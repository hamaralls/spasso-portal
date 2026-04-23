'use client'

import { useState } from 'react'

export default function NewsletterSignup() {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [email, setEmail] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('loading')

    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setState('success')
      setEmail('')
    } else {
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <p className="text-[#8dc63f] text-sm font-semibold">
        ✓ Inscrito! Você receberá as principais notícias.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 max-w-sm">
      {state === 'error' && (
        <p className="text-red-400 text-xs">Erro ao inscrever. Tente novamente.</p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-[#8dc63f] min-w-0"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="px-4 py-2 bg-[#f5821f] text-white text-sm font-bold rounded-lg hover:bg-[#e07010] transition-colors whitespace-nowrap disabled:opacity-60"
        >
          {state === 'loading' ? '...' : 'Inscrever'}
        </button>
      </form>
    </div>
  )
}
