/**
 * Diagnóstico: por que 673 artigos ficaram sem imagem?
 * Cruza DB (nulos) com dump WP para ver o padrão.
 */

import fs from 'node:fs'
import path from 'node:path'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const DATA_DIR = path.join(__dirname, 'data')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const WP_UPLOADS = 'https://jornalspassocidades.com.br/wp-content/uploads/'
const WP_UPLOADS_HTTP = 'http://jornalspassocidades.com.br/wp-content/uploads/'

async function main() {
  // 1. Busca todos os artigos nulos do DB (paginado)
  console.log('Buscando artigos sem imagem no DB...')
  const nullArticles: { id: string; slug: string }[] = []
  let page = 0
  while (true) {
    const { data } = await supabase
      .from('articles')
      .select('id, slug')
      .is('featured_image_url', null)
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (!data?.length) break
    nullArticles.push(...data)
    if (data.length < 1000) break
    page++
  }
  console.log(`  ${nullArticles.length} artigos nulos no DB`)

  // 2. Carrega dump WP
  const postmeta    = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'postmeta.json'), 'utf8'))
  const attachments = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'attachments.json'), 'utf8'))
  const posts       = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'posts.json'), 'utf8'))

  // Monta mapa slug → URL original WP
  const slugToWpUrl = new Map<string, string>()
  for (const post of posts) {
    const meta    = postmeta[post.ID] ?? postmeta[String(post.ID)]
    const thumbId = meta?.['_thumbnail_id']
    const url     = attachments[thumbId]
    if (!post.post_name || !url) continue
    slugToWpUrl.set(post.post_name, url)
  }
  console.log(`  ${slugToWpUrl.size} posts com thumbnail no dump WP\n`)

  // 3. Cruza: quais dos 673 tinham imagem no WP?
  let comUrlWp    = 0
  let semUrlWp    = 0
  const urlSamples: string[] = []
  const anoMesCounts: Record<string, number> = {}
  const dominios = new Set<string>()

  for (const art of nullArticles) {
    const wpUrl = slugToWpUrl.get(art.slug)
    if (!wpUrl) { semUrlWp++; continue }

    comUrlWp++

    // Domínio
    try {
      dominios.add(new URL(wpUrl).hostname)
    } catch {}

    // YYYY/MM
    const m = wpUrl.match(/uploads\/(\d{4}\/\d{2})\//)
    const ym = m?.[1] ?? 'sem-data'
    anoMesCounts[ym] = (anoMesCounts[ym] ?? 0) + 1

    // Amostras (primeiras 15)
    if (urlSamples.length < 15) {
      urlSamples.push(`  ${art.slug}\n    → ${wpUrl}`)
    }
  }

  console.log(`Dos ${nullArticles.length} artigos nulos:`)
  console.log(`  Tinham imagem no WP dump: ${comUrlWp}`)
  console.log(`  Não tinham imagem no WP:  ${semUrlWp}`)
  console.log(`\nDomínios encontrados nas URLs WP: ${[...dominios].join(', ')}`)

  console.log('\nDistribuição por YYYY/MM (top 20):')
  Object.entries(anoMesCounts)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 20)
    .forEach(([ym, c]) => console.log(`  ${ym}: ${c}`))

  console.log('\nAmostras (slug → URL WP original):')
  urlSamples.forEach(s => console.log(s))

  // 4. Verifica se as URLs seguem o padrão esperado
  let patternOk  = 0
  let patternBad = 0
  for (const art of nullArticles) {
    const url = slugToWpUrl.get(art.slug)
    if (!url) continue
    if (url.startsWith(WP_UPLOADS) || url.startsWith(WP_UPLOADS_HTTP)) patternOk++
    else { patternBad++; if (patternBad <= 5) console.log(`  URL fora do padrão: ${url}`) }
  }
  console.log(`\nURLs com padrão esperado (uploads/): ${patternOk}`)
  console.log(`URLs com padrão diferente: ${patternBad}`)
}

main().catch(err => { console.error(err); process.exit(1) })
