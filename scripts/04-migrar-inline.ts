/**
 * Script 04 — Substitui URLs inline do WP no content dos artigos
 *
 * Para cada artigo, substitui:
 *   https://jornalspassocidades.com.br/wp-content/uploads/...
 * por:
 *   https://pub-XXX.r2.dev/wp-migrated/...
 *
 * Uso:
 *   npx tsx scripts/04-migrar-inline.ts            ← atualiza tudo
 *   npx tsx scripts/04-migrar-inline.ts --dry-run  ← mostra amostras sem alterar
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const WP_BASE    = 'https://jornalspassocidades.com.br/wp-content/uploads/'
const WP_BASE_2  = 'http://jornalspassocidades.com.br/wp-content/uploads/'
const R2_BASE    = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/wp-migrated/`

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const isDryRun = process.argv.includes('--dry-run')

  console.log('Buscando artigos com URLs inline do WP...')

  let page = 0
  const PAGE_SIZE = 200
  let total = 0
  let updated = 0

  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, content')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (error) { console.error(error.message); break }
    if (!data?.length) break

    total += data.length

    for (const article of data) {
      const rendered: string = article.content?.rendered ?? ''
      const newRendered = rendered
        .replace(new RegExp(WP_BASE.replace(/\//g, '\\/'), 'g'), R2_BASE)
        .replace(new RegExp(WP_BASE_2.replace(/\//g, '\\/'), 'g'), R2_BASE)

      if (newRendered === rendered) continue

      if (isDryRun) {
        // Mostra primeira diferença
        const match = rendered.match(new RegExp(WP_BASE + '[^"\'\\s]+'))
        console.log(`  [dry-run] ${article.id}: ${match?.[0]?.slice(0, 80)}...`)
        updated++
        continue
      }

      const { error: upErr } = await supabase
        .from('articles')
        .update({ content: { rendered: newRendered } })
        .eq('id', article.id)

      if (upErr) console.error(`  ❌ ${article.id}: ${upErr.message}`)
      else updated++
    }

    process.stdout.write(`\r  Processados: ${total}...`)
    page++
  }

  console.log('\n')
  console.log(`  Artigos verificados: ${total}`)
  console.log(`  ${isDryRun ? 'Com URLs WP (seriam atualizados)' : '✅ Atualizados'}: ${updated}`)
  console.log('\n✅ Script 04 concluído.')
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
