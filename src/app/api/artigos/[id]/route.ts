import { createClient } from '@/lib/supabase/server'
import { updateArticle, deleteArticle } from '@/lib/supabase/admin'
import { readingTime } from '@/lib/format'

export const runtime = 'edge'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body   = await request.json()

  const patch: Record<string, unknown> = {
    title:              body.title,
    slug:               body.slug,
    excerpt:            body.excerpt   || null,
    content:            body.content   ?? { rendered: '' },
    featured_image_url: body.featured_image_url || null,
    status:             body.status    ?? 'draft',
    category_slug:      body.category_slug || null,
    theme_slug:         body.theme_slug    || null,
    content_type:       body.content_type  ?? 'news',
    source_type:        body.source_type   ?? 'original',
    origin_badge:       body.origin_badge  || null,
    columnist_id:       body.columnist_id  || null,
    seo_title:          body.seo_title     || null,
    seo_description:    body.seo_description || null,
  }

  if (body.published_at !== undefined) {
    patch.published_at = body.published_at || null
  }

  const htmlContent = body.content?.rendered ?? ''
  if (htmlContent) patch.reading_time_min = readingTime(htmlContent)

  const article = await updateArticle(id, patch)
  return Response.json(article)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await deleteArticle(id)
  return new Response(null, { status: 204 })
}
