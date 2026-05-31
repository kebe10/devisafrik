// app/subscription/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, formatAmount } from '@/lib/supabase'
import type { Organization } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout'

const PLANS = {
  month: { price: 9500,  label: '/mois' },
  year:  { price: 7600,  label: '/mois (annuel)' },
}

const FEATURES_FREE = [
  { ok: true,  label: '3 devis par mois' },
  { ok: true,  label: 'Génération PDF' },
  { ok: true,  label: 'Partage WhatsApp' },
  { ok: true,  label: 'Gestion clients' },
  { ok: false, label: 'Logo sur les PDF' },
  { ok: false, label: 'Génération IA' },
  { ok: false, label: 'Devis illimités' },
  { ok: false, label: 'Statistiques avancées' },
]

const FEATURES_PREMIUM = [
  'Devis illimités',
  'Logo personnalisé sur les PDF',
  'Génération IA avancée',
  'Catalogue de services',
  'Branding WhatsApp',
  'Historique complet',
  'Statistiques et revenus',
  'Support prioritaire WhatsApp',
]

const FAQS = [
  ['Puis-je annuler à tout moment ?', "Oui, depuis votre compte. Le Premium reste actif jusqu'à la fin de la période payée."],
  ['Que se passe-t-il si je dépasse 3 devis ?', 'Vous serez invité à passer en Premium. Vos devis existants restent accessibles.'],
  ['Le paiement est-il sécurisé ?', 'Oui. FedaPay est une plateforme certifiée. Wave CI, Orange Money et MTN sont supportés.'],
  ['Mes données sont-elles conservées ?', 'Absolument — tous vos devis, clients et historiques sont conservés quel que soit votre plan.'],
]

function SubscriptionContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [org, setOrg]             = useState<Organization | null>(null)
  const [orgId, setOrgId]         = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName]   = useState('')
  const [loading, setLoading]     = useState(true)
  const [period, setPeriod]       = useState<'month' | 'year'>('month')
  const [openFaq, setOpenFaq]     = useState<number | null>(null)
  const [paying, setPaying]       = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const status  = searchParams.get('status')
    const oid     = searchParams.get('org_id')
    const per     = searchParams.get('period') as 'month' | 'year' | null

    if (status === 'success' && oid) {
      // ✅ Activer le plan Premium directement après retour paiement
      activatePremium(oid, per || 'month')
    } else if (status === 'cancelled') {
      setSuccessMsg('❌ Paiement annulé. Vous pouvez réessayer.')
    }

    loadData()
  }, [])

  const activatePremium = async (oid: string, per: string) => {
    setSuccessMsg('⏳ Activation de votre plan Premium en cours...')

    const now = new Date()
    const expiresAt = new Date(now)
    if (per === 'year') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    const { error } = await supabase
      .from('organizations')
      .update({
        plan:             'premium',
        plan_expires_at:  expiresAt.toISOString(),
        last_payment_at:  now.toISOString(),
      })
      .eq('id', oid)

    if (error) {
      console.error('Erreur activation premium:', error)
      setSuccessMsg('⚠️ Paiement reçu mais erreur activation. Contactez le support.')
    } else {
      setSuccessMsg('🎉 Plan Premium activé ! Devis illimités, IA avancée — tout est débloqué.')
      // Recharger les données pour afficher le nouveau plan
      await loadData()
    }
  }

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    setUserEmail(user.email || '')
    setUserName(user.user_metadata?.name || '')

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member) { router.push('/login'); return }
    setOrgId(member.organization_id)

    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', member.organization_id)
      .single()

    setOrg(orgData)
    setLoading(false)
  }

  const handlePay = async () => {
    if (org?.plan === 'premium') return
    setPaying(true)

    try {
      const amount = period === 'year' ? 7600 * 12 : 9500

      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          period,
          org_id: orgId,
          email:  userEmail,
          name:   userName,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.payment_url) {
        alert('Erreur lors de la création du paiement. Réessayez.')
        setPaying(false)
        return
      }

      window.location.href = data.payment_url

    } catch {
      alert('Erreur réseau. Réessayez.')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  const currentPrice = PLANS[period]
  const saving = (9500 - 7600) * 12

  return (
    <AppLayout org={org}>
      <div style={{ padding: '24px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Tarifs & Abonnement</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{org?.name}</p>
        </div>

        {/* Message succès / erreur */}
        {successMsg && (
          <div style={{
            background: successMsg.startsWith('🎉') ? '#ECFDF5' : successMsg.startsWith('❌') ? '#FEF2F2' : '#FFF9F6',
            border: `1.5px solid ${successMsg.startsWith('🎉') ? '#10B981' : successMsg.startsWith('❌') ? '#DC2626' : 'var(--orange)'}`,
            borderRadius: 12, padding: '16px 18px', marginBottom: 20,
            fontSize: 14, fontWeight: 600,
            color: successMsg.startsWith('🎉') ? '#065F46' : successMsg.startsWith('❌') ? '#DC2626' : 'var(--orange)',
          }}>
            {successMsg}
          </div>
        )}

        {/* Plan actuel Premium */}
        {org?.plan === 'premium' && (
          <div style={{ background: 'var(--blue)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 32 }}>⭐</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Vous êtes sur le plan Premium !</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Devis illimités, IA avancée — tout est débloqué.</div>
            </div>
          </div>
        )}

        {/* Toggle mensuel / annuel */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 30, padding: '4px 12px' }}>
            {(['month', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: period === p ? 'var(--orange)' : 'transparent', color: period === p ? '#fff' : 'var(--text-muted)', transition: 'all .2s' }}>
                {p === 'month' ? 'Mensuel' : 'Annuel'}
              </button>
            ))}
            <span style={{ background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>-20% 🎁</span>
          </div>
          {period === 'year' && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#059669', fontWeight: 600 }}>
              Économisez {formatAmount(saving, 'XOF')} par an !
            </div>
          )}
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 24 }}>

          {/* Gratuit */}
          <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 18, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>PLAN GRATUIT</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--blue)', marginBottom: 2 }}>0 <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>FCFA</span></div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>Pour toujours</div>
            <div style={{ width: '100%', padding: '10px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: 'transparent', color: 'var(--blue)', border: '2px solid var(--blue)', textAlign: 'center', marginBottom: 16 }}>
              {org?.plan === 'free' ? '✅ Votre plan actuel' : 'Plan gratuit'}
            </div>
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />
            {FEATURES_FREE.map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, opacity: f.ok ? 1 : 0.4 }}>
                <span style={{ fontSize: 13 }}>{f.ok ? '✅' : '❌'}</span>
                <span style={{ fontSize: 13 }}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Premium */}
          <div style={{ background: 'var(--blue)', border: '2px solid var(--orange)', borderRadius: 18, padding: 22, boxShadow: '0 8px 32px rgba(30,58,95,.25)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--orange)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 14px', borderBottomLeftRadius: 12 }}>⭐ POPULAIRE</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>PLAN PREMIUM</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
              {new Intl.NumberFormat('fr-FR').format(currentPrice.price)} <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>FCFA</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: period === 'year' ? 4 : 16 }}>{currentPrice.label}</div>
            {period === 'year' && <div style={{ color: 'var(--orange)', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Économisez {formatAmount(saving, 'XOF')} 🎁</div>}

            <button onClick={handlePay} disabled={paying || org?.plan === 'premium'}
              style={{ width: '100%', padding: '11px', borderRadius: 9, fontSize: 13, fontWeight: 800, background: org?.plan === 'premium' ? 'rgba(255,255,255,0.2)' : 'var(--orange)', color: '#fff', border: 'none', cursor: paying || org?.plan === 'premium' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {paying ? (
                <><div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Redirection...</>
              ) : org?.plan === 'premium' ? '✅ Plan actuel' : `Passer Premium → ${formatAmount(period === 'year' ? 7600 * 12 : 9500, 'XOF')}`}
            </button>

            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
              💙 Wave CI &nbsp;·&nbsp; 🟠 Orange Money &nbsp;·&nbsp; 🟡 MTN MoMo &nbsp;·&nbsp; 💳 Carte bancaire
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', marginBottom: 12 }} />
            {FEATURES_PREMIUM.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--orange)' }}>⭐</span>
                <span style={{ fontSize: 13, color: '#fff' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sécurité */}
        <div style={{ background: '#F0F7FF', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 10 }}>
          🔒 Paiements sécurisés via <strong>FedaPay</strong> — plateforme certifiée pour l'Afrique de l'Ouest.
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--blue)', marginBottom: 14 }}>Questions fréquentes</h3>
          {FAQS.map(([q, a], i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 11, marginBottom: 7, overflow: 'hidden' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', background: '#fff', fontWeight: 600, fontSize: 13, color: 'var(--blue)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                {q}
                <span style={{ fontSize: 18, color: 'var(--orange)', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .2s' }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 15px 13px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, background: '#FAFAFA' }}>{a}</div>
              )}
            </div>
          ))}
        </div>

        {/* Garantie */}
        <div style={{ background: 'linear-gradient(135deg, var(--orange) 0%, #FF8C5A 100%)', borderRadius: 18, padding: '24px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
          <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 17, marginBottom: 7 }}>Satisfait ou remboursé 7 jours</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 18 }}>Essayez Premium sans risque.</p>
          <button onClick={handlePay} disabled={paying || org?.plan === 'premium'}
            style={{ background: '#fff', color: 'var(--orange)', fontWeight: 800, fontSize: 14, padding: '12px 26px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {org?.plan === 'premium' ? '✅ Déjà Premium' : 'Essayer Premium maintenant →'}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  )
}