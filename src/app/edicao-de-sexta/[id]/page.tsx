import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEdicaoPorId } from '@/lib/supabase/queries'
import type { Metadata } from 'next'

export const runtime = 'edge'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const ed = await getEdicaoPorId(id)
  if (!ed) return { title: 'Edição não encontrada' }

  const dateStr = new Date(ed.published_date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return {
    title: `Edição de Sexta${ed.edition_number ? ` Nº ${ed.edition_number}` : ''} — ${dateStr} | Spasso Cidades`,
    description: ed.description ?? `Edição impressa de ${dateStr} — Jornal Spasso Cidades`,
    openGraph: ed.cover_url ? { images: [{ url: ed.cover_url }] } : undefined,
  }
}

export default async function EdicaoPage({ params }: Props) {
  const { id } = await params
  const ed = await getEdicaoPorId(id)

  if (!ed) notFound()

  const dateStr = new Date(ed.published_date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-[#f5821f] transition-colors">Início</Link>
        <span>/</span>
        <Link href="/edicao-de-sexta" className="hover:text-[#f5821f] transition-colors">Edição de Sexta</Link>
        {ed.edition_number && (
          <>
            <span>/</span>
            <span className="text-gray-600">Nº {ed.edition_number}</span>
          </>
        )}
      </nav>

      {/* Cabeçalho */}
      <div className="mb-6">
        <p className="text-xs font-bold text-[#f5821f] uppercase tracking-widest mb-1">
          Edição de Sexta{ed.edition_number ? ` · Nº ${ed.edition_number}` : ''}
        </p>
        <p className="text-sm text-gray-500 capitalize">{dateStr}</p>
        {ed.description && (
          <p className="text-gray-600 leading-relaxed mt-3 text-sm max-w-2xl">{ed.description}</p>
        )}
        <div className="flex items-center gap-4 mt-4">
          <a
            href={ed.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#f5821f] text-white font-semibold rounded-lg hover:bg-[#e0711a] transition-colors text-sm"
          >
            📥 Baixar PDF
          </a>
          <Link href="/edicao-de-sexta" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Todas as edições
          </Link>
        </div>
      </div>

      {/* Visualizador PDF — proxy entrega com nome limpo */}
      <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50"
        style={{ height: 'min(88vh, 1000px)' }}>
        <iframe
          src={`/api/edicoes/${ed.id}/pdf#toolbar=1&view=FitH`}
          className="w-full h-full"
          title={`Edição de Sexta${ed.edition_number ? ` Nº ${ed.edition_number}` : ''}`}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        PDF não carregou?{' '}
        <a href={ed.pdf_url} target="_blank" rel="noopener noreferrer"
          className="text-[#f5821f] hover:underline">
          Abrir diretamente
        </a>.
      </p>
    </div>
  )
}
