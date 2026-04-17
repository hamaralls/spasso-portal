/**
 * Diagnóstico 2: verifica se o R2 tem arquivos dos meses com falha.
 * Se tiver → zip tinha os arquivos, problema é outro (nome duplicado no índice).
 * Se não tiver → zip não tem esses meses.
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  // Artigos COM R2 — distribuição por YYYY/MM do path R2
  const articles: { featured_image_url: string }[] = []
  let page = 0
  while (true) {
    const { data } = await supabase
      .from('articles')
      .select('featured_image_url')
      .like('featured_image_url', '%r2.dev/wp-migrated/%')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (!data?.length) break
    articles.push(...data)
    if (data.length < 1000) break
    page++
  }
  console.log(`${articles.length} artigos com R2 no DB`)

  const counts: Record<string, number> = {}
  for (const a of articles) {
    const m = a.featured_image_url.match(/wp-migrated\/(\d{4}\/\d{2})\//)
    const ym = m?.[1] ?? 'sem-data'
    counts[ym] = (counts[ym] ?? 0) + 1
  }

  console.log('\nDistribuição R2 por YYYY/MM:')
  Object.entries(counts).sort().forEach(([ym, c]) => console.log(`  ${ym}: ${c}`))

  // Verifica especificamente os meses problemáticos
  const problematicos = ['2024/06','2024/08','2024/09','2024/11','2025/01','2025/02','2025/03','2026/01','2026/03']
  console.log('\nMeses problemáticos — quantos chegaram ao R2:')
  for (const ym of problematicos) {
    console.log(`  ${ym}: ${counts[ym] ?? 0}`)
  }

  // Mostra 3 exemplos de URL R2 mais recente
  const recentes = articles
    .filter(a => a.featured_image_url.includes('2025/') || a.featured_image_url.includes('2026/'))
    .slice(0, 5)
  if (recentes.length) {
    console.log('\nExemplos R2 de 2025/2026:')
    recentes.forEach(a => console.log(`  ${a.featured_image_url}`))
  } else {
    console.log('\n⚠️  NENHUM arquivo 2025/2026 chegou ao R2!')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
