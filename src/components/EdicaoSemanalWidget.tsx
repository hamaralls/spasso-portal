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
    <Link href={`/edicao-de-sexta/${edition.id}`}
      className="group flex items-center gap-5 bg-[#1a1a1a] text-white px-6 py-5 hover:bg-[#2a2a2a] transition-colors">

      {/* Capa */}
      {edition.cover_url ? (
        <div className="relative w-16 h-[90px] shrink-0 overflow-hidden shadow-lg">
          <Image
            src={edition.cover_url}
            alt={edition.title ?? 'Capa da edição'}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="64px"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-16 h-[90px] shrink-0 bg-white/10 flex items-center justify-center rounded text-2xl">
          📰
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#f5821f] uppercase tracking-widest mb-1">
          Edição de Sexta
        </p>
        <p className="text-base font-bold leading-snug line-clamp-2 group-hover:text-[#f5821f] transition-colors">
          {edition.title ?? (edition.edition_number ? `Nº ${edition.edition_number}` : 'Edição desta semana')}
        </p>
        <p className="text-xs text-gray-400 mt-1">{dateStr}</p>
      </div>

      {/* CTA */}
      <div className="hidden sm:block shrink-0">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f5821f] text-white text-sm font-semibold rounded-lg group-hover:bg-[#e0711a] transition-colors whitespace-nowrap">
          📖 Ler edição
        </span>
      </div>
    </Link>
  )
}
