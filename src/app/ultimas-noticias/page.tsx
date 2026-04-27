import type { Metadata } from 'next'
import { getArtigosPaginados } from '@/lib/supabase/queries'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import { AdUnit } from '@/components/AdUnit'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Últimas Notícias',
  description: 'Todas as notícias de Sumaré e da Região Metropolitana de Campinas em ordem cronológica.',
  alternates: { canonical: '/ultimas-noticias' },
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function UltimasNoticiasPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const perPage = 24

  const { articles, total } = await getArtigosPaginados(page, perPage)
  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <SectionHeader title="Últimas Notícias" color="#f5821f" />
        <p className="text-sm text-gray-500 mt-1">{total.toLocaleString('pt-BR')} notícias publicadas</p>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">
        <div>
          {articles.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>Nenhuma notícia encontrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {page > 1 && (
                <a href={`/ultimas-noticias?page=${page - 1}`}
                  className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
                  ← Anterior
                </a>
              )}
              <span className="px-4 py-2 text-sm text-gray-500">
                Página {page} de {totalPages}
              </span>
              {page < totalPages && (
                <a href={`/ultimas-noticias?page=${page + 1}`}
                  className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
                  Próxima →
                </a>
              )}
            </div>
          )}
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-4">
          <AdUnit slot="ultimas-sidebar" format="rectangle" />
        </aside>
      </div>
    </div>
  )
}
