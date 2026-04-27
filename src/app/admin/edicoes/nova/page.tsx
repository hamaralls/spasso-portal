import EditionForm from '@/components/admin/EditionForm'

export const runtime = 'edge'

export default function NovaEdicaoPage() {
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Nova Edição de Sexta</h1>
      <EditionForm />
    </div>
  )
}
