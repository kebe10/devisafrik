// app/dashboard/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatAmount, QUOTE_STATUSES } from '@/lib/supabase'
import type { Quote, Organization } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface Stats {
  total: number; revenue: number; sent: number
  pending: number; accepted: number; paid: number
}

type QuoteWithClient = Quote & {
  client: { name: string; phone?: string } | null
}

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const PIE_COLORS = ['#FF6B35', '#1E3A5F', '#10B981', '#F59E0B', '#8B5CF6']

const PERIODS = [
  { label: '3 mois',  value: 3  },
  { label: '6 mois',  value: 6  },
  { label: '12 mois', value: 12 },
]

// ── Bloc affiché à la place des stats avancées pour les non-premium ──
function PremiumStatsBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div style={{
      background: '#fff',
      border: '1.5px dashed #F59E0B',
      borderRadius: 16,
      padding: '36px 24px',
      marginBottom: 22,
      textAlign: 'center',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Aperçu flou des graphiques */}
      <div style={{ position: 'relative', marginBottom: 24, pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ filter: 'blur(6px)', opacity: 0.35, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {/* Faux graphique bars */}
          <div style={{ background: '#F8F9FA', borderRadius: 12, padding: 16, height: 120, display: 'flex', alignItems: 'flex-end', gap: 6, justifyContent: 'center' }}>
            {[40, 70, 50, 90, 60, 80].map((h, i) => (
              <div key={i} style={{ width: 18, height: `${h}%`, background: '#FF6B35', borderRadius: '4px 4px 0 0', opacity: 0.7 }} />
            ))}
          </div>
          {/* Faux graphique pie */}
          <div style={{ background: '#F8F9FA', borderRadius: 12, padding: 16, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'conic-gradient(#FF6B35 0% 35%, #1E3A5F 35% 60%, #10B981 60% 80%, #F59E0B 80% 100%)' }} />
          </div>
        </div>
        {/* Overlay dégradé */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.85) 100%)', borderRadius: 12 }} />
      </div>

      <div style={{ fontSize: 28, marginBottom: 10 }}>⭐</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#92400E', marginBottom: 6 }}>
        Fonctionnalité Premium
      </div>
      <div style={{ fontSize: 13, color: '#B45309', marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>
        Passez en Premium pour accéder aux statistiques avancées : revenus par mois, évolution des devis, top clients et répartition par statut.
      </div>
      <button
        onClick={onUpgrade}
        style={{
          padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
          background: '#F59E0B', color: '#fff', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
        }}>
        Passer Premium →
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [org, setOrg]             = useState<Organization | null>(null)
  const [quotes, setQuotes]       = useState<QuoteWithClient[]>([])
  const [allQuotes, setAllQuotes] = useState<any[]>([])
  const [stats, setStats]         = useState<Stats>({ total: 0, revenue: 0, sent: 0, pending: 0, accepted: 0, paid: 0 })
  const [loading, setLoading]     = useState(true)
  const [period, setPeriod]       = useState(6)

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

      const { data: quotesAll } = await supabase
        .from('quotes')
        .select('id, status, total, created_at, client:clients(name)')
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false })

      const all = quotesAll || []
      setAllQuotes(all)
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

  const revenueByMonth = () => {
    const now = new Date()
    const result = []
    for (let i = period - 1; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = d.getMonth()
      const year  = d.getFullYear()
      const monthQuotes = allQuotes.filter(q => {
        const qd = new Date(q.created_at)
        return qd.getMonth() === month && qd.getFullYear() === year
      })
      result.push({
        name:    MONTHS[month],
        revenus: monthQuotes.filter(q => q.status === 'paid').reduce((s, q) => s + (q.total || 0), 0),
        devis:   monthQuotes.length,
      })
    }
    return result
  }

  const quotesByStatus = () => {
    const statusLabels: Record<string, string> = {
      draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', paid: 'Payé', cancelled: 'Annulé',
    }
    const counts: Record<string, number> = {}
    allQuotes.forEach(q => { counts[q.status] = (counts[q.status] || 0) + 1 })
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: statusLabels[k] || k, value: v }))
  }

  const topClients = () => {
    const clientRevenue: Record<string, number> = {}
    allQuotes
      .filter(q => q.status === 'paid' && q.client?.name)
      .forEach(q => {
        const name = q.client.name
        clientRevenue[name] = (clientRevenue[name] || 0) + (q.total || 0)
      })
    return Object.entries(clientRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, total]) => ({ name: name.length > 14 ? name.substring(0, 12) + '…' : name, total }))
  }

  const currency    = org?.default_currency || 'XOF'
  const isPremium   = org?.plan === 'premium'
  const monthlyData = revenueByMonth()
  const statusData  = quotesByStatus()
  const clientData  = topClients()

  const fmtYAxis = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
    if (v >= 1000)    return (v / 1000).toFixed(0) + 'k'
    return String(v)
  }

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
        <div style={{ background: 'linear-gradient(135deg, var(--orange) 0%, #FF8C5A 100%)', borderRadius: 16, padding: '20px 24px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, marginBottom: 3 }}>Créer un nouveau devis</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Professionnel en moins de 60 secondes</div>
          </div>
          <button onClick={() => router.push('/quotes/new')}
            style={{ padding: '11px 22px', background: '#fff', color: 'var(--orange)', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            ➕ Créer un devis
          </button>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total devis',       value: stats.total,                          icon: '📄', color: 'var(--orange)' },
            { label: 'Revenus encaissés', value: formatAmount(stats.revenue, currency), icon: '💰', color: '#10B981' },
            { label: 'Devis acceptés',    value: stats.accepted,                       icon: '✅', color: '#059669' },
            { label: 'Devis payés',       value: stats.paid,                           icon: '💵', color: 'var(--blue)' },
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

        {/* Plan gratuit — barre de progression */}
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

        {/* ── STATISTIQUES AVANCÉES ── */}
        {/* Toujours afficher le titre de la section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--blue)' }}>📊 Statistiques</div>
          {isPremium && (
            <div style={{ display: 'flex', gap: 6 }}>
              {PERIODS.map(p => (
                <button key={p.value} onClick={() => setPeriod(p.value)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: period === p.value ? 'var(--blue)' : '#fff',
                    color: period === p.value ? '#fff' : 'var(--text-muted)',
                    border: period === p.value ? '1px solid var(--blue)' : '1px solid var(--border)',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bloc premium ou graphiques */}
        {!isPremium ? (
          <PremiumStatsBanner onUpgrade={() => router.push('/subscription')} />
        ) : allQuotes.length > 0 ? (
          <>
            {/* Graphique 1 — Revenus par mois */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--blue)' }}>💰 Revenus encaissés par mois</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtYAxis} tick={{ fontSize: 11 }} width={45} />
                  <Tooltip
                    formatter={(value: any) => [formatAmount(Number(value), currency), 'Revenus']}
                    contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  />
                  <Bar dataKey="revenus" fill="#FF6B35" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique 2 — Évolution du nombre de devis */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--blue)' }}>📈 Évolution du nombre de devis</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={35} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any) => [value, 'Devis créés']}
                    contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="devis" stroke="#1E3A5F" strokeWidth={2.5} dot={{ fill: '#1E3A5F', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Graphiques 3 & 4 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 22 }}>

              {/* Graphique 3 — Devis par statut */}
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--blue)' }}>🥧 Devis par statut</div>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%" cy="45%"
                        innerRadius={55} outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        label={false}
                      >
                        {statusData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>Pas encore de données</div>
                )}
              </div>

              {/* Graphique 4 — Top clients */}
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--blue)' }}>🏆 Top clients (revenus)</div>
                {clientData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={clientData} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                      <XAxis type="number" tickFormatter={fmtYAxis} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip
                        formatter={(value: any) => [formatAmount(Number(value), currency), 'Revenus']}
                        contentStyle={{ borderRadius: 10, fontSize: 12 }}
                      />
                      <Bar dataKey="total" fill="#10B981" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
                    Aucun devis payé pour l'instant
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '32px 20px', marginBottom: 22, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Créez vos premiers devis pour voir apparaître vos statistiques.
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
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < quotes.length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap', gap: 10, cursor: 'pointer' }}
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