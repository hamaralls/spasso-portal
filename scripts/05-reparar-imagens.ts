/**
 * Script 05 — Repara featured_image_url com ano/mês errado
 *
 * Problema: o script 03 usou fallback por nome de arquivo quando o path
 * exato não estava no zip. Isso fez artigos de 2026/03 pegarem imagens de
 * 2025/09 com o mesmo nome — imagem de um artigo aparecendo em outro.
 *
 * Solução: para cada artigo, compara o path original do WP (via postmeta
 * do dump) com o path migrado para o R2. Se o YYYY/MM não bater, nula o
 * campo → artigo exibe og-default.jpg em vez de imagem errada.
 *
 * Uso:
 *   npx tsx scripts/05-reparar-imagens.ts --dry-run
 *   npx tsx scripts/05-reparar-imagens.ts
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
const R2_PREFIX  = process.env.NEXT_PUBLIC_R2_PUBLIC_URL! + '/wp-migrated/'

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  if (isDryRun) console.log('⚠️  DRY RUN')

  // Carrega dados do dump WP
  const posts       = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'posts.json'), 'utf8'))
  const postmeta    = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'postmeta.json'), 'utf8'))
  const attachments = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'attachments.json'), 'utf8'))

  // Monta mapa post_name → URL original do WP
  const slugToOriginalUrl = new Map<string, string>()

  for (const [, post] of Object.entries(posts) as [string, any][]) {
    const meta    = postmeta[post.ID] ?? postmeta[String(post.ID)]
    const thumbId = meta?._thumbnail_id
    const attUrl  = attachments[thumbId]
    if (!post.post_name || !attUrl) continue

    // Extrai só o path relativo: YYYY/MM/filename.ext
    const relPath = attUrl.replace(WP_UPLOADS, '').replace(/^\//, '')
    slugToOriginalUrl.set(post.post_name, relPath)
  }

  console.log(`  ${slugToOriginalUrl.size} artigos com thumbnail no dump WP`)

  // Busca TODOS os artigos do DB com imagem R2 (paginado — Supabase cap 1000/query)
  const articles: { id: string; slug: string; featured_image_url: string | null }[] = []
  let page = 0
  const PAGE = 1000

  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, featured_image_url')
      .like('featured_image_url', `%r2.dev/wp-migrated/%`)
      .range(page * PAGE, (page + 1) * PAGE - 1)

    if (error) { console.error(error.message); process.exit(1) }
    if (!data?.length) break
    articles.push(...data)
    if (data.length < PAGE) break
    page++
  }

  if (!articles.length) { console.log('Nenhum artigo para verificar.'); return }

  console.log(`  ${articles.length} artigos no DB com imagem R2\n`)

  let corretos  = 0
  let errados   = 0
  let semDados  = 0
  const toNull: string[] = []

  for (const art of articles) {
    const originalRelPath = slugToOriginalUrl.get(art.slug)

    if (!originalRelPath) {
      semDados++
      continue
    }

    // Path atual no R2: extrai o relPath do URL R2
    const currentRelPath = art.featured_image_url!
      .replace(R2_PREFIX, '')
      .replace(/^\//, '')

    // Compara path completo (YYYY/MM/filename) — fallback de nome pega arquivo errado do mesmo mês
    const origBasename = path.basename(originalRelPath).replace(/-\d+x\d+(\.\w+)$/, '$1').toLowerCase()
    const currBasename = path.basename(currentRelPath).toLowerCase()

    if (origBasename === currBasename) {
      corretos++
    } else {
      errados++
      toNull.push(art.id)
      if (isDryRun || errados <= 10) {
        console.log(`  ❌ ${art.slug}`)
        console.log(`     original:  ${originalRelPath}`)
        console.log(`     migrado:   ${currentRelPath}`)
      }
    }
  }

  console.log(`\n  ✅ Corretos:        ${corretos}`)
  console.log(`  ❌ Errados (nular): ${errados}`)
  console.log(`  ⚠️  Sem dados WP:   ${semDados}`)

  if (isDryRun || toNull.length === 0) {
    if (toNull.length > 0) console.log('\n  (dry-run — nenhuma alteração feita)')
    return
  }

  // Nula os errados em lotes de 100
  let nulled = 0
  for (let i = 0; i < toNull.length; i += 100) {
    const batch = toNull.slice(i, i + 100)
    const { error: upErr } = await supabase
      .from('articles')
      .update({ featured_image_url: null })
      .in('id', batch)

    if (upErr) console.error('Erro ao nular batch:', upErr.message)
    else nulled += batch.length
    process.stdout.write(`\r  Nulando... ${nulled}/${toNull.length}`)
  }

  console.log(`\n\n✅ ${nulled} imagens erradas removidas.`)
  console.log('   Artigos afetados vão exibir og-default.jpg.')
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
