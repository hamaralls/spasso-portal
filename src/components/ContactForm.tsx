'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('loading')

    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    const res = await fetch('/api/contato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      setState('success')
      setMessage('Mensagem enviada com sucesso! Entraremos em contato em breve.')
      form.reset()
    } else {
      const json = await res.json().catch(() => ({}))
      setState('error')
      setMessage(json.error ?? 'Erro ao enviar. Tente novamente.')
    }
  }

  if (state === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-green-700 font-semibold mb-1">Mensagem enviada!</p>
        <p className="text-sm text-green-600">{message}</p>
        <button
          onClick={() => setState('idle')}
          className="mt-4 text-sm text-green-700 underline hover:no-underline"
        >
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Nome *
          </label>
          <input
            name="nome"
            type="text"
            required
            placeholder="Seu nome"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dd8500] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            E-mail *
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="seu@email.com"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dd8500] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Assunto
        </label>
        <input
          name="assunto"
          type="text"
          placeholder="Ex: Sugestão de pauta"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dd8500] focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Mensagem *
        </label>
        <textarea
          name="mensagem"
          required
          rows={5}
          placeholder="Escreva sua mensagem..."
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#dd8500] focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={state === 'loading'}
        className="w-full sm:w-auto bg-[#dd8500] text-white font-bold px-8 py-3 rounded-lg text-sm hover:bg-[#c47600] transition-colors disabled:opacity-60"
      >
        {state === 'loading' ? 'Enviando...' : 'Enviar mensagem'}
      </button>
    </form>
  )
}
