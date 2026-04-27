import { createClient } from '@/lib/supabase/server'
import { updateEdition, deleteEdition } from '@/lib/supabase/admin'

export const runtime = 'edge'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const patch: Record<string, unknown> = {}
  if ('edition_number' in body) patch.edition_number = body.edition_number ? Number(body.edition_number) : null
  if ('published_date' in body) patch.published_date = body.published_date
  if ('title'          in body) patch.title          = body.title          || null
  if ('pdf_url'        in body) patch.pdf_url        = body.pdf_url
  if ('cover_url'      in body) patch.cover_url      = body.cover_url      || null
  if ('description'    in body) patch.description    = body.description    || null
  if ('active'         in body) patch.active         = Boolean(body.active)

  const edition = await updateEdition(id, patch)
  return Response.json(edition)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  await deleteEdition(id)
  return new Response(null, { status: 204 })
}
