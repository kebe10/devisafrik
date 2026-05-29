// app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Le hash contient le token : #access_token=...&type=recovery
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const type = params.get('type') || new URLSearchParams(window.location.search).get('type')

    // Supabase détecte automatiquement le token dans le hash
    // et crée la session via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/auth/reset-password')
      } else if (event === 'SIGNED_IN' && type !== 'recovery') {
        router.replace('/dashboard')
      }
    })

    // Fallback : si pas d'événement après 3s, lire le hash manuellement
    const timeout = setTimeout(async () => {
      const accessToken  = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token:  accessToken,
          refresh_token: refreshToken,
        })
        if (type === 'recovery') {
          router.replace('/auth/reset-password')
        } else {
          router.replace('/dashboard')
        }
      } else {
        // Pas de token → rediriger vers login avec erreur
        router.replace('/login?error=Lien+invalide+ou+expiré')
      }
    }, 1500)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
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