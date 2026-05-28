// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const type  = searchParams.get('type')

  // ── Lien expiré ou invalide (erreur dans le hash) ──────────
  // Supabase met l'erreur dans le hash: #error=access_denied&error_code=otp_expired
  // Le hash n'est pas lisible côté serveur mais on peut détecter via token_hash absent
  const tokenHash = searchParams.get('token_hash')
  const next      = searchParams.get('next') || '/dashboard'

  // Si pas de code ni token_hash → lien invalide/expiré
  if (!code && !tokenHash) {
    const errorParam = encodeURIComponent('Lien invalide ou expiré. Veuillez faire une nouvelle demande.')
    if (type === 'recovery') {
      return NextResponse.redirect(new URL(`/login?error=${errorParam}`, req.url))
    }
    return NextResponse.redirect(new URL(`/login?error=${errorParam}`, req.url))
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    if (tokenHash) {
      await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any })
    } else if (code) {
      await supabase.auth.exchangeCodeForSession(code)
    }

    // Réinitialisation mot de passe
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/auth/reset-password', req.url))
    }

    // Confirmation email → dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url))

  } catch {
    const errorParam = encodeURIComponent('Une erreur est survenue. Réessayez.')
    return NextResponse.redirect(new URL(`/login?error=${errorParam}`, req.url))
  }
}