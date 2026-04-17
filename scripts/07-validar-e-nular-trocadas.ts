/**
 * Script 07 — Valida imagens pelo path completo (YYYY/MM/filename)
 *
 * Compara o path original do WP (dump) com o path no R2.
 * Se não bater exatamente → nula featured_image_url.
 *
 * Usa normalização:
 *   - strip de sufixo de tamanho (-300x200.jpg → .jpg)
 *   - lowercase para comparar
 *
 * Uso:
 *   npx tsx scripts/07-validar-e-nular-trocadas.ts --dry-run
 *   npx tsx scripts/07-validar-e-nular-trocadas.ts
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

const WP_UPLOADS    = 'https://jornalspassocidades.com.br/wp-content/uploads/'
const R2_PREFIX     = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL!}/wp-migrated/`

function normalize(relPath: string): string {
  return relPath
    .replace(/-\d+x\d+(\.\w+)$/, '$1')  // strip tamanho (-300x200.jpg → .jpg)
    .toLowerCase()
    .trim()
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  if (isDryRun) console.log('⚠️  DRY RUN\n')

  // Carrega mapa slug → relPath original do WP
  const postmeta    = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'postmeta.json'), 'utf8'))
  const attachments = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'attachments.json'), 'utf8'))
  const posts       = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'posts.json'), 'utf8'))

  const slugToRelPath = new Map<string, string>()
  for (const post of posts) {
    const meta    = postmeta[post.ID] ?? postmeta[String(post.ID)]
    const thumbId = meta?.['_thumbnail_id']
    const url     = attachments[thumbId]
    if (!post.post_name || !url) continue
    const rel = url.replace(WP_UPLOADS, '').replace(/^\//, '')
    slugToRelPath.set(post.post_name, rel)
  }
  console.log(`${slugToRelPath.size} artigos com thumbnail no dump WP`)

  // Busca artigos COM imagem R2 (paginado)
  console.log('Buscando artigos com imagem R2...')
  const articles: { id: string; slug: string; featured_image_url: string }[] = []
  let page = 0
  while (true) {
    const { data } = await supabase
      .from('articles')
      .select('id, slug, featured_image_url')
      .like('featured_image_url', '%r2.dev/wp-migrated/%')
      .range(page * 1000, (page + 1) * 1000 - 1)
    if (!data?.length) break
    articles.push(...data as any)
    if (data.length < 1000) break
    page++
  }
  console.log(`${articles.length} artigos com imagem R2\n`)

  let corretos  = 0
  let trocados  = 0
  let semDados  = 0
  const toNull: string[] = []

  for (const art of articles) {
    const wpRelPath = slugToRelPath.get(art.slug)

    if (!wpRelPath) {
      semDados++
      continue
    }

    // relPath atual no R2
    const r2RelPath = art.featured_image_url.replace(R2_PREFIX, '').replace(/^\//, '')

    const wpNorm = normalize(wpRelPath)
    const r2Norm = normalize(r2RelPath)

    if (wpNorm === r2Norm) {
      corretos++
    } else {
      trocados++
      toNull.push(art.id)
      if (trocados <= 15) {
        console.log(`  ❌ ${art.slug}`)
        console.log(`     WP esperado: ${wpRelPath}`)
        console.log(`     R2 atual:    ${r2RelPath}`)
      }
    }
  }

  console.log(`\n✅ Corretos:           ${corretos}`)
  console.log(`❌ Trocados (nular):   ${trocados}`)
  console.log(`⚠️  Sem dados WP:      ${semDados}`)

  if (isDryRun || toNull.length === 0) {
    if (toNull.length > 0) console.log('\n(dry-run — nenhuma alteração feita)')
    return
  }

  // Nula em lotes de 100
  console.log(`\nNulando ${toNull.length} imagens trocadas...`)
  let nulled = 0
  for (let i = 0; i < toNull.length; i += 100) {
    const batch = toNull.slice(i, i + 100)
    const { error } = await supabase.from('articles')
      .update({ featured_image_url: null })
      .in('id', batch)
    if (error) console.error('Erro no batch:', error.message)
    else nulled += batch.length
    process.stdout.write(`\r  ${nulled}/${toNull.length}...`)
  }

  console.log(`\n\n✅ ${nulled} imagens trocadas removidas.`)
  console.log(`   Artigos afetados exibem og-default.jpg até corrigir manualmente.`)
}

main().catch(err => { console.error(err); process.exit(1) })
