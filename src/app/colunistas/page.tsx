import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import { AdUnit } from '@/components/AdUnit'
import { getColunistas, getArtigosPorCategoria } from '@/lib/supabase/queries'
import type { ColunistaCom } from '@/lib/supabase/queries'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Colunistas — Spasso Cidades',
  description: 'Opiniões, análises e colunas editoriais do Jornal Spasso Cidades.',
  alternates: { canonical: '/colunistas' },
  openGraph: {
    title: 'Colunistas — Spasso Cidades',
    description: 'Opiniões, análises e colunas editoriais do Jornal Spasso Cidades.',
    url: 'https://jornalspassocidades.com.br/colunistas',
    type: 'website',
    images: [{ url: 'https://jornalspassocidades.com.br/og-default.jpg', width: 1200, height: 630 }],
  },
}

function ColumnistCard({ col }: { col: ColunistaCom }) {
  const initials = col.name
    .split(' ').filter(Boolean)
    .map((n: string) => n[0].toUpperCase())
    .slice(0, 2).join('')
  const isPerson = col.type === 'person'

  return (
    <Link
      href={`/colunistas/${col.slug}`}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden block"
    >
      {/* Cabeçalho */}
      <div className="p-5 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: isPerson && col.avatar_url ? undefined : '#f5821f1a' }}
        >
          {isPerson && col.avatar_url ? (
            <Image
              src={col.avatar_url}
              alt={col.name}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-xl font-extrabold text-[#f5821f]">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[#1a1a1a] text-sm leading-snug">{col.name}</p>
          {col.bio && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-0.5">{col.bio}</p>
          )}
        </div>
      </div>

      {/* Último artigo */}
      {col.lastArticle && (
        <div className="px-5 pb-4 pt-3 border-t border-gray-50 flex gap-3 items-start">
          {col.lastArticle.featured_image_url && (
            <div className="relative w-14 h-10 shrink-0 overflow-hidden rounded bg-gray-100">
              <Image
                src={col.lastArticle.featured_image_url}
                alt={col.lastArticle.title}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          )}
          <p className="text-xs text-gray-600 line-clamp-2 leading-snug group-hover:text-[#f5821f] transition-colors">
            {col.lastArticle.title}
          </p>
        </div>
      )}

      <div className="px-5 pb-4 text-xs font-semibold text-[#f5821f] group-hover:underline">
        Ver coluna →
      </div>
    </Link>
  )
}

export default async function ColunistasPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const perPage = 12

  const [colunistas, { articles, total }] = await Promise.all([
    getColunistas(),
    getArtigosPorCategoria('colunistas', page, perPage),
  ])

  const totalPages = Math.ceil(total / perPage)
  const pessoas = colunistas.filter(c => c.type === 'person')
  const editoriais = colunistas.filter(c => c.type === 'editorial')

  const gridCols = (n: number) =>
    n === 1 ? 'grid-cols-1 max-w-sm' :
    n === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

      <div>
        <SectionHeader title="Colunistas" color="#f5821f" />
        <p className="text-sm text-gray-500 mt-1">Opiniões, análises e colunas editoriais</p>
      </div>

      {/* Colunistas pessoa */}
      {pessoas.length > 0 && (
        <section>
          <div className={`grid gap-4 ${gridCols(pessoas.length)}`}>
            {pessoas.map(col => <ColumnistCard key={col.id} col={col} />)}
          </div>
        </section>
      )}

      {/* Colunas editoriais */}
      {editoriais.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            Colunas editoriais
          </h2>
          <div className={`grid gap-4 ${gridCols(editoriais.length)}`}>
            {editoriais.map(col => <ColumnistCard key={col.id} col={col} />)}
          </div>
        </section>
      )}

      {/* Banner entre colunistas e feed */}
      <AdUnit slot="colunistas-leaderboard" format="leaderboard" className="flex justify-center" />

      {/* Feed de artigos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wide">
            Últimas publicações
            <span className="ml-2 text-sm font-normal text-gray-400 normal-case">({total})</span>
          </h2>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Nenhuma publicação ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} size="columnist" />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <Link href={`/colunistas?page=${page - 1}`}
                className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
                ← Anterior
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-gray-500">Página {page} de {totalPages}</span>
            {page < totalPages && (
              <Link href={`/colunistas?page=${page + 1}`}
                className="px-4 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
                Próxima →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
