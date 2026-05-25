// app/clients/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Client, Organization } from '@/lib/supabase'
import AppLayout from '../../components/AppLayout'

export default function ClientsPage() {
  const router = useRouter()
  const [org, setOrg]         = useState<Organization | null>(null)
  const [orgId, setOrgId]     = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [adding, setAdding]   = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    name: '', company_name: '', phone: '',
    whatsapp_number: '', email: '', address: '',
  })

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
    await loadClients(member.organization_id, '')
    setLoading(false)
  }

  const loadClients = async (oid: string, s: string) => {
    let query = supabase
      .from('clients')
      .select('*')
      .eq('organization_id', oid)
      .order('name')

    if (s) query = query.ilike('name', `%${s}%`)
    const { data } = await query
    setClients(data || [])
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    if (orgId) loadClients(orgId, val)
  }

  const addClient = async () => {
    if (!form.name.trim()) return
    setSaving(true)

    const { data, error } = await supabase
      .from('clients')
      .insert({
        organization_id: orgId,
        name:            form.name,
        company_name:    form.company_name || null,
        phone:           form.phone || null,
        whatsapp_number: form.whatsapp_number || form.phone || null,
        email:           form.email || null,
        address:         form.address || null,
      })
      .select()
      .single()

    if (!error && data) {
      setClients([data, ...clients])
      setForm({ name: '', company_name: '', phone: '', whatsapp_number: '', email: '', address: '' })
      setAdding(false)
    }
    setSaving(false)
  }

  const deleteClient = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return
    await supabase.from('clients').delete().eq('id', id)
    setClients(clients.filter(c => c.id !== id))
  }

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

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
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Mes clients</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{org?.name}</p>
          </div>
          <button onClick={() => setAdding(!adding)}
            style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            ➕ Nouveau client
          </button>
        </div>

        {/* Formulaire ajout */}
        {adding && (
          <div style={{ background: '#fff', border: '1.5px solid var(--orange)', borderRadius: 16, padding: 20, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Ajouter un client</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Nom complet *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Kofi Mensah" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Entreprise</label>
                <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Nom de l'entreprise" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Téléphone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+225 07 00 00 00" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>WhatsApp</label>
                <input value={form.whatsapp_number} onChange={e => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+22507000000" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="client@email.com" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Adresse</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Quartier, ville" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={addClient} disabled={saving}
                style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {saving ? '⏳ Ajout...' : 'Ajouter'}
              </button>
              <button onClick={() => setAdding(false)}
                style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-muted)', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: '1.5px solid var(--border)' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Recherche */}
        <input
          placeholder="🔍 Rechercher un client..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        {/* Liste */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {clients.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Aucun client pour l'instant</div>
              <button onClick={() => setAdding(true)}
                style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Ajouter mon premier client
              </button>
            </div>
          ) : (
            clients.map((c, i) => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', padding: '14px 20px',
                borderBottom: i < clients.length - 1 ? '1px solid var(--border)' : 'none',
                gap: 14, flexWrap: 'wrap',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--orange)', color: '#fff',
                  fontWeight: 700, fontSize: 15, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {initials(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                    {c.company_name && `${c.company_name} · `}
                    {c.phone || c.email || '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {c.whatsapp_number && (
                    <button onClick={() => window.open(`https://wa.me/${c.whatsapp_number?.replace(/\D/g, '')}`, '_blank')}
                      style={{ padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#25D366', color: '#fff', cursor: 'pointer' }}>
                      💬
                    </button>
                  )}
                  <button onClick={() => router.push(`/quotes/new?client=${c.id}`)}
                    style={{ padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#F0F4FF', color: 'var(--blue)', cursor: 'pointer' }}>
                    📄 Devis
                  </button>
                  <button onClick={() => deleteClient(c.id)}
                    style={{ padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}