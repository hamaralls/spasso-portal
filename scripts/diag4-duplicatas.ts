/**
 * Diagnóstico 4: imagens duplicadas — mesma URL R2 em vários artigos
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log('Buscando artigos com imagem R2...')
  const articles: { id: string; slug: string; featured_image_url: string; published_at: string }[] = []
  let page = 0
  while (true) {
    const { data } = await supabase
      .from('articles')
      .select('id, slug, featured_image_url, published_at')
      .like('featured_image_url', '%r2.dev/wp-migrated/%')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (!data?.length) break
    articles.push(...data as any)
    if (data.length < 1000) break
    page++
  }
  console.log(`${articles.length} artigos com imagem R2\n`)

  // Agrupa por URL
  const byUrl = new Map<string, typeof articles>()
  for (const a of articles) {
    const list = byUrl.get(a.featured_image_url) ?? []
    list.push(a)
    byUrl.set(a.featured_image_url, list)
  }

  const duplicatas = [...byUrl.entries()].filter(([, list]) => list.length > 1)
  console.log(`URLs únicas: ${byUrl.size}`)
  console.log(`URLs duplicadas (usadas em +1 artigo): ${duplicatas.length}`)

  // Total de artigos afetados
  const totalAfetados = duplicatas.reduce((acc, [, list]) => acc + list.length, 0)
  console.log(`Artigos com imagem compartilhada: ${totalAfetados}`)

  // Top 10 mais duplicadas
  console.log('\nTop 10 imagens mais compartilhadas:')
  duplicatas
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .forEach(([url, list]) => {
      const filename = url.split('/').pop()
      console.log(`  ${list.length}x  ${filename}`)
      list.slice(0, 3).forEach(a => console.log(`    - ${a.slug} (${a.published_at?.slice(0, 10)})`))
      if (list.length > 3) console.log(`    ... e mais ${list.length - 3}`)
    })
}

main().catch(err => { console.error(err); process.exit(1) })
