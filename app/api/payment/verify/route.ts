// app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { transaction_id, org_id, period } = await req.json()

    if (!transaction_id || !org_id || !period) {
      return NextResponse.json(
        { error: 'Paramètres manquants (transaction_id, org_id, period).' },
        { status: 400 }
      )
    }

    // ── 1. Appel FedaPay sandbox ──
    const fedaRes = await fetch(
      `https://sandbox-api.fedapay.com/v1/transactions/${transaction_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    // ── 2. Lire le body UNE SEULE FOIS ──
    const fedaData = await fedaRes.json()
    console.log('[verify] FedaPay status HTTP:', fedaRes.status)
    console.log('[verify] FedaPay response:', JSON.stringify(fedaData))

    if (!fedaRes.ok) {
      return NextResponse.json(
        { error: 'Impossible de vérifier la transaction auprès de FedaPay.' },
        { status: 502 }
      )
    }

    // ── 3. Extraire la transaction — FedaPay sandbox renvoie { 'v1/transaction': {...} } ──
    const transaction =
      fedaData['v1/transaction'] ||  // format sandbox le plus courant
      fedaData.transaction       ||  // format alternatif
      fedaData.v1                    // ancien format

    const transactionStatus = transaction?.status
    console.log(`[verify] transaction ${transaction_id} → status: ${transactionStatus}`)

    if (transactionStatus !== 'approved') {
      return NextResponse.json({ activated: false, status: transactionStatus })
    }

    // ── 4. Vérifier que la transaction n'a pas déjà été utilisée ──
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('last_transaction_id, plan')
      .eq('id', org_id)
      .single()

    if (existingOrg?.last_transaction_id === String(transaction_id)) {
      return NextResponse.json({ activated: true, already: true })
    }

    // ── 5. Calculer la date d'expiration ──
    const now = new Date()
    const expiresAt = new Date(now)
    if (period === 'year') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    // ── 6. Activer le plan Premium dans Supabase ──
    const { error } = await supabaseAdmin
      .from('organizations')
      .update({
        plan:                'premium',
        plan_expires_at:     expiresAt.toISOString(),
        last_payment_at:     now.toISOString(),
        last_transaction_id: String(transaction_id),
      })
      .eq('id', org_id)

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json(
        { error: "Paiement confirmé mais erreur lors de l'activation. Contactez le support." },
        { status: 500 }
      )
    }

    // ── 7. Enregistrer dans la table subscriptions ──
    const amount   = transaction?.amount   || (period === 'year' ? 91200 : 9500)
    const currency = transaction?.currency?.iso || 'XOF'

    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        organization_id:   org_id,
        plan:              'premium',
        status:            'active',
        payment_provider:  'fedapay',
        payment_reference: String(transaction_id),
        amount,
        currency,
        starts_at:         now.toISOString(),
        expire_at:         expiresAt.toISOString(),
      })

    if (subError) {
      console.error('Erreur insert subscriptions:', subError)
    }

    return NextResponse.json({ activated: true })

  } catch (err) {
    console.error('verify route error:', err)
    return NextResponse.json(
      { error: 'Erreur serveur inattendue.' },
      { status: 500 }
    )
  }
}