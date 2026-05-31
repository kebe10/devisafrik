// app/api/payment/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('FedaPay webhook:', JSON.stringify(body))

    const event       = body.name
    const transaction = body.entity

    if (event === 'transaction.approved') {
      const org_id = transaction.metadata?.org_id
      const period = transaction.metadata?.period

      if (!org_id) return NextResponse.json({ error: 'org_id manquant' }, { status: 400 })

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const now = new Date()
      const expiresAt = new Date(now)
      if (period === 'year') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      }

      await supabase
        .from('organizations')
        .update({
          plan:                'premium',
          plan_expires_at:     expiresAt.toISOString(),
          last_payment_at:     now.toISOString(),
          last_payment_amount: transaction.amount,
        })
        .eq('id', org_id)

      console.log(`✅ Premium activé pour org ${org_id}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}