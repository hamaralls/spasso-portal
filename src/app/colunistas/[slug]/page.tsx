import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
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
      <div className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-10">

          {/* Breadcrumb */}
          <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#7c3aed]">Home</Link>
            <span>/</span>
            <Link href="/colunistas" className="hover:text-[#7c3aed]">Colunistas</Link>
            <span>/</span>
            <span className="text-gray-600">{col.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div
              className="w-28 h-28 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: isPerson && col.avatar_url ? undefined : '#7c3aed1a' }}
            >
              {isPerson && col.avatar_url ? (
                <Image
                  src={col.avatar_url}
                  alt={col.name}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                  priority
                />
              ) : (
                <span className="text-4xl font-extrabold text-[#7c3aed]">{initials}</span>
              )}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left">
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mb-2"
                style={{
                  background: isPerson ? '#7c3aed1a' : '#f5f5f5',
                  color: isPerson ? '#7c3aed' : '#6b7280',
                }}
              >
                {isPerson ? 'Colunista' : 'Editorial'}
              </span>

              <h1 className="text-3xl font-extrabold text-[#1a1a1a] leading-tight">
                {col.name}
              </h1>

              {col.subtitle && (
                <p className="text-gray-500 mt-1 text-sm">{col.subtitle}</p>
              )}

              {bioText && (
                <p className="mt-3 text-gray-600 leading-relaxed max-w-xl text-sm">
                  {bioText}
                </p>
              )}

              <p className="mt-3 text-xs text-gray-400">
                {total} {total === 1 ? 'publicação' : 'publicações'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Artigos */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-6">
          <SectionHeader
            title={isPerson ? `Artigos de ${col.name}` : 'Arquivo'}
            color="#7c3aed"
          />
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Nenhuma publicação ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} size="default" />
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
