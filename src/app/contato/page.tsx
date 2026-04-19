import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Entre em contato com a redação do Spasso Cidades. Sugestões de pauta, press releases e informações.',
  alternates: { canonical: '/contato/' },
}

export default function ContatoPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2 text-[#1a1a1a]">Contato</h1>
      <p className="text-gray-500 mb-10">Fale com a redação do Spasso Cidades</p>

      <div className="space-y-8">
        <div className="border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Redação</h2>
          <p className="text-sm text-gray-500 mb-3">Sugestões de pauta, press releases e informações</p>
          <a
            href="mailto:redacao@jornalspassocidades.com.br"
            className="inline-flex items-center gap-2 text-[#dd8500] hover:underline font-medium"
          >
            redacao@jornalspassocidades.com.br
          </a>
        </div>

        <div className="border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Comercial e Publicidade</h2>
          <p className="text-sm text-gray-500 mb-3">Anúncios, banners e conteúdo patrocinado</p>
          <a
            href="mailto:comercial@jornalspassocidades.com.br"
            className="inline-flex items-center gap-2 text-[#dd8500] hover:underline font-medium"
          >
            comercial@jornalspassocidades.com.br
          </a>
          <div className="mt-2">
            <a href="/anuncie/" className="text-sm text-gray-500 hover:text-[#dd8500] underline">
              Ver formatos e preços →
            </a>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Privacidade e LGPD</h2>
          <p className="text-sm text-gray-500 mb-3">Solicitações relacionadas a dados pessoais</p>
          <a
            href="mailto:privacidade@jornalspassocidades.com.br"
            className="inline-flex items-center gap-2 text-[#dd8500] hover:underline font-medium"
          >
            privacidade@jornalspassocidades.com.br
          </a>
        </div>

        <div className="border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">Redes Sociais</h2>
          <p className="text-sm text-gray-500 mb-3">Nos siga para acompanhar as notícias em tempo real</p>
          <div className="flex gap-4">
            <a
              href="https://www.facebook.com/jornalspassocidades"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#dd8500] hover:underline font-medium"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
