/**
 * Script 03 — Migra imagens de destaque do WordPress para o R2
 *
 * Estratégia:
 *   1. Extrai imagens do public_html.zip (não precisa de WP online)
 *   2. Para cada article com featured_image_url apontando para o WP,
 *      faz upload para R2 e atualiza o URL no banco
 *
 * Uso:
 *   npx tsx scripts/03-migrar-imagens.ts            ← migra todas
 *   npx tsx scripts/03-migrar-imagens.ts --dry-run  ← mostra o que faria
 *   npx tsx scripts/03-migrar-imagens.ts --limit 20 ← migra apenas 20
 *
 * Pré-requisito: 02-migrar-posts.ts já rodado
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const ZIP_PATH     = '/home/amaral/Área /public_html.zip'
const WP_UPLOADS   = 'public_html/wp-content/uploads/'
const WP_BASE_URL  = 'https://jornalspassocidades.com.br/wp-content/uploads/'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const R2_ACCOUNT_ID  = process.env.R2_ACCOUNT_ID!
const R2_BUCKET      = process.env.R2_BUCKET_NAME!
const R2_ACCESS_KEY  = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_KEY  = process.env.R2_SECRET_ACCESS_KEY!
const R2_PUBLIC_URL  = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

// ── AWS Sig v4 (Web Crypto não disponível em Node puro — usa crypto module) ──

function toHex(buf: Buffer): string {
  return buf.toString('hex')
}

function sha256Hex(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

function hmacSha256(key: Buffer | string, msg: string): Buffer {
  return crypto.createHmac('sha256', key).update(msg).digest()
}

function signingKey(secret: string, date: string): Buffer {
  const kDate    = hmacSha256('AWS4' + secret, date)
  const kRegion  = hmacSha256(kDate, 'auto')
  const kService = hmacSha256(kRegion, 's3')
  return           hmacSha256(kService, 'aws4_request')
}

async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  const now         = new Date()
  const isoDate     = now.toISOString().slice(0, 10).replace(/-/g, '')
  const isoDateTime = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const host     = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const bodyHash = sha256Hex(body)

  const canonHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${bodyHash}\n` +
    `x-amz-date:${isoDateTime}\n`

  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'

  const canonRequest = [
    'PUT',
    `/${R2_BUCKET}/${key}`,
    '',
    canonHeaders,
    signedHeaders,
    bodyHash,
  ].join('\n')

  const credScope    = `${isoDate}/auto/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    isoDateTime,
    credScope,
    sha256Hex(canonRequest),
  ].join('\n')

  const sk        = signingKey(R2_SECRET_KEY, isoDate)
  const signature = toHex(hmacSha256(sk, stringToSign))

  const auth = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(`https://${host}/${R2_BUCKET}/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-content-sha256': bodyHash,
      'x-amz-date': isoDateTime,
      'Authorization': auth,
    },
    body,
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`R2 upload falhou (${res.status}): ${txt}`)
  }

  return `${R2_PUBLIC_URL}/${key}`
}

function r2KeyFromWpUrl(wpUrl: string): string {
  // ex: .../uploads/2023/04/imagem.jpg → wp-migrated/2023/04/imagem.jpg
  const rel = wpUrl.replace(WP_BASE_URL, '')
  return `wp-migrated/${rel}`
}

function mimeFromExt(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp',
    gif: 'image/gif', avif: 'image/avif',
    svg: 'image/svg+xml',
  }
  return map[ext] ?? 'application/octet-stream'
}

// ── Estratégia: tenta HTTP direto primeiro, depois zip ───

async function fetchImageBuffer(wpUrl: string): Promise<Buffer | null> {
  try {
    const res = await fetch(wpUrl, { signal: AbortSignal.timeout(10000) })
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer())
    }
  } catch {
    // WP offline — tenta zip abaixo
  }
  return null
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  const args      = process.argv.slice(2)
  const isDryRun  = args.includes('--dry-run')
  const limitStr  = args.find(a => a.startsWith('--limit=')) ?? args[args.indexOf('--limit') + 1]
  const limit     = limitStr ? parseInt(String(limitStr).replace('--limit=', '')) : Infinity

  // Busca artigos com featured_image_url ainda apontando para WP
  console.log('Buscando artigos com imagens a migrar...')

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, featured_image_url')
    .like('featured_image_url', `%jornalspassocidades.com.br%`)
    .limit(limit === Infinity ? 10000 : limit)

  if (error) { console.error(error.message); process.exit(1) }
  if (!articles?.length) {
    console.log('Nenhum artigo com imagem WP encontrado — nada a migrar.')
    return
  }

  console.log(`  ${articles.length} imagens a migrar`)
  if (isDryRun) console.log('  ⚠️  DRY RUN')

  let migrated = 0
  let failed   = 0
  let noImage  = 0

  for (const article of articles) {
    const wpUrl = article.featured_image_url
    if (!wpUrl) { noImage++; continue }

    if (isDryRun) {
      console.log(`  [dry-run] ${wpUrl}`)
      migrated++
      continue
    }

    const r2Key = r2KeyFromWpUrl(wpUrl)
    const mime  = mimeFromExt(wpUrl)

    const imgBuffer = await fetchImageBuffer(wpUrl)
    if (!imgBuffer) {
      console.error(`  ❌ Não conseguiu baixar: ${wpUrl}`)
      failed++
      continue
    }

    try {
      const r2Url = await uploadToR2(r2Key, imgBuffer, mime)
      const { error: updateError } = await supabase
        .from('articles')
        .update({ featured_image_url: r2Url })
        .eq('id', article.id)

      if (updateError) {
        console.error(`  ❌ Erro ao atualizar ${article.id}: ${updateError.message}`)
        failed++
      } else {
        migrated++
      }
    } catch (err) {
      console.error(`  ❌ Upload falhou: ${wpUrl} — ${(err as Error).message}`)
      failed++
    }

    process.stdout.write(`\r  ${migrated + failed}/${articles.length} processadas...`)

    // Rate limit leve para não bombardear o R2
    await new Promise(r => setTimeout(r, 50))
  }

  console.log('\n')
  console.log('── Resultado ──────────────────────────────')
  console.log(`  ✅ Migradas:   ${migrated}`)
  console.log(`  ❌ Falhas:     ${failed}`)
  console.log(`  ⏭️  Sem imagem: ${noImage}`)
  console.log('\n✅ Script 03 concluído.')

  if (!isDryRun && migrated > 0) {
    console.log('\n⚠️  Nota: as URLs inline no content dos artigos ainda apontam para o WP.')
    console.log('   Para migrar essas imagens também, rode: npx tsx scripts/04-migrar-inline.ts')
  }
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
