/**
 * Script 09 — Valida imagens pelo critério de exclusividade no WP dump
 *
 * Lógica:
 *   - _thumbnail_id usado por exatamente 1 post → imagem exclusiva → MANTER
 *   - _thumbnail_id usado por 2+ posts → genérica/ambígua → NULAR
 *   - Exceção: category_slug = 'opiniao' → MANTER sempre (Politicando confirmado)
 *
 * Uso:
 *   npx tsx scripts/09-validar-thumbnail-unico.ts --dry-run
 *   npx tsx scripts/09-validar-thumbnail-unico.ts
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

// Categorias onde imagem compartilhada é intencional (cabeçalho de coluna)
const CATEGORIAS_COLUNA = new Set(['opiniao'])

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  if (isDryRun) console.log('⚠️  DRY RUN\n')

  // 1. Mapa thumbId → quantos posts usam
  const postmeta = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'postmeta.json'), 'utf8'))
  const posts    = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'posts.json'), 'utf8'))

  // slug → thumbId
  const slugToThumbId = new Map<string, string>()
  // thumbId → count de posts
  const thumbIdCount  = new Map<string, number>()

  for (const post of posts) {
    const meta    = postmeta[post.ID] ?? postmeta[String(post.ID)]
    const thumbId = meta?.['_thumbnail_id']
    if (!thumbId || !post.post_name) continue
    slugToThumbId.set(post.post_name, thumbId)
    thumbIdCount.set(thumbId, (thumbIdCount.get(thumbId) ?? 0) + 1)
  }

  // 2. Busca artigos com imagem R2
  console.log('Buscando artigos com imagem R2...')
  const articles: { id: string; slug: string; featured_image_url: string; category_slug: string }[] = []
  let page = 0
  while (true) {
    const { data } = await supabase
      .from('articles')
      .select('id, slug, featured_image_url, category_slug')
      .like('featured_image_url', '%r2.dev/wp-migrated/%')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (!data?.length) break
    articles.push(...data as any)
    if (data.length < 1000) break
    page++
  }
  console.log(`${articles.length} artigos com imagem R2\n`)

  // 3. Classifica cada artigo
  let manter       = 0
  let nular        = 0
  let semDadosWP   = 0
  const toNull: string[] = []
  const exemplosNular: string[] = []

  // Grupos de nulação para relatório
  const motivos: Record<string, number> = {}

  for (const art of articles) {
    // Exceção: categorias de coluna → sempre manter
    if (CATEGORIAS_COLUNA.has(art.category_slug)) {
      manter++
      continue
    }

    const thumbId = slugToThumbId.get(art.slug)
    if (!thumbId) {
      semDadosWP++
      continue
    }

    const count = thumbIdCount.get(thumbId) ?? 1

    if (count === 1) {
      manter++
    } else {
      nular++
      toNull.push(art.id)
      const motivo = `shared-${count}x`
      motivos[motivo] = (motivos[motivo] ?? 0) + 1
      if (exemplosNular.length < 10) {
        exemplosNular.push(`  [${art.category_slug}] ${art.slug} (thumb compartilhado ${count}x)`)
      }
    }
  }

  console.log('── Resultado ────────────────────────────────')
  console.log(`✅ Manter (imagem exclusiva ou coluna):  ${manter}`)
  console.log(`❌ Nular  (thumbnail compartilhado):     ${nular}`)
  console.log(`⚠️  Sem dados WP:                        ${semDadosWP}`)

  console.log('\nDistribuição dos compartilhamentos:')
  Object.entries(motivos).sort((a,b) => b[1]-a[1]).forEach(([m,c]) => console.log(`  ${m}: ${c} artigos`))

  if (exemplosNular.length) {
    console.log('\nExemplos a nular:')
    exemplosNular.forEach(e => console.log(e))
  }

  if (isDryRun || toNull.length === 0) {
    if (toNull.length > 0) console.log('\n(dry-run — nenhuma alteração feita)')
    return
  }

  console.log(`\nNulando ${toNull.length} imagens...`)
  let nulled = 0
  for (let i = 0; i < toNull.length; i += 100) {
    const batch = toNull.slice(i, i + 100)
    const { error } = await supabase.from('articles')
      .update({ featured_image_url: null })
      .in('id', batch)
    if (error) console.error('Erro batch:', error.message)
    else nulled += batch.length
    process.stdout.write(`\r  ${nulled}/${toNull.length}...`)
  }

  console.log(`\n\n✅ ${nulled} imagens ambíguas removidas.`)
  console.log(`   Artigos exibem og-default.jpg até correção manual.`)
}

main().catch(err => { console.error(err); process.exit(1) })
