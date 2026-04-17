/**
 * Script 03 — Migra imagens de destaque WP → R2
 *
 * Estratégia: scanner customizado em Node puro.
 *   1. buildZipIndex — varre PK local headers (PK\x03\x04) sequencialmente
 *      → Map<name, ZipEntry> com dataOffset de cada arquivo
 *   2. Resolve qual entry do zip cada artigo precisa
 *   3. extractEntry  — fs.readSync no offset (O(1) por arquivo, sem subprocess)
 *   4. Upload paralelo (CONCURRENCY=5) + atualiza DB
 *
 * Por que não usar 7z x @filelist: o central directory do zip está corrompido,
 * então 7z falha com "Unexpected end of archive" na extração em lote.
 * 7z l funciona porque faz scan de local headers como fallback, igual ao que
 * fazemos aqui — mas com acesso direto ao arquivo, sem overhead de processo.
 *
 * Uso:
 *   npx tsx scripts/03-migrar-imagens.ts            ← migra todas
 *   npx tsx scripts/03-migrar-imagens.ts --dry-run  ← simula sem alterar
 *   npx tsx scripts/03-migrar-imagens.ts --limit 50 ← migra apenas 50
 */

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const ZIP_PATH    = '/home/amaral/Área /public_html.zip'
const WP_BASE_URL = 'https://jornalspassocidades.com.br/wp-content/uploads/'
const CONCURRENCY = 5

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_BUCKET     = process.env.R2_BUCKET_NAME!
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

// ── AWS Sig v4 ────────────────────────────────────────────

function hmacSha256(key: Buffer | string, msg: string): Buffer {
  return crypto.createHmac('sha256', key).update(msg).digest()
}

// Codifica path para canonical request — resolve SignatureDoesNotMatch em nomes especiais
function encodePath(p: string): string {
  return p.split('/').map(seg => encodeURIComponent(seg)).join('/')
}

async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  const now         = new Date()
  const isoDate     = now.toISOString().slice(0, 10).replace(/-/g, '')
  const isoDateTime = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const host        = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const bodyHash    = crypto.createHash('sha256').update(body).digest('hex')
  const encodedPath = encodePath(`${R2_BUCKET}/${key}`)

  const canonHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${bodyHash}\n` +
    `x-amz-date:${isoDateTime}\n`

  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'
  const canonRequest  = ['PUT', `/${encodedPath}`, '', canonHeaders, signedHeaders, bodyHash].join('\n')
  const credScope     = `${isoDate}/auto/s3/aws4_request`
  const stringToSign  = ['AWS4-HMAC-SHA256', isoDateTime, credScope,
    crypto.createHash('sha256').update(canonRequest).digest('hex')].join('\n')

  const sk        = hmacSha256(hmacSha256(hmacSha256(hmacSha256('AWS4' + R2_SECRET_KEY, isoDate), 'auto'), 's3'), 'aws4_request')
  const signature = hmacSha256(sk, stringToSign).toString('hex')
  const auth      = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(`https://${host}/${encodedPath}`, {
    method: 'PUT',
    headers: { 'Content-Type': contentType, 'x-amz-content-sha256': bodyHash, 'x-amz-date': isoDateTime, 'Authorization': auth },
    body,
  })

  if (!res.ok) throw new Error(`R2 ${res.status}: ${await res.text()}`)
  return `${R2_PUBLIC_URL}/${key}`
}

function mimeFromExt(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' })[ext] ?? 'image/jpeg'
}

// ── Scanner de ZIP (PK local headers) ────────────────────

interface ZipEntry {
  name:        string
  compression: number   // 0=stored, 8=deflate
  compSize:    number   // -1 = data descriptor (bit 3 set, tamanho desconhecido)
  dataOffset:  number   // offset absoluto no arquivo onde os dados começam
}

/**
 * Varre o zip sequencialmente lendo PK\x03\x04 (local file headers).
 * Funciona mesmo sem central directory.
 */
async function buildZipIndex(zipPath: string): Promise<Map<string, ZipEntry>> {
  const index = new Map<string, ZipEntry>()
  const CHUNK  = 64 * 1024 * 1024
  const fsize  = fs.statSync(zipPath).size
  const fd     = fs.openSync(zipPath, 'r')

  let globalOffset = 0
  let leftover     = Buffer.alloc(0)
  let total        = 0

  process.stdout.write(`  Varrendo zip ${(fsize / 1024 ** 3).toFixed(1)}GB...`)

  while (globalOffset < fsize) {
    const toRead = Math.min(CHUNK, fsize - globalOffset)
    const buf    = Buffer.alloc(toRead)
    fs.readSync(fd, buf, 0, toRead, globalOffset)

    const combined = Buffer.concat([leftover, buf])
    let pos = 0

    while (pos < combined.length - 30) {
      if (combined[pos]   !== 0x50 || combined[pos+1] !== 0x4b ||
          combined[pos+2] !== 0x03 || combined[pos+3] !== 0x04) {
        pos++; continue
      }

      const flags      = combined.readUInt16LE(pos + 6)
      const comp       = combined.readUInt16LE(pos + 8)
      let   compSize   = combined.readUInt32LE(pos + 18)
      const fnLen      = combined.readUInt16LE(pos + 26)
      const extLen     = combined.readUInt16LE(pos + 28)

      if (fnLen === 0 || fnLen > 1024) { pos++; continue }

      const nameEnd = pos + 30 + fnLen
      if (nameEnd > combined.length) { leftover = combined.subarray(pos); break }

      const name      = combined.subarray(pos + 30, nameEnd).toString('utf8')
      const dataStart = (globalOffset - leftover.length) + pos + 30 + fnLen + extLen

      // Bit 3 set → compSize pode ser 0 no header (data descriptor)
      if ((flags & 0x0008) && compSize === 0) compSize = -1

      index.set(name, { name, compression: comp, compSize, dataOffset: dataStart })
      total++

      if (compSize > 0) {
        pos += 30 + fnLen + extLen + compSize
      } else {
        pos += 30 + fnLen + extLen
      }
    }

    if (pos >= combined.length - 30) {
      leftover = combined.subarray(Math.max(0, combined.length - 30))
    }

    globalOffset += toRead
    if (total % 10000 === 0 && total > 0) {
      process.stdout.write(`\r  ${total} entradas @ ${(globalOffset / 1024 ** 3).toFixed(1)}GB...`)
    }
  }

  fs.closeSync(fd)
  console.log(`\r  ${index.size} arquivos indexados no zip           `)
  return index
}

/**
 * Para entradas com data descriptor (compSize=-1): avança a partir de dataOffset
 * procurando PK\x07\x08, PK\x03\x04 ou PK\x01\x02.
 */
function findDataDescriptorEnd(fd: number, dataOffset: number): number {
  const SCAN = 128 * 1024
  let offset = dataOffset

  while (offset - dataOffset < 50 * 1024 * 1024) {
    const buf  = Buffer.alloc(SCAN)
    const read = fs.readSync(fd, buf, 0, SCAN, offset)
    if (read === 0) break

    for (let i = 0; i < read - 4; i++) {
      if (buf[i] === 0x50 && buf[i+1] === 0x4b) {
        if ((buf[i+2] === 0x07 && buf[i+3] === 0x08) ||
            (buf[i+2] === 0x03 && buf[i+3] === 0x04) ||
            (buf[i+2] === 0x01 && buf[i+3] === 0x02)) {
          return offset + i
        }
      }
    }

    offset += read - 4  // sobreposição de 4 bytes para não perder assinatura na borda
  }

  throw new Error('data descriptor end not found within 50MB')
}

function decompress(data: Buffer, method: number): Buffer {
  if (method === 0) return data
  if (method === 8) return zlib.inflateRawSync(data)
  throw new Error(`Compressão não suportada: ${method}`)
}

/**
 * Extrai dados de uma entrada. Para compSize > 0: leitura direta O(1).
 * Para compSize = -1: scan forward para achar o fim.
 */
function extractEntry(entry: ZipEntry, fd: number): Buffer {
  if (entry.compSize === -1) {
    const endPos   = findDataDescriptorEnd(fd, entry.dataOffset)
    const compSize = endPos - entry.dataOffset
    const buf      = Buffer.alloc(compSize)
    fs.readSync(fd, buf, 0, compSize, entry.dataOffset)
    return decompress(buf, entry.compression)
  }

  const buf = Buffer.alloc(entry.compSize)
  fs.readSync(fd, buf, 0, entry.compSize, entry.dataOffset)
  return decompress(buf, entry.compression)
}

// ── Upload pool paralelo ──────────────────────────────────

type WorkItem = {
  articleId: number
  relPath:   string   // 2024/04/img.jpg
  r2Key:     string   // wp-migrated/2024/04/img.jpg
  entry:     ZipEntry
}

async function runUploadPool(
  items: WorkItem[],
  fd: number
): Promise<{ ok: number; fail: number }> {
  let ok = 0, fail = 0
  const total = items.length
  const queue = [...items]

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift()!
      try {
        const imgData = extractEntry(item.entry, fd)
        const mime    = mimeFromExt(item.relPath)
        const r2Url   = await uploadToR2(item.r2Key, imgData, mime)

        const { error: upErr } = await supabase
          .from('articles')
          .update({ featured_image_url: r2Url })
          .eq('id', item.articleId)

        if (upErr) throw new Error(`DB: ${upErr.message}`)
        ok++
      } catch (err) {
        console.error(`\n  ❌ ${item.relPath}: ${(err as Error).message}`)
        fail++
      }

      process.stdout.write(`\r  ${ok + fail}/${total} | ✅${ok} ❌${fail}...`)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  return { ok, fail }
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  const args     = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const limitStr = args.find(a => a.startsWith('--limit=')) ?? args[args.indexOf('--limit') + 1]
  const limit    = limitStr ? parseInt(String(limitStr).replace('--limit=', '')) : Infinity

  console.log('📦 Migração de imagens: zip → R2 (scanner Node puro + uploads paralelos)')
  if (isDryRun) console.log('  ⚠️  DRY RUN')

  // 1. Busca artigos com imagens WP
  let query = supabase
    .from('articles')
    .select('id, featured_image_url')
    .like('featured_image_url', `%jornalspassocidades.com.br%`)

  query = query.limit(limit !== Infinity ? limit : 5000)

  const { data: articles, error } = await query
  if (error) { console.error(error.message); process.exit(1) }
  if (!articles?.length) { console.log('Nenhuma imagem WP para migrar.'); return }

  console.log(`\n  ${articles.length} artigos com imagem WP`)

  // 2. Indexa o zip
  console.log('\n📂 Indexando zip...')
  const zipIndex = await buildZipIndex(ZIP_PATH)

  // Mapa auxiliar: relPath → entry (uploads/2024/04/img.jpg → entry)
  const wpPathToEntry  = new Map<string, ZipEntry>()
  const filenameToEntry = new Map<string, ZipEntry>()

  for (const [name, entry] of zipIndex) {
    if (!name.includes('wp-content/uploads/') || name.endsWith('/')) continue
    const rel = name.replace(/^.*wp-content\/uploads\//, '')
    wpPathToEntry.set(rel, entry)
    filenameToEntry.set(path.basename(rel), entry)
  }

  // 3. Monta lista de trabalho
  const workList: WorkItem[] = []
  let notFound = 0
  const notFoundList: string[] = []

  for (const article of articles) {
    const wpUrl        = article.featured_image_url!
    const relPath      = wpUrl.replace(WP_BASE_URL, '').replace(/^\//, '')
    const originalPath = relPath.replace(/-\d+x\d+(\.\w+)$/, '$1')

    let entry = wpPathToEntry.get(relPath) ?? wpPathToEntry.get(originalPath)

    if (!entry) {
      entry = filenameToEntry.get(path.basename(relPath)) ??
              filenameToEntry.get(path.basename(originalPath))
    }

    if (!entry) {
      notFound++
      notFoundList.push(relPath)
      continue
    }

    const useRelPath = entry.name.replace(/^.*wp-content\/uploads\//, '')
    workList.push({
      articleId: article.id,
      relPath: useRelPath,
      r2Key: `wp-migrated/${useRelPath}`,
      entry,
    })
  }

  console.log(`  ✅ Mapeadas: ${workList.length}  🔍 Não encontradas: ${notFound}`)

  if (notFoundList.length > 0 && notFoundList.length <= 20) {
    console.log('\n  Não encontradas:')
    notFoundList.forEach(p => console.log(`    ${p}`))
  }

  if (isDryRun) {
    workList.slice(0, 10).forEach(w => console.log(`  [dry] ${w.relPath} → ${w.r2Key}`))
    if (workList.length > 10) console.log(`  ... e mais ${workList.length - 10}`)
    return
  }

  if (workList.length === 0) { console.log('Nada para migrar.'); return }

  // 4. Upload paralelo
  console.log(`\n  Fazendo upload (${CONCURRENCY} paralelos)...`)
  const fd = fs.openSync(ZIP_PATH, 'r')

  let ok = 0, fail = 0
  try {
    const result = await runUploadPool(workList, fd)
    ok = result.ok; fail = result.fail
  } finally {
    fs.closeSync(fd)
  }

  console.log('\n')
  console.log('── Resultado ──────────────────────────────')
  console.log(`  ✅ Migradas:        ${ok}`)
  console.log(`  ❌ Falhas:          ${fail}`)
  console.log(`  🔍 Não encontradas: ${notFound}`)

  console.log('\n✅ Script 03 concluído.')
  if (ok > 0) console.log('   Próximo: npm run migrate:04 (URLs inline no content)')
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
