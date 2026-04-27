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

  // Partial update: só inclui campos explicitamente enviados no body
  const patch: Record<string, unknown> = {}
  if ('title'               in body) patch.title               = body.title
  if ('slug'                in body) patch.slug                = body.slug
  if ('excerpt'             in body) patch.excerpt             = body.excerpt   || null
  if ('content'             in body) patch.content             = body.content   ?? { rendered: '' }
  if ('featured_image_url'  in body) patch.featured_image_url  = body.featured_image_url  || null
  if ('featured_image_alt'  in body) patch.featured_image_alt  = body.featured_image_alt  || null
  if ('featured_image_caption' in body) patch.featured_image_caption = body.featured_image_caption || null
  if ('status'              in body) patch.status              = body.status    ?? 'draft'
  if ('category_slug'       in body) patch.category_slug       = body.category_slug || null
  if ('theme_slug'          in body) patch.theme_slug          = body.theme_slug    || null
  if ('content_type'        in body) patch.content_type        = body.content_type  ?? 'news'
  if ('source_type'         in body) patch.source_type         = body.source_type   ?? 'original'
  if ('origin_badge'        in body) patch.origin_badge        = body.origin_badge  || null
  if ('columnist_id'        in body) patch.columnist_id        = body.columnist_id  || null
  if ('seo_title'           in body) patch.seo_title           = body.seo_title     || null
  if ('seo_description'     in body) patch.seo_description     = body.seo_description || null
  if ('published_at'        in body) patch.published_at        = body.published_at  || null
  if ('is_featured'         in body) patch.is_featured         = Boolean(body.is_featured)
  if ('is_featured_pinned'  in body) patch.is_featured_pinned  = Boolean(body.is_featured_pinned)

  if ('content' in body) {
    const htmlContent = body.content?.rendered ?? ''
    if (htmlContent) patch.reading_time_min = readingTime(htmlContent)
  }

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
