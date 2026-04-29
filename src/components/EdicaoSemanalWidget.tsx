import Link from 'next/link'
import type { WeeklyEdition } from '@/types'

interface Props {
  edition: WeeklyEdition
}

export default function EdicaoSemanalWidget({ edition }: Props) {
  const dateStr = new Date(edition.published_date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div>
      {/* Label */}
      <div className="flex items-center justify-center mb-3">
        <p className="font-extrabold text-sm uppercase tracking-widest text-[#1a1a1a]">
          Edição de Sexta
        </p>
      </div>

      <Link href={`/edicao-de-sexta/${edition.id}`} className="group block">
        {/* Capa — proporção natural do PDF, sem crop */}
        <div className="border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow overflow-hidden bg-white">
          {edition.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={edition.cover_url}
              alt={`Edição de Sexta${edition.edition_number ? ` Nº ${edition.edition_number}` : ''}`}
              className="w-full h-auto block"
            />
          ) : (
            <div className="aspect-[3/4] flex flex-col items-center justify-center bg-gray-50 gap-3 p-6">
              <span className="text-4xl">📰</span>
            </div>
          )}
        </div>

        {/* Info: número + data + link em uma linha só */}
        <div className="mt-3 text-center">
          <p className="text-[13px] text-gray-600 group-hover:text-[#f5821f] transition-colors">
            {dateStr}{edition.edition_number ? ` - Nº ${edition.edition_number}` : ''} <span className="font-semibold underline ml-1">Ler edição completa →</span>
          </p>
        </div>
      </Link>
    </div>
  )
}
