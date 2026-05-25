// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      if (authError.message.includes('Invalid login')) {
        setError('Email ou mot de passe incorrect.')
      } else {
        setError('Une erreur est survenue. Réessayez.')
      }
      return
    }

    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--orange)', borderRadius: 14,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 12,
          }}>D</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--blue)' }}>DevisAfrik</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Connectez-vous à votre compte
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 28,
          boxShadow: 'var(--shadow-sm)',
        }}>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Adresse email *
            </label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Mot de passe *
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {/* Mot de passe oublié */}
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: 'var(--orange)', cursor: 'pointer', fontWeight: 600 }}>
              Mot de passe oublié ?
            </span>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{
              background: '#FEF2F2', color: '#DC2626',
              padding: '10px 14px', borderRadius: 8,
              fontSize: 13, marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Bouton */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: 10,
              fontSize: 15, fontWeight: 700,
              background: loading ? '#ccc' : 'var(--orange)',
              color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 18, height: 18,
                  border: '2px solid #fff', borderTopColor: 'transparent',
                  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                }} />
                Connexion...
              </>
            ) : 'Se connecter'}
          </button>

          {/* Lien inscription */}
          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'var(--text-muted)' }}>
            Pas encore de compte ?{' '}
            <span
              onClick={() => router.push('/register')}
              style={{ color: 'var(--orange)', fontWeight: 600, cursor: 'pointer' }}
            >
              S'inscrire gratuitement
            </span>
          </div>
        </div>

        {/* Retour landing */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span
            onClick={() => router.push('/')}
            style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            ← Retour à l'accueil
          </span>
        </div>

      </div>
    </div>
  )
}