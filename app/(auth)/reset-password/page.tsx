// app/auth/reset-password/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [ready, setReady]         = useState(false)

  useEffect(() => {
    // Échanger le code pour une session
    const init = async () => {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }
      setReady(true)
    }
    init()
  }, [code])

  const handleReset = async () => {
    setError('')
    if (!password || !confirm) { setError('Veuillez remplir tous les champs.'); return }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) { setError('Erreur lors de la mise à jour. Réessayez.'); return }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: 'var(--orange)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 12 }}>D</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--blue)' }}>DevisAfrik</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#059669', marginBottom: 10 }}>Mot de passe mis à jour !</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Redirection vers votre tableau de bord...</div>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--blue)', marginBottom: 6 }}>Nouveau mot de passe</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Choisissez un nouveau mot de passe sécurisé.</div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Nouveau mot de passe *</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Confirmer le mot de passe *</label>
                <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReset()} />
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                  ⚠️ {error}
                </div>
              )}

              <button onClick={handleReset} disabled={loading}
                style={{ width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: loading ? '#ccc' : 'var(--orange)', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '⏳ Mise à jour...' : '✅ Mettre à jour le mot de passe'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}