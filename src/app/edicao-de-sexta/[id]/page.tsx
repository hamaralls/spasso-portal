import Link from 'next/link'
import Image from 'next/image'
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
    title: `${ed.title ?? `Edição ${ed.edition_number ?? ''}`} | Spasso Cidades`,
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
    <div className="max-w-6xl mx-auto px-4 py-8">
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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Capa */}
        {ed.cover_url && (
          <div className="w-full lg:w-56 shrink-0">
            <Image
              src={ed.cover_url}
              alt={ed.title ?? `Edição ${ed.edition_number ?? ''}`}
              width={224}
              height={314}
              className="rounded shadow-lg object-cover w-full lg:w-56"
              unoptimized
            />
          </div>
        )}

        {/* Metadados */}
        <div className="flex-1">
          {ed.edition_number && (
            <p className="text-sm font-bold text-[#f5821f] uppercase tracking-wide mb-1">
              Nº {ed.edition_number}
            </p>
          )}
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a1a1a] leading-tight mb-2">
            {ed.title ?? `Edição de Sexta — ${dateStr}`}
          </h1>
          <p className="text-sm text-gray-500 capitalize mb-4">{dateStr}</p>
          {ed.description && (
            <p className="text-gray-600 leading-relaxed mb-6">{ed.description}</p>
          )}
          <a
            href={ed.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f5821f] text-white font-semibold rounded-lg hover:bg-[#e0711a] transition-colors text-sm"
          >
            <span>📥</span> Baixar PDF
          </a>
          <Link
            href="/edicao-de-sexta"
            className="ml-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Todas as edições
          </Link>
        </div>
      </div>

      {/* Visualizador PDF */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">Leia a edição</h2>
        <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50"
          style={{ height: 'min(85vh, 900px)' }}>
          <iframe
            src={`${ed.pdf_url}#toolbar=1&view=FitH`}
            className="w-full h-full"
            title={ed.title ?? `Edição ${ed.edition_number ?? ''}`}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Se o PDF não carregar,{' '}
          <a href={ed.pdf_url} target="_blank" rel="noopener noreferrer"
            className="text-[#f5821f] hover:underline">
            clique aqui para abrir diretamente
          </a>.
        </p>
      </div>
    </div>
  )
}
