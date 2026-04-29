import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { AdUnit } from '@/components/AdUnit'
import { buscarArtigos } from '@/lib/supabase/queries'
import { formatDateShort } from '@/lib/format'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Busca — Spasso Cidades',
  robots: { index: false },
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-[#f5821f]/20 text-[#f5821f] font-semibold rounded px-0.5">{part}</mark>
      : part
  )
}

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function BuscaPage({ searchParams }: Props) {
  const { q, page: pageParam } = await searchParams
  const query = (q ?? '').trim()
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const perPage = 20

  const { articles, total } = query.length >= 2
    ? await buscarArtigos(query, page, perPage)
    : { articles: [], total: 0 }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-[#1a1a1a] mb-6">Busca</h1>

      {/* Formulário */}
      <form method="GET" action="/busca" className="mb-8 flex gap-2 max-w-xl">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Buscar notícias..."
          autoFocus
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f] focus:border-transparent"
        />
        <button
          type="submit"
          className="bg-[#f5821f] text-white font-bold px-5 py-2 rounded-lg text-sm hover:bg-[#c47600] transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Banner acima dos resultados */}
      <AdUnit slot="busca-leaderboard" format="leaderboard" className="flex justify-center mb-8" />

      {/* Resultados */}
      {query.length >= 2 && (
        <>
          <p className="text-sm text-gray-500 mb-6">
            {total === 0
              ? `Nenhum resultado para "${query}"`
              : `${total} resultado${total !== 1 ? 's' : ''} para "${query}"`}
          </p>

          {articles.length > 0 && (
            <div className="divide-y divide-gray-100">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/${article.slug}`}
                  className="flex gap-4 py-4 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group"
                >
                  {article.featured_image_url && (
                    <div className="shrink-0 hidden sm:block">
                      <Image
                        src={article.featured_image_url}
                        alt=""
                        width={112}
                        height={63}
                        className="rounded object-cover"
                        style={{ width: 112, height: 63 }}
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a1a1a] group-hover:underline leading-snug line-clamp-2 transition-colors">
                      {highlight(article.title, query)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      {article.category_slug && (
                        <span className="capitalize">{article.category_slug.replace(/-/g, ' ')}</span>
                      )}
                      {article.published_at && (
                        <span>· {formatDateShort(article.published_at)}</span>
                      )}
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: article.excerpt }}
                      />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {page > 1 && (
                <a
                  href={`/busca?q=${encodeURIComponent(query)}&page=${page - 1}`}
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
                  href={`/busca?q=${encodeURIComponent(query)}&page=${page + 1}`}
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
