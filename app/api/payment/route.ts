// app/api/payment/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { amount, period, org_id, email, name } = await req.json()

    if (!amount || !org_id || !email) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

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
        // ✅ callback_url = webhook pour mise à jour du plan (serveur → serveur)
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
        // ✅ return_url = redirection utilisateur après paiement réussi
        return_url:   `${process.env.NEXT_PUBLIC_APP_URL}/subscription?status=success&org_id=${org_id}&period=${period}`,
        // ✅ cancel_url = redirection si annulation
        cancel_url:   `${process.env.NEXT_PUBLIC_APP_URL}/subscription?status=cancelled`,
        customer: {
          email,
          lastname: name || 'Client',
        },
        metadata: { org_id, period },
      }),
    })

    const txData = await txRes.json()
    const transaction = txData['v1/transaction']

    if (!transaction?.id) {
      console.error('FedaPay error:', JSON.stringify(txData))
      return NextResponse.json({ error: 'Erreur création transaction' }, { status: 500 })
    }

    return NextResponse.json({
      transaction_id: transaction.id,
      payment_url:    transaction.payment_url,
    })

  } catch (err) {
    console.error('Payment error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}