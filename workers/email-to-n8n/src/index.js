// Cloudflare Email Worker — email-to-n8n
// Recebe emails em emerson@jornalspassocidades.com.br
// → parseia multipart MIME, salva anexos no R2 (temp-raw/), extrai links cloud
// → POST para webhook n8n com payload compatível + attachments[] + cloudLinks[]
// → encaminha o email original para o destino de leitura humana

const MAX_RAW_BYTES = 26 * 1024 * 1024; // 25 MiB (limite do Email Routing)
const ATTACHMENT_MIME_PREFIXES = ['image/', 'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument', 'application/vnd.ms-excel',
  'application/zip', 'application/x-zip', 'audio/', 'video/'];

const CLOUD_PROVIDERS = [
  { name: 'Google Drive', re: /https?:\/\/(?:drive|docs)\.google\.com\/[^\s<>"'`)\]]+/gi },
  { name: 'WeTransfer',   re: /https?:\/\/(?:we\.tl|(?:[a-z0-9-]+\.)?wetransfer\.com)\/[^\s<>"'`)\]]+/gi },
  { name: 'Dropbox',      re: /https?:\/\/(?:www\.)?dropbox\.com\/[^\s<>"'`)\]]+|https?:\/\/db\.tt\/[^\s<>"'`)\]]+/gi },
  { name: 'OneDrive',     re: /https?:\/\/1drv\.ms\/[^\s<>"'`)\]]+|https?:\/\/onedrive\.live\.com\/[^\s<>"'`)\]]+/gi },
  { name: 'Mega',         re: /https?:\/\/mega\.nz\/[^\s<>"'`)\]]+/gi },
  { name: 'SendSpace',    re: /https?:\/\/(?:www\.)?sendspace\.com\/[^\s<>"'`)\]]+/gi },
];

// ─── decode helpers ──────────────────────────────────────────────────────────

function base64ToUint8Array(b64) {
  const clean = b64.replace(/[\r\n\s]/g, '');
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Decodifica quoted-printable em Uint8Array (bytes brutos, sem assumir charset)
function decodeQuotedPrintableBytes(str) {
  const noSoftBreaks = str.replace(/=\r?\n/g, '');
  const bytes = [];
  for (let i = 0; i < noSoftBreaks.length; i++) {
    const ch = noSoftBreaks.charCodeAt(i);
    if (ch === 0x3D /* '=' */ && i + 2 < noSoftBreaks.length) {
      const h1 = noSoftBreaks.charCodeAt(i + 1);
      const h2 = noSoftBreaks.charCodeAt(i + 2);
      const isHex = c => (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);
      if (isHex(h1) && isHex(h2)) {
        bytes.push(parseInt(noSoftBreaks.slice(i + 1, i + 3), 16));
        i += 2;
        continue;
      }
    }
    bytes.push(ch & 0xff);
  }
  return new Uint8Array(bytes);
}

// Decodifica quoted-printable em string UTF-8
function decodeQuotedPrintable(str, charset = 'utf-8') {
  const bytes = decodeQuotedPrintableBytes(str);
  return new TextDecoder(charset, { fatal: false }).decode(bytes);
}

function decodeMimeWord(s) {
  // RFC 2047: =?charset?B?...?= ou =?charset?Q?...?=
  return s.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, charset, enc, txt) => {
    const cs = (charset || 'utf-8').toLowerCase();
    try {
      if (enc === 'B' || enc === 'b') {
        return new TextDecoder(cs, { fatal: false }).decode(base64ToUint8Array(txt));
      }
      // Q-encoding usa '_' como espaço
      return decodeQuotedPrintable(txt.replace(/_/g, ' '), cs);
    } catch { return txt; }
  });
}

// Extrai display name do header From: cru.
// Formatos aceitos:
//   "Nome Sobrenome" <email@dom>
//   Nome Sobrenome <email@dom>
//   =?UTF-8?B?Tm9tZQ==?= <email@dom>   (MIME-encoded)
//   email@dom                          (sem display name → retorna '')
function parseFromName(headerValue) {
  if (!headerValue) return '';
  const m = headerValue.match(/^\s*"?([^"<]+?)"?\s*<[^>]+>\s*$/);
  if (!m) return '';
  return decodeMimeWord(m[1].trim()).trim();
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n').trim();
}

// ─── MIME parser (recursivo, suporta multipart aninhado) ─────────────────────

function parseHeaders(raw) {
  // Junta linhas com folding (linha começando com espaço/tab continua a anterior)
  const unfolded = raw.replace(/\r?\n[ \t]+/g, ' ');
  const out = {};
  for (const line of unfolded.split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const val = line.slice(idx + 1).trim();
    out[key] = val;
  }
  return out;
}

function getHeaderParam(headerValue, paramName) {
  if (!headerValue) return null;
  const re = new RegExp(`${paramName}\\s*=\\s*"?([^";\\r\\n]+)"?`, 'i');
  const m = headerValue.match(re);
  return m ? m[1].trim() : null;
}

function sanitizeFilename(name) {
  if (!name) return 'anexo';
  const decoded = decodeMimeWord(name);
  // Mantém pontos e traços, troca o resto por '-'
  return decoded
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos combinantes
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'anexo';
}

// Recebe rawText do email (todo MIME) e devolve { textPlain, textHtml, attachments[] }
function parseMime(rawText) {
  const result = { textPlain: '', textHtml: '', attachments: [] };

  function walk(part, depth = 0) {
    if (depth > 8) return; // proteção contra recursão maluca

    const sep = part.search(/\r?\n\r?\n/);
    if (sep < 0) return;

    const headerBlock = part.slice(0, sep);
    const body = part.replace(/^\r?\n\r?\n/, '').slice(sep);
    const headers = parseHeaders(headerBlock);

    const ct = headers['content-type'] || 'text/plain';
    const ctType = ct.split(';')[0].trim().toLowerCase();
    const cte = (headers['content-transfer-encoding'] || '7bit').toLowerCase();
    const cd = headers['content-disposition'] || '';
    const cdType = cd.split(';')[0].trim().toLowerCase();
    const filename = getHeaderParam(cd, 'filename') || getHeaderParam(ct, 'name');

    if (ctType.startsWith('multipart/')) {
      const boundary = getHeaderParam(ct, 'boundary');
      if (!boundary) return;
      const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = body.split(new RegExp('--' + escaped + '(?:--)?'));
      for (const p of parts) {
        const trimmed = p.replace(/^\r?\n/, '').replace(/\r?\n$/, '');
        if (!trimmed || trimmed === '--') continue;
        walk(trimmed, depth + 1);
      }
      return;
    }

    // É parte folha (não-multipart). Decide se é texto ou anexo.
    const isAttachmentDisposition = cdType === 'attachment' || (cdType === 'inline' && filename);
    const isAttachmentByMime = ATTACHMENT_MIME_PREFIXES.some(p => ctType.startsWith(p));

    if (isAttachmentDisposition || (isAttachmentByMime && !ctType.startsWith('text/'))) {
      // Anexo: decodifica conforme CTE
      let bytes;
      try {
        if (cte === 'base64') {
          bytes = base64ToUint8Array(body);
        } else if (cte === 'quoted-printable') {
          bytes = decodeQuotedPrintableBytes(body);
        } else {
          // 7bit / 8bit / binary — trata como bytes brutos
          bytes = new Uint8Array(body.length);
          for (let i = 0; i < body.length; i++) bytes[i] = body.charCodeAt(i) & 0xff;
        }
      } catch (e) {
        console.error('attachment decode error', e);
        return;
      }

      result.attachments.push({
        filename: sanitizeFilename(filename || 'anexo'),
        contentType: ctType,
        size: bytes.byteLength,
        bytes,
      });
      return;
    }

    // Texto
    let text = body;
    if (cte === 'base64') {
      try {
        const bytes = base64ToUint8Array(body);
        text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      } catch { text = ''; }
    } else if (cte === 'quoted-printable') {
      text = decodeQuotedPrintable(body);
    }

    if (ctType === 'text/plain' && !result.textPlain) {
      result.textPlain = text.trim();
    } else if (ctType === 'text/html' && !result.textHtml) {
      result.textHtml = text.trim();
    }
  }

  walk(rawText);
  return result;
}

// ─── cloud link extraction ───────────────────────────────────────────────────

function extractCloudLinks(text, html) {
  const seen = new Set();
  const out = [];
  const haystack = `${text || ''}\n${html || ''}`;
  for (const provider of CLOUD_PROVIDERS) {
    const matches = haystack.match(provider.re) || [];
    for (let url of matches) {
      // Limpa pontuação final
      url = url.replace(/[.,;:!?)\]]+$/, '');
      if (!seen.has(url)) {
        seen.add(url);
        out.push({ provider: provider.name, url });
      }
    }
  }
  return out;
}

// ─── R2 upload ───────────────────────────────────────────────────────────────

function todayPath() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function shortHash(s) {
  // Hash determinístico curto (não-cripto) para agrupar anexos do mesmo email
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

async function uploadAttachments(env, attachments, messageId) {
  if (!attachments?.length || !env.MEDIA_BUCKET) return [];
  const day = todayPath();
  const hash = shortHash(messageId || String(Date.now()));
  const out = [];
  for (let i = 0; i < attachments.length; i++) {
    const a = attachments[i];
    const key = `${env.TEMP_PREFIX}/${day}/${hash}-${i}-${a.filename}`;
    try {
      await env.MEDIA_BUCKET.put(key, a.bytes, {
        httpMetadata: { contentType: a.contentType || 'application/octet-stream' },
      });
      out.push({
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
        r2Key: key,
        publicUrl: `${env.R2_PUBLIC_BASE}/${key}`,
      });
    } catch (e) {
      console.error('R2 put error', { key, error: String(e) });
    }
  }
  return out;
}

// ─── POST n8n com retry ──────────────────────────────────────────────────────

// O n8n no Railway às vezes responde 403/5xx transitório (cold start, reinício,
// ou 2 emails quase simultâneos). Sem retry o email era perdido silenciosamente.
// Tenta algumas vezes com backoff antes de desistir.
async function postToN8n(url, payload) {
  const ATTEMPTS = 4;
  for (let i = 1; i <= ATTEMPTS; i++) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        if (i > 1) console.log(`n8n ok na tentativa ${i}`);
        return;
      }
      console.error(`n8n non-2xx ${r.status} (tentativa ${i}/${ATTEMPTS})`);
    } catch (err) {
      console.error(`n8n webhook erro (tentativa ${i}/${ATTEMPTS}): ${String(err)}`);
    }
    if (i < ATTEMPTS) await new Promise(res => setTimeout(res, 1500 * i));
  }
  console.error(`n8n FALHOU após ${ATTEMPTS} tentativas — email pode ter se perdido: ${payload.subject || '(sem assunto)'}`);
}

// ─── handler ─────────────────────────────────────────────────────────────────

export default {
  async email(message, env, ctx) {
    const from     = message.from;
    const fromName = parseFromName(message.headers.get('from'));
    const subject  = decodeMimeWord(message.headers.get('subject') || '');
    const date     = message.headers.get('date') || new Date().toISOString();
    const messageId = message.headers.get('message-id') || `${Date.now()}-${from}`;

    // Lê raw e parseia
    let raw;
    try {
      const buf = await new Response(message.raw).arrayBuffer();
      if (buf.byteLength > MAX_RAW_BYTES) {
        console.warn('email exceeds MAX_RAW_BYTES', buf.byteLength);
      }
      raw = new TextDecoder('latin1', { fatal: false }).decode(buf);
    } catch (e) {
      console.error('failed to read raw', e);
      raw = '';
    }

    const parsed = parseMime(raw);
    const textBody = parsed.textPlain || stripHtml(parsed.textHtml) || '';
    const cloudLinks = extractCloudLinks(parsed.textPlain, parsed.textHtml);

    // Sobe anexos no R2 (em paralelo com o forward, mas precisamos do resultado pro payload)
    const attachments = await uploadAttachments(env, parsed.attachments, messageId);

    // Payload mantém compat com o que o n8n já espera (from/subject/text/html/date/headers/binary)
    // e adiciona attachments[] e cloudLinks[]
    const payload = {
      from: { value: [{ address: from, name: fromName }] },
      subject,
      text: textBody,
      html: parsed.textHtml || '',
      date: new Date(date).toISOString(),
      headers: { date, 'message-id': messageId },
      binary: {},
      attachments,
      cloudLinks,
    };

    // POST n8n com retry (não bloqueia o forward)
    ctx.waitUntil(postToN8n(env.N8N_WEBHOOK_URL, payload));

    // Forward pro destino de leitura humana (mantém comportamento atual)
    try {
      await message.forward(env.FORWARD_TO);
    } catch (e) {
      console.error('forward error', e);
    }
  },
};
