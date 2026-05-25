// Ruta destino: src/app/pulse/auth/callback/route.ts
//
// Maneja el callback de OAuth (Google) para Pulse Motor.
// Intercambia el code por una sesión Supabase y redirige al dashboard.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/pulse/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[pulse/auth/callback] exchangeCodeForSession error:', error.message)
  }

  // Si algo falla, redirigir al login con mensaje de error
  return NextResponse.redirect(`${origin}/pulse/login?error=auth_callback_failed`)
}
