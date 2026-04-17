/**
 * Diagnóstico 3: os arquivos ausentes existem no R2 com path diferente?
 * Se sim → é bug de path e corrigimos o Supabase.
 * Se não → arquivos genuinamente faltando no zip.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const DATA_DIR = path.join(__dirname, 'data')
const WP_UPLOADS = 'https://jornalspassocidades.com.br/wp-content/uploads/'
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_BUCKET     = process.env.R2_BUCKET_NAME!
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!

function hmacSha256(key: Buffer | string, msg: string): Buffer {
  return crypto.createHmac('sha256', key).update(msg).digest()
}

async function r2Head(key: string): Promise<boolean> {
  const now         = new Date()
  const isoDate     = now.toISOString().slice(0, 10).replace(/-/g, '')
  const isoDateTime = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const host        = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const bodyHash    = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  const encodedPath = `${R2_BUCKET}/${key}`.split('/').map(encodeURIComponent).join('/')

  const canonHeaders = `host:${host}\nx-amz-content-sha256:${bodyHash}\nx-amz-date:${isoDateTime}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonRequest  = ['HEAD', `/${encodedPath}`, '', canonHeaders, signedHeaders, bodyHash].join('\n')
  const credScope     = `${isoDate}/auto/s3/aws4_request`
  const stringToSign  = ['AWS4-HMAC-SHA256', isoDateTime, credScope,
    crypto.createHash('sha256').update(canonRequest).digest('hex')].join('\n')
  const sk        = hmacSha256(hmacSha256(hmacSha256(hmacSha256('AWS4' + R2_SECRET_KEY, isoDate), 'auto'), 's3'), 'aws4_request')
  const signature = hmacSha256(sk, stringToSign).toString('hex')
  const auth      = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(`https://${host}/${encodedPath}`, {
    method: 'HEAD',
    headers: { 'host': host, 'x-amz-content-sha256': bodyHash, 'x-amz-date': isoDateTime, 'Authorization': auth },
  })
  return res.ok
}

async function main() {
  // Carrega mapa slug → URL WP original (do dump)
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

  // Monta lista de arquivos para checar
  const toCheck = nullArticles
    .map(a => ({ id: a.id, slug: a.slug, wpUrl: slugToWpUrl.get(a.slug) }))
    .filter(a => a.wpUrl)

  console.log(`Verificando ${toCheck.length} arquivos no R2 (amostras)...`)
  console.log('(Testando 30 amostras — se todos falharem, os arquivos não estão no R2)\n')

  // Testa 30 amostras distribuídas
  const sample = toCheck.filter((_, i) => i % Math.ceil(toCheck.length / 30) === 0).slice(0, 30)

  let found = 0
  let notFound = 0
  const foundExamples: string[] = []

  for (const item of sample) {
    const relPath = item.wpUrl!.replace(WP_UPLOADS, '').replace(/^\//, '')
    const r2Key   = `wp-migrated/${relPath}`

    // Tenta path exato
    const exists = await r2Head(r2Key)
    if (exists) {
      found++
      foundExamples.push(`  ✅ ${relPath}`)
    } else {
      // Tenta variações: sem YYYY/MM (só filename)
      const basename = path.basename(relPath)
      // Não sabemos o path alternativo sem varrer o R2 inteiro
      notFound++
      if (notFound <= 5) {
        process.stdout.write(`  ❌ ${relPath}\n`)
      }
    }
  }

  console.log(`\nResultado (${sample.length} amostras):`)
  console.log(`  ✅ Encontrados no R2 (path exato): ${found}`)
  console.log(`  ❌ Não encontrados:                ${notFound}`)

  if (found > 0) {
    console.log('\nExemplos encontrados:')
    foundExamples.forEach(e => console.log(e))
    console.log('\n→ BUG: arquivos estão no R2 mas com path errado no Supabase!')
  } else {
    console.log('\n→ CONCLUSÃO: arquivos genuinamente ausentes do zip/R2.')
    console.log('  Opção: tentar baixar direto do servidor WP se ainda acessível.')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
