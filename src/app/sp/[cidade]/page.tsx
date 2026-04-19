import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import { getCategoria, getArtigosPorCategoria } from '@/lib/supabase/queries'

export const runtime = 'edge'

interface Props {
  params: Promise<{ cidade: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cidade } = await params
  const categoria = await getCategoria(cidade)
  if (!categoria) return {}
  return {
    title: `${categoria.name} — Notícias`,
    description: `Últimas notícias de ${categoria.name} e região.`,
    alternates: { canonical: `/sp/${cidade}` },
  }
}

export default async function CidadePage({ params, searchParams }: Props) {
  const { cidade } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const perPage = 12

  const [categoria, { articles, total }] = await Promise.all([
    getCategoria(cidade),
    getArtigosPorCategoria(cidade, page, perPage),
  ])

  if (!categoria) notFound()

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <SectionHeader title={categoria.name} color={categoria.badge_color ?? '#f5821f'} />
        <p className="text-sm text-gray-500">{total} notícias</p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>Nenhuma notícia publicada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && (
            <a
              href={`/sp/${cidade}?page=${page - 1}`}
              className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ← Anterior
            </a>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/sp/${cidade}?page=${page + 1}`}
              className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Próxima →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
