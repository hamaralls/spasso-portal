import { notFound } from 'next/navigation'
import ColumnistForm from '@/components/admin/ColumnistForm'
import { getColumnistById } from '@/lib/supabase/admin'

export const runtime = 'edge'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarColunistePage({ params }: Props) {
  const { id } = await params
  const col = await getColumnistById(id).catch(() => null)
  if (!col) notFound()

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/colunistas" className="text-sm text-gray-500 hover:text-[#f5821f]">← Colunistas</a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Editar — {col.name}</h1>
      </div>
      <ColumnistForm initial={{
        id: col.id,
        name: col.name ?? '',
        slug: col.slug ?? '',
        bio: col.bio ?? '',
        type: (col.type as 'editorial' | 'person') ?? 'person',
        avatar_url: col.avatar_url ?? '',
        active: col.active ?? true,
      }} />
    </div>
  )
}
