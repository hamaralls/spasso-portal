import Link from 'next/link'
import Image from 'next/image'
import type { WeeklyEdition } from '@/types'

interface Props {
  edition: WeeklyEdition
}

export default function EdicaoSemanalWidget({ edition }: Props) {
  const dateStr = new Date(edition.published_date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <Link href={`/edicao-de-sexta/${edition.id}`} className="group block w-full">
      {/* Capa proporção A4 */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
        {edition.cover_url ? (
          <Image
            src={edition.cover_url}
            alt={edition.title ?? `Edição ${edition.edition_number ?? ''}`}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="300px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f5f5f5] gap-3 p-4">
            <span className="text-5xl">📰</span>
            <span className="text-xs text-gray-400 text-center leading-relaxed">
              {edition.title ?? (edition.edition_number ? `Edição Nº ${edition.edition_number}` : 'Edição de Sexta')}
            </span>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="mt-2">
        <p className="text-[10px] font-bold text-[#f5821f] uppercase tracking-widest">
          Edição de Sexta{edition.edition_number ? ` · Nº ${edition.edition_number}` : ''}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{dateStr}</p>
        <p className="text-xs font-semibold text-[#f5821f] mt-1 group-hover:underline">
          Ler edição completa →
        </p>
      </div>
    </Link>
  )
}
