import { Resend } from 'resend'

export const runtime = 'edge'

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Serviço de email não configurado.' }, { status: 503 })
  }

  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const { nome, email, assunto, mensagem, token } = body
  if (!nome || !email || !mensagem) {
    return Response.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 422 })
  }

  // Verifica Turnstile se configurado
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (secretKey) {
    if (!token) {
      return Response.json({ error: 'Verificação de segurança necessária.' }, { status: 422 })
    }
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: token }),
    })
    const verifyData = await verifyRes.json() as { success: boolean }
    if (!verifyData.success) {
      return Response.json({ error: 'Verificação de segurança falhou. Tente novamente.' }, { status: 422 })
    }
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'Formulário Spasso <contato@jornalspassocidades.com.br>',
    to: ['redacao@jornalspassocidades.com.br'],
    replyTo: email,
    subject: assunto ? `[Contato] ${assunto}` : `[Contato] Mensagem de ${nome}`,
    text: `Nome: ${nome}\nEmail: ${email}\n\nMensagem:\n${mensagem}`,
  })

  if (error) {
    console.error('Resend error:', error)
    return Response.json({ error: 'Erro ao enviar mensagem. Tente novamente.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
