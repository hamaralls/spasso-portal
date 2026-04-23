import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Edição Impressa',
  description: 'Acesse as edições impressas do Spasso Cidades. Distribuição gratuita em Sumaré e região, toda semana.',
  alternates: { canonical: '/edicao-impressa' },
}

export default function EdicaoImpressaPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2 text-[#1a1a1a]">Edição Impressa</h1>
      <p className="text-[#f5821f] font-semibold mb-8">5.000 exemplares semanais — distribuição gratuita</p>

      <div className="prose-spasso space-y-4">
        <p>
          O <strong>Spasso Cidades</strong> circula toda semana em Sumaré e região com 5 mil exemplares
          distribuídos gratuitamente em pontos estratégicos da cidade: mercados, farmácias, padarias,
          clínicas e estabelecimentos comerciais.
        </p>
        <p>
          As edições digitais das impressões estarão disponíveis aqui em breve para consulta online.
        </p>

        <div className="bg-[#f5f5f5] rounded-xl p-6 mt-8">
          <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Quer anunciar no impresso?</h2>
          <p className="text-sm text-gray-600 mb-4">
            Alcance leitores de Sumaré e região com anúncios no jornal impresso.
          </p>
          <a
            href="/anuncie"
            className="inline-block bg-[#f5821f] text-white font-bold px-6 py-2 rounded-lg text-sm hover:bg-[#c47600] transition-colors"
          >
            Ver formatos e preços →
          </a>
        </div>
      </div>
    </div>
  )
}
