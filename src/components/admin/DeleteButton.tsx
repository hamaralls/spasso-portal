'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Excluir este artigo permanentemente?')) return
    setLoading(true)
    await fetch(`/api/artigos/${id}`, { method: 'DELETE' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs font-medium text-red-500 hover:underline disabled:opacity-40 ml-3"
    >
      {loading ? '...' : 'Excluir'}
    </button>
  )
}
