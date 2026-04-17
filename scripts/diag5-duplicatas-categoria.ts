/**
 * Diagnóstico 5: analisa os 473 artigos com imagem compartilhada por categoria
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const articles: { id: string; slug: string; featured_image_url: string; category_slug: string; published_at: string }[] = []
  let page = 0
  while (true) {
    const { data } = await supabase
      .from('articles')
      .select('id, slug, featured_image_url, category_slug, published_at')
      .like('featured_image_url', '%r2.dev/wp-migrated/%')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (!data?.length) break
    articles.push(...data as any)
    if (data.length < 1000) break
    page++
  }

  // Agrupa por URL, pega só duplicatas
  const byUrl = new Map<string, typeof articles>()
  for (const a of articles) {
    const list = byUrl.get(a.featured_image_url) ?? []
    list.push(a)
    byUrl.set(a.featured_image_url, list)
  }

  const duplicatas = [...byUrl.entries()]
    .filter(([, list]) => list.length > 1)
    .sort((a, b) => b[1].length - a[1].length)

  console.log(`\n${duplicatas.length} URLs compartilhadas — detalhamento por categoria:\n`)

  for (const [url, list] of duplicatas) {
    const filename = url.split('/').pop()
    // Contagem por categoria
    const cats: Record<string, number> = {}
    for (const a of list) {
      cats[a.category_slug] = (cats[a.category_slug] ?? 0) + 1
    }
    const catStr = Object.entries(cats).sort((a,b) => b[1]-a[1]).map(([c,n]) => `${c}(${n})`).join(' ')
    console.log(`  ${list.length}x  ${filename}`)
    console.log(`     cats: ${catStr}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
