/**
 * Script 10 — Limpa artigos de janeiro a 15/04 de 2026
 *
 * Emerson só tem backup no Coda a partir de 02/02/2026.
 * Este script apaga os artigos publicados entre 01/01/2026 e 15/04/2026
 * para permitir re-importação limpa via Coda → n8n → Portal.
 *
 * Uso:
 *   npx tsx scripts/10-limpar-2026.ts          ← mostra preview (não apaga)
 *   npx tsx scripts/10-limpar-2026.ts --confirm ← APAGA os dados
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  const confirmed = process.argv.includes('--confirm')

  console.log('\n📋 Script 10 — Limpeza de artigos 2026 (jan a 15/abr)\n')
  console.log('Período: 2026-01-01 00:00:00 → 2026-04-15 23:59:59\n')

  if (!confirmed) {
    console.log('⚠️  MODO PREVIEW — nada será apagado\n')
  } else {
    console.log('🚨 MODO DELETE — dados serão apagados permanentemente\n')
  }

  // Busca artigos no período
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, published_at')
    .gte('published_at', '2026-01-01')
    .lte('published_at', '2026-04-15 23:59:59')
    .order('published_at')

  if (error) {
    console.error('Erro ao buscar:', error.message)
    process.exit(1)
  }

  console.log(`📰 Artigos encontrados no período: ${data.length}\n`)

  if (data.length === 0) {
    console.log('Nada para apagar. Tudo certo.')
    return
  }

  // Mostra breakdown por mês
  const porMes: Record<string, number> = {}
  for (const a of data) {
    const mes = (a.published_at ?? '').slice(0, 7)
    porMes[mes] = (porMes[mes] ?? 0) + 1
  }
  console.log('Por mês:')
  for (const [mes, qtd] of Object.entries(porMes).sort()) {
    console.log(`  ${mes}: ${qtd} artigos`)
  }

  if (!confirmed) {
    console.log('\nPara apagar, rode: npx tsx scripts/10-limpar-2026.ts --confirm')
    return
  }

  // Confirmação final
  console.log(`\n⛔ Apagando ${data.length} artigos...`)

  const { error: deleteError } = await supabase
    .from('articles')
    .delete()
    .gte('published_at', '2026-01-01')
    .lte('published_at', '2026-04-15 23:59:59')

  if (deleteError) {
    console.error('Erro ao apagar:', deleteError.message)
    process.exit(1)
  }

  console.log(`\n✅ ${data.length} artigos apagados com sucesso.`)
  console.log('Agora pode re-importar pelo Coda.')
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
