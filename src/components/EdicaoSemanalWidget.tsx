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
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-1 h-4 bg-[#f5821f] block rounded-sm" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
          Edição de Sexta
        </p>
      </div>

      <Link href={`/edicao-de-sexta/${edition.id}`} className="group block">
        {/* Capa — imagem completa, sem crop, proporção natural do PDF */}
        <div className="border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow overflow-hidden bg-white">
          {edition.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={edition.cover_url}
              alt={edition.title ?? `Edição ${edition.edition_number ?? ''}`}
              className="w-full h-auto block"
            />
          ) : (
            <div className="aspect-[3/4] flex flex-col items-center justify-center bg-gray-50 gap-3 p-6">
              <span className="text-4xl">📰</span>
              <span className="text-xs text-gray-400 text-center leading-relaxed">
                {edition.title ?? (edition.edition_number ? `Edição Nº ${edition.edition_number}` : 'Edição desta semana')}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-2 space-y-0.5">
          {edition.edition_number && (
            <p className="text-[11px] font-bold text-gray-700">Nº {edition.edition_number}</p>
          )}
          <p className="text-[11px] text-gray-500">{dateStr}</p>
          <p className="text-[11px] font-semibold text-[#f5821f] pt-0.5 group-hover:underline">
            Ler edição completa →
          </p>
        </div>
      </Link>
    </div>
  )
}
