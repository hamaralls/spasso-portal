import { getSupabase } from './edge'
import type { ArticlePublico, Category } from '@/types'

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

// ── Artigo completo (inclui content) ─────────────────────────────────────────

export async function getArtigoCompleto(slug: string) {
  const { data } = await getSupabase()
    .from('articles')
    .select(`
      id, slug, title, excerpt, content, featured_image_url,
      content_type, source_type, origin_badge, is_legacy_blog,
      category_slug, author_id, published_at, updated_at,
      views, reading_time_min,
      seo_title, seo_description, seo_keywords,
      wp_post_id
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

// ── Sitemap: todos os slugs publicados ───────────────────────────────────────

export async function getAllArtigosSlugs(): Promise<
  { slug: string; published_at: string }[]
> {
  const { data } = await getSupabase()
    .from('articles')
    .select('slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  return data ?? []
}
