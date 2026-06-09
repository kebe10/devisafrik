// app/quotes/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatAmount, QUOTE_STATUSES } from '@/lib/supabase'
import type { Quote, Organization } from '@/lib/supabase'
import AppLayout from '../../components/AppLayout'

export default function QuotesPage() {
  const router = useRouter()
  const [org, setOrg]       = useState<Organization | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [orgId, setOrgId]       = useState('')
  const [duplicating, setDuplicating]   = useState<string | null>(null)
  const [quotaExceeded, setQuotaExceeded] = useState(false) // ✅ modale quota

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
    setOrgId(member.organization_id)

    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', member.organization_id)
      .single()

    setOrg(orgData)
    await loadQuotes(member.organization_id, '', 'all')
    setLoading(false)
  }

  const loadQuotes = async (oid: string, s: string, status: string) => {
    let query = supabase
      .from('quotes')
      .select('*, client:clients(name, phone, whatsapp_number)')
      .eq('organization_id', oid)
      .order('created_at', { ascending: false })

    if (status !== 'all') query = query.eq('status', status)
    if (s) query = query.ilike('title', `%${s}%`)

    const { data } = await query
    setQuotes(data || [])
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    if (orgId) loadQuotes(orgId, val, filterStatus)
  }

  const handleFilter = (val: string) => {
    setFilterStatus(val)
    if (orgId) loadQuotes(orgId, search, val)
  }

  const deleteQuote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Supprimer ce devis ?')) return
    await supabase.from('quotes').delete().eq('id', id)
    setQuotes(prev => prev.filter(q => q.id !== id))
  }

  // ✅ Duplication passe par /api/quotes pour vérifier le quota
  const duplicateQuote = async (q: Quote, e: React.MouseEvent) => {
    e.stopPropagation()
    if (duplicating) return
    setDuplicating(q.id)

    try {
      // 1. Récupérer les items du devis original
      const { data: items } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', q.id)
        .order('sort_order')

      // 2. Créer le nouveau devis via l'API (quota vérifié côté serveur)
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: q.organization_id,
          client_id:       q.client_id || null,
          title:           (q.title || 'Devis') + ' (copie)',
          status:          'draft',
          tax_rate:        q.tax_rate,
          discount_amount: q.discount_amount,
          payment_terms:   q.payment_terms,
          validity_days:   q.validity_days,
          notes:           q.notes,
          items: (items || []).map(i => ({
            description: i.description,
            quantity:    i.quantity,
            unit:        i.unit,
            unit_price:  i.unit_price,
          })),
        }),
      })

      const data = await res.json()

      // ✅ Quota dépassé → modale Premium
      if (res.status === 403 && data.error === 'QUOTA_EXCEEDED') {
        setQuotaExceeded(true)
        setDuplicating(null)
        return
      }

      if (!res.ok) {
        alert(data.error || 'Erreur lors de la duplication.')
        setDuplicating(null)
        return
      }

      // 3. Recharger la liste pour afficher le nouveau devis
      await loadQuotes(orgId, search, filterStatus)

    } catch {
      alert('Erreur réseau. Réessayez.')
    }
    setDuplicating(null)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  return (
    <AppLayout org={org}>
      <div style={{ padding: '24px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Mes devis</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{quotes.length} devis au total</p>
          </div>
          <button onClick={() => router.push('/quotes/new')}
            style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            ➕ Nouveau devis
          </button>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <input
            placeholder="🔍 Rechercher un devis..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select value={filterStatus} onChange={e => handleFilter(e.target.value)} style={{ width: 'auto', minWidth: 150 }}>
            <option value="all">Tous les statuts</option>
            {Object.entries(QUOTE_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Liste */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {quotes.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Aucun devis trouvé</div>
              <button onClick={() => router.push('/quotes/new')}
                style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Créer mon premier devis
              </button>
            </div>
          ) : (
            quotes.map((q, i) => {
              const st = QUOTE_STATUSES[q.status as keyof typeof QUOTE_STATUSES] || QUOTE_STATUSES.draft
              const isDuplicating = duplicating === q.id
              return (
                <div key={q.id} onClick={() => router.push(`/quotes/${q.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '14px 20px',
                    borderBottom: i < quotes.length - 1 ? '1px solid var(--border)' : 'none',
                    gap: 12, cursor: 'pointer', transition: 'background 0.1s',
                    flexWrap: 'wrap',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.title || 'Sans titre'}
                      </span>
                      <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, flexShrink: 0 }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {(q.client as any)?.name || '—'} · {q.quote_number} · {new Date(q.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--blue)' }}>
                      {formatAmount(q.total, org?.default_currency || 'XOF')}
                    </span>
                    <button onClick={e => duplicateQuote(q, e)} disabled={!!isDuplicating}
                      style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#F3F4F6', color: 'var(--text-muted)', cursor: isDuplicating ? 'wait' : 'pointer' }}>
                      {isDuplicating ? '⏳' : 'Dupliquer'}
                    </button>
                    <button onClick={e => deleteQuote(q.id, e)}
                      style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>
                      ✕
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Modale quota dépassé ── */}
      {quotaExceeded && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🚫</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--blue)', marginBottom: 8 }}>
              Limite atteinte
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Vous avez atteint la limite de <strong>3 devis par mois</strong> du plan gratuit.<br />
              Passez en Premium pour créer des devis illimités.
            </div>
            <button
              onClick={() => router.push('/subscription')}
              style={{ width: '100%', padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: 'var(--orange)', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: 10 }}>
              ⭐ Passer Premium →
            </button>
            <button
              onClick={() => setQuotaExceeded(false)}
              style={{ width: '100%', padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'transparent', color: 'var(--text-muted)', border: '1.5px solid var(--border)', cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        </div>
      )}

    </AppLayout>
  )
}