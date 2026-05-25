// app/api/quotes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const createServerClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

// ── GET — Liste des devis ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(req.url)
    const orgId  = searchParams.get('org_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    if (!orgId) return NextResponse.json({ error: 'org_id requis' }, { status: 400 })

    let query = supabase
      .from('quotes')
      .select('*, client:clients(id, name, phone, whatsapp_number, company_name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (search) query = query.ilike('title', `%${search}%`)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ quotes: data })
  } catch (err) {
    console.error('[GET /api/quotes]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ── POST — Créer un devis ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await req.json()
    const {
      organization_id, client_id, title, status = 'draft',
      currency = 'XOF', tax_rate = 18, discount_amount = 0,
      payment_terms, validity_days = 30, notes, items = [],
    } = body

    if (!organization_id) return NextResponse.json({ error: 'organization_id requis' }, { status: 400 })
    if (!items.length)    return NextResponse.json({ error: 'Au moins une ligne requise' }, { status: 400 })

    const subtotal   = items.reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0)
    const tax_amount = subtotal * (tax_rate / 100)
    const total      = subtotal + tax_amount - discount_amount

    const now = new Date()
    const quote_number = `DEV-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${Math.floor(Math.random()*900)+100}`

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        organization_id,
        client_id:       client_id || null,
        quote_number,
        title:           title || 'Nouveau devis',
        status, currency, tax_rate, discount_amount,
        subtotal, tax_amount, total, payment_terms, validity_days, notes,
      })
      .select()
      .single()

    if (quoteError) {
      if (quoteError.message?.includes('QUOTE_LIMIT_REACHED')) {
        return NextResponse.json(
          { error: 'QUOTA_EXCEEDED', message: 'Limite de 3 devis/mois atteinte.' },
          { status: 403 }
        )
      }
      throw quoteError
    }

    if (items.length > 0) {
      await supabase.from('quote_items').insert(
        items.map((item: any, idx: number) => ({
          quote_id:    quote.id,
          description: item.description,
          quantity:    item.quantity,
          unit:        item.unit || 'forfait',
          unit_price:  item.unit_price,
          total:       item.quantity * item.unit_price,
          sort_order:  idx,
        }))
      )
    }

    return NextResponse.json({ quote }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/quotes]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
