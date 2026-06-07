import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import ArticleCard from '@/components/ArticleCard'
import { AdUnit } from '@/components/AdUnit'
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

  const cidadeUrl = `https://jornalspassocidades.com.br/sp/${cidade}`
  const heroDescricao = `Notícias de ${categoria.name} e região: política, saúde, educação, economia, cultura e mais.`

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoria.name} — Spasso Cidades`,
    url: cidadeUrl,
    description: heroDescricao,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Spasso Cidades',
      url: 'https://jornalspassocidades.com.br',
    },
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jornalspassocidades.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Cidades', item: 'https://jornalspassocidades.com.br/rmc' },
      { '@type': 'ListItem', position: 3, name: categoria.name, item: cidadeUrl },
    ],
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumb visual */}
      <nav className="text-xs text-gray-400 mb-3 flex items-center gap-1.5" aria-label="Navegação">
        <Link href="/" className="hover:text-[#f5821f]">Home</Link>
        <span>/</span>
        <Link href="/rmc" className="hover:text-[#f5821f]">Cidades</Link>
        <span>/</span>
        <span className="text-gray-500">{categoria.name}</span>
      </nav>

      {/* Hero editorial */}
      <header className="mb-8 pb-6 border-b border-gray-100">
        <h1
          className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-2"
          style={{ borderLeft: `4px solid ${categoria.badge_color ?? '#f5821f'}`, paddingLeft: '0.75rem' }}
        >
          {categoria.name}
        </h1>
        <p className="text-base text-gray-600 max-w-3xl mb-2">{heroDescricao}</p>
        <p className="text-xs text-gray-400">{total} notícia{total === 1 ? '' : 's'} publicada{total === 1 ? '' : 's'}</p>
      </header>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">
        <div>
          {articles.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>Nenhuma notícia publicada ainda.</p>
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
                <a href={`/sp/${cidade}?page=${page - 1}`}
                  className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
                  ← Anterior
                </a>
              )}
              <span className="px-4 py-2 text-sm text-gray-500">
                Página {page} de {totalPages}
              </span>
              {page < totalPages && (
                <a href={`/sp/${cidade}?page=${page + 1}`}
                  className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
                  Próxima →
                </a>
              )}
            </div>
          )}
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-4">
          <AdUnit slot="cidade-sidebar" format="rectangle" fallbackSlot="sidebar" />
        </aside>
      </div>
    </div>
  )
}
