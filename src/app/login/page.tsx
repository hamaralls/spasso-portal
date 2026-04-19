'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [mode,     setMode]     = useState<'login' | 'forgot'>('login')
  const [sent,     setSent]     = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const sb = createClient()
    const { error: authError } = await sb.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }
    router.push('/admin/artigos')
    router.refresh()
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const sb = createClient()
    const { error: err } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-[#f5821f]">SPASSO CIDADES</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login' ? 'CMS — Redação' : 'Recuperar senha'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f] focus:border-transparent"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#f5821f] text-white font-semibold rounded-lg hover:bg-[#c87800] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <p className="text-center">
              <button type="button" onClick={() => { setMode('forgot'); setError('') }}
                className="text-sm text-gray-500 hover:text-[#f5821f] transition-colors">
                Esqueci minha senha
              </button>
            </p>
          </form>
        ) : sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-green-700 bg-green-50 px-3 py-3 rounded-lg">
              Email enviado! Verifique sua caixa de entrada e clique no link.
            </p>
            <button onClick={() => { setMode('login'); setSent(false) }}
              className="text-sm text-gray-500 hover:text-[#f5821f] transition-colors">
              Voltar ao login
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email da conta</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f] focus:border-transparent"
                placeholder="email@exemplo.com"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#f5821f] text-white font-semibold rounded-lg hover:bg-[#c87800] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
            <p className="text-center">
              <button type="button" onClick={() => { setMode('login'); setError('') }}
                className="text-sm text-gray-500 hover:text-[#f5821f] transition-colors">
                Voltar ao login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
