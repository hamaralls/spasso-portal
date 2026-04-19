import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ArticleCard from '@/components/ArticleCard'
import SectionHeader from '@/components/SectionHeader'
import { getColunistas, getArtigosPorCategoria } from '@/lib/supabase/queries'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Colunistas — Spasso Cidades',
  description: 'Opiniões, análises e colunas editoriais do Jornal Spasso Cidades.',
  alternates: { canonical: '/colunistas' },
}

function ColumnistCard({ col }: { col: { id: string; name: string; slug: string; type: string; avatar_url: string | null; bio: string | null } }) {
  const initials = col.name
    .split(' ').filter(Boolean)
    .map((n: string) => n[0].toUpperCase())
    .slice(0, 2).join('')

  const isPerson = col.type === 'person'

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shrink-0 mb-3"
        style={{ background: isPerson && col.avatar_url ? undefined : '#7c3aed1a' }}
      >
        {isPerson && col.avatar_url ? (
          <Image
            src={col.avatar_url}
            alt={col.name}
            width={80}
            height={80}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-2xl font-extrabold text-[#7c3aed]">{initials}</span>
        )}
      </div>

      {/* Tag tipo */}
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mb-2 ${
        isPerson
          ? 'bg-[#7c3aed]/10 text-[#7c3aed]'
          : 'bg-gray-100 text-gray-500'
      }`}>
        {isPerson ? 'Colunista' : 'Editorial'}
      </span>

      {/* Nome */}
      <p className="font-extrabold text-[#1a1a1a] text-sm uppercase tracking-wide leading-tight mb-1">{col.name}</p>

      {/* Bio */}
      {col.bio && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-1">{col.bio}</p>
      )}
    </div>
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

      {/* Header da seção */}
      <div>
        <SectionHeader title="Colunistas" color="#7c3aed" />
        <p className="text-sm text-gray-500 mt-1">Opiniões, análises e colunas editoriais</p>
      </div>

      {/* Perfis dos colunistas */}
      {colunistas.length > 0 && (
        <section>
          <div className={`grid gap-4 ${
            colunistas.length === 1 ? 'grid-cols-1 max-w-xs' :
            colunistas.length === 2 ? 'grid-cols-2 max-w-md' :
            colunistas.length === 3 ? 'grid-cols-3 max-w-xl' :
            'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          }`}>
            {colunistas.map(col => (
              <ColumnistCard key={col.id} col={col} />
            ))}
          </div>
        </section>
      )}

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
