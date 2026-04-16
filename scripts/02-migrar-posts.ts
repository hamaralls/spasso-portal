/**
 * Script 02 — Migra posts do WordPress para o Supabase
 *
 * Pré-requisito: rodar 01-extrair-dados.ts antes
 *
 * Uso:
 *   npx tsx scripts/02-migrar-posts.ts            ← migra tudo
 *   npx tsx scripts/02-migrar-posts.ts --dry-run  ← só mostra o que faria
 *   npx tsx scripts/02-migrar-posts.ts --limit 50 ← migra apenas 50 posts
 */

import fs from 'node:fs'
import path from 'node:path'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const DATA_DIR = path.join(__dirname, 'data')

// ── Supabase (service role) ─────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Mapeamento de categorias ────────────────────────────

const CIDADES_MAP: Record<string, string | null> = {
  'sumare':                    'sumare',
  'hortolandia':               'hortolandia',
  'nova-odessa':               'nova-odessa',
  'campinas':                  'campinas',
  'paulinia':                  'paulinia',
  'monte-mor':                 'monte-mor',
  'santa-barbara-doeste':      'santa-barbara-doeste',
  'americana':                 'outras-cidades',
  'indaiatuba':                'outras-cidades',
  'piracicaba':                'outras-cidades',
  'cosmopolis':                'outras-cidades',
  'holambra':                  'outras-cidades',
  'jaguariuna':                'outras-cidades',
  'valinhos':                  'outras-cidades',
  'vinhedo':                   'outras-cidades',
  'espirito-santo-do-pinhal':  'outras-cidades',
  'braganca-paulista':         'outras-cidades',
  'jundiai':                   'outras-cidades',
  'amparo':                    'outras-cidades',
  'sao-pedro':                 'outras-cidades',
  'taboao-da-serra':           'outras-cidades',
  'cidades-da-rmc':            null,   // só parent, ignora
  'regiao-metropolitana-de-campinas': 'rmc',
}

const TEMAS_MAP: Record<string, string> = {
  'blog':                       'estilo-de-vida',  // legacy blog
  'brasil':                     'brasil',
  'saude':                      'saude',
  'saude-e-bem-estar':          'saude',
  'saude-mental':               'saude',
  'saude-publica':              'saude',
  'educacao':                   'educacao',
  'economia':                   'economia',
  'economia-e-negocios':        'economia',
  'esporte':                    'esporte',
  'esportes':                   'esporte',
  'politica':                   'politica',
  'politica-e-gestao':          'politica',
  'politicas-publicas':         'politica',
  'eleicoes':                   'politica',
  'politicando':                'opiniao',
  'opiniao':                    'opiniao',
  'cultura-e-lazer':            'cultura-e-lazer',
  'cultura':                    'cultura-e-lazer',
  'seguranca':                  'seguranca',
  'meio-ambiente':              'meio-ambiente',
  'infraestrutura':             'infraestrutura',
  'transito-e-mobilidade':      'infraestrutura',
  'turismo':                    'estilo-de-vida',
  'eventos':                    'eventos',
  'tecnologia':                 'tecnologia',
  'empregos':                   'empregos',
  'emprego':                    'empregos',
  'gastronomia':                'estilo-de-vida',
  'moda':                       'estilo-de-vida',
  'tendencias':                 'estilo-de-vida',
  'beleza':                     'estilo-de-vida',
  'comportamento':              'estilo-de-vida',
  'pets':                       'estilo-de-vida',
  'relacionamentos':            'estilo-de-vida',
  'decoracao':                  'estilo-de-vida',
  'casa-e-decoracao':           'estilo-de-vida',
  'jardim':                     'estilo-de-vida',
  // Slugs extras encontrados no dump WP
  'sao-paulo':                  'brasil',
  'estado-de-sao-paulo':        'brasil',
  'outros':                     'brasil',
  'abastecimento-de-agua':      'meio-ambiente',
  'internacional':              'brasil',
  'alimentacao':                'estilo-de-vida',
  'comunidade-e-ongs':          'brasil',
  'clima':                      'meio-ambiente',
  'casa':                       'estilo-de-vida',
  'previsao-do-tempo':          'meio-ambiente',
  'saude-da-mulher':            'saude',
  'direito-da-familia':         'brasil',
  'emagrecimento':              'saude',
  'bem-estar':                  'saude',
  'promocoes-e-varejo':         'economia',
  'entretenimento':             'cultura-e-lazer',
  'inovacao':                   'tecnologia',
  'agronegocio':                'economia',
  'politica-internacional':     'brasil',
  'aguas-de-lindoia':           'outras-cidades',
  'artur-nogueira':             'outras-cidades',
  'brotas':                     'outras-cidades',
  'tecnologia-e-inovacao':      'tecnologia',
  'dicas':                      'estilo-de-vida',
  'consumo':                    'economia',
  'comercio':                   'economia',
  'fitness':                    'saude',
  'culinaria':                  'estilo-de-vida',
  'video':                      'brasil',
  'mundo':                      'brasil',
  // Slugs adicionais (encontrados no batch 1350-1400)
  'investimentos-publicos':     'infraestrutura',
  'acessorios':                 'estilo-de-vida',
  'imposto':                    'economia',
  'campanha':                   'politica',
  'policia':                    'seguranca',
  'cidades-da-rmc':             'rmc',   // fallback se for único
}

// Categorias que marcam is_legacy_blog = true
const LEGACY_BLOG_SLUGS = new Set(['blog', 'decoracao', 'casa-e-decoracao', 'jardim', 'pets', 'relacionamentos'])

// Categorias para ignorar ao buscar primary (WP internos)
const IGNORAR_SLUGS = new Set(['featured', 'destaque', 'uncategorized', 'sem-categoria', 'td-demo'])

// ── Utilitários ─────────────────────────────────────────

function stripGutenberg(html: string): string {
  return html
    .replace(/<!-- \/?wp:[^\n]*?-->/g, '')   // remove block comments
    .replace(/\n{3,}/g, '\n\n')              // colapsa linhas em branco extras
    .trim()
}

function stripHtmlForExcerpt(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300)
}

// ── Carrega dados ───────────────────────────────────────

type WPPost = {
  ID: string
  post_title: string
  post_name: string
  post_content: string
  post_excerpt: string
  post_date: string
  post_author: string
  post_status: string
  post_type: string
}

function loadData() {
  const files = ['posts', 'attachments', 'postmeta', 'terms', 'term_taxonomy', 'term_relationships']
  for (const f of files) {
    const p = path.join(DATA_DIR, `${f}.json`)
    if (!fs.existsSync(p)) {
      console.error(`Arquivo não encontrado: ${p}`)
      console.error('Rode primeiro: npx tsx scripts/01-extrair-dados.ts')
      process.exit(1)
    }
  }

  return {
    posts:               JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'posts.json'), 'utf8'))             as WPPost[],
    attachments:         JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'attachments.json'), 'utf8'))       as Record<string, string>,
    postmeta:            JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'postmeta.json'), 'utf8'))          as Record<string, Record<string, string>>,
    terms:               JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'terms.json'), 'utf8'))             as Record<string, { name: string; slug: string }>,
    termTaxonomy:        JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'term_taxonomy.json'), 'utf8'))     as Record<string, { term_id: string; taxonomy: string; parent: string }>,
    termRelationships:   JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'term_relationships.json'), 'utf8')) as Record<string, string[]>,
  }
}

// ── Resolve categoria primária ──────────────────────────

function resolveCategorySlug(
  postId: string,
  termRelationships: Record<string, string[]>,
  termTaxonomy: Record<string, { term_id: string; taxonomy: string; parent: string }>,
  terms: Record<string, { name: string; slug: string }>
): { categorySlug: string; isLegacyBlog: boolean } {
  const ttids = termRelationships[postId] ?? []

  // Filtra só taxonomia 'category'
  const catTtids = ttids.filter(ttid => termTaxonomy[ttid]?.taxonomy === 'category')

  // Busca slugs das categorias
  const catSlugs = catTtids
    .map(ttid => terms[termTaxonomy[ttid]?.term_id]?.slug ?? '')
    .filter(Boolean)

  // Verifica legacy blog
  const isLegacyBlog = catSlugs.some(s => LEGACY_BLOG_SLUGS.has(s))

  // Exclui slugs internos
  const validSlugs = catSlugs.filter(s => !IGNORAR_SLUGS.has(s) && !s.startsWith('td-demo'))

  // Prioridade: cidade > tema
  for (const slug of validSlugs) {
    if (slug in CIDADES_MAP && CIDADES_MAP[slug] !== null) {
      return { categorySlug: CIDADES_MAP[slug]!, isLegacyBlog }
    }
  }

  for (const slug of validSlugs) {
    if (slug in TEMAS_MAP) {
      return { categorySlug: TEMAS_MAP[slug], isLegacyBlog }
    }
  }

  // Fallback seguro para todos os slugs WP não mapeados
  // Não usar slug cru — ele pode não existir na tabela categories

  // Fallback seguro: sempre vai existir no banco
  return { categorySlug: 'brasil', isLegacyBlog }
}

// ── Org ID ──────────────────────────────────────────────

let orgId: string | null = null

async function getOrgId(): Promise<string> {
  if (orgId) return orgId
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single()
  if (error || !data) throw new Error(`Organização não encontrada: ${error?.message}`)
  orgId = data.id as string
  return orgId as string
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const limitArg = args.find(a => a.startsWith('--limit=')) ?? args[args.indexOf('--limit') + 1]
  const limit = limitArg ? parseInt(String(limitArg).replace('--limit=', '')) : Infinity

  console.log('Carregando dados...')
  const { posts, attachments, postmeta, terms, termTaxonomy, termRelationships } = loadData()
  console.log(`  ${posts.length} posts a migrar`)
  if (isDryRun) console.log('  ⚠️  DRY RUN — nada será inserido')
  if (limit !== Infinity) console.log(`  Limite: ${limit} posts`)

  const org_id = isDryRun ? 'dry-run' : await getOrgId()

  let inserted = 0
  let skipped  = 0
  let errors   = 0
  const BATCH  = 50

  const postsToProcess = posts.slice(0, limit === Infinity ? undefined : limit)

  for (let i = 0; i < postsToProcess.length; i += BATCH) {
    const batch = postsToProcess.slice(i, i + BATCH)

    const rows = batch.map(post => {
      const meta = postmeta[post.ID] ?? {}
      const thumbId = meta['_thumbnail_id']
      const featuredImageUrl = thumbId ? (attachments[thumbId] ?? null) : null

      const seoTitle = meta['_yoast_wpseo_title']
        ?? meta['_aioseo_title']
        ?? null

      const seoDesc = meta['_yoast_wpseo_metadesc']
        ?? meta['_aioseo_description']
        ?? null

      const { categorySlug, isLegacyBlog } = resolveCategorySlug(
        post.ID,
        termRelationships,
        termTaxonomy,
        terms
      )

      const cleanContent = stripGutenberg(post.post_content)

      const excerpt = post.post_excerpt
        ? stripHtmlForExcerpt(post.post_excerpt)
        : stripHtmlForExcerpt(cleanContent).slice(0, 200)

      return {
        org_id,
        title:              post.post_title,
        slug:               post.post_name,
        content:            { rendered: cleanContent },
        excerpt:            excerpt || null,
        status:             'published' as const,
        category_slug:      categorySlug,
        featured_image_url: featuredImageUrl,
        seo_title:          seoTitle,
        seo_description:    seoDesc,
        content_type:       'news' as const,
        source_type:        'original' as const,
        is_legacy_blog:     isLegacyBlog,
        published_at:       post.post_date
          ? new Date(post.post_date.replace(' ', 'T') + '-03:00').toISOString()
          : new Date().toISOString(),
        created_at:         post.post_date
          ? new Date(post.post_date.replace(' ', 'T') + '-03:00').toISOString()
          : new Date().toISOString(),
      }
    })

    if (isDryRun) {
      // Mostra amostra
      if (i === 0) {
        console.log('\nAmostra (primeiros 3 posts):')
        rows.slice(0, 3).forEach(r => {
          console.log(`  [${r.slug}]`)
          console.log(`    categoria: ${r.category_slug}`)
          console.log(`    legacy:    ${r.is_legacy_blog}`)
          console.log(`    imagem:    ${r.featured_image_url ?? '(sem imagem)'}`)
          console.log(`    seo_title: ${r.seo_title ?? '(vazio)'}`)
        })
      }
      inserted += rows.length
      continue
    }

    const { error } = await supabase
      .from('articles')
      .upsert(rows, { onConflict: 'slug', ignoreDuplicates: false })

    if (error) {
      console.error(`  Erro no batch ${i}–${i + BATCH}: ${error.message}`)
      errors += rows.length
    } else {
      inserted += rows.length
    }

    // Progress
    process.stdout.write(`\r  ${inserted + errors + skipped}/${postsToProcess.length} processados...`)
  }

  console.log('\n')
  console.log('── Resultado ──────────────────────────────')
  if (isDryRun) {
    console.log(`  Simulado: ${inserted} posts seriam inseridos`)
  } else {
    console.log(`  ✅ Inseridos: ${inserted}`)
    console.log(`  ❌ Erros:    ${errors}`)
    console.log(`  ⏭️  Pulados:  ${skipped}`)
  }

  // Validação
  if (!isDryRun) {
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
    console.log(`\n  Total no banco (publicados): ${count}`)
  }

  console.log('\n✅ Script 02 concluído.')
  if (!isDryRun) {
    console.log('   Próximo passo: npx tsx scripts/03-migrar-imagens.ts')
  }
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
