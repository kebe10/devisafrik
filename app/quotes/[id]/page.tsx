// app/quotes/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, formatAmount, QUOTE_STATUSES } from '@/lib/supabase'
import type { Client, Organization, Quote, QuoteItem } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout'

interface Item {
  id:          string | number
  description: string
  quantity:    number
  unit:        string
  unit_price:  number
}

const UNITS = ['forfait', 'unité', 'heure', 'jour', 'm²', 'ml', 'kg']

export default function QuoteDetailPage() {
  const router  = useRouter()
  const params  = useParams()
  const quoteId = params.id as string

  const [org, setOrg]           = useState<Organization | null>(null)
  const [clients, setClients]   = useState<Client[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [pdfReady, setPdfReady] = useState(false)
  const [showClients, setShowClients]     = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [showCatalogue, setShowCatalogue] = useState(false)
  const [catalogue, setCatalogue]         = useState<any[]>([])
  const [catSearch, setCatSearch]         = useState('')

  const [quoteNumber, setQuoteNumber]   = useState('')
  const [title, setTitle]               = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [status, setStatus]             = useState('draft')
  const [taxRate, setTaxRate]           = useState(18)
  const [discount, setDiscount]         = useState(0)
  const [paymentTerms, setPaymentTerms] = useState('Paiement à la livraison')
  const [notes, setNotes]               = useState('')
  const [items, setItems] = useState<Item[]>([
    { id: 1, description: '', quantity: 1, unit: 'forfait', unit_price: 0 }
  ])

  useEffect(() => { loadData() }, [quoteId])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member) { router.push('/login'); return }

    const [{ data: orgData }, { data: clientsData }, { data: quoteData }] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', member.organization_id).single(),
      supabase.from('clients').select('*').eq('organization_id', member.organization_id).order('name'),
      supabase.from('quotes').select('*, client:clients(*), items:quote_items(*)').eq('id', quoteId).single(),
    ])

    if (!quoteData) { router.push('/quotes'); return }

    setOrg(orgData)
    setClients(clientsData || [])
    setQuoteNumber(quoteData.quote_number)
    setTitle(quoteData.title || '')
    setStatus(quoteData.status)
    setTaxRate(quoteData.tax_rate || 18)
    setDiscount(quoteData.discount_amount || 0)
    setPaymentTerms(quoteData.payment_terms || 'Paiement à la livraison')
    setNotes(quoteData.notes || '')

    if (quoteData.client) setSelectedClient(quoteData.client as Client)

    if (quoteData.items && quoteData.items.length > 0) {
      setItems(quoteData.items.map((i: QuoteItem) => ({
        id: i.id, description: i.description,
        quantity: i.quantity, unit: i.unit, unit_price: i.unit_price,
      })))
    }

    // Charger le catalogue de services
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('organization_id', member.organization_id)
      .order('name')
    setCatalogue(servicesData || [])

    setLoading(false)
  }

  const currency  = org?.default_currency || 'XOF'
  const subtotal  = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total     = subtotal + taxAmount - discount

  const updateItem = (id: string | number, field: keyof Item, value: any) =>
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i))

  const addItem = () =>
    setItems([...items, { id: Date.now(), description: '', quantity: 1, unit: 'forfait', unit_price: 0 }])

  const removeItem = (id: string | number) =>
    setItems(items.filter(i => i.id !== id))

  const updateQuote = async (redirect = false) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          title: title || 'Nouveau devis', client_id: selectedClient?.id || null,
          status, tax_rate: taxRate, discount_amount: discount,
          subtotal, tax_amount: taxAmount, total, payment_terms: paymentTerms, notes,
        })
        .eq('id', quoteId)

      if (error) throw error

      await supabase.from('quote_items').delete().eq('quote_id', quoteId)

      if (items.filter(i => i.description).length > 0) {
        await supabase.from('quote_items').insert(
          items.filter(i => i.description).map((item, idx) => ({
            quote_id: quoteId, description: item.description,
            quantity: item.quantity, unit: item.unit,
            unit_price: item.unit_price, total: item.quantity * item.unit_price, sort_order: idx,
          }))
        )
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      if (redirect) router.push('/quotes')
    } catch {
      alert('Erreur lors de la sauvegarde.')
    }
    setSaving(false)
  }

  const handleGeneratePDF = async () => {
    try {
      const { generateQuotePDF } = await import('@/lib/pdf')
      await generateQuotePDF({
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
          logo_url: org?.logo_url || null,
        },
      })
      setPdfReady(true)
      await updateQuote(false)
    } catch {
      alert('Erreur lors de la génération du PDF.')
    }
  }

  const shareWhatsApp = async () => {
    await updateQuote(false)
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
      <div style={{ padding: '16px 16px 100px', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>

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
            {saved && <span style={{ fontSize: 13, color: '#059669', fontWeight: 600, alignSelf: 'center' }}>✅</span>}
            <button onClick={() => updateQuote(false)} disabled={saving}
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

        <div className="quote-detail-grid">

          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

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

            {/* Lignes */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Prestations / Produits</div>

              <div className="items-header-d" style={{ display: 'grid', gridTemplateColumns: '2fr 65px 85px 100px 32px', gap: 6, marginBottom: 6 }}>
                {['Description', 'Qté', 'Unité', 'Prix unit.', ''].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>

              <div className="items-rows-d">
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

              <div className="items-rows-m">
                {items.map((item, idx) => (
                  <div key={item.id} style={{ background: '#F8F9FA', borderRadius: 10, padding: 12, marginBottom: 10, border: '1px solid var(--border)', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Ligne {idx + 1}</span>
                      <button onClick={() => removeItem(item.id)}
                        style={{ background: '#FEF2F2', border: 'none', color: '#DC2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕ Supprimer</button>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                      <input placeholder="Description..." value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Quantité</label>
                        <input type="number" min="0" step="0.5" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} style={{ textAlign: 'center', width: '100%', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Unité</label>
                        <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Prix unit.</label>
                        <input type="number" min="0" step="500" value={item.unit_price} onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} style={{ textAlign: 'right', width: '100%', boxSizing: 'border-box' }} />
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

              {/* Boutons ajouter */}
              <button onClick={addItem}
                style={{ padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'transparent', color: 'var(--text-muted)', border: '1.5px solid var(--border)', cursor: 'pointer', marginTop: 6, width: '100%', boxSizing: 'border-box' }}>
                ➕ Ajouter une ligne
              </button>

              {/* ✅ Bouton catalogue */}
              {catalogue.length > 0 && (
                <button onClick={() => setShowCatalogue(true)}
                  style={{ padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#F0F4FF', color: 'var(--blue)', border: '1.5px solid var(--blue)', cursor: 'pointer', marginTop: 8, width: '100%', boxSizing: 'border-box' }}>
                  🛠️ Ajouter depuis le catalogue
                </button>
              )}
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
          <div className="recap-col-d" style={{ minWidth: 0 }}>
            <div style={{ background: '#fff', border: '2px solid var(--blue)', borderRadius: 16, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--blue)', marginBottom: 14 }}>Récapitulatif</div>
              <div style={{ fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Sous-total HT</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{formatAmount(subtotal, currency)}</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>TVA (%)</span>
                    <input type="number" min="0" max="30" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} style={{ width: 52, padding: '4px 6px', fontSize: 12, textAlign: 'center' }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                    {formatAmount(taxAmount, currency)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Remise</span>
                  <input type="number" min="0" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} style={{ width: 80, padding: '4px 8px', fontSize: 12, textAlign: 'right' }} />
                </div>
                <div style={{ background: 'var(--blue)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>TOTAL TTC</div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, wordBreak: 'break-all' }}>{formatAmount(total, currency)}</div>
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
                <button onClick={() => updateQuote(true)} disabled={saving}
                  style={{ width: '100%', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'transparent', color: 'var(--blue)', border: '1.5px solid var(--blue)', cursor: 'pointer' }}>
                  {saving ? '⏳ Sauvegarde...' : '💾 Enregistrer'}
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
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{i.description}</span>
                    <span style={{ fontWeight: 600, flexShrink: 0 }}>{formatAmount(i.quantity * i.unit_price, currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Modal catalogue */}
      {showCatalogue && (
        <div onClick={() => setShowCatalogue(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 500, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--blue)' }}>🛠️ Catalogue de services</div>
              <button onClick={() => setShowCatalogue(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <input placeholder="🔍 Rechercher..." value={catSearch} onChange={e => setCatSearch(e.target.value)} style={{ marginBottom: 12 }} />
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {catalogue
                .filter(s => !catSearch || s.name.toLowerCase().includes(catSearch.toLowerCase()))
                .map(s => (
                  <div key={s.id}
                    onClick={() => {
                      setItems(prev => [...prev, {
                        id: Date.now(), description: s.name,
                        quantity: 1, unit: s.unit, unit_price: s.unit_price,
                      }])
                      setShowCatalogue(false)
                      setCatSearch('')
                    }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, marginBottom: 8, border: '1.5px solid var(--border)', cursor: 'pointer', background: '#fff' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.background = '#FFF9F6' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#fff' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                      {s.description && <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{s.description}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontWeight: 700, color: 'var(--orange)', fontSize: 14 }}>{formatAmount(s.unit_price, currency)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>par {s.unit}</div>
                    </div>
                  </div>
                ))}
              {catalogue.filter(s => !catSearch || s.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Aucun service trouvé</div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .quote-detail-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 16px;
          align-items: start;
          width: 100%;
        }
        .items-rows-m { display: none; }
        .items-rows-d { display: block; }
        .items-header-d { display: grid; }
        .recap-col-d { position: sticky; top: 20px; }

        @media (max-width: 768px) {
          .quote-detail-grid { grid-template-columns: 1fr !important; }
          .recap-col-d { position: relative !important; top: auto !important; order: -1; }
          .items-rows-m { display: block !important; }
          .items-rows-d { display: none !important; }
          .items-header-d { display: none !important; }
          .quote-detail-grid, .quote-detail-grid * { max-width: 100% !important; box-sizing: border-box !important; }
          .items-rows-m input, .items-rows-m select, .items-rows-m textarea { width: 100% !important; min-width: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </AppLayout>
  )
}