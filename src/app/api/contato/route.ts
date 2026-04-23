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

  const { nome, email, assunto, mensagem } = body
  if (!nome || !email || !mensagem) {
    return Response.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 422 })
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
