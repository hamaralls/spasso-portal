'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router  = useRouter()
  const [ready,    setReady]    = useState(false)
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    const sb = createClient()
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token') ?? ''
    const type = params.get('type')

    if (accessToken && type === 'recovery') {
      sb.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error: err }) => {
          if (err) setError('Link inválido ou expirado. Solicite um novo.')
          else setReady(true)
        })
      return
    }

    // Fallback: espera evento do cliente Supabase (quando chega via redirectTo)
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 8)  { setError('Mínimo de 8 caracteres.'); return }
    setLoading(true)
    const sb = createClient()
    const { error: err } = await sb.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-[#f5821f]">SPASSO CIDADES</h1>
          <p className="text-sm text-gray-500 mt-1">Redefinir senha</p>
        </div>

        {success ? (
          <p className="text-sm text-green-700 bg-green-50 px-3 py-3 rounded-lg text-center">
            Senha alterada! Redirecionando para o login...
          </p>
        ) : error && !ready ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-red-600 bg-red-50 px-3 py-3 rounded-lg">{error}</p>
            <button onClick={() => router.push('/login')}
              className="text-sm text-gray-500 hover:text-[#f5821f] transition-colors">
              Voltar ao login
            </button>
          </div>
        ) : !ready ? (
          <p className="text-sm text-gray-500 text-center">Validando link de recuperação...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f] focus:border-transparent"
                placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f5821f] focus:border-transparent"
                placeholder="Repita a nova senha" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#f5821f] text-white font-semibold rounded-lg hover:bg-[#c87800] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
