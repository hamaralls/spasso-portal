import { notFound } from 'next/navigation'
import EditionForm from '@/components/admin/EditionForm'
import { getEditionById } from '@/lib/supabase/admin'
import type { WeeklyEdition } from '@/types'

export const runtime = 'edge'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarEdicaoPage({ params }: Props) {
  const { id } = await params
  const edition = await getEditionById(id).catch(() => null)

  if (!edition) notFound()

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Editar Edição</h1>
      <EditionForm initial={edition as WeeklyEdition} />
    </div>
  )
}
