import Link from 'next/link'
import Image from 'next/image'
import { listEditions } from '@/lib/supabase/admin'
import DeleteEditionButton from '@/components/admin/DeleteEditionButton'

export const runtime = 'edge'

export default async function EdicoesAdminPage() {
  const editions = await listEditions()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edição de Sexta</h1>
          <p className="text-sm text-gray-500">{editions.length} edições cadastradas</p>
        </div>
        <Link
          href="/admin/edicoes/nova"
          className="px-4 py-2 bg-[#f5821f] text-white text-sm font-semibold rounded-lg hover:bg-[#e0711a] transition-colors"
        >
          + Nova edição
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {editions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📰</p>
            <p>Nenhuma edição cadastrada ainda.</p>
            <Link href="/admin/edicoes/nova" className="mt-4 inline-block text-sm text-[#f5821f] hover:underline">
              Publicar primeira edição
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Capa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Edição</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {editions.map((ed) => {
                const dateStr = new Date(ed.published_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })
                return (
                  <tr key={ed.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 hidden md:table-cell" style={{ width: 96 }}>
                      {ed.cover_url ? (
                        <Image
                          src={ed.cover_url}
                          alt={`Capa edição ${ed.edition_number ?? ''}`}
                          width={60}
                          height={84}
                          className="rounded object-cover shadow-sm"
                          unoptimized
                        />
                      ) : (
                        <div className="w-[60px] h-[84px] rounded bg-gray-100 flex items-center justify-center text-gray-300 text-[10px]">
                          sem capa
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">
                        {ed.edition_number ? `Nº ${ed.edition_number}` : 'Edição sem número'}
                      </p>
                      {ed.title && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ed.title}</p>
                      )}
                      <a href={ed.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#f5821f] hover:underline mt-0.5 inline-block">
                        Ver PDF ↗
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{dateStr}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        ed.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {ed.active ? 'Publicada' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/edicoes/${ed.id}/editar`}
                        className="text-xs font-medium text-[#f5821f] hover:underline"
                      >
                        Editar
                      </Link>
                      <DeleteEditionButton id={ed.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
