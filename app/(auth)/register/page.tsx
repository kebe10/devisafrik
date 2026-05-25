// app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name:     '',
    company:  '',
    email:    '',
    password: '',
    phone:    '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleRegister = async () => {
    setError('')

    // Validation
    if (!form.name || !form.email || !form.password) {
      setError('Veuillez remplir les champs obligatoires.')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (!form.company) {
      setError('Le nom de votre entreprise est requis.')
      return
    }

    setLoading(true)

    try {
      // Appel API register
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:        form.email,
          password:     form.password,
          name:         form.name,
          company_name: form.company,
          phone:        form.phone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.')
        setLoading(false)
        return
      }

      // Connexion automatique après inscription
      
      await supabase.auth.signInWithPassword({
        email:    form.email,
        password: form.password,
      })

      router.push('/dashboard')

    } catch (err) {
      setError('Erreur réseau. Vérifiez votre connexion.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--orange)', borderRadius: 14,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 22, marginBottom: 12,
          }}>D</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--blue)' }}>DevisAfrik</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Créez votre compte gratuit
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 28,
          boxShadow: 'var(--shadow-sm)',
        }}>

          {/* Badge gratuit */}
          <div style={{
            background: '#ECFDF5', border: '1px solid #6EE7B7',
            borderRadius: 8, padding: '10px 14px',
            fontSize: 13, color: '#065F46', marginBottom: 20, textAlign: 'center',
          }}>
            ✅ Gratuit · 3 devis/mois · Aucune carte bancaire requise
          </div>

          {/* Grille 2 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Votre nom *
              </label>
              <input
                placeholder="Kofi Mensah"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Téléphone
              </label>
              <input
                placeholder="+225 07 00 00 00"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Entreprise */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Nom de votre entreprise *
            </label>
            <input
              placeholder="Ex: Électricité Mensah & Fils"
              value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Adresse email *
            </label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Mot de passe * <span style={{ fontWeight: 400, fontSize: 12 }}>(6 caractères minimum)</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
            />
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
            onClick={handleRegister}
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
                Création du compte...
              </>
            ) : 'Créer mon compte gratuit 🚀'}
          </button>

          {/* CGU */}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
            En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>

          {/* Lien connexion */}
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text-muted)' }}>
            Déjà un compte ?{' '}
            <span
              onClick={() => router.push('/login')}
              style={{ color: 'var(--orange)', fontWeight: 600, cursor: 'pointer' }}
            >
              Se connecter
            </span>
          </div>
        </div>

        {/* Retour */}
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