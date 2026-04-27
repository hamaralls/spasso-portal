import { createClient } from '@/lib/supabase/server'
import { createEdition } from '@/lib/supabase/admin'

export const runtime = 'edge'

export async function POST(request: Request) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  if (!body.pdf_url || !body.published_date) {
    return Response.json({ error: 'pdf_url e published_date são obrigatórios' }, { status: 400 })
  }

  const edition = await createEdition({
    edition_number: body.edition_number ? Number(body.edition_number) : null,
    published_date: body.published_date,
    title:          body.title          || null,
    pdf_url:        body.pdf_url,
    cover_url:      body.cover_url      || null,
    description:    body.description    || null,
    active:         true,
  })

  return Response.json(edition, { status: 201 })
}
