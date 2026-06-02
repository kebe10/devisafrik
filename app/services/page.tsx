// app/services/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatAmount } from '@/lib/supabase'
import type { Organization } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout'

interface Service {
  id:              string
  organization_id: string
  name:            string
  description:     string
  unit_price:      number
  unit:            string
  category:        string
}

const UNITS      = ['forfait', 'unité', 'heure', 'jour', 'm²', 'ml', 'kg']
const CATEGORIES = ['Tous', 'Main d\'œuvre', 'Matériaux', 'Transport', 'Conseil', 'Autre']

export default function ServicesPage() {
  const router = useRouter()
  const [org, setOrg]             = useState<Organization | null>(null)
  const [orgId, setOrgId]         = useState('')
  const [services, setServices]   = useState<Service[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('Tous')
  const [adding, setAdding]       = useState(false)
  const [editing, setEditing]     = useState<Service | null>(null)
  const [saving, setSaving]       = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', unit_price: 0, unit: 'forfait', category: 'Main d\'œuvre',
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
      .from('organizations').select('*').eq('id', member.organization_id).single()

    setOrg(orgData)
    await loadServices(member.organization_id)
    setLoading(false)
  }

  const loadServices = async (oid: string) => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('organization_id', oid)
      .order('name')
    setServices(data || [])
  }

  const resetForm = () => setForm({ name: '', description: '', unit_price: 0, unit: 'forfait', category: 'Main d\'œuvre' })

  const saveService = async () => {
    if (!form.name.trim()) return
    setSaving(true)

    if (editing) {
      const { error } = await supabase
        .from('services')
        .update({ ...form, unit_price: Number(form.unit_price) })
        .eq('id', editing.id)

      if (!error) {
        setServices(prev => prev.map(s => s.id === editing.id ? { ...s, ...form, unit_price: Number(form.unit_price) } : s))
        setEditing(null)
        resetForm()
      }
    } else {
      const { data, error } = await supabase
        .from('services')
        .insert({ organization_id: orgId, ...form, unit_price: Number(form.unit_price) })
        .select().single()

      if (!error && data) {
        setServices(prev => [data, ...prev])
        setAdding(false)
        resetForm()
      }
    }
    setSaving(false)
  }

  const deleteService = async (id: string) => {
    if (!confirm('Supprimer ce service ?')) return
    await supabase.from('services').delete().eq('id', id)
    setServices(prev => prev.filter(s => s.id !== id))
  }

  const startEdit = (s: Service) => {
    setEditing(s)
    setForm({ name: s.name, description: s.description, unit_price: s.unit_price, unit: s.unit, category: s.category })
    setAdding(false)
  }

  const cancelForm = () => {
    setAdding(false)
    setEditing(null)
    resetForm()
  }

  const filtered = services.filter(s => {
    const matchSearch   = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'Tous' || s.category === category
    return matchSearch && matchCategory
  })

  const currency = org?.default_currency || 'XOF'

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
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Catalogue de services</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{services.length} service{services.length > 1 ? 's' : ''} enregistré{services.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { setAdding(true); setEditing(null); resetForm() }}
            style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            ➕ Nouveau service
          </button>
        </div>

        {/* Formulaire ajout/édition */}
        {(adding || editing) && (
          <div style={{ background: '#fff', border: `1.5px solid ${editing ? 'var(--blue)' : 'var(--orange)'}`, borderRadius: 16, padding: 20, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: editing ? 'var(--blue)' : 'var(--orange)' }}>
              {editing ? '✏️ Modifier le service' : '➕ Ajouter un service'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Nom du service *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Installation prise électrique" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Détails de la prestation..." rows={2} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Prix unitaire</label>
                <input type="number" min="0" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Unité</label>
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Catégorie</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.filter(c => c !== 'Tous').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={saveService} disabled={saving}
                style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                {saving ? '⏳...' : editing ? '✅ Enregistrer' : '➕ Ajouter'}
              </button>
              <button onClick={cancelForm}
                style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-muted)', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: '1.5px solid var(--border)' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input placeholder="🔍 Rechercher un service..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ minWidth: 160 }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛠️</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {services.length === 0 ? 'Aucun service enregistré' : 'Aucun résultat'}
            </div>
            {services.length === 0 && (
              <button onClick={() => setAdding(true)}
                style={{ padding: '10px 20px', background: 'var(--orange)', color: '#fff', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Ajouter mon premier service
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map(s => (
              <div key={s.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
                {/* Catégorie badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ background: '#F0F4FF', color: 'var(--blue)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                    {s.category || 'Autre'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => startEdit(s)}
                      style={{ background: '#F0F4FF', border: 'none', color: 'var(--blue)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>
                      ✏️
                    </button>
                    <button onClick={() => deleteService(s.id)}
                      style={{ background: '#FEF2F2', border: 'none', color: '#DC2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>
                      🗑️
                    </button>
                  </div>
                </div>

                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.name}</div>
                {s.description && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>{s.description}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--orange)' }}>
                    {formatAmount(s.unit_price, currency)}
                  </span>
                  <span style={{ background: '#F8F9FA', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                    par {s.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}