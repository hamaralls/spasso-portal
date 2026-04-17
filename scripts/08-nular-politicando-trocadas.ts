/**
 * Script 08 — Nula os 101 artigos não-opiniao que estão usando
 * a foto do Politicando (foto-jodrther-thsr56-yd658d-6yifrfrrrnal-36gd-fky-d.jpg)
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const FOTO_POLITICANDO = 'foto-jodrther-thsr56-yd658d-6yifrfrrrnal-36gd-fky-d.jpg'

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  if (isDryRun) console.log('⚠️  DRY RUN\n')

  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, category_slug, featured_image_url')
    .like('featured_image_url', `%${FOTO_POLITICANDO}`)
    .neq('category_slug', 'opiniao')

  if (error) { console.error(error.message); process.exit(1) }

  console.log(`${data?.length ?? 0} artigos não-opiniao com foto do Politicando:`)
  data?.forEach(a => console.log(`  [${a.category_slug}] ${a.slug}`))

  if (isDryRun || !data?.length) {
    if (data?.length) console.log('\n(dry-run — nenhuma alteração feita)')
    return
  }

  const ids = data.map(a => a.id)
  const { error: upErr } = await supabase
    .from('articles')
    .update({ featured_image_url: null })
    .in('id', ids)

  if (upErr) { console.error(upErr.message); process.exit(1) }
  console.log(`\n✅ ${ids.length} imagens removidas.`)
}

main().catch(err => { console.error(err); process.exit(1) })
