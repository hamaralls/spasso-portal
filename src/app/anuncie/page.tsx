import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Anuncie no Spasso Cidades',
  description: 'Alcance mais de 16 mil seguidores e leitores de Sumaré e da Região Metropolitana de Campinas. Anuncie no Spasso Cidades.',
  alternates: { canonical: '/anuncie/' },
}

export default function AnunciePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2 text-[#1a1a1a]">Anuncie no Spasso Cidades</h1>
      <p className="text-[#dd8500] font-semibold mb-10">O diário digital de Sumaré e região</p>

      {/* Números */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          { num: '12 mil', label: 'visitas/mês no portal' },
          { num: '16,6 mil', label: 'seguidores no Facebook' },
          { num: '250 mil', label: 'alcance orgânico/mês' },
          { num: '2.500+', label: 'assinantes no WhatsApp' },
        ].map((item) => (
          <div key={item.label} className="bg-[#dd8500] text-white rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold">{item.num}</p>
            <p className="text-xs mt-1 opacity-90">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Formatos */}
      <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">Formatos disponíveis</h2>
      <div className="space-y-3 mb-10">
        {[
          { nome: 'Banner Header', desc: '728×90 desktop / 320×50 mobile — aparece no topo de todas as páginas', destaque: true },
          { nome: 'Banner Artigo', desc: '300×250 — exibido dentro dos artigos, alta visibilidade', destaque: true },
          { nome: 'Publieditorial', desc: 'Artigo patrocinado produzido pela nossa redação com badge de identificação', destaque: false },
          { nome: 'Patrocínio de seção', desc: 'Associe sua marca a uma categoria (ex: Saúde, Educação, Esporte)', destaque: false },
          { nome: 'Jornal impresso', desc: 'Anúncio na edição impressa semanal — 5.000 exemplares distribuídos gratuitamente', destaque: false },
        ].map((f) => (
          <div key={f.nome} className={`border rounded-xl p-4 ${f.destaque ? 'border-[#dd8500] bg-orange-50' : 'border-gray-200'}`}>
            <p className="font-bold text-[#1a1a1a]">{f.nome}</p>
            <p className="text-sm text-gray-600 mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[#1a1a1a] text-white rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Vamos conversar?</h2>
        <p className="text-gray-300 text-sm mb-6">
          Entre em contato para receber nossa mídia kit, tabela de preços e disponibilidade de datas.
        </p>
        <a
          href="mailto:comercial@jornalspassocidades.com.br"
          className="inline-block bg-[#dd8500] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#c47600] transition-colors"
        >
          comercial@jornalspassocidades.com.br
        </a>
      </div>
    </div>
  )
}
