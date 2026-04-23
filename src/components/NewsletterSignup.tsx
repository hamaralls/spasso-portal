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
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
        <p className="text-white font-semibold text-sm">Inscrito com sucesso!</p>
        <p className="text-white/70 text-xs mt-1">Você receberá as principais notícias no seu email.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
      {state === 'error' && (
        <p className="text-red-300 text-xs col-span-2">Erro. Tente novamente.</p>
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        required
        className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/90 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 min-w-0"
      />
      <button
        type="submit"
        disabled={state === 'loading'}
        className="px-4 py-2 bg-[#8dc63f] text-white text-sm font-bold rounded-lg hover:bg-[#7ab32e] transition-colors whitespace-nowrap disabled:opacity-60"
      >
        {state === 'loading' ? '...' : 'Inscrever'}
      </button>
    </form>
  )
}
