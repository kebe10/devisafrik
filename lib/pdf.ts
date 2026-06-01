// lib/pdf.ts
import jsPDF from 'jspdf'

const fmt = (amount: number, currency: string = 'XOF'): string => {
  const symbols: Record<string, string> = {
    XOF: 'FCFA', XAF: 'FCFA', EUR: '€', USD: '$', GHS: 'GH₵', NGN: '₦',
  }
  const symbol = symbols[currency] || currency
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Math.round(amount)).replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ')
  if (['EUR', 'USD', 'GHS', 'NGN'].includes(currency)) return `${symbol} ${formatted}`
  return `${formatted} ${symbol}`
}

interface PDFQuote {
  quote_number: string; title: string; status: string;
  tax_rate: number; discount_amount: number; subtotal: number;
  tax_amount: number; total: number; payment_terms?: string;
  validity_days: number; notes?: string; created_at: string;
  client?: {
    name: string; phone?: string|null; whatsapp_number?: string|null;
    company_name?: string|null; address?: string|null; email?: string|null
  };
  items: { description: string; quantity: number; unit: string; unit_price: number; total: number }[];
  organization: {
    name: string; phone?: string|null; address?: string|null;
    email?: string|null; rccm?: string|null; devis_color?: string|null;
    devis_footer?: string|null; currency?: string; logo_url?: string|null;
  };
}

// Charger une image depuis une URL et la convertir en base64
async function loadImageAsBase64(url: string): Promise<{ data: string; format: string } | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const format = blob.type.includes('png') ? 'PNG' : 'JPEG'
        const base64 = result.split(',')[1]
        resolve({ data: base64, format })
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function generateQuotePDF(quote: PDFQuote): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const color    = quote.organization.devis_color || '#FF6B35'
  const currency = quote.organization.currency || 'XOF'
  const pageW = 210; const pageH = 297; const margin = 14; const cW = 182

  const hexRgb = (hex: string) => ({
    r: parseInt(hex.slice(1,3),16),
    g: parseInt(hex.slice(3,5),16),
    b: parseInt(hex.slice(5,7),16),
  })
  const { r, g, b } = hexRgb(color)

  // EN-TÊTE
  doc.setFillColor(r, g, b)
  doc.rect(0, 0, pageW, 44, 'F')

  // ✅ LOGO — si disponible, afficher le logo, sinon afficher le cercle "D"
  const logoUrl = quote.organization.logo_url
  let logoLoaded = false

  if (logoUrl) {
    const imgData = await loadImageAsBase64(logoUrl)
    if (imgData) {
      try {
        // Afficher le logo dans un carré blanc arrondi
        doc.setFillColor(255, 255, 255)
        doc.roundedRect(margin, 8, 28, 28, 2, 2, 'F')
        doc.addImage(imgData.data, imgData.format, margin + 1, 9, 26, 26)
        logoLoaded = true
      } catch {
        logoLoaded = false
      }
    }
  }

  if (!logoLoaded) {
    // Cercle "D" par défaut
    doc.setFillColor(255, 255, 255)
    doc.circle(margin + 7, 22, 7, 'F')
    doc.setTextColor(r, g, b)
    doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text('D', margin + 4.5, 25)
  }

  // Infos organisation
  const textX = logoLoaded ? margin + 32 : margin + 18
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14); doc.setFont('helvetica', 'bold')
  doc.text(quote.organization.name.substring(0, 35), textX, 17)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  let orgY = 24
  if (quote.organization.phone)   { doc.text(quote.organization.phone, textX, orgY); orgY += 5 }
  if (quote.organization.email)   { doc.text(quote.organization.email, textX, orgY); orgY += 5 }
  if (quote.organization.address) doc.text(quote.organization.address.substring(0,50), textX, orgY)
  if (quote.organization.rccm)    doc.text('RCCM: ' + quote.organization.rccm, textX, 39)

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(255,255,255)
  doc.text('DEVIS N° ' + quote.quote_number, pageW - margin, 15, { align: 'right' })
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text('Date : ' + new Date(quote.created_at).toLocaleDateString('fr-FR'), pageW - margin, 22, { align: 'right' })
  doc.text('Validité : ' + quote.validity_days + ' jours', pageW - margin, 28, { align: 'right' })

  let y = 52

  // TITRE
  if (quote.title) {
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 58, 95)
    doc.text(quote.title.substring(0, 60), margin, y); y += 9
  }

  // CLIENT
  if (quote.client) {
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(margin, y, cW, 26, 2, 2, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(120, 120, 140)
    doc.text('DESTINATAIRE', margin + 3, y + 6)
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 46)
    doc.text(quote.client.name, margin + 3, y + 13)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(90, 90, 110)
    const infos = [quote.client.company_name, quote.client.phone, quote.client.email].filter(Boolean).join(' | ')
    if (infos) doc.text(infos.substring(0, 70), margin + 3, y + 20)
    y += 32
  }

  // TABLEAU
  const c = {
    desc:  { x: margin,       w: 82 },
    qty:   { x: margin + 83,  w: 13 },
    unit:  { x: margin + 97,  w: 18 },
    price: { x: margin + 116, w: 33 },
    total: { x: margin + 150, w: 32 },
  }

  doc.setFillColor(r, g, b)
  doc.rect(margin, y, cW, 8, 'F')
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text('DESCRIPTION', c.desc.x + 2, y + 5.5)
  doc.text('QTÉ', c.qty.x + c.qty.w - 2, y + 5.5, { align: 'right' })
  doc.text('UNITÉ', c.unit.x + 2, y + 5.5)
  doc.text('PRIX UNIT.', c.price.x + c.price.w - 2, y + 5.5, { align: 'right' })
  doc.text('TOTAL', c.total.x + c.total.w - 2, y + 5.5, { align: 'right' })
  y += 8

  quote.items.forEach((item, idx) => {
    const rowH = 8
    if (idx % 2 === 0) { doc.setFillColor(248, 249, 252); doc.rect(margin, y, cW, rowH, 'F') }
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 50)
    const desc = item.description.length > 40 ? item.description.substring(0, 37) + '...' : item.description
    doc.text(desc, c.desc.x + 2, y + 5.5)
    doc.text(String(item.quantity), c.qty.x + c.qty.w - 2, y + 5.5, { align: 'right' })
    doc.text(item.unit, c.unit.x + 2, y + 5.5)
    doc.text(fmt(item.unit_price, currency), c.price.x + c.price.w - 2, y + 5.5, { align: 'right' })
    doc.text(fmt(item.total, currency), c.total.x + c.total.w - 2, y + 5.5, { align: 'right' })
    doc.setDrawColor(220, 222, 230); doc.setLineWidth(0.2)
    doc.line(margin, y + rowH, margin + cW, y + rowH)
    y += rowH
  })

  y += 6

  // TOTAUX
  const tX = margin + 100; const tW = cW - 100
  const drawRow = (label: string, value: string, highlight = false) => {
    if (highlight) {
      doc.setFillColor(r, g, b); doc.roundedRect(tX, y, tW, 10, 1, 1, 'F')
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    } else {
      doc.setTextColor(60, 60, 80); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
      doc.setDrawColor(220, 222, 230); doc.setLineWidth(0.2); doc.line(tX, y + 8, tX + tW, y + 8)
    }
    doc.text(label, tX + 3, y + (highlight ? 7 : 6))
    doc.text(value, tX + tW - 3, y + (highlight ? 7 : 6), { align: 'right' })
    y += highlight ? 12 : 9
  }

  drawRow('Sous-total HT', fmt(quote.subtotal, currency))
  drawRow('TVA (' + quote.tax_rate + '%)', fmt(quote.tax_amount, currency))
  if (quote.discount_amount > 0) drawRow('Remise', '- ' + fmt(quote.discount_amount, currency))
  y += 2
  drawRow('TOTAL TTC', fmt(quote.total, currency), true)
  y += 8

  // CONDITIONS
  if (quote.payment_terms) {
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(r, g, b)
    doc.text('CONDITIONS DE PAIEMENT', margin, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 80)
    doc.text(quote.payment_terms, margin, y); y += 8
  }

  // NOTES
  if (quote.notes) {
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(r, g, b)
    doc.text('NOTES', margin, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 80)
    const lines = doc.splitTextToSize(quote.notes, cW)
    doc.text(lines, margin, y); y += lines.length * 5 + 5
  }

  // SIGNATURE
  doc.setDrawColor(200, 200, 210); doc.setLineWidth(0.3)
  doc.line(margin, pageH - 42, margin + 55, pageH - 42)
  doc.setFontSize(7); doc.setTextColor(140, 140, 160)
  doc.text('Signature & cachet client', margin, pageH - 37)

  // PIED DE PAGE
  doc.setFillColor(r, g, b)
  doc.rect(0, pageH - 16, pageW, 16, 'F')
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(255, 255, 255)
  const footer = quote.organization.devis_footer || 'Merci de votre confiance — ' + quote.organization.name
  doc.text(footer.substring(0, 80), pageW / 2, pageH - 9, { align: 'center' })
  doc.text('Généré avec DevisAfrik', pageW / 2, pageH - 4, { align: 'center' })

  doc.save(quote.quote_number + '.pdf')
}