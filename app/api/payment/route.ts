// app/api/payment/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { amount, period, org_id, email, name } = await req.json()

    if (!amount || !org_id || !email) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Étape 1 — Créer la transaction
    const txRes = await fetch('https://sandbox-api.fedapay.com/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        description:  `DevisAfrik Premium - ${period === 'year' ? 'Annuel' : 'Mensuel'}`,
        amount,
        currency:     { iso: 'XOF' },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`,
        return_url:   `${process.env.NEXT_PUBLIC_APP_URL}/subscription?status=success&org_id=${org_id}`,
        cancel_url:   `${process.env.NEXT_PUBLIC_APP_URL}/subscription?status=cancelled`,
        customer: {
          email,
          lastname: name || 'Client',
        },
        metadata: { org_id, period },
      }),
    })

    const txData = await txRes.json()
    console.log('FedaPay transaction response:', JSON.stringify(txData))

    // La réponse peut être dans txData ou txData.v1_transaction
    const transaction = txData?.v1_transaction || txData?.transaction || txData
    const transactionId = transaction?.id

    if (!transactionId) {
      console.error('No transaction ID in response:', txData)
      return NextResponse.json({ error: 'Erreur création transaction FedaPay' }, { status: 500 })
    }

    // Étape 2 — Générer le token de paiement
    const tokenRes = await fetch(
      `https://sandbox-api.fedapay.com/v1/transactions/${transactionId}/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
        },
      }
    )

    const tokenData = await tokenRes.json()
    console.log('FedaPay token response:', JSON.stringify(tokenData))

    const token = tokenData?.token || tokenData?.v1_transaction_token?.token

    if (!token) {
      console.error('No token in response:', tokenData)
      return NextResponse.json({ error: 'Erreur génération token FedaPay' }, { status: 500 })
    }

    const payment_url = `https://sandbox-checkout.fedapay.com/payment-page?token=${token}`

    return NextResponse.json({ transaction_id: transactionId, payment_url })

  } catch (err) {
    console.error('Payment error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}