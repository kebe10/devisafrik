// app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    const hashParams = new URLSearchParams(hash.replace('#', ''))
    const searchParams = new URLSearchParams(window.location.search)

    const accessToken  = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type         = hashParams.get('type') || searchParams.get('type')
    const errorCode    = hashParams.get('error_code')

    // Lien expiré ou invalide
    if (errorCode) {
      router.replace('/login?error=Lien+invalide+ou+expiré.+Veuillez+faire+une+nouvelle+demande.')
      return
    }

    // Token présent dans le hash → créer la session
    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token:  accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          router.replace('/login?error=Erreur+d+authentification.+Réessayez.')
          return
        }
        if (type === 'recovery') {
          router.replace('/auth/reset-password')
        } else {
          router.replace('/dashboard')
        }
      })
      return
    }

    // Pas de token du tout
    router.replace('/login?error=Lien+invalide+ou+expiré.+Veuillez+faire+une+nouvelle+demande.')
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Authentification en cours...</div>
      </div>
    </div>
  )
}