import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Entre em contato com a redação do Spasso Cidades. Sugestões de pauta, press releases e informações.',
  alternates: { canonical: '/contato/' },
}

export default function ContatoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2 text-[#1a1a1a]">Contato</h1>
      <p className="text-gray-500 mb-10">Fale com a redação do Spasso Cidades</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">Envie uma mensagem</h2>
          <ContactForm />
        </div>

        {/* Canais */}
        <div className="space-y-5">
          <div className="border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-[#1a1a1a] mb-1">Redação</h2>
            <p className="text-sm text-gray-500 mb-2">Sugestões de pauta, press releases e informações</p>
            <a href="mailto:redacao@jornalspassocidades.com.br" className="text-[#f5821f] hover:underline text-sm font-medium">
              redacao@jornalspassocidades.com.br
            </a>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-[#1a1a1a] mb-1">Comercial e Publicidade</h2>
            <p className="text-sm text-gray-500 mb-2">Anúncios, banners e conteúdo patrocinado</p>
            <a href="mailto:comercial@jornalspassocidades.com.br" className="text-[#f5821f] hover:underline text-sm font-medium">
              comercial@jornalspassocidades.com.br
            </a>
            <div className="mt-2">
              <a href="/anuncie/" className="text-sm text-gray-400 hover:text-[#f5821f] underline">
                Ver formatos e preços →
              </a>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-[#1a1a1a] mb-1">Privacidade e LGPD</h2>
            <p className="text-sm text-gray-500 mb-2">Solicitações relacionadas a dados pessoais</p>
            <a href="mailto:privacidade@jornalspassocidades.com.br" className="text-[#f5821f] hover:underline text-sm font-medium">
              privacidade@jornalspassocidades.com.br
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
