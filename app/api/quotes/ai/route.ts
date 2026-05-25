// app/api/quotes/ai/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const SYSTEM_PROMPT = `Tu es un assistant expert en devis professionnels pour le marché africain francophone (Côte d'Ivoire, Sénégal, Cameroun, Burkina Faso, Mali, Togo, Bénin).

Ton rôle : aider les artisans, freelances et PME à structurer leurs devis à partir d'une description en langage naturel.

Règles :
- Identifie toutes les prestations ou fournitures décrites
- Crée des lignes de devis claires et professionnelles en français
- Suggère des quantités réalistes selon le contexte
- Propose des prix en FCFA cohérents avec le marché local
- Unités adaptées : forfait, heure, jour, unité, m², ml, kg

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans texte avant ou après :
{
  "title": "Titre court du devis (max 60 caractères)",
  "items": [
    {
      "description": "Description claire de la prestation",
      "quantity": 1,
      "unit": "forfait",
      "unit_price": 25000
    }
  ],
  "notes": "Conditions particulières si nécessaire (optionnel)"
}`

export async function POST(req: NextRequest) {
  try {
    const { description, org_id } = await req.json()

    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { error: 'Description trop courte. Décrivez votre travail en quelques mots.' },
        { status: 400 }
      )
    }

    if (!org_id) {
      return NextResponse.json(
        { error: 'org_id manquant' },
        { status: 400 }
      )
    }

    // Vérifier le plan via service role (bypasse RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('plan, plan_expires_at')
      .eq('id', org_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organisation introuvable' },
        { status: 404 }
      )
    }

    // Bloquer les utilisateurs gratuits
    const isPremium = org.plan === 'premium' &&
      (!org.plan_expires_at || new Date(org.plan_expires_at) > new Date())

    if (!isPremium) {
      return NextResponse.json(
        {
          error: 'PLAN_REQUIRED',
          message: 'La génération IA est réservée au plan Premium.',
        },
        { status: 403 }
      )
    }

    // Appeler Claude API
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const message = await client.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: description.trim() }],
    })

    const rawText = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    // Parser la réponse JSON
    let parsed: any
    try {
      const clean = rawText.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('Erreur parsing IA:', rawText)
      return NextResponse.json(
        { error: 'Erreur de génération. Réessayez avec une description plus détaillée.' },
        { status: 500 }
      )
    }

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return NextResponse.json(
        { error: 'Réponse IA invalide. Réessayez.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      title: parsed.title || '',
      items: parsed.items.map((item: any) => ({
        description: String(item.description || ''),
        quantity:    Number(item.quantity) || 1,
        unit:        String(item.unit || 'forfait'),
        unit_price:  Number(item.unit_price) || 0,
      })),
      notes: parsed.notes || '',
    })

  } catch (err: any) {
    console.error('[POST /api/quotes/ai]', err)
    return NextResponse.json(
      { error: 'Erreur serveur. Réessayez.' },
      { status: 500 }
    )
  }
}