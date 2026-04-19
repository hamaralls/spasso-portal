import ColumnistForm from '@/components/admin/ColumnistForm'

export const runtime = 'edge'

export default function NovoColunistePage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/colunistas" className="text-sm text-gray-500 hover:text-[#f5821f]">← Colunistas</a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Novo colunista</h1>
      </div>
      <ColumnistForm />
    </div>
  )
}
