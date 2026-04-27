import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { listArticles } from '@/lib/supabase/admin'
import { formatDateTimeAdmin } from '@/lib/format'
import DeleteButton from '@/components/admin/DeleteButton'

export const runtime = 'edge'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  scheduled: 'Agendado',
  archived: 'Arquivado',
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
  archived: 'bg-red-100 text-red-700',
}

const CATEGORIAS = [
  'sumare','hortolandia','nova-odessa','campinas','paulinia','monte-mor',
  'santa-barbara-doeste','outras-cidades','rmc','brasil','saude','politica',
  'economia','educacao','cultura-e-lazer','esporte','eventos','meio-ambiente',
  'seguranca','empregos','tecnologia','infraestrutura','estilo-de-vida','colunistas',
]

interface Props {
  searchParams: Promise<{ status?: string; page?: string; cat?: string }>
}

export default async function ArtigosPage({ searchParams }: Props) {
  const { status = 'all', page: pageStr = '1', cat = 'all' } = await searchParams
  const page = Math.max(1, parseInt(pageStr, 10))

  await createClient()
  const { articles, total } = await listArticles(page, 200, status, cat)
  const totalPages = Math.ceil(total / 200)

  function filterHref(params: { status?: string; cat?: string; page?: number }) {
    const s = params.status ?? status
    const c = params.cat ?? cat
    const p = params.page ?? 1
    return `/admin/artigos?status=${s}&cat=${c}&page=${p}`
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Artigos</h1>
          <p className="text-sm text-gray-500">{total} no total</p>
        </div>
        <Link
          href="/admin/artigos/novo"
          className="px-4 py-2 bg-[#f5821f] text-white text-sm font-semibold rounded-lg hover:bg-[#c87800] transition-colors"
        >
          + Novo artigo
        </Link>
      </div>

      {/* Filtro status */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {['all', 'published', 'scheduled', 'draft', 'archived'].map((s) => (
          <Link
            key={s}
            href={filterHref({ status: s })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              status === s
                ? 'bg-[#f5821f] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#f5821f]'
            }`}
          >
            {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {/* Filtro categoria */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href={filterHref({ cat: 'all' })}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            cat === 'all'
              ? 'bg-gray-700 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
          }`}
        >
          Todas categorias
        </Link>
        {CATEGORIAS.map((c) => (
          <Link
            key={c}
            href={filterHref({ cat: c })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
              cat === c
                ? 'bg-gray-700 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {c.replace(/-/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>Nenhum artigo encontrado.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Capa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Título</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Data</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 hidden md:table-cell" style={{width:'144px'}}>
                    {article.featured_image_url ? (
                      <Image
                        src={article.featured_image_url}
                        alt=""
                        width={128}
                        height={72}
                        className="rounded object-cover"
                        style={{width:'128px',height:'72px'}}
                        unoptimized
                      />
                    ) : (
                      <div className="rounded bg-gray-100 flex items-center justify-center text-gray-300 text-xs" style={{width:'128px',height:'72px'}}>sem foto</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{article.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/{article.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {article.category_slug ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[article.status] ?? ''}`}>
                      {STATUS_LABEL[article.status] ?? article.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs hidden lg:table-cell" style={{ minWidth: '100px' }}>
                    {article.published_at ? (() => {
                      const { date, time } = formatDateTimeAdmin(article.published_at)
                      const isScheduled = article.status === 'scheduled'
                      return (
                        <span className="flex flex-col gap-0.5">
                          <span className={isScheduled ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
                            {isScheduled ? '⏰ ' : ''}{date}
                          </span>
                          <span className={isScheduled ? 'text-blue-400' : 'text-gray-400'}>
                            {time}
                          </span>
                        </span>
                      )
                    })() : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/artigos/${article.id}/editar`}
                      className="text-xs font-medium text-[#f5821f] hover:underline"
                    >
                      Editar
                    </Link>
                    <DeleteButton id={article.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <Link href={filterHref({ page: page - 1 })}
              className="px-4 py-2 rounded border text-sm">← Anterior</Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={filterHref({ page: page + 1 })}
              className="px-4 py-2 rounded border text-sm">Próxima →</Link>
          )}
        </div>
      )}
    </div>
  )
}
