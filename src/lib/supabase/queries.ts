import { getSupabase } from './edge'
import type { ArticlePublico, Category, Columnist } from '@/types'

// ── Home: últimos artigos publicados ────────────────────────────────────────

export async function getArtigosRecentes(limit = 13): Promise<ArticlePublico[]> {
  const { data } = await getSupabase()
    .from('artigos_publicados')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ── Listagem por categoria ───────────────────────────────────────────────────

export async function getArtigosPorCategoria(
  slug: string,
  page = 1,
  perPage = 12
): Promise<{ articles: ArticlePublico[]; total: number }> {
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, count } = await getSupabase()
    .from('artigos_publicados')
    .select('*', { count: 'exact' })
    .eq('category_slug', slug)
    .order('published_at', { ascending: false })
    .range(from, to)

  return { articles: data ?? [], total: count ?? 0 }
}

// ── Últimas notícias paginadas (sem filtro de categoria) ────────────────────

export async function getArtigosPaginados(
  page = 1,
  perPage = 24
): Promise<{ articles: ArticlePublico[]; total: number }> {
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, count } = await getSupabase()
    .from('artigos_publicados')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(from, to)

  return { articles: data ?? [], total: count ?? 0 }
}

// ── Home sections: múltiplas categorias ──────────────────────────────────────

export async function getArtigosPorCategorias(
  slugs: string[],
  limit = 3
): Promise<ArticlePublico[]> {
  const { data } = await getSupabase()
    .from('artigos_publicados')
    .select('*')
    .in('category_slug', slugs)
    .order('published_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ── Home sections: por tema (theme_slug OR category_slug) ────────────────────

export async function getArtigosPorTema(
  slug: string,
  limit = 10
): Promise<ArticlePublico[]> {
  const { data } = await getSupabase()
    .from('artigos_publicados')
    .select('*')
    .or(`theme_slug.eq.${slug},category_slug.eq.${slug}`)
    .order('published_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ── Artigo completo (inclui content) ─────────────────────────────────────────

export async function getArtigoCompleto(slug: string) {
  const { data } = await getSupabase()
    .from('articles')
    .select(`
      id, slug, title, excerpt, content, featured_image_url,
      featured_image_alt, featured_image_caption,
      content_type, source_type, origin_badge, is_legacy_blog,
      category_slug, author_id, columnist_id, published_at, updated_at,
      views, reading_time_min,
      seo_title, seo_description, seo_keywords,
      wp_post_id,
      author:users!author_id(name),
      columnist:columnists!columnist_id(name, slug, type, subtitle, bio, avatar_url)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data ?? null
}

// ── Categoria por slug ────────────────────────────────────────────────────────

export async function getCategoria(slug: string): Promise<Category | null> {
  const { data } = await getSupabase()
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()
  return data ?? null
}

export async function getCategorias(): Promise<Category[]> {
  const { data } = await getSupabase()
    .from('categories')
    .select('*')
    .order('sort_order')
  return data ?? []
}

// ── Colunistas (público) ──────────────────────────────────────────────────────

export type ColunistaCom = {
  id: string
  name: string
  slug: string
  type: string
  avatar_url: string | null
  bio: string | null
  subtitle: string | null
  active: boolean
  lastArticle: { slug: string; title: string; excerpt: string | null; featured_image_url: string | null } | null
}

export async function getColunistas(): Promise<ColunistaCom[]> {
  const { data: cols } = await getSupabase()
    .from('columnists')
    .select('id, name, slug, type, avatar_url, bio, subtitle, active')
    .eq('active', true)
    .order('name')

  if (!cols?.length) return []

  const slugs = cols.map(c => c.slug)
  const { data: recents } = await getSupabase()
    .from('artigos_publicados')
    .select('slug, title, excerpt, featured_image_url, columnist_slug')
    .in('columnist_slug', slugs)
    .order('published_at', { ascending: false })
    .limit(50)

  const lastBySlug: Record<string, { slug: string; title: string; excerpt: string | null; featured_image_url: string | null }> = {}
  for (const a of recents ?? []) {
    if (a.columnist_slug && !lastBySlug[a.columnist_slug]) {
      lastBySlug[a.columnist_slug] = { slug: a.slug, title: a.title, excerpt: a.excerpt ?? null, featured_image_url: a.featured_image_url }
    }
  }

  return cols.map(c => ({ ...c, lastArticle: lastBySlug[c.slug] ?? null }))
}

export async function getColunistaPorSlug(slug: string): Promise<Columnist | null> {
  const { data } = await getSupabase()
    .from('columnists')
    .select('id, name, slug, type, avatar_url, bio, subtitle, active, created_at')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  return data ?? null
}

export async function getArtigosPorColunista(
  columnistSlug: string,
  page = 1,
  perPage = 12
): Promise<{ articles: ArticlePublico[]; total: number }> {
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  const { data, count } = await getSupabase()
    .from('artigos_publicados')
    .select('*', { count: 'exact' })
    .eq('columnist_slug', columnistSlug)
    .order('published_at', { ascending: false })
    .range(from, to)
  return { articles: data ?? [], total: count ?? 0 }
}

// ── Destaques: top artigos por views (últimos 7 dias) ────────────────────────

export async function getArtigosDestaque(limit = 3): Promise<ArticlePublico[]> {
  const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await getSupabase()
    .from('artigos_publicados')
    .select('*')
    .gte('published_at', desde)
    .order('views', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ── Artigos relacionados ──────────────────────────────────────────────────────

export async function getArtigosRelacionados(
  categorySlug: string,
  excludeSlug: string,
  limit = 3
): Promise<ArticlePublico[]> {
  const { data } = await getSupabase()
    .from('artigos_publicados')
    .select('*')
    .eq('category_slug', categorySlug)
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ── Busca full-text ──────────────────────────────────────────────────────────

export async function buscarArtigos(
  query: string,
  page = 1,
  perPage = 12
): Promise<{ articles: ArticlePublico[]; total: number }> {
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Tenta FTS via RPC (usa GIN index, stemming em português)
  const { data: rpcData, error: rpcErr } = await getSupabase()
    .rpc('search_artigos', { query, page_from: from, page_to: to })

  if (!rpcErr && rpcData) {
    // RPC não retorna count total — faz query separada só para o total
    const { count } = await getSupabase()
      .from('artigos_publicados')
      .select('id', { count: 'exact', head: true })
      .textSearch('title', query, { type: 'websearch', config: 'portuguese' })
    return { articles: rpcData as ArticlePublico[], total: count ?? rpcData.length }
  }

  // Fallback: ILIKE (funciona antes de aplicar migration 003)
  const term = `%${query.trim()}%`
  const { data, count } = await getSupabase()
    .from('artigos_publicados')
    .select('*', { count: 'exact' })
    .or(`title.ilike.${term},excerpt.ilike.${term}`)
    .order('published_at', { ascending: false })
    .range(from, to)

  return { articles: data ?? [], total: count ?? 0 }
}

// ── Mais lidos (últimos 30 dias) ─────────────────────────────────────────────

export async function getArtigosMaisLidos(limit = 5): Promise<ArticlePublico[]> {
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await getSupabase()
    .from('artigos_publicados')
    .select('*')
    .gte('published_at', desde)
    .order('views', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ── Navegação: artigo anterior / próximo ─────────────────────────────────────

export async function getArtigoAnterior(
  publishedAt: string,
  excludeSlug: string
): Promise<{ slug: string; title: string; featured_image_url: string | null } | null> {
  const { data } = await getSupabase()
    .from('artigos_publicados')
    .select('slug, title, featured_image_url')
    .lt('published_at', publishedAt)
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(1)
  return data?.[0] ?? null
}

export async function getArtigoProximo(
  publishedAt: string,
  excludeSlug: string
): Promise<{ slug: string; title: string; featured_image_url: string | null } | null> {
  const { data } = await getSupabase()
    .from('artigos_publicados')
    .select('slug, title, featured_image_url')
    .gt('published_at', publishedAt)
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: true })
    .limit(1)
  return data?.[0] ?? null
}

// ── Sitemap: todos os slugs publicados ───────────────────────────────────────

export async function getAllArtigosSlugs(): Promise<
  { slug: string; published_at: string }[]
> {
  const { data } = await getSupabase()
    .from('articles')
    .select('slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10000)
  return data ?? []
}
