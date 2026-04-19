import Link from 'next/link'
import { listColumnists } from '@/lib/supabase/admin'

export const runtime = 'edge'

export default async function ColunistasAdminPage() {
  const columnists = await listColumnists()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Colunistas</h1>
        <Link
          href="/admin/colunistas/novo"
          className="bg-[#f5821f] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#e0711a] transition-colors"
        >
          + Novo colunista
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Slug</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {columnists.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nenhum colunista cadastrado.
                </td>
              </tr>
            )}
            {columnists.map((col) => (
              <tr key={col.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#7c3aed]/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {col.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={col.avatar_url} alt={col.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-[#7c3aed]">
                        {col.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    )}
                  </div>
                  {col.name}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{col.slug}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    col.type === 'editorial'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-[#7c3aed]/10 text-[#7c3aed]'
                  }`}>
                    {col.type === 'editorial' ? 'Editorial' : 'Pessoa'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    col.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                  }`}>
                    {col.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/colunistas/${col.id}/editar`}
                    className="text-xs text-[#f5821f] hover:underline font-medium"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
