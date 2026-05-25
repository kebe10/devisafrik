// app/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Organization } from '@/lib/supabase'
import AppLayout from '../../components/AppLayout'

export default function SettingsPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [orgId, setOrgId]     = useState('')
  const [org, setOrg]         = useState<Organization | null>(null)
  const [form, setForm] = useState({
    name:                  '',
    email:                 '',
    phone:                 '',
    whatsapp_number:       '',
    address:               '',
    rccm:                  '',
    tax_number:            '',
    default_tax_rate:      18,
    default_payment_terms: 'Paiement à la livraison',
    default_currency:      'XOF',
    devis_color:           '#FF6B35',
    devis_footer:          '',
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

    if (orgData) {
      setForm({
        name:                  orgData.name || '',
        email:                 orgData.email || '',
        phone:                 orgData.phone || '',
        whatsapp_number:       orgData.whatsapp_number || '',
        address:               orgData.address || '',
        rccm:                  orgData.rccm || '',
        tax_number:            orgData.tax_number || '',
        default_tax_rate:      orgData.default_tax_rate || 18,
        default_payment_terms: orgData.default_payment_terms || 'Paiement à la livraison',
        default_currency:      orgData.default_currency || 'XOF',
        devis_color:           orgData.devis_color || '#FF6B35',
        devis_footer:          orgData.devis_footer || '',
      })
    }
    setLoading(false)
  }

  const saveSettings = async () => {
    if (!form.name.trim()) { alert("Le nom de l'entreprise est obligatoire."); return }
    setSaving(true)

    const { error } = await supabase
      .from('organizations')
      .update({
        name:                  form.name.trim(),
        email:                 form.email.trim() || null,
        phone:                 form.phone.trim() || null,
        whatsapp_number:       form.whatsapp_number.trim() || null,
        address:               form.address.trim() || null,
        rccm:                  form.rccm.trim() || null,
        tax_number:            form.tax_number.trim() || null,
        default_tax_rate:      Number(form.default_tax_rate) || 18,
        default_payment_terms: form.default_payment_terms.trim() || 'Paiement à la livraison',
        default_currency:      form.default_currency,
        devis_color:           form.devis_color,
        devis_footer:          form.devis_footer.trim() || null,
      })
      .eq('id', orgId)

    setSaving(false)
    if (error) { alert('Erreur lors de la sauvegarde. Réessayez.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }

  return (
    <AppLayout org={org}>
      <div style={{ padding: '24px 20px', maxWidth: 740 }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Paramètres</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>Informations de votre entreprise</p>
        </div>

        {/* Entreprise */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 22, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: 'var(--blue)' }}>🏢 Informations entreprise</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div><label style={lbl}>Nom de l'entreprise *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Électricité Pro Abidjan" /></div>
            <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@entreprise.ci" /></div>
            <div><label style={lbl}>Téléphone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+225 07 00 11 22" /></div>
            <div><label style={lbl}>Numéro WhatsApp</label><input value={form.whatsapp_number} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="+22507001122" /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Adresse</label><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Rue, quartier, ville" /></div>
            <div><label style={lbl}>RCCM / Registre</label><input value={form.rccm} onChange={e => setForm(f => ({ ...f, rccm: e.target.value }))} placeholder="CI-ABJ-2024-B-00000" /></div>
            <div><label style={lbl}>NIF / N° Fiscal</label><input value={form.tax_number} onChange={e => setForm(f => ({ ...f, tax_number: e.target.value }))} placeholder="0000000000" /></div>
          </div>
        </div>

        {/* Devis */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 22, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: 'var(--blue)' }}>📄 Paramètres des devis</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={lbl}>TVA par défaut (%)</label>
              <input type="number" min="0" max="30" value={form.default_tax_rate} onChange={e => setForm(f => ({ ...f, default_tax_rate: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={lbl}>Devise par défaut</label>
              <select value={form.default_currency} onChange={e => setForm(f => ({ ...f, default_currency: e.target.value }))}>
                <option value="XOF">FCFA (XOF) — Afrique de l'Ouest</option>
                <option value="XAF">FCFA (XAF) — Afrique Centrale</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="USD">Dollar (USD)</option>
                <option value="GHS">Cedi ghanéen (GHS)</option>
                <option value="NGN">Naira nigérian (NGN)</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Conditions de paiement par défaut</label>
              <input value={form.default_payment_terms} onChange={e => setForm(f => ({ ...f, default_payment_terms: e.target.value }))} placeholder="Ex: Paiement à la livraison" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Pied de page des devis PDF</label>
              <textarea value={form.devis_footer} onChange={e => setForm(f => ({ ...f, devis_footer: e.target.value }))} placeholder="Ex: Merci de votre confiance. Devis valable 30 jours." rows={2} style={{ resize: 'vertical' }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Ce texte apparaîtra en bas de chaque PDF généré.</div>
            </div>
          </div>

          {/* Couleur */}
          <div style={{ marginTop: 16 }}>
            <label style={lbl}>Couleur principale des devis PDF</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <input type="color" value={form.devis_color} onChange={e => setForm(f => ({ ...f, devis_color: e.target.value }))}
                style={{ width: 52, height: 40, padding: 4, cursor: 'pointer', borderRadius: 8, border: '1.5px solid var(--border)' }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['#FF6B35', '#1E3A5F', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#0EA5E9', '#EC4899'].map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, devis_color: c }))}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.devis_color === c ? '3px solid var(--text)' : '2px solid rgba(0,0,0,0.1)' }} />
                ))}
              </div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 40, height: 16, borderRadius: 4, background: form.devis_color }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aperçu : {form.devis_color}</span>
            </div>
          </div>
        </div>

        {saved && (
          <div style={{ background: '#ECFDF5', color: '#059669', padding: '12px 16px', borderRadius: 10, marginBottom: 14, fontSize: 14, fontWeight: 600 }}>
            ✅ Paramètres sauvegardés avec succès !
          </div>
        )}
        <button onClick={saveSettings} disabled={saving}
          style={{ padding: '13px 28px', background: saving ? '#ccc' : 'var(--orange)', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? '⏳ Sauvegarde en cours...' : '✅ Enregistrer les modifications'}
        </button>
      </div>
    </AppLayout>
  )
}