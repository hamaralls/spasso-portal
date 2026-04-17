'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthRecoveryRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Se a URL contém type=recovery no hash, redireciona para /reset-password
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      router.replace('/reset-password' + window.location.hash)
      return
    }

    const sb = createClient()
    const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  return null
}
