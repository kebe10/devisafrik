// app/auth/confirm/page.tsx
'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ConfirmForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    const type      = searchParams.get('type')

    if (!tokenHash) {
      router.replace('/login?error=Lien+invalide')
      return
    }

    supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any || 'recovery',
    }).then(({ error }) => {
      if (error) {
        router.replace('/login?error=Lien+invalide+ou+expiré.+Veuillez+faire+une+nouvelle+demande.')
        return
      }
      if (type === 'recovery') {
        router.replace('/auth/reset-password')
      } else {
        router.replace('/dashboard')
      }
    })
  }, [router, searchParams])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Vérification en cours...</div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    }>
      <ConfirmForm />
    </Suspense>
  )
}