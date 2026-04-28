import Link from 'next/link'
import { getEdicoesSemanais } from '@/lib/supabase/queries'
import type { Metadata } from 'next'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Edição de Sexta | Spasso Cidades',
  description: 'Todas as edições do Jornal Spasso Cidades. Leia a edição impressa digitalizada.',
}

export default async function EdicaoDeSextaPage() {
  const editions = await getEdicoesSemanais(50)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[#1a1a1a]">Edição de Sexta</h1>
        <p className="text-sm text-gray-500 mt-1">O jornal impresso Spasso Cidades, publicado toda sexta-feira.</p>
      </div>

      {editions.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">📰</p>
          <p>Nenhuma edição disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {editions.map((ed) => {
            const dateStr = new Date(ed.published_date + 'T12:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
            const label = ed.edition_number ? `Nº ${ed.edition_number}` : dateStr

            return (
              <Link key={ed.id} href={`/edicao-de-sexta/${ed.id}`}
                className="group flex flex-col">
                {/* Capa — proporção natural, sem crop */}
                <div className="border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow overflow-hidden bg-white">
                  {ed.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ed.cover_url}
                      alt={label}
                      className="w-full h-auto block group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="aspect-[3/4] flex items-center justify-center bg-gray-50">
                      <span className="text-3xl">📄</span>
                    </div>
                  )}
                </div>

                {/* Info: número + data (sem repetição) */}
                <div className="mt-2">
                  <p className="text-xs font-bold text-[#f5821f]">{label}</p>
                  {ed.edition_number && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{dateStr}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
