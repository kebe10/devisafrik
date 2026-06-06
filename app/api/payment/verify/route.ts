// app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase avec la clé SERVICE ROLE (pas la clé publique)
// pour pouvoir écrire sans restrictions RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { transaction_id, org_id, period } = await req.json()

    // Validation des paramètres
    if (!transaction_id || !org_id || !period) {
      return NextResponse.json(
        { error: 'Paramètres manquants (transaction_id, org_id, period).' },
        { status: 400 }
      )
    }

    // ── 1. Vérification de la transaction auprès de FedaPay ──
    const fedaRes = await fetch(
      `https://sandbox-api.com/v1/transactions/${transaction_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!fedaRes.ok) {
      console.error('FedaPay API error:', fedaRes.status, await fedaRes.text())
      return NextResponse.json(
        { error: 'Impossible de vérifier la transaction auprès de FedaPay.' },
        { status: 502 }
      )
    }

    const fedaData = await fedaRes.json()
    const transaction = fedaData.v1 // structure FedaPay : { v1: { ... } }

    const transactionStatus = transaction?.status

    console.log(`[verify] transaction ${transaction_id} → status: ${transactionStatus}`)

    // ── 2. Vérifier que le statut est bien "approved" ──
    if (transactionStatus !== 'approved') {
      return NextResponse.json({
        activated: false,
        status: transactionStatus,
      })
    }

    // ── 3. Vérifier que cette transaction n'a pas déjà été utilisée ──
    // (évite la réutilisation d'un transaction_id déjà consommé)
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('last_transaction_id, plan')
      .eq('id', org_id)
      .single()

    if (existingOrg?.last_transaction_id === transaction_id) {
      // Déjà activé avec cette transaction — on retourne succès sans re-écrire
      return NextResponse.json({ activated: true, already: true })
    }

    // ── 4. Calculer la date d'expiration ──
    const now = new Date()
    const expiresAt = new Date(now)
    if (period === 'year') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    // ── 5. Activer le plan Premium dans Supabase ──
    const { error } = await supabaseAdmin
      .from('organizations')
      .update({
        plan:                'premium',
        plan_expires_at:     expiresAt.toISOString(),
        last_payment_at:     now.toISOString(),
        last_transaction_id: transaction_id, // stocke l'ID pour éviter la réutilisation
      })
      .eq('id', org_id)

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json(
        { error: 'Paiement confirmé mais erreur lors de l\'activation. Contactez le support.' },
        { status: 500 }
      )
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