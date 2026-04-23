'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: object) => string
      reset: (id: string) => void
      remove: (id: string) => void
    }
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export default function ContactForm() {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')
  const widgetRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !SITE_KEY || widgetRef.current) return
    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (t: string) => setToken(t),
      'expired-callback': () => setToken(''),
      'error-callback': () => setToken(''),
      theme: 'light',
    })
  }, [])

  useEffect(() => {
    if (!SITE_KEY) return
    if (window.turnstile) { renderWidget(); return }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.onload = renderWidget
    document.head.appendChild(script)
    return () => {
      if (widgetRef.current && window.turnstile) {
        window.turnstile.remove(widgetRef.current)
        widgetRef.current = null
      }
    }
  }, [renderWidget])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (SITE_KEY && !token) return
    setState('loading')

    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    const res = await fetch('/api/contato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, token }),
    })

    if (res.ok) {
      setState('success')
      setMessage('Mensagem enviada com sucesso! Entraremos em contato em breve.')
      form.reset()
      setToken('')
    } else {
      const json = await res.json().catch(() => ({}))
      setState('error')
      setMessage(json.error ?? 'Erro ao enviar. Tente novamente.')
      if (widgetRef.current && window.turnstile) {
        window.turnstile.reset(widgetRef.current)
        setToken('')
      }
    }
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[#1a1a1a] font-bold text-lg">Mensagem enviada!</p>
        <p className="text-sm text-gray-500 max-w-xs">{message}</p>
        <button
          onClick={() => setState('idle')}
          className="mt-2 text-sm text-[#f5821f] hover:underline font-medium"
        >
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state === 'error' && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
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
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f5821f]/30 focus:border-[#f5821f] transition-colors"
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
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f5821f]/30 focus:border-[#f5821f] transition-colors"
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
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f5821f]/30 focus:border-[#f5821f] transition-colors"
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
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f5821f]/30 focus:border-[#f5821f] transition-colors resize-none"
        />
      </div>

      {/* Turnstile widget — só renderiza quando SITE_KEY configurado */}
      {SITE_KEY && <div ref={containerRef} />}

      <button
        type="submit"
        disabled={state === 'loading' || (!!SITE_KEY && !token)}
        className="flex items-center gap-2 bg-[#f5821f] text-white font-bold px-8 py-3 rounded-lg text-sm hover:bg-[#e07010] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Enviando...
          </>
        ) : 'Enviar mensagem'}
      </button>
    </form>
  )
}
