import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Disparar welcome email solo si aún no se ha enviado
      try {
        const { data: yaEnviado } = await supabase
          .from('emails_enviados')
          .select('id')
          .eq('vendedor_id', data.user.id)
          .eq('tipo', 'welcome')
          .maybeSingle()

        if (!yaEnviado) {
          const nombre =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split('@')[0] ||
            'Vendedor'

          // Fire-and-forget con keepalive para que no se cancele en el redirect
          fetch(`${origin}/api/welcome-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre,
              email: data.user.email,
              userId: data.user.id,
            }),
            keepalive: true,
          }).catch((e) => {
            console.error('[callback] welcome-email fetch error:', e)
          })
        }
      } catch (e) {
        console.error('[callback] welcome check error:', e)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si hay error, redirigir al login
  return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
}