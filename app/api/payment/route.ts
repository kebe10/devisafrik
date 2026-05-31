// app/api/payment/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { amount, period, org_id, email, name } = await req.json()

    if (!amount || !org_id || !email) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Créer une transaction FedaPay
    const response = await fetch('https://sandbox-api.fedapay.com/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        description:    `DevisAfrik Premium - ${period === 'year' ? 'Annuel' : 'Mensuel'}`,
        amount:          amount,
        currency:        { iso: 'XOF' },
        callback_url:   `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`,
        return_url:     `${process.env.NEXT_PUBLIC_APP_URL}/subscription?status=success&org_id=${org_id}`,
        cancel_url:     `${process.env.NEXT_PUBLIC_APP_URL}/subscription?status=cancelled`,
        customer: {
          email,
          lastname: name || 'Client',
        },
        metadata: {
          org_id,
          period,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('FedaPay error:', data)
      return NextResponse.json({ error: 'Erreur création paiement' }, { status: 500 })
    }

    // Générer le lien de paiement
    const tokenResponse = await fetch(`https://sandbox-api.fedapay.com/v1/transactions/${data.v1_transaction.id}/token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      },
    })

    const tokenData = await tokenResponse.json()

    return NextResponse.json({
      transaction_id: data.v1_transaction.id,
      payment_url:    `https://sandbox-checkout.fedapay.com/payment-page?token=${tokenData.token}`,
    })

  } catch (err) {
    console.error('Payment error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}