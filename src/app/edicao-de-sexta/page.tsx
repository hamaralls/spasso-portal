import Link from 'next/link'
import Image from 'next/image'
import { getEdicoesSemanais } from '@/lib/supabase/queries'
import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Edição de Sexta | Spasso Cidades',
  description: 'Todas as edições semanais do Jornal Spasso Cidades. Leia a edição impressa digitalizada.',
}

export default async function EdicaoDeSextaPage() {
  const editions = await getEdicoesSemanais(50)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#1a1a1a] mb-2">Edição de Sexta</h1>
        <p className="text-gray-500">O jornal impresso Spasso Cidades, publicado toda sexta-feira.</p>
      </div>

      {editions.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">📰</p>
          <p className="text-lg">Nenhuma edição disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {editions.map((ed) => {
            const dateStr = new Date(ed.published_date + 'T12:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })
            return (
              <Link key={ed.id} href={`/edicao-de-sexta/${ed.id}`}
                className="group flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 shadow-md group-hover:shadow-xl transition-shadow">
                  {ed.cover_url ? (
                    <Image
                      src={ed.cover_url}
                      alt={ed.title ?? `Edição ${ed.edition_number ?? ''}`}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 20vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f5821f]/10 to-[#8dc63f]/10">
                      <span className="text-4xl">📄</span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  {ed.edition_number && (
                    <p className="text-xs font-bold text-[#f5821f] uppercase tracking-wide">
                      Nº {ed.edition_number}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-[#1a1a1a] leading-snug mt-0.5 group-hover:text-[#f5821f] transition-colors">
                    {ed.title ?? dateStr}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{dateStr}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
