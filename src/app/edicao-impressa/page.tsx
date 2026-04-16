import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Edição Impressa',
  description: 'Acesse as edições impressas do Spasso Cidades.',
}

export default function EdicaoImpressaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-6">Edição Impressa</h1>
      <p className="text-gray-500">As edições impressas estarão disponíveis em breve.</p>
    </div>
  )
}
