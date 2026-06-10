// app/api/payment/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { amount, period, org_id, email, name } = await req.json()

    if (!amount || !org_id || !email) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const txRes = await fetch('https://api.fedapay.com/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        description: `DevisAfrik Premium - ${period === 'year' ? 'Annuel' : 'Mensuel'}`,
        amount,
        currency:    { iso: 'XOF' },
        // FedaPay ajoute automatiquement ?id={transaction_id}&status=approved à cette URL
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?source=fedapay&org_id=${org_id}&period=${period}`,
        // URL de retour quand l'utilisateur annule
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?source=cancelled`,
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