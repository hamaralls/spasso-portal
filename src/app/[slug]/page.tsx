import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Badge from '@/components/Badge'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import ShareButtons from '@/components/ShareButtons'
import SocialFollowCard from '@/components/SocialFollowCard'
import { AdUnit } from '@/components/AdUnit'
import ViewTracker from '@/components/ViewTracker'
import {
  getCategoria,
  getArtigosPorCategoria,
  getArtigoCompleto,
  getArtigosRelacionados,
  getArtigosMaisLidos,
  getArtigoAnterior,
  getArtigoProximo,
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
  const metaAuthorName = Array.isArray(authorRaw)
    ? (authorRaw[0] as { name: string } | undefined)?.name
    : (authorRaw as { name: string } | null)?.name

  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    ...(metaAuthorName ? { authors: [{ name: metaAuthorName }] } : {}),
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
          <SectionHeader title={categoria.name} color={categoria.badge_color ?? '#f5821f'} />
          <p className="text-sm text-gray-500">{total} notícias</p>
        </div>

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
                  <a href={`/${slug}?page=${page - 1}`}
                    className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
                    ← Anterior
                  </a>
                )}
                <span className="px-4 py-2 text-sm text-gray-500">
                  Página {page} de {totalPages}
                </span>
                {page < totalPages && (
                  <a href={`/${slug}?page=${page + 1}`}
                    className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
                    Próxima →
                  </a>
                )}
              </div>
            )}
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-4">
            <AdUnit slot="categoria-sidebar" format="rectangle" />
          </aside>
        </div>
      </div>
    )
  }

  // 2. Tentar como artigo
  const artigo = await getArtigoCompleto(slug)
  if (!artigo) notFound()

  const [relacionados, categoriaArtigo, maisLidos, anterior, proximo] = await Promise.all([
    getArtigosRelacionados(artigo.category_slug ?? '', artigo.slug, 4),
    artigo.category_slug ? getCategoria(artigo.category_slug) : Promise.resolve(null),
    getArtigosMaisLidos(5),
    artigo.published_at ? getArtigoAnterior(artigo.published_at, artigo.slug) : Promise.resolve(null),
    artigo.published_at ? getArtigoProximo(artigo.published_at, artigo.slug) : Promise.resolve(null),
  ])

  const htmlContent = artigo.content?.rendered ?? ''
  const tempoLeitura = artigo.reading_time_min ?? readingTime(htmlContent)
  const url = `https://jornalspassocidades.com.br/${artigo.slug}`

  const authorRaw = artigo.author as unknown
  const userAuthorName = Array.isArray(authorRaw)
    ? (authorRaw[0] as { name: string } | undefined)?.name
    : (authorRaw as { name: string } | null)?.name

  type ColumnistJoin = { name: string; slug: string; type: string; subtitle: string | null; bio: string | null; avatar_url: string | null }
  const colRaw = artigo.columnist as unknown
  const colData: ColumnistJoin | null = Array.isArray(colRaw)
    ? ((colRaw[0] as ColumnistJoin | undefined) ?? null)
    : (colRaw as ColumnistJoin | null)

  const authorName = colData?.name ?? userAuthorName ?? null
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
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="lg:grid lg:grid-cols-[1fr_288px] lg:gap-10 lg:items-start">

            {/* ── Artigo principal ─────────────────────────── */}
            <article className="min-w-0">
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
                {authorName && (
                  <span className="font-medium text-[#1a1a1a] flex items-center gap-2">
                    {colData?.avatar_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={colData.avatar_url}
                        alt={authorName}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    )}
                    {colData?.slug ? (
                      <Link href={`/colunistas/${colData.slug}`} className="hover:text-[#f5821f] transition-colors">
                        {authorName}
                      </Link>
                    ) : authorName}
                  </span>
                )}
                {artigo.published_at && (
                  <time dateTime={artigo.published_at}>{formatDate(artigo.published_at)}</time>
                )}
                <span>{tempoLeitura} min de leitura</span>
              </div>

              {/* Imagem destaque */}
              {artigo.featured_image_url && (
                <figure className="mb-6">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={artigo.featured_image_url}
                      alt={(artigo as { featured_image_alt?: string | null }).featured_image_alt ?? artigo.title}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 800px"
                    />
                  </div>
                  {(artigo as { featured_image_caption?: string | null }).featured_image_caption && (
                    <figcaption className="text-xs text-gray-400 mt-2 px-1 italic">
                      {(artigo as { featured_image_caption?: string | null }).featured_image_caption}
                    </figcaption>
                  )}
                </figure>
              )}

              {/* Banner meio-artigo */}
              <AdUnit slot="artigo-meio" format="rectangle" className="flex justify-center my-6" />

              {/* Conteúdo */}
              <div
                className="prose-spasso"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />

              {/* Badge de origem — só para conteúdo de terceiros sem colunista cadastrado */}
              {artigo.origin_badge && !colData && (
                <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 text-xs uppercase tracking-wide mb-1">
                    Conteúdo de terceiros
                  </p>
                  <p>{artigo.origin_badge}</p>
                </div>
              )}

              {/* Banner fim-artigo */}
              <AdUnit slot="artigo-fim" format="rectangle" className="flex justify-center my-6" />

              {/* Perfil do colunista */}
              {colData && (
                <div className="mt-10 pt-6 border-t border-gray-100">
                  <Link href={`/colunistas/${colData.slug}`}
                    className="group flex items-start gap-5 bg-gray-50 rounded-xl p-5 hover:bg-orange-50 transition-colors">
                    <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: colData.avatar_url ? undefined : '#f5821f1a' }}>
                      {colData.avatar_url ? (
                        <Image src={colData.avatar_url} alt={colData.name} width={64} height={64}
                          className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-xl font-extrabold text-[#f5821f]">
                          {colData.name.split(' ').filter(Boolean).map(n => n[0].toUpperCase()).slice(0, 2).join('')}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#f5821f] mb-1">
                        {colData.type === 'person' ? 'Colunista' : 'Editorial'}
                      </p>
                      <p className="font-extrabold text-[#1a1a1a] text-base leading-snug group-hover:underline">
                        {colData.name}
                      </p>
                      {colData.bio && (
                        <p className="mt-1 text-sm text-gray-500 leading-relaxed">{colData.bio}</p>
                      )}
                      <p className="mt-2 text-xs font-semibold text-[#f5821f]">Ver todas as colunas →</p>
                    </div>
                  </Link>
                </div>
              )}

              {/* Compartilhar */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <ShareButtons title={artigo.title} url={url} />
              </div>

              {/* Navegação anterior / próximo */}
              {(anterior || proximo) && (
                <nav className="mt-10 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    {anterior && (
                      <Link href={`/${anterior.slug}`}
                        className="group flex flex-col gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <span className="text-xs text-gray-400 font-medium">← Anterior</span>
                        <span className="text-sm font-semibold text-[#1a1a1a] line-clamp-2 group-hover:underline">
                          {anterior.title}
                        </span>
                      </Link>
                    )}
                  </div>
                  <div className="text-right">
                    {proximo && (
                      <Link href={`/${proximo.slug}`}
                        className="group flex flex-col gap-1 p-3 rounded-lg hover:bg-gray-50 transition-colors items-end">
                        <span className="text-xs text-gray-400 font-medium">Próximo →</span>
                        <span className="text-sm font-semibold text-[#1a1a1a] line-clamp-2 group-hover:underline">
                          {proximo.title}
                        </span>
                      </Link>
                    )}
                  </div>
                </nav>
              )}
            </article>

            {/* ── Sidebar desktop ──────────────────────────── */}
            <aside className="hidden lg:block lg:sticky lg:top-4 space-y-8">

              {/* Mais Lidos */}
              {maisLidos.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-100">
                    Mais Lidos
                  </h2>
                  <ol className="space-y-3">
                    {maisLidos.map((a, i) => (
                      <li key={a.id}>
                        <Link href={`/${a.slug}`} className="group flex items-center gap-3">
                          <span className="text-xl font-extrabold text-gray-200 leading-none w-5 shrink-0 select-none">
                            {i + 1}
                          </span>
                          <p className="flex-1 text-sm font-semibold text-[#1a1a1a] line-clamp-2 group-hover:underline leading-snug min-w-0">
                            {a.title}
                          </p>
                          {a.featured_image_url && (
                            <div className="relative w-16 h-10 rounded overflow-hidden shrink-0">
                              <Image src={a.featured_image_url} alt={a.title} fill className="object-cover" sizes="64px" />
                            </div>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Banner sidebar artigo */}
              <AdUnit slot="artigo-sidebar" format="rectangle" className="flex justify-center" />

              {/* Veja Também */}
              {relacionados.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-100">
                    Veja Também
                  </h2>
                  <div className="space-y-3">
                    {relacionados.map((a) => (
                      <Link key={a.id} href={`/${a.slug}`} className="group flex items-center gap-3">
                        <p className="flex-1 text-sm font-semibold text-[#1a1a1a] line-clamp-2 group-hover:underline leading-snug min-w-0">
                          {a.title}
                        </p>
                        {a.featured_image_url && (
                          <div className="relative w-16 h-10 rounded overflow-hidden shrink-0">
                            <Image src={a.featured_image_url} alt={a.title} fill className="object-cover" sizes="64px" />
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Redes sociais */}
              <SocialFollowCard />

            </aside>

          </div>
        </div>
      </div>

      {/* Relacionados mobile (oculto no desktop — coberto pela sidebar) */}
      {relacionados.length > 0 && (
        <section className="lg:hidden max-w-6xl mx-auto px-4 py-10">
          <SectionHeader title="Veja Também" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relacionados.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
