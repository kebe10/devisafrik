// app/quotes/new/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, formatAmount, QUOTE_STATUSES } from '@/lib/supabase'
import type { Client, Organization } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout'

interface Item {
  id:          number
  description: string
  quantity:    number
  unit:        string
  unit_price:  number
}

const UNITS = ['forfait', 'unité', 'heure', 'jour', 'm²', 'ml', 'kg']

export default function NewQuotePage() {
  const router = useRouter()
  const [org, setOrg]         = useState<Organization | null>(null)
  const [orgId, setOrgId]     = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [pdfReady, setPdfReady]   = useState(false)
  const [showClients, setShowClients] = useState(false)
  const [aiText, setAiText]   = useState('')
  const [saved, setSaved]     = useState(false)

  const [title, setTitle]           = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [status, setStatus]         = useState('draft')
  const [taxRate, setTaxRate]       = useState(18)
  const [discount, setDiscount]     = useState(0)
  const [paymentTerms, setPaymentTerms] = useState('Paiement à la livraison')
  const [notes, setNotes]           = useState('')
  const [items, setItems] = useState<Item[]>([
    { id: 1, description: '', quantity: 1, unit: 'forfait', unit_price: 0 }
  ])
  const [quoteNumber] = useState(() => {
    const d = new Date()
    return `DEV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${Math.floor(Math.random()*900)+100}`
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

    const [{ data: orgData }, { data: clientsData }] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', member.organization_id).single(),
      supabase.from('clients').select('*').eq('organization_id', member.organization_id).order('name'),
    ])

    setOrg(orgData)
    setClients(clientsData || [])
    if (orgData) {
      setTaxRate(orgData.default_tax_rate || 18)
      setPaymentTerms(orgData.default_payment_terms || 'Paiement à la livraison')
    }
    setLoading(false)
  }

  const currency  = org?.default_currency || 'XOF'
  const subtotal  = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total     = subtotal + taxAmount - discount

  const updateItem = (id: number, field: keyof Item, value: any) =>
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))

  const addItem = () =>
    setItems([...items, { id: Date.now(), description: '', quantity: 1, unit: 'forfait', unit_price: 0 }])

  const removeItem = (id: number) =>
    setItems(items.filter(i => i.id !== id))

  const generateAI = async () => {
    if (!aiText.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/quotes/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiText, org_id: orgId }),
      })
      const data = await res.json()
      if (res.status === 403 && data.error === 'PLAN_REQUIRED') {
        alert('⭐ Fonctionnalité Premium\n\nLa génération IA est réservée au plan Premium.')
        setAiLoading(false)
        return
      }
      if (!res.ok) { alert(data.error || 'Erreur. Réessayez.'); setAiLoading(false); return }
      if (data.title) setTitle(data.title)
      if (data.items) setItems(data.items.map((it: any, idx: number) => ({ ...it, id: Date.now() + idx })))
      if (data.notes) setNotes(data.notes)
      setAiText('')
    } catch {
      alert('Erreur réseau. Réessayez.')
    }
    setAiLoading(false)
  }

  const saveQuote = async (redirect = true) => {
    if (!orgId) return
    setSaving(true)
    try {
      const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
          organization_id: orgId,
          client_id:       selectedClient?.id || null,
          quote_number:    quoteNumber,
          title:           title || 'Nouveau devis',
          status, tax_rate: taxRate, discount_amount: discount,
          subtotal, tax_amount: taxAmount, total,
          payment_terms: paymentTerms, validity_days: 30, notes,
        })
        .select().single()

      if (error) {
        alert(error.message?.includes('QUOTE_LIMIT_REACHED')
          ? '⚠️ Limite de 3 devis/mois atteinte. Passez en Premium.'
          : 'Erreur lors de la sauvegarde.')
        setSaving(false)
        return
      }

      if (items.length > 0) {
        await supabase.from('quote_items').insert(
          items.filter(i => i.description).map((item, idx) => ({
            quote_id: quote.id, description: item.description,
            quantity: item.quantity, unit: item.unit,
            unit_price: item.unit_price, total: item.quantity * item.unit_price, sort_order: idx,
          }))
        )
      }
      setSaved(true)
      if (redirect) router.push('/quotes')
    } catch { alert('Erreur réseau. Réessayez.') }
    setSaving(false)
  }

  const handleGeneratePDF = async () => {
    try {
      const { generateQuotePDF } = await import('@/lib/pdf')
      generateQuotePDF({
        quote_number: quoteNumber, title: title || 'Devis', status,
        tax_rate: taxRate, discount_amount: discount, subtotal,
        tax_amount: taxAmount, total, payment_terms: paymentTerms,
        validity_days: 30, notes, created_at: new Date().toISOString(),
        client: selectedClient ? {
          name: selectedClient.name, phone: selectedClient.phone,
          whatsapp_number: selectedClient.whatsapp_number,
          company_name: selectedClient.company_name,
        } : undefined,
        items: items.filter(i => i.description).map(i => ({
          description: i.description, quantity: i.quantity, unit: i.unit,
          unit_price: i.unit_price, total: i.quantity * i.unit_price,
        })),
        organization: {
          name: org?.name || 'Mon Entreprise', phone: org?.phone,
          email: org?.email, address: org?.address, rccm: org?.rccm,
          devis_color: org?.devis_color, devis_footer: org?.devis_footer || undefined,
          currency: org?.default_currency || 'XOF',
        },
      })
      setPdfReady(true)
      await saveQuote(false)
    } catch (err) {
      alert('Erreur lors de la génération du PDF.')
    }
  }

  const shareWhatsApp = async () => {
    await saveQuote(false)
    const itemsList = items.filter(i => i.description)
      .map(i => `  • ${i.description} (${i.quantity} ${i.unit}) → ${formatAmount(i.quantity * i.unit_price, currency)}`)
      .join('\n')
    const msg = `*Devis professionnel - ${org?.name || 'DevisAfrik'}*\n\nBonjour ${selectedClient?.name || 'Client'},\n\nVeuillez trouver ci-dessous votre devis *${quoteNumber}*.\n\n📋 *${title || 'Prestation'}*\n\n*Détail des prestations :*\n${itemsList}\n\n💰 *Sous-total HT : ${formatAmount(subtotal, currency)}*\n💰 *TVA (${taxRate}%) : ${formatAmount(taxAmount, currency)}*\n💰 *TOTAL TTC : ${formatAmount(total, currency)}*\n\n📅 Conditions : ${paymentTerms}${notes ? `\n📝 Notes : ${notes}` : ''}\n\n_Téléchargez votre PDF depuis l'application._\nMerci de votre confiance.\n_Envoyé via DevisAfrik_`
    const phone = (selectedClient?.whatsapp_number || selectedClient?.phone || '').replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
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
      <div style={{ padding: '16px 16px 100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/quotes')}
              style={{ padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'transparent', color: 'var(--text-muted)', border: '1.5px solid var(--border)', cursor: 'pointer' }}>
              ← Retour
            </button>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{quoteNumber}</span>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: QUOTE_STATUSES[status as keyof typeof QUOTE_STATUSES]?.color, background: QUOTE_STATUSES[status as keyof typeof QUOTE_STATUSES]?.bg }}>
              {QUOTE_STATUSES[status as keyof typeof QUOTE_STATUSES]?.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {saved && <span style={{ fontSize: 13, color: '#059669', fontWeight: 600, alignSelf: 'center' }}>✅ Sauvegardé</span>}
            <button onClick={() => saveQuote(false)} disabled={saving}
              style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'transparent', color: 'var(--text-muted)', border: '1.5px solid var(--border)', cursor: 'pointer' }}>
              💾
            </button>
            <button onClick={shareWhatsApp}
              style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#25D366', color: '#fff', cursor: 'pointer' }}>
              💬
            </button>
            <button onClick={handleGeneratePDF}
              style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'var(--orange)', color: '#fff', cursor: 'pointer' }}>
              📄 PDF
            </button>
          </div>
        </div>

        {/* Layout : 1 colonne sur mobile, 2 colonnes sur desktop */}
        <div className="quote-new-grid">

          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* IA */}
            <div style={{ background: '#FFF9F6', border: '1.5px solid var(--orange)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, color: 'var(--orange)', marginBottom: 4 }}>🤖 Génération IA</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Décrivez votre travail, l'IA crée votre devis.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={aiText} onChange={e => setAiText(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateAI()}
                  placeholder='Ex: "Installation 3 prises + câblage salon"' />
                <button onClick={generateAI} disabled={aiLoading}
                  style={{ padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'var(--orange)', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {aiLoading ? '⏳' : '✨ IA'}
                </button>
              </div>
            </div>

            {/* Infos devis */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Informations du devis</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Intitulé *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Installation climatisation" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Statut</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    {Object.entries(QUOTE_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Client */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Client</div>
                <button onClick={() => setShowClients(!showClients)}
                  style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'transparent', color: 'var(--orange)', border: '1.5px solid var(--orange)', cursor: 'pointer' }}>
                  {showClients ? 'Fermer' : selectedClient ? 'Changer' : 'Sélectionner'}
                </button>
              </div>
              {showClients && (
                <div style={{ marginBottom: 12 }}>
                  {clients.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                      Aucun client — <span onClick={() => router.push('/clients')} style={{ color: 'var(--orange)', cursor: 'pointer', fontWeight: 600 }}>Ajouter un client</span>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                      {clients.map(c => (
                        <div key={c.id} onClick={() => { setSelectedClient(c); setShowClients(false) }}
                          style={{ border: '1.5px solid var(--border)', borderRadius: 9, padding: '10px 12px', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--orange)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.company_name || c.phone || ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {selectedClient && !showClients ? (
                <div style={{ background: '#F0F4FF', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedClient.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{selectedClient.company_name} {selectedClient.phone ? `· ${selectedClient.phone}` : ''}</div>
                </div>
              ) : !showClients && (
                <div style={{ textAlign: 'center', padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>👤 Aucun client sélectionné</div>
              )}
            </div>

            {/* Lignes de devis — cards sur mobile */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Prestations / Produits</div>

              {/* En-tête colonnes — caché sur mobile via CSS */}
              <div className="items-header" style={{ display: 'grid', gridTemplateColumns: '2fr 65px 85px 100px 32px', gap: 6, marginBottom: 6 }}>
                {['Description', 'Qté', 'Unité', 'Prix unit.', ''].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>

              {/* Lignes desktop */}
              <div className="items-desktop">
                {items.map(item => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 65px 85px 100px 32px', gap: 6, marginBottom: 7, alignItems: 'center' }}>
                    <input placeholder="Description..." value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                    <input type="number" min="0" step="0.5" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center' }} />
                    <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input type="number" min="0" step="500" value={item.unit_price} onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} style={{ textAlign: 'right' }} />
                    <button onClick={() => removeItem(item.id)}
                      style={{ background: '#FEF2F2', border: 'none', color: '#DC2626', borderRadius: 6, width: 30, height: 36, cursor: 'pointer', fontSize: 13 }}>✕</button>
                  </div>
                ))}
              </div>

              {/* Lignes mobile — cards */}
              <div className="items-mobile">
                {items.map((item, idx) => (
                  <div key={item.id} style={{ background: '#F8F9FA', borderRadius: 10, padding: 12, marginBottom: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Ligne {idx + 1}</span>
                      <button onClick={() => removeItem(item.id)}
                        style={{ background: '#FEF2F2', border: 'none', color: '#DC2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕ Supprimer</button>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                      <input placeholder="Description..." value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Quantité</label>
                        <input type="number" min="0" step="0.5" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Unité</label>
                        <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}>
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Prix unit.</label>
                        <input type="number" min="0" step="500" value={item.unit_price} onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} style={{ textAlign: 'right' }} />
                      </div>
                    </div>
                    {item.description && (
                      <div style={{ marginTop: 8, textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>
                        = {formatAmount(item.quantity * item.unit_price, currency)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={addItem}
                style={{ padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'transparent', color: 'var(--text-muted)', border: '1.5px solid var(--border)', cursor: 'pointer', marginTop: 6, width: '100%' }}>
                ➕ Ajouter une ligne
              </button>
            </div>

            {/* Notes */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Conditions de paiement</label>
                <input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Notes pour le client</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Informations supplémentaires..." style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* Colonne droite — Récapitulatif */}
          <div className="recap-col">
            <div style={{ background: '#fff', border: '2px solid var(--blue)', borderRadius: 16, padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--blue)', marginBottom: 14 }}>Récapitulatif</div>
              <div style={{ fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sous-total HT</span>
                  <span style={{ fontWeight: 600 }}>{formatAmount(subtotal, currency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ color: 'var(--text-muted)' }}>TVA (%)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="number" min="0" max="30" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} style={{ width: 50, padding: '4px 6px', fontSize: 12, textAlign: 'center' }} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{formatAmount(taxAmount, currency)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Remise</span>
                  <input type="number" min="0" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} style={{ width: 90, padding: '4px 8px', fontSize: 12, textAlign: 'right' }} />
                </div>
                <div style={{ background: 'var(--blue)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>TOTAL TTC</div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>{formatAmount(total, currency)}</div>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <button onClick={handleGeneratePDF}
                  style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: 'var(--orange)', color: '#fff', cursor: 'pointer' }}>
                  📄 Télécharger le PDF
                </button>
                <button onClick={shareWhatsApp}
                  style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#25D366', color: '#fff', cursor: 'pointer' }}>
                  💬 Envoyer sur WhatsApp
                </button>
                <button onClick={() => saveQuote(true)} disabled={saving}
                  style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'transparent', color: 'var(--blue)', border: '1.5px solid var(--blue)', cursor: 'pointer' }}>
                  {saving ? '⏳ Sauvegarde...' : '💾 Enregistrer et retour'}
                </button>
              </div>

              {pdfReady && (
                <div style={{ marginTop: 12, background: '#ECFDF5', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#059669', fontWeight: 600, textAlign: 'center' }}>
                  ✅ PDF téléchargé !<br />
                  <span style={{ fontSize: 11, color: '#047857' }}>Envoyez-le sur WhatsApp 💬</span>
                </div>
              )}
            </div>

            {items.some(i => i.description) && (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Détail lignes</div>
                {items.filter(i => i.description).map(i => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{i.description}</span>
                    <span style={{ fontWeight: 600 }}>{formatAmount(i.quantity * i.unit_price, currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS responsive */}
      <style>{`
        .quote-new-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 16px;
          align-items: start;
        }
        .items-mobile { display: none; }
        .items-desktop { display: block; }
        .items-header { display: grid; }
        .recap-col { position: sticky; top: 20px; }

        @media (max-width: 768px) {
          .quote-new-grid {
            grid-template-columns: 1fr !important;
          }
          .recap-col {
            position: relative !important;
            top: auto !important;
            order: -1;
          }
          .items-mobile { display: block !important; }
          .items-desktop { display: none !important; }
          .items-header { display: none !important; }
        }
      `}</style>
    </AppLayout>
  )
}