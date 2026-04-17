/**
 * Diagnóstico 6: os 30 artigos mais recentes e suas imagens
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const { data } = await supabase
    .from('articles')
    .select('id, slug, title, featured_image_url, published_at, category_slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30)

  console.log('30 artigos mais recentes:\n')
  data?.forEach(a => {
    const img = a.featured_image_url
      ? a.featured_image_url.split('/wp-migrated/')[1] ?? a.featured_image_url
      : '(null)'
    console.log(`${a.published_at?.slice(0,10)}  [${a.category_slug}]  ${a.slug}`)
    console.log(`  img: ${img}`)
  })
}
main().catch(console.error)
