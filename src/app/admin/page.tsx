import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/supabase/admin'
import { formatDateShort } from '@/lib/format'

export const runtime = 'edge'

export default async function AdminDashboard() {
  await createClient()
  const stats = await getDashboardStats()

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">Visão geral do portal</p>
      </div>

      {/* Cards de totais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de artigos', value: stats.total.toLocaleString('pt-BR'), color: 'text-[#1a1a1a]' },
          { label: 'Publicados', value: stats.published.toLocaleString('pt-BR'), color: 'text-green-600' },
          { label: 'Rascunhos', value: stats.draft.toLocaleString('pt-BR'), color: 'text-gray-500' },
          { label: 'Sem foto de capa', value: stats.semFoto.toLocaleString('pt-BR'), color: stats.semFoto > 0 ? 'text-orange-500' : 'text-gray-400' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">{card.label}</p>
            <p className={`text-3xl font-extrabold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Top artigos por views */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">Top 10 por Visualizações</h2>
          <Link href="/admin/artigos" className="text-xs text-[#dd8500] hover:underline">Ver todos →</Link>
        </div>
        {stats.topViews.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            Nenhuma visualização registrada ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium text-gray-400 text-xs">#</th>
                <th className="text-left px-5 py-2.5 font-medium text-gray-400 text-xs">Artigo</th>
                <th className="text-left px-5 py-2.5 font-medium text-gray-400 text-xs hidden md:table-cell">Categoria</th>
                <th className="text-left px-5 py-2.5 font-medium text-gray-400 text-xs hidden lg:table-cell">Data</th>
                <th className="text-right px-5 py-2.5 font-medium text-gray-400 text-xs">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.topViews.map((article, i) => (
                <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-300 font-bold text-xs w-8">{i + 1}</td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/${article.slug}/`}
                      target="_blank"
                      className="font-medium text-gray-900 hover:text-[#dd8500] line-clamp-1 transition-colors"
                    >
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell">
                    {article.category_slug ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">
                    {article.published_at ? formatDateShort(article.published_at) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-bold text-[#dd8500]">
                      {article.views.toLocaleString('pt-BR')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ações rápidas */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 text-sm mb-4">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/artigos/novo"
            className="px-4 py-2 bg-[#dd8500] text-white text-sm font-semibold rounded-lg hover:bg-[#c87800] transition-colors"
          >
            + Novo artigo
          </Link>
          <Link
            href="/admin/artigos?status=draft"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:border-[#dd8500] transition-colors"
          >
            Ver rascunhos
          </Link>
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:border-[#dd8500] transition-colors"
          >
            Abrir portal ↗
          </Link>
        </div>
      </div>
    </div>
  )
}
