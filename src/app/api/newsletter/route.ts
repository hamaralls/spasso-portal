import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function POST(request: Request) {
  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const { email, nome } = body
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Email inválido.' }, { status: 422 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase.rpc('subscribe_newsletter', {
    sub_email: email,
    sub_nome: nome || null,
  })

  if (error) {
    console.error('Newsletter subscribe error:', error)
    return Response.json({ error: 'Erro ao inscrever. Tente novamente.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
