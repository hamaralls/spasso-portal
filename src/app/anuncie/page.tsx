import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Anuncie',
  description: 'Anuncie no Spasso Cidades e alcance milhares de leitores na região.',
}

export default function AnunciePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-6">Anuncie no Spasso Cidades</h1>
      <div className="prose-spasso">
        <p>
          Alcance milhares de leitores de Sumaré e da Região Metropolitana de Campinas.
          O Spasso Cidades oferece formatos de publicidade digital eficientes para o seu negócio.
        </p>
        <h2>Formatos disponíveis</h2>
        <ul>
          <li>Banner header (728×90)</li>
          <li>Banner inline artigos (300×250)</li>
          <li>Publieditorial</li>
          <li>Patrocínio de seção</li>
        </ul>
        <h2>Fale conosco</h2>
        <p>
          Entre em contato: <a href="mailto:comercial@jornalspassocidades.com.br">comercial@jornalspassocidades.com.br</a>
        </p>
      </div>
    </div>
  )
}
