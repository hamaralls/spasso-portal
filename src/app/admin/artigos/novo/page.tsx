import ArticleEditorClient from '@/components/admin/ArticleEditorClient'
import { getCategorias } from '@/lib/supabase/queries'

export const runtime = 'edge'

export default async function NovoArtigoPage() {
  const categories = await getCategorias()

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <a href="/admin/artigos" className="text-sm text-gray-500 hover:text-[#dd8500]">← Artigos</a>
        <span className="text-gray-300">/</span>
        <h1 className="text-sm font-semibold text-gray-800">Novo artigo</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <ArticleEditorClient categories={categories} />
      </div>
    </div>
  )
}
