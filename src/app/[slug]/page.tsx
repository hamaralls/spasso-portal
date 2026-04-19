import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Badge from '@/components/Badge'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import ShareButtons from '@/components/ShareButtons'
import { AdUnit } from '@/components/AdUnit'
import ViewTracker from '@/components/ViewTracker'
import ReadingProgress from '@/components/ReadingProgress'
import {
  getCategoria,
  getArtigosPorCategoria,
  getArtigoCompleto,
  getArtigosRelacionados,
} from '@/lib/supabase/queries'
import { formatDate, readingTime } from '@/lib/format'

export const runtime = 'edge'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const categoria = await getCategoria(slug)
  if (categoria) {
    return {
      title: `${categoria.name} — Notícias`,
      description: `Últimas notícias sobre ${categoria.name}.`,
      alternates: { canonical: `/${slug}` },
    }
  }

  const artigo = await getArtigoCompleto(slug)
  if (!artigo) return {}

  const title = artigo.seo_title || artigo.title
  const description = (artigo.seo_description || artigo.excerpt || '').replace(/<[^>]+>/g, '').slice(0, 160)
  const image = artigo.featured_image_url
  const authorRaw = artigo.author as unknown
  const authorName = Array.isArray(authorRaw)
    ? (authorRaw[0] as { name: string } | undefined)?.name
    : (authorRaw as { name: string } | null)?.name

  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    ...(authorName ? { authors: [{ name: authorName }] } : {}),
    openGraph: {
      title,
      description,
      url: `https://jornalspassocidades.com.br/${slug}`,
      type: 'article',
      publishedTime: artigo.published_at ?? undefined,
      modifiedTime: artigo.updated_at ?? undefined,
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: title }]
        : [{ url: '/og-default.jpg', width: 1200, height: 630 }],
    },
  }
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const perPage = 12

  // 1. Verificar se é uma categoria
  const categoria = await getCategoria(slug)
  if (categoria) {
    const { articles, total } = await getArtigosPorCategoria(slug, page, perPage)
    const totalPages = Math.ceil(total / perPage)

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <SectionHeader title={categoria.name} />
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

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {page > 1 && (
              <a
                href={`/${slug}?page=${page - 1}`}
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
                href={`/${slug}?page=${page + 1}`}
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

  // 2. Tentar como artigo
  const artigo = await getArtigoCompleto(slug)
  if (!artigo) notFound()

  const [relacionados, categoriaArtigo] = await Promise.all([
    getArtigosRelacionados(artigo.category_slug ?? '', artigo.slug, 3),
    artigo.category_slug ? getCategoria(artigo.category_slug) : Promise.resolve(null),
  ])

  const htmlContent = artigo.content?.rendered ?? ''
  const tempoLeitura = artigo.reading_time_min ?? readingTime(htmlContent)
  const url = `https://jornalspassocidades.com.br/${artigo.slug}`

  const authorRaw = artigo.author as unknown
  const authorName = Array.isArray(authorRaw)
    ? (authorRaw[0] as { name: string } | undefined)?.name
    : (authorRaw as { name: string } | null)?.name
  const description = (artigo.seo_description || artigo.excerpt || '').replace(/<[^>]+>/g, '').slice(0, 300)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: artigo.title,
    description,
    datePublished: artigo.published_at,
    dateModified: artigo.updated_at,
    image: artigo.featured_image_url
      ? [{ '@type': 'ImageObject', url: artigo.featured_image_url }]
      : [{ '@type': 'ImageObject', url: 'https://jornalspassocidades.com.br/og-default.jpg' }],
    author: {
      '@type': authorName ? 'Person' : 'Organization',
      name: authorName ?? 'Spasso Cidades',
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'Spasso Cidades',
      url: 'https://jornalspassocidades.com.br',
      logo: {
        '@type': 'ImageObject',
        url: 'https://jornalspassocidades.com.br/og-default.jpg',
        width: 1200,
        height: 630,
      },
    },
  }

  const categoryLabel = categoriaArtigo?.name ?? (artigo.category_slug
    ? artigo.category_slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null)
  const categoryUrl = categoriaArtigo
    ? `https://jornalspassocidades.com.br${categoriaArtigo.url_prefix}`
    : artigo.category_slug
    ? `https://jornalspassocidades.com.br/${artigo.category_slug}`
    : null

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jornalspassocidades.com.br' },
      ...(categoryLabel && categoryUrl
        ? [{ '@type': 'ListItem', position: 2, name: categoryLabel, item: categoryUrl }]
        : []),
      { '@type': 'ListItem', position: categoryLabel ? 3 : 2, name: artigo.title, item: url },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <ViewTracker slug={artigo.slug} />
      <ReadingProgress />
      <article className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#f5821f]">Home</Link>
            {categoriaArtigo && (
              <>
                <span>/</span>
                <Link href={`${categoriaArtigo.url_prefix}`} className="hover:text-[#f5821f]">
                  {categoriaArtigo.name}
                </Link>
              </>
            )}
          </nav>

          {/* Badge + título */}
          <div className="mb-4">
            {categoriaArtigo && (
              <div className="mb-3">
                <Badge name={categoriaArtigo.name} color={categoriaArtigo.badge_color} />
              </div>
            )}
            <h1 className="text-2xl md:text-4xl font-extrabold text-[#1a1a1a] leading-tight">
              {artigo.title}
            </h1>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
            {authorName && <span className="font-medium text-[#1a1a1a]">{authorName}</span>}
            {artigo.published_at && (
              <time dateTime={artigo.published_at}>{formatDate(artigo.published_at)}</time>
            )}
            <span>{tempoLeitura} min de leitura</span>
          </div>

          {/* Imagem destaque */}
          {artigo.featured_image_url && (
            <div className="relative w-full aspect-video mb-6 rounded-lg overflow-hidden">
              <Image
                src={artigo.featured_image_url}
                alt={artigo.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          )}

          {/* Banner meio-artigo */}
          <AdUnit slot="artigo-meio" format="rectangle" className="flex justify-center my-6" />

          {/* Conteúdo */}
          <div
            className="prose-spasso"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Badge de origem */}
          {artigo.origin_badge && (
            <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-600">
              <p className="font-semibold text-gray-800 text-xs uppercase tracking-wide mb-1">
                Conteúdo de terceiros
              </p>
              <p>{artigo.origin_badge}</p>
            </div>
          )}

          {/* Banner fim-artigo */}
          <AdUnit slot="artigo-fim" format="rectangle" className="flex justify-center my-6" />

          {/* Compartilhar */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <ShareButtons title={artigo.title} url={url} />
          </div>
        </div>
      </article>

      {/* Relacionados */}
      {relacionados.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <SectionHeader title="Veja Também" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relacionados.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
