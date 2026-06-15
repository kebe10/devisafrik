// app/(auth)/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [resetMode, setResetMode]       = useState(false)
  const [resetEmail, setResetEmail]     = useState('')
  const [resetSent, setResetSent]       = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  // ✅ useEffect DANS le composant
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error')
    if (urlError) setError(decodeURIComponent(urlError))
  }, [])

  const handleLogin = async () => {
    setError('')
    if (!form.email || !form.password) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    form.email,
      password: form.password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message.includes('Invalid login')
        ? 'Email ou mot de passe incorrect.'
        : 'Une erreur est survenue. Réessayez.')
      return
    }

    router.push('/dashboard')
  }

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) { setError('Veuillez entrer votre adresse email.'); return }
    setResetLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    setResetLoading(false)

    if (resetError) { setError("Erreur lors de l'envoi. Vérifiez votre email."); return }
    setResetSent(true)
  }

  // ── Vue réinitialisation ───────────────────────────────────
  if (resetMode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <img src="/logo-new.png" alt="DevisAfrik" style={{ width: 180, height: 'auto', marginBottom: 12 }} />
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>
            {resetSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>📧</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--blue)', marginBottom: 10 }}>Email envoyé !</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
                  Un lien de réinitialisation a été envoyé à<br />
                  <strong style={{ color: 'var(--text)' }}>{resetEmail}</strong>.<br />
                  Cliquez sur le lien pour choisir un nouveau mot de passe.
                </div>
                <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#065F46', marginBottom: 20 }}>
                  ✅ Vérifiez aussi vos spams si vous ne voyez pas l'email.
                </div>
                <button onClick={() => { setResetMode(false); setResetSent(false); setResetEmail('') }}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: 'var(--orange)', color: '#fff', cursor: 'pointer' }}>
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--blue)', marginBottom: 6 }}>Mot de passe oublié ?</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                  Entrez votre email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Adresse email *</label>
                  <input type="email" placeholder="votre@email.com" value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleResetPassword()} />
                </div>
                {error && (
                  <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                    ⚠️ {error}
                  </div>
                )}
                <button onClick={handleResetPassword} disabled={resetLoading}
                  style={{ width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: resetLoading ? '#ccc' : 'var(--orange)', color: '#fff', cursor: resetLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
                  {resetLoading ? (
                    <><div style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Envoi en cours...</>
                  ) : '📧 Envoyer le lien de réinitialisation'}
                </button>
                <div style={{ textAlign: 'center' }}>
                  <span onClick={() => { setResetMode(false); setError('') }}
                    style={{ fontSize: 13, color: 'var(--orange)', fontWeight: 600, cursor: 'pointer' }}>
                    ← Retour à la connexion
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Vue connexion ──────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo-new.png" alt="DevisAfrik" style={{ width: 180, height: 'auto', marginBottom: 12 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Connectez-vous à votre compte</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-sm)' }}>

          {/* Message d'erreur depuis l'URL (ex: lien expiré) */}
          {error && !form.email && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Adresse email *</label>
            <input type="email" placeholder="votre@email.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Mot de passe *</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <span onClick={() => { setResetMode(true); setError(''); setResetEmail(form.email) }}
              style={{ fontSize: 13, color: 'var(--orange)', cursor: 'pointer', fontWeight: 600 }}>
              Mot de passe oublié ?
            </span>
          </div>

          {error && form.email && (
            <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700, background: loading ? '#ccc' : 'var(--orange)', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? (
              <><div style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Connexion...</>
            ) : 'Se connecter'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'var(--text-muted)' }}>
            Pas encore de compte ?{' '}
            <span onClick={() => router.push('/register')}
              style={{ color: 'var(--orange)', fontWeight: 600, cursor: 'pointer' }}>
              S'inscrire gratuitement
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span onClick={() => router.push('/')}
            style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
            ← Retour à l'accueil
          </span>
        </div>
      </div>
    </div>
  )
}