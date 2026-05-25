// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, company_name, phone } = body

    // Validation
    if (!email || !password || !name || !company_name) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis.' },
        { status: 400 }
      )
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
        { status: 400 }
      )
    }

    // Client Supabase avec SERVICE_ROLE_KEY pour bypasser RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Créer le compte avec signUp (pas admin.createUser)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'Cette adresse email est déjà utilisée.' },
          { status: 409 }
        )
      }
      throw authError
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte.' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // 2. Créer l'organisation
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name:                  company_name,
        phone:                 phone || null,
        whatsapp_number:       phone || null,
        plan:                  'free',
        default_currency:      'XOF',
        default_tax_rate:      18,
        default_payment_terms: 'Paiement à la livraison',
        devis_color:           '#FF6B35',
      })
      .select()
      .single()

    if (orgError) throw orgError

    // 3. Lier l'utilisateur à l'organisation
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id:         userId,
        role:            'owner',
      })

    if (memberError) throw memberError

    // 4. Services de base dans le catalogue
    await supabase.from('service_catalog').insert([
      { organization_id: org.id, name: "Main d'oeuvre",  default_price: 15000, default_unit: 'heure',   category: 'Service'  },
      { organization_id: org.id, name: 'Déplacement',    default_price: 5000,  default_unit: 'forfait', category: 'Service'  },
      { organization_id: org.id, name: 'Fournitures',    default_price: 10000, default_unit: 'forfait', category: 'Matériel' },
    ])

    return NextResponse.json(
      { success: true, message: 'Compte créé avec succès', org_id: org.id },
      { status: 201 }
    )

  } catch (err: any) {
    console.error('[POST /api/auth/register]', err)
    return NextResponse.json(
      { error: 'Une erreur est survenue. Réessayez.' },
      { status: 500 }
    )
  }
}