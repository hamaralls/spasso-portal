import { getAdminClient } from '@/lib/supabase/admin'
import { readingTime } from '@/lib/format'

export const runtime = 'edge'

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.CODA_WEBHOOK_SECRET) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { title, slug, content, excerpt, featured_image_url, category_slug, published_at, status } = body as {
    title?: string
    slug?: string
    content?: string
    excerpt?: string
    featured_image_url?: string
    category_slug?: string
    published_at?: string
    status?: string
  }

  if (!title || !slug) {
    return Response.json({ error: 'Campos obrigatórios: title, slug' }, { status: 400 })
  }

  const contentObj = { rendered: content ?? '' }
  const mins = readingTime(content ?? '')
  const articleStatus = (status === 'published' ? 'published' : 'draft') as 'published' | 'draft'

  const sb = getAdminClient()

  const { data: existing } = await sb
    .from('articles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    const { data, error } = await sb
      .from('articles')
      .update({
        title,
        content:            contentObj,
        excerpt:            excerpt            || null,
        featured_image_url: featured_image_url || null,
        category_slug:      category_slug      || null,
        status:             articleStatus,
        published_at:       articleStatus === 'published' ? (published_at ?? new Date().toISOString()) : null,
        reading_time_min:   mins,
      })
      .eq('id', existing.id)
      .select('id, slug')
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ action: 'updated', ...data }, { status: 200 })
  }

  const { data, error } = await sb
    .from('articles')
    .insert({
      title,
      slug,
      content:            contentObj,
      excerpt:            excerpt            || null,
      featured_image_url: featured_image_url || null,
      category_slug:      category_slug      || null,
      status:             articleStatus,
      published_at:       articleStatus === 'published' ? (published_at ?? new Date().toISOString()) : null,
      content_type:       'news',
      source_type:        'original',
      reading_time_min:   mins,
    })
    .select('id, slug')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ action: 'created', ...data }, { status: 201 })
}
