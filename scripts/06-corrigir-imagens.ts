/**
 * Script 06 — Corrige featured_image_url de artigos com null
 *
 * Para cada artigo nulo que tinha imagem no WP:
 *   1. Constrói URL R2 esperada (wp-migrated/YYYY/MM/file.jpg)
 *   2. Faz HEAD no R2 — se existir, atualiza Supabase
 *   3. Se não existir, mantém null (arquivo não estava no zip)
 *
 * Uso:
 *   npx tsx scripts/06-corrigir-imagens.ts --dry-run
 *   npx tsx scripts/06-corrigir-imagens.ts
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const DATA_DIR = path.join(__dirname, 'data')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const WP_UPLOADS    = 'https://jornalspassocidades.com.br/wp-content/uploads/'
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_BUCKET     = process.env.R2_BUCKET_NAME!
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!
const CONCURRENCY   = 10

function hmacSha256(key: Buffer | string, msg: string): Buffer {
  return crypto.createHmac('sha256', key).update(msg).digest()
}

async function r2Exists(key: string): Promise<boolean> {
  const now         = new Date()
  const isoDate     = now.toISOString().slice(0, 10).replace(/-/g, '')
  const isoDateTime = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const host        = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const bodyHash    = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  const encodedPath = `${R2_BUCKET}/${key}`.split('/').map(encodeURIComponent).join('/')

  const canonHeaders  = `host:${host}\nx-amz-content-sha256:${bodyHash}\nx-amz-date:${isoDateTime}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonRequest  = ['HEAD', `/${encodedPath}`, '', canonHeaders, signedHeaders, bodyHash].join('\n')
  const credScope     = `${isoDate}/auto/s3/aws4_request`
  const stringToSign  = ['AWS4-HMAC-SHA256', isoDateTime, credScope,
    crypto.createHash('sha256').update(canonRequest).digest('hex')].join('\n')
  const sk        = hmacSha256(hmacSha256(hmacSha256(hmacSha256('AWS4' + R2_SECRET_KEY, isoDate), 'auto'), 's3'), 'aws4_request')
  const signature = hmacSha256(sk, stringToSign).toString('hex')
  const auth      = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  try {
    const res = await fetch(`https://${host}/${encodedPath}`, {
      method: 'HEAD',
      headers: { host, 'x-amz-content-sha256': bodyHash, 'x-amz-date': isoDateTime, Authorization: auth },
    })
    return res.ok
  } catch {
    return false
  }
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  if (isDryRun) console.log('⚠️  DRY RUN\n')

  // Carrega mapa slug → URL WP original
  const postmeta    = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'postmeta.json'), 'utf8'))
  const attachments = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'attachments.json'), 'utf8'))
  const posts       = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'posts.json'), 'utf8'))

  const slugToWpUrl = new Map<string, string>()
  for (const post of posts) {
    const meta    = postmeta[post.ID] ?? postmeta[String(post.ID)]
    const thumbId = meta?.['_thumbnail_id']
    const url     = attachments[thumbId]
    if (!post.post_name || !url) continue
    slugToWpUrl.set(post.post_name, url)
  }

  // Busca artigos nulos do DB
  console.log('Buscando artigos sem imagem...')
  const nullArticles: { id: string; slug: string }[] = []
  let page = 0
  while (true) {
    const { data } = await supabase.from('articles').select('id, slug')
      .is('featured_image_url', null).range(page * 1000, (page + 1) * 1000 - 1)
    if (!data?.length) break
    nullArticles.push(...data)
    if (data.length < 1000) break
    page++
  }
  console.log(`  ${nullArticles.length} artigos nulos`)

  // Monta trabalho: só os que tinham imagem no WP
  const work = nullArticles
    .map(a => {
      const wpUrl = slugToWpUrl.get(a.slug)
      if (!wpUrl) return null
      const relPath = wpUrl.replace(WP_UPLOADS, '').replace(/^\//, '')
      const r2Key   = `wp-migrated/${relPath}`
      const r2Url   = `${R2_PUBLIC_URL}/${r2Key}`
      return { id: a.id, slug: a.slug, r2Key, r2Url }
    })
    .filter(Boolean) as { id: string; slug: string; r2Key: string; r2Url: string }[]

  console.log(`  ${work.length} tinham imagem no WP dump\n`)
  console.log(`Verificando existência no R2 (${CONCURRENCY} paralelos)...`)

  let found = 0, missing = 0, updated = 0, errors = 0
  const total = work.length
  const toUpdate: { id: string; r2Url: string }[] = []

  // Pool de HEAD requests
  const queue = [...work]
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()!
      const exists = await r2Exists(item.r2Key)
      if (exists) {
        found++
        toUpdate.push({ id: item.id, r2Url: item.r2Url })
      } else {
        missing++
      }
      if ((found + missing) % 50 === 0 || found + missing === total) {
        process.stdout.write(`\r  ${found + missing}/${total} verificados | ✅${found} no R2 | ❌${missing} ausentes...`)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  console.log('\n')

  console.log(`✅ Encontrados no R2: ${found}`)
  console.log(`❌ Genuinamente ausentes do zip: ${missing}`)

  if (isDryRun || toUpdate.length === 0) {
    if (toUpdate.length > 0) console.log('\n(dry-run — nenhuma alteração feita)')
    return
  }

  // Atualiza Supabase em lotes
  console.log(`\nAtualizando ${toUpdate.length} registros no Supabase...`)
  for (let i = 0; i < toUpdate.length; i += 50) {
    const batch = toUpdate.slice(i, i + 50)
    // Atualiza um por um para garantir (batch update por IDs heterogêneos)
    await Promise.all(batch.map(async ({ id, r2Url }) => {
      const { error } = await supabase.from('articles')
        .update({ featured_image_url: r2Url }).eq('id', id)
      if (error) { errors++; console.error(`\n  ❌ ${id}: ${error.message}`) }
      else updated++
    }))
    process.stdout.write(`\r  ${Math.min(i + 50, toUpdate.length)}/${toUpdate.length} atualizados...`)
  }

  console.log('\n')
  console.log('── Resultado final ─────────────────────────')
  console.log(`  ✅ Imagens recuperadas: ${updated}`)
  console.log(`  ❌ Erros DB:            ${errors}`)
  console.log(`  ⚠️  Ausentes do zip:    ${missing} (precisam de outra fonte)`)
}

main().catch(err => { console.error(err); process.exit(1) })
