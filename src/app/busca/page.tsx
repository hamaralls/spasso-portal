import type { Metadata } from 'next'
import ArticleCard from '@/components/ArticleCard'
import { buscarArtigos } from '@/lib/supabase/queries'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Busca — Spasso Cidades',
  robots: { index: false },
}

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function BuscaPage({ searchParams }: Props) {
  const { q, page: pageParam } = await searchParams
  const query = (q ?? '').trim()
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const perPage = 12

  const { articles, total } = query.length >= 2
    ? await buscarArtigos(query, page, perPage)
    : { articles: [], total: 0 }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] mb-6">Busca</h1>

      {/* Formulário */}
      <form method="GET" action="/busca/" className="mb-8 flex gap-2 max-w-xl">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Buscar notícias..."
          autoFocus
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#dd8500] focus:border-transparent"
        />
        <button
          type="submit"
          className="bg-[#dd8500] text-white font-bold px-5 py-2 rounded-lg text-sm hover:bg-[#c47600] transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Resultados */}
      {query.length >= 2 && (
        <>
          <p className="text-sm text-gray-500 mb-6">
            {total === 0
              ? `Nenhum resultado para "${query}"`
              : `${total} resultado${total !== 1 ? 's' : ''} para "${query}"`}
          </p>

          {articles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {page > 1 && (
                <a
                  href={`/busca/?q=${encodeURIComponent(query)}&page=${page - 1}`}
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
                  href={`/busca/?q=${encodeURIComponent(query)}&page=${page + 1}`}
                  className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Próxima →
                </a>
              )}
            </div>
          )}
        </>
      )}

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-gray-400">Digite pelo menos 2 caracteres.</p>
      )}
    </div>
  )
}
