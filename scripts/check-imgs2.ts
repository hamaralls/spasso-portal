import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {auth:{autoRefreshToken:false,persistSession:false}})
  
  // Distribuição por ano/mês dos sem imagem
  const { data } = await sb.from('articles')
    .select('published_at, title, slug')
    .is('featured_image_url', null)
    .order('published_at', { ascending: false })
    .limit(10)
  
  console.log('10 mais recentes sem imagem:')
  data?.forEach(a => console.log(`  ${a.published_at?.slice(0,10)}  ${a.slug}`))

  // Contar por ano
  const { data: byYear } = await sb.from('articles')
    .select('published_at')
    .is('featured_image_url', null)
  
  const counts: Record<string, number> = {}
  byYear?.forEach(a => {
    const y = a.published_at?.slice(0,4) ?? 'null'
    counts[y] = (counts[y]||0) + 1
  })
  console.log('\nPor ano:')
  Object.entries(counts).sort().forEach(([y,c]) => console.log(`  ${y}: ${c}`))
}
main()
