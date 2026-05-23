# email-to-n8n — Cloudflare Email Worker

Recebe emails entregues a `emerson@jornalspassocidades.com.br` (via Cloudflare Email Routing), parseia o MIME, salva anexos no R2 e dispara o webhook do n8n.

## O que o Worker faz

1. Lê o email cru (multipart MIME), extrai texto/HTML do corpo
2. Para cada **anexo** (image/*, PDF, doc, zip…): faz upload no bucket R2 `spasso-media`, sob o prefixo `temp-raw/YYYY-MM-DD/{hash}-{idx}-{filename}` (lifecycle 7 dias deleta sozinho)
3. Extrai **links de cloud externo** (Drive, WeTransfer, Dropbox, OneDrive, Mega, SendSpace) do corpo via regex
4. Faz `POST` no webhook n8n com payload compatível + `attachments[]` + `cloudLinks[]`
5. Encaminha o email original para `contato.spassocidades@gmail.com` (humano de leitura)

## Arquivos

- `src/index.js` — código do worker (parser MIME nativo, sem dependências)
- `wrangler.jsonc` — config + binding R2 + vars
- `package.json` — scripts `deploy`, `dev`, `tail`

## Ambiente em produção

- Worker rodando em `email-to-n8n.<account>.workers.dev`
- Trigger: Email Routing rule do domínio `jornalspassocidades.com.br`
- Bucket R2: `spasso-media` (binding `MEDIA_BUCKET`)
- Public URL: `https://pub-e2001ebd7e21497aab9f0958d110d3c5.r2.dev/{key}`
- Webhook destino: `https://primary-production-f54c.up.railway.app/webhook/email-spasso-inbox`
- Forward: `contato.spassocidades@gmail.com`

## Payload enviado ao n8n

```json
{
  "from":    { "value": [{ "address": "remetente@x.com", "name": "" }] },
  "subject": "Assunto decodificado (RFC 2047)",
  "text":    "Corpo em texto puro",
  "html":    "<corpo HTML preservado>",
  "date":    "2026-04-29T13:00:00.000Z",
  "headers": { "date": "...", "message-id": "<...>" },
  "binary":  {},
  "attachments": [
    {
      "filename":    "foto-prefeitura.jpg",
      "contentType": "image/jpeg",
      "size":        234567,
      "r2Key":       "temp-raw/2026-04-29/abc12345-0-foto-prefeitura.jpg",
      "publicUrl":   "https://pub-e2001ebd7e21497aab9f0958d110d3c5.r2.dev/temp-raw/2026-04-29/abc12345-0-foto-prefeitura.jpg"
    }
  ],
  "cloudLinks": [
    { "provider": "Google Drive", "url": "https://drive.google.com/file/d/..." }
  ]
}
```

Os campos `from`/`subject`/`text`/`html`/`date`/`headers`/`binary` mantêm exatamente o formato anterior (compat com expressões `body.from.value[0].address`, etc no n8n). `attachments` e `cloudLinks` são novos.

## Como deployar uma mudança

```bash
cd workers/email-to-n8n
npx wrangler deploy
```

Antes precisa estar autenticado: `npx wrangler login` ou exportar `CLOUDFLARE_API_TOKEN`.

## Configuração externa necessária (uma vez)

- **Lifecycle R2**: bucket `spasso-media`, regra com prefixo `temp-raw/`, ação Delete after 7 days. Configurada no dashboard Cloudflare → R2 → bucket → Settings → Lifecycle rules.
- **Coda**: tabela `grid-M5g6ayCY1G` precisa de duas colunas — `Imagens do release` e `Links externos`.
- **n8n**: nó `Edit Fields4` do workflow `lHQRgW2YKhyI883f` deve mapear:
  - `Imagens do release` ← `{{ $json.body.attachments.map(a => a.publicUrl).join('\n') }}`
  - `Links externos` ← `{{ $json.body.cloudLinks.map(l => '[' + l.provider + '] ' + l.url).join('\n') }}`

## Limites

- Cloudflare Email Routing: até 25 MiB por mensagem
- Email Worker CPU: 30s no plano pago, 50ms no free — parsear e fazer upload de anexos cabe folgado
- Imagens inline `cid:...` em HTML não são extraídas (caso raro, geralmente é assinatura/footer)

## Observações

- Worker é do tipo **email** (não fetch handler) — exporta `email(message, env, ctx)`
- A entrega para o n8n usa `ctx.waitUntil()` — não bloqueia o forward para o Gmail. Se o n8n cair, o email continua chegando no Gmail
- Whitelist de remetente continua no n8n (nó `If2`), não foi movida para o Worker — escopo desta versão é só anexo+link
