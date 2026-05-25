// app/subscription/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatAmount } from '@/lib/supabase'
import type { Organization } from '@/lib/supabase'
import AppLayout from '../../components/AppLayout'

const PLANS = {
  month: { price: 9500, label: '/mois' },
  year:  { price: 7600, label: '/mois (annuel)' },
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

const METHODS = [
  { id: 'wave',     label: 'Wave CI',      emoji: '💙', color: '#1B8EF2', note: 'Recommandé · Instantané' },
  { id: 'orange',   label: 'Orange Money', emoji: '🟠', color: '#FF7900', note: 'Disponible partout' },
  { id: 'mtn',      label: 'MTN MoMo',     emoji: '🟡', color: '#FFCC00', note: 'CI · Cameroun' },
  { id: 'cinetpay', label: 'CinetPay',     emoji: '🔵', color: '#0066CC', note: 'Multi-pays FCFA' },
]

const FAQS = [
  ['Puis-je annuler à tout moment ?', "Oui, depuis votre compte. Le Premium reste actif jusqu'à la fin de la période payée."],
  ['Que se passe-t-il si je dépasse 3 devis ?', 'Vous serez invité à passer en Premium. Vos devis existants restent accessibles.'],
  ['Le paiement est-il sécurisé ?', 'Oui. Wave, Orange Money et CinetPay sont des plateformes certifiées. Aucune carte bancaire internationale requise.'],
  ['Mes données sont-elles conservées ?', 'Absolument — tous vos devis, clients et historiques sont conservés quel que soit votre plan.'],
]

export default function SubscriptionPage() {
  const router = useRouter()
  const [org, setOrg]         = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState<'month' | 'year'>('month')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [modal, setModal]     = useState<'choix' | 'paying' | 'success' | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member) { router.push('/login'); return }

    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', member.organization_id)
      .single()

    setOrg(orgData)
    setLoading(false)
  }

  const startPay = async (methodId: string) => {
    setModal('paying')
    await new Promise(r => setTimeout(r, 2200))
    setModal('success')
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
            <button onClick={() => setModal('choix')}
              style={{ width: '100%', padding: '11px', borderRadius: 9, fontSize: 13, fontWeight: 800, background: 'var(--orange)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>
              {org?.plan === 'premium' ? '✅ Plan actuel' : 'Passer Premium →'}
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', marginBottom: 12 }} />
            {FEATURES_PREMIUM.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--orange)' }}>⭐</span>
                <span style={{ fontSize: 13, color: '#fff' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Méthodes de paiement */}
        <div style={{ background: '#F0F7FF', borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--blue)' }}>🌍 Méthodes de paiement acceptées</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 10 }}>
            {METHODS.map(m => (
              <div key={m.id}
                style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px', textAlign: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = m.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{m.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--blue)' }}>{m.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{m.note}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: '9px 12px', fontSize: 11, color: 'var(--blue)' }}>
            🔒 Paiements sécurisés. Aucune carte bancaire internationale requise.
          </div>
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
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 18 }}>Essayez Premium sans risque. Remboursement intégral si vous n'êtes pas satisfait.</p>
          <button onClick={() => setModal('choix')}
            style={{ background: '#fff', color: 'var(--orange)', fontWeight: 800, fontSize: 14, padding: '12px 26px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Essayer Premium maintenant →
          </button>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={e => { if (e.target === e.currentTarget && modal !== 'paying') setModal(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            {modal === 'choix' && (
              <>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--blue)', marginBottom: 4 }}>Passer en Premium ⭐</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>{formatAmount(currentPrice.price, 'XOF')} {currentPrice.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 9 }}>Choisissez votre méthode :</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {METHODS.map(m => (
                    <button key={m.id} onClick={() => startPay(m.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 9, border: '2px solid var(--border)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.background = m.color + '12' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#fff' }}>
                      <span style={{ fontSize: 20 }}>{m.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--blue)' }}>{m.label}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{m.note}</div>
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>→</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setModal(null)}
                  style={{ width: '100%', padding: '10px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
                  Annuler
                </button>
              </>
            )}

            {modal === 'paying' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 44, height: 44, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--blue)', marginBottom: 6 }}>Redirection en cours...</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Montant : {formatAmount(currentPrice.price, 'XOF')}</div>
              </div>
            )}

            {modal === 'success' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#059669', marginBottom: 7 }}>Paiement réussi !</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                  Votre plan <strong>Premium ⭐</strong> est activé.<br />Devis illimités, IA avancée — tout est débloqué.
                </div>
                <button onClick={() => { setModal(null); router.push('/dashboard') }}
                  style={{ width: '100%', padding: '12px', background: 'var(--orange)', color: '#fff', borderRadius: 10, fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Accéder à mon compte →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}