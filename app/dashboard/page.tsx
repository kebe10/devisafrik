// app/dashboard/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatAmount, QUOTE_STATUSES } from '@/lib/supabase'
import type { Quote, Organization } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout'

interface Stats {
  total: number; revenue: number; sent: number
  pending: number; accepted: number; paid: number
}

type QuoteWithClient = Quote & {
  client: { name: string; phone?: string } | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [org, setOrg]       = useState<Organization | null>(null)
  const [quotes, setQuotes] = useState<QuoteWithClient[]>([])
  const [stats, setStats]   = useState<Stats>({ total: 0, revenue: 0, sent: 0, pending: 0, accepted: 0, paid: 0 })
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
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

      const { data: allQuotes } = await supabase
        .from('quotes')
        .select('id, status, total')
        .eq('organization_id', member.organization_id)

      const all = allQuotes || []
      setStats({
        total:    all.length,
        revenue:  all.filter(q => q.status === 'paid').reduce((s, q) => s + (q.total || 0), 0),
        sent:     all.filter(q => q.status === 'sent').length,
        pending:  all.filter(q => ['sent', 'accepted'].includes(q.status)).length,
        accepted: all.filter(q => q.status === 'accepted').length,
        paid:     all.filter(q => q.status === 'paid').length,
      })

      const { data: quotesData } = await supabase
        .from('quotes')
        .select('*, client:clients(name, phone)')
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false })
        .limit(5)

      setQuotes(quotesData || [])
    } catch (err) {
      console.error('Erreur dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Chargement...</div>
        </div>
      </div>
    )
  }

  const currency = org?.default_currency || 'XOF'

  return (
    <AppLayout org={org}>
      <div style={{ padding: '24px 20px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Tableau de bord</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{org?.name}</p>
          </div>
          <button onClick={() => router.push('/quotes/new')}
            style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            ➕ Nouveau devis
          </button>
        </div>

        {/* CTA bannière */}
        <div style={{
          background: 'linear-gradient(135deg, var(--orange) 0%, #FF8C5A 100%)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: 3 }}>Créer un nouveau devis</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Professionnel en moins de 60 secondes</div>
          </div>
          <button onClick={() => router.push('/quotes/new')}
            style={{ padding: '11px 22px', background: '#fff', color: 'var(--orange)', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            ➕ Créer un devis
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total devis',       value: stats.total,                        icon: '📄', color: 'var(--orange)' },
            { label: 'Revenus encaissés', value: formatAmount(stats.revenue, currency), icon: '💰', color: '#10B981' },
            { label: 'Devis acceptés',    value: stats.accepted,                     icon: '✅', color: '#059669' },
            { label: 'Devis payés',       value: stats.paid,                         icon: '💵', color: 'var(--blue)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '14px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</span>
                <span style={{ fontSize: 18, background: stat.color + '18', padding: '4px 6px', borderRadius: 7 }}>{stat.icon}</span>
              </div>
              <div style={{ fontSize: typeof stat.value === 'number' ? 22 : 14, fontWeight: 700 }}>
                {String(stat.value ?? 0)}
              </div>
            </div>
          ))}
        </div>

        {/* Plan gratuit */}
        {org?.plan === 'free' && (
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Devis ce mois-ci (plan gratuit)</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: stats.total >= 3 ? '#DC2626' : 'var(--orange)' }}>
                {Math.min(stats.total, 3)} / 3
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((stats.total / 3) * 100, 100)}%`, background: stats.total >= 3 ? '#DC2626' : 'var(--orange)', borderRadius: 3, transition: 'width .3s' }} />
            </div>
            {stats.total >= 3 && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#DC2626' }}>⚠️ Limite atteinte</span>
                <button onClick={() => router.push('/subscription')}
                  style={{ padding: '5px 14px', background: 'var(--orange)', color: '#fff', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Passer Premium →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Devis récents */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Devis récents</div>
            <button onClick={() => router.push('/quotes')}
              style={{ fontSize: 13, color: 'var(--orange)', fontWeight: 600, background: 'none', cursor: 'pointer', border: 'none' }}>
              Voir tout ({stats.total}) →
            </button>
          </div>

          {quotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Aucun devis pour l'instant</div>
              <button onClick={() => router.push('/quotes/new')}
                style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Créer mon premier devis
              </button>
            </div>
          ) : (
            quotes.map((q, i) => {
              const st = QUOTE_STATUSES[q.status as keyof typeof QUOTE_STATUSES] || QUOTE_STATUSES.draft
              return (
                <div key={q.id} onClick={() => router.push(`/quotes/${q.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0', borderBottom: i < quotes.length - 1 ? '1px solid var(--border)' : 'none',
                    flexWrap: 'wrap', gap: 10, cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.title || 'Sans titre'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {q.client?.name || '—'} · {q.quote_number}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: st?.color, background: st?.bg }}>
                      {st?.label || q.status}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--blue)' }}>
                      {formatAmount(q.total, currency)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </AppLayout>
  )
}