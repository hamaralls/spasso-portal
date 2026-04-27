import { createClient } from '@/lib/supabase/server'
import { uploadToR2, r2Key } from '@/lib/r2'

export const runtime = 'edge'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const MAX_SIZE = 50 * 1024 * 1024 // 50MB (PDFs podem ser maiores)

export async function POST(request: Request) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file     = formData.get('file') as File | null

  if (!file) return Response.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return Response.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
  if (file.size > MAX_SIZE) return Response.json({ error: 'Arquivo muito grande (máx 10MB)' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const key    = r2Key(file.name)
  const url    = await uploadToR2(key, buffer, file.type)

  return Response.json({ url, key })
}
