import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Entre em contato com a redação do Spasso Cidades.',
}

export default function ContatoPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-6">Contato</h1>
      <div className="prose-spasso">
        <p>Para falar com a redação do Spasso Cidades:</p>
        <ul>
          <li>E-mail: <a href="mailto:redacao@jornalspassocidades.com.br">redacao@jornalspassocidades.com.br</a></li>
        </ul>
        <p>Para anúncios e publicidade, acesse nossa página <a href="/anuncie/">Anuncie</a>.</p>
      </div>
    </div>
  )
}
