import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página não encontrada — Spasso Cidades',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-8xl font-extrabold text-[#dd8500] mb-4">404</p>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-3">Página não encontrada</h1>
      <p className="text-gray-500 mb-8">
        O conteúdo que você procura pode ter sido movido ou não existe mais.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-block bg-[#dd8500] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#c47600] transition-colors"
        >
          Ir para o início
        </Link>
        <Link
          href="/sp/sumare/"
          className="inline-block border border-[#dd8500] text-[#dd8500] font-bold px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors"
        >
          Notícias de Sumaré
        </Link>
      </div>
    </div>
  )
}
