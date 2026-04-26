import { createClient } from '@/lib/supabase/server'
import { createArticle, listArticles } from '@/lib/supabase/admin'
import { readingTime } from '@/lib/format'

export const runtime = 'edge'

export async function GET(request: Request) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const url    = new URL(request.url)
  const page   = parseInt(url.searchParams.get('page') ?? '1', 10)
  const status = url.searchParams.get('status') ?? undefined

  const result = await listArticles(page, 20, status)
  return Response.json(result)
}

export async function POST(request: Request) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const htmlContent = body.content?.rendered ?? ''
  const mins = readingTime(htmlContent)

  const article = await createArticle({
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
    published_at:       body.published_at  || undefined,
    reading_time_min:   mins,
  })

  return Response.json(article, { status: 201 })
}
