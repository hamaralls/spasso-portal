import { createClient } from '@supabase/supabase-js'

// Cliente service role — nunca expor no browser
export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface ArticleInput {
  title: string
  slug: string
  excerpt?: string
  content: { rendered: string }
  featured_image_url?: string
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  category_slug?: string
  content_type: string
  source_type: string
  origin_badge?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  published_at?: string
  reading_time_min?: number
}

export async function createArticle(input: ArticleInput) {
  const sb = getAdminClient()
  const { data, error } = await sb
    .from('articles')
    .insert({
      ...input,
      published_at: input.status === 'published' ? (input.published_at ?? new Date().toISOString()) : null,
    })
    .select('id, slug')
    .single()
  if (error) throw error
  return data
}

export async function updateArticle(id: string, input: Partial<ArticleInput>) {
  const sb = getAdminClient()
  const patch: Record<string, unknown> = { ...input }
  if (input.status === 'published' && !input.published_at) {
    patch.published_at = new Date().toISOString()
  }
  const { data, error } = await sb
    .from('articles')
    .update(patch)
    .eq('id', id)
    .select('id, slug')
    .single()
  if (error) throw error
  return data
}

export async function deleteArticle(id: string) {
  const sb = getAdminClient()
  const { error } = await sb.from('articles').delete().eq('id', id)
  if (error) throw error
}

export async function listArticles(page = 1, perPage = 20, status?: string, category?: string) {
  const sb   = getAdminClient()
  const from = (page - 1) * perPage
  const to   = from + perPage - 1

  let query = sb
    .from('articles')
    .select('id, slug, title, status, category_slug, published_at, created_at, views, featured_image_url', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') query = query.eq('status', status)
  if (category && category !== 'all') query = query.eq('category_slug', category)

  const { data, count, error } = await query
  if (error) throw error
  return { articles: data ?? [], total: count ?? 0 }
}

export async function getDashboardStats() {
  const sb = getAdminClient()

  const [totalResult, publishedResult, draftResult, topViewsResult, semFotoResult] = await Promise.all([
    sb.from('articles').select('id', { count: 'exact', head: true }),
    sb.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    sb.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    sb.from('articles')
      .select('id, title, slug, views, category_slug, published_at')
      .eq('status', 'published')
      .order('views', { ascending: false })
      .limit(10),
    sb.from('articles').select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .is('featured_image_url', null),
  ])

  return {
    total: totalResult.count ?? 0,
    published: publishedResult.count ?? 0,
    draft: draftResult.count ?? 0,
    semFoto: semFotoResult.count ?? 0,
    topViews: topViewsResult.data ?? [],
  }
}

export async function getArticleById(id: string) {
  const sb = getAdminClient()
  const { data, error } = await sb
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
