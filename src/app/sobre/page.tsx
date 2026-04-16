import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Sobre',
  description: 'Conheça o Spasso Cidades, o diário digital de Sumaré e região.',
}

export default function SobrePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-6">Sobre o Spasso Cidades</h1>
      <div className="prose-spasso">
        <p>
          O <strong>Spasso Cidades</strong> é o diário digital de Sumaré e da Região Metropolitana de Campinas.
          Cobrimos política, saúde, educação, economia, esporte, cultura e tudo que importa para quem vive na região.
        </p>
        <p>
          Fundado para ser uma referência jornalística regional, o portal opera com jornalismo independente
          e comprometido com a comunidade local.
        </p>
      </div>
    </div>
  )
}
