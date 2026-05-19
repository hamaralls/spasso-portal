'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function FeaturedToggleButton({
  id,
  isFeatured,
}: {
  id: string
  isFeatured: boolean
}) {
  const router = useRouter()
  const [active, setActive] = useState(isFeatured)
  const [pending, startTransition] = useTransition()

  async function toggle() {
    const next = !active
    setActive(next)
    try {
      // Estrela = FIXAR no hero. is_featured_pinned força a matéria pro topo
      // (a query do hero ordena por ele antes da data); is_featured mantém
      // ela dentro do filtro is_featured=true. Juntos garantem que a escolha
      // manual aparece mesmo competindo com auto-destaques mais recentes.
      await fetch(`/api/artigos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: next, is_featured_pinned: next }),
      })
      startTransition(() => router.refresh())
    } catch {
      setActive(!next) // rollback
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={active ? 'Remover do hero' : 'Destacar no hero'}
      className={`text-lg leading-none transition-opacity ${pending ? 'opacity-40' : 'opacity-100'}`}
    >
      {active ? '⭐' : '☆'}
    </button>
  )
}
