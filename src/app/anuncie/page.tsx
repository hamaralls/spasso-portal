import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Anuncie no Spasso Cidades',
  description: 'Alcance leitores de Sumaré e da Região Metropolitana de Campinas. Fale com nossa equipe comercial.',
  alternates: { canonical: '/anuncie' },
}

export default function AnunciePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold mb-2 text-[#1a1a1a]">Anuncie no Spasso Cidades</h1>
      <p className="text-[#f5821f] font-semibold mb-8">O diário digital de Sumaré e região</p>

      <p className="text-gray-600 leading-relaxed mb-10">
        O Spasso Cidades é o portal de notícias de referência na Região Metropolitana de Campinas,
        com foco em Sumaré e cidades vizinhas. Conectamos sua marca a uma audiência local engajada
        no portal, Facebook, WhatsApp e edição impressa.
      </p>

      <div className="bg-[#1a1a1a] text-white rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Vamos conversar?</h2>
        <p className="text-gray-300 text-sm mb-6">
          Entre em contato para receber nossa proposta comercial.
        </p>
        <a
          href="mailto:comercial@jornalspassocidades.com.br"
          className="inline-block bg-[#f5821f] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#c47600] transition-colors"
        >
          comercial@jornalspassocidades.com.br
        </a>
      </div>
    </div>
  )
}
