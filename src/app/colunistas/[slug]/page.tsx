import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import SectionHeader from '@/components/SectionHeader'
import { AdUnit } from '@/components/AdUnit'
import { timeAgo } from '@/lib/format'
import { getColunistaPorSlug, getArtigosPorColunista } from '@/lib/supabase/queries'

export const runtime = 'edge'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const col = await getColunistaPorSlug(slug)
  if (!col) return {}

  const description = col.bio ?? `Leia as colunas de ${col.name} no Spasso Cidades.`
  return {
    title: `${col.name} — Spasso Cidades`,
    description,
    alternates: { canonical: `/colunistas/${col.slug}` },
    openGraph: {
      title: `${col.name} — Spasso Cidades`,
      description,
      url: `https://jornalspassocidades.com.br/colunistas/${col.slug}`,
      type: 'profile',
      images: col.avatar_url
        ? [{ url: col.avatar_url, width: 400, height: 400, alt: col.name }]
        : [{ url: 'https://jornalspassocidades.com.br/og-default.jpg', width: 1200, height: 630 }],
    },
  }
}

export default async function ColunistaPaginaPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const perPage = 12

  const [col, { articles, total }] = await Promise.all([
    getColunistaPorSlug(slug),
    getArtigosPorColunista(slug, page, perPage),
  ])

  if (!col) notFound()

  const totalPages = Math.ceil(total / perPage)
  const isPerson = col.type === 'person'
  const initials = col.name
    .split(' ').filter(Boolean)
    .map(n => n[0].toUpperCase())
    .slice(0, 2).join('')

  const bioText = col.bio && col.bio !== 'Da Redação'
    ? col.bio
    : isPerson ? null : 'Coluna editorial do Jornal Spasso Cidades.'

  return (
    <div className="bg-white min-h-screen">
      {/* Hero do colunista */}
      <div className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-10">

          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-8 flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#f5821f]">Home</Link>
            <span>/</span>
            <Link href="/colunistas" className="hover:text-[#f5821f]">Colunistas</Link>
            <span>/</span>
            <span className="text-gray-600">{col.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7">
            {/* Avatar — maior e com anel laranja */}
            <div
              className="w-36 h-36 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
              style={{
                background: col.avatar_url ? undefined : '#f5821f1a',
                outline: '4px solid #f5821f',
                outlineOffset: '3px',
              }}
            >
              {col.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={col.avatar_url}
                  alt={col.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-5xl font-extrabold text-[#f5821f]">{initials}</span>
              )}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex flex-col justify-center">
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 self-center sm:self-start"
                style={{
                  background: isPerson ? '#f5821f' : '#f5f5f5',
                  color: isPerson ? '#fff' : '#6b7280',
                }}
              >
                {isPerson ? 'Colunista' : 'Editorial'}
              </span>

              <h1 className="text-4xl font-extrabold text-[#1a1a1a] leading-tight">
                {col.name}
              </h1>

              {bioText && (
                <p className="mt-4 text-gray-600 leading-relaxed max-w-xl text-sm">
                  {bioText}
                </p>
              )}

              <p className="mt-4 text-xs text-gray-400">
                {total} {total === 1 ? 'publicação' : 'publicações'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Banner leaderboard entre hero e artigos */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <AdUnit slot="colunista-leaderboard" format="leaderboard" className="flex justify-center" />
      </div>

      {/* Artigos */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-6">
          <SectionHeader
            title={isPerson ? `Artigos de ${col.name}` : 'Arquivo'}
            color="#f5821f"
          />
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Nenhuma publicação ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {articles.map(article => (
              <Link key={article.id} href={`/${article.slug}`}
                className="group flex flex-col gap-1 py-5 hover:bg-gray-50 transition-colors px-1 -mx-1">
                <h3 className="font-bold text-[#1a1a1a] leading-snug group-hover:underline text-base">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                    {article.excerpt.replace(/<[^>]+>/g, '')}
                  </p>
                )}
                <span className="text-xs text-gray-400 mt-0.5">{timeAgo(article.published_at)}</span>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`/colunistas/${col.slug}?page=${page - 1}`}
                className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-gray-500">
              Página {page} de {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/colunistas/${col.slug}?page=${page + 1}`}
                className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Próxima →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
