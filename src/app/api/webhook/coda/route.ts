import { getAdminClient } from '@/lib/supabase/admin'
import { uploadToR2, r2Key } from '@/lib/r2'
import { readingTime } from '@/lib/format'
import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

function getSecret(): string {
  try {
    return (getRequestContext().env.CODA_WEBHOOK_SECRET as string | undefined ?? '').trim()
  } catch {
    return (process.env.CODA_WEBHOOK_SECRET ?? '').trim()
  }
}

// Converte data do Coda (DD/MM/YY ou DD/MM/YYYY) → ISO string (YYYY-MM-DDTHH:mm:ssZ)
function parseCodaDate(raw?: string): string | undefined {
  if (!raw) return undefined
  // Se já está em formato ISO, retorna direto
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw
  // Formato brasileiro DD/MM/YY ou DD/MM/YYYY
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (!match) return raw
  let [, day, month, year] = match
  if (year.length === 2) year = Number(year) > 50 ? `19${year}` : `20${year}`
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00Z`
  return iso
}

async function resolveImage(codaImageUrl?: string, featuredImageUrl?: string): Promise<string | null> {
  if (featuredImageUrl) return featuredImageUrl
  if (!codaImageUrl) return null
  try {
    const res = await fetch(codaImageUrl)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const buffer = await res.arrayBuffer()
    const filename = codaImageUrl.split('/').pop()?.split('?')[0] ?? 'imagem.jpg'
    const key = r2Key(filename)
    return await uploadToR2(key, buffer, contentType)
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  const secret = getSecret()
  if (!secret) {
    return Response.json({ error: 'Webhook não configurado (sem secret)' }, { status: 503 })
  }
  if (!apiKey || apiKey.trim() !== secret) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Limpa title/slug de aspas, backticks e colchetes que o n8n insere ao montar JSON
  const title = ((body.title as string | undefined) ?? '').replace(/^[\`"'\[\]]+|[\`"'\[\]]+$/g, '').trim()
  const slug  = ((body.slug  as string | undefined) ?? '').replace(/^[\`"'\[\]]+|[\`"'\[\]]+$/g, '').trim()
  const content            = body.content            as string | undefined
  const excerpt            = body.excerpt            as string | undefined
  const featured_image_url = body.featured_image_url as string | undefined
  const coda_image_url    = body.coda_image_url    as string | undefined
  const category_slug     = body.category_slug     as string | undefined
  const published_at       = parseCodaDate(body.published_at as string | undefined)
  const status             = body.status             as string | undefined

  if (!title || !slug) {
    return Response.json({ error: 'Campos obrigatórios: title, slug' }, { status: 400 })
  }

  const imageUrl   = await resolveImage(coda_image_url, featured_image_url)
  const contentObj = { rendered: content ?? '' }
  const mins       = readingTime(content ?? '')
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
        featured_image_url: imageUrl,
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
      featured_image_url: imageUrl,
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
