/**
 * Nula imagens de 2026 + levanta padrões por ano/mês
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

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  if (isDryRun) console.log('⚠️  DRY RUN\n')

  // Carrega mapa slug → thumbId → count (para identificar shared)
  const postmeta    = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'postmeta.json'), 'utf8'))
  const attachments = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'attachments.json'), 'utf8'))
  const posts       = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'posts.json'), 'utf8'))

  const slugToThumbId = new Map<string, string>()
  const thumbIdCount  = new Map<string, number>()
  for (const post of posts) {
    const meta    = postmeta[post.ID] ?? postmeta[String(post.ID)]
    const thumbId = meta?.['_thumbnail_id']
    if (!thumbId || !post.post_name) continue
    slugToThumbId.set(post.post_name, thumbId)
    thumbIdCount.set(thumbId, (thumbIdCount.get(thumbId) ?? 0) + 1)
  }

  // Busca todos artigos com imagem R2
  const articles: { id: string; slug: string; featured_image_url: string; published_at: string; category_slug: string }[] = []
  let page = 0
  while (true) {
    const { data } = await supabase.from('articles').select('id, slug, featured_image_url, published_at, category_slug')
      .like('featured_image_url', '%r2.dev/wp-migrated/%')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (!data?.length) break
    articles.push(...data as any)
    if (data.length < 1000) break
    page++
  }

  // Analisa por ano
  const byYear: Record<string, { total: number; shared: number; unique: number; ids2026: string[] }> = {}
  const to2026: string[] = []

  for (const art of articles) {
    const year = art.published_at?.slice(0, 4) ?? 'unknown'
    if (!byYear[year]) byYear[year] = { total: 0, shared: 0, unique: 0, ids2026: [] }
    byYear[year].total++

    const thumbId = slugToThumbId.get(art.slug)
    const count   = thumbId ? (thumbIdCount.get(thumbId) ?? 1) : 1
    const isColuna = art.category_slug === 'opiniao'

    if (count > 1 && !isColuna) byYear[year].shared++
    else byYear[year].unique++

    if (year === '2026') {
      to2026.push(art.id)
      byYear[year].ids2026.push(art.id)
    }
  }

  console.log('── Padrão por ano (artigos com imagem R2) ──────────────')
  Object.entries(byYear).sort().forEach(([y, s]) =>
    console.log(`  ${y}: total=${s.total}  único=${s.unique}  shared=${s.shared}`)
  )

  // Analisa R2 path vs WP path por ano
  console.log('\n── Amostras de imagens 2026 (10 artigos) ──────────────')
  const amostras2026 = articles.filter(a => a.published_at?.startsWith('2026')).slice(0, 10)
  for (const art of amostras2026) {
    const thumbId  = slugToThumbId.get(art.slug)
    const wpUrl    = thumbId ? attachments[thumbId] : null
    const wpRel    = wpUrl ? wpUrl.replace(WP_UPLOADS, '') : '(sem dados WP)'
    const r2Rel    = art.featured_image_url.split('/wp-migrated/')[1] ?? art.featured_image_url
    const match    = wpRel === r2Rel ? '✅' : wpRel === '(sem dados WP)' ? '⚠️' : '❌'
    console.log(`  ${match} ${art.slug}`)
    console.log(`     WP: ${wpRel}`)
    console.log(`     R2: ${r2Rel}`)
  }

  console.log(`\n${to2026.length} artigos de 2026 com imagem → nular`)

  if (isDryRun || to2026.length === 0) {
    if (to2026.length > 0) console.log('(dry-run — nenhuma alteração feita)')
    return
  }

  let nulled = 0
  for (let i = 0; i < to2026.length; i += 100) {
    const batch = to2026.slice(i, i + 100)
    const { error } = await supabase.from('articles').update({ featured_image_url: null }).in('id', batch)
    if (error) console.error('Erro:', error.message)
    else nulled += batch.length
    process.stdout.write(`\r  ${nulled}/${to2026.length}...`)
  }
  console.log(`\n✅ ${nulled} imagens de 2026 removidas.`)
}

main().catch(console.error)
