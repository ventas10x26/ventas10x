// Ruta destino: src/app/api/auth/log-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

function detectDispositivo(ua: string): string {
  if (/mobile|android|iphone|ipad/i.test(ua)) return 'mobile'
  if (/tablet/i.test(ua)) return 'tablet'
  return 'desktop'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'desconocida'
    const ua = req.headers.get('user-agent') || ''
    const dispositivo = detectDispositivo(ua)

    // Obtener nombre del perfil
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabaseAdmin as any)
      .from('profiles')
      .select('nombre, apellido')
      .eq('id', user.id)
      .maybeSingle()

    const nombre = profile
      ? [profile.nombre, profile.apellido].filter(Boolean).join(' ')
      : null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any)
      .from('login_logs')
      .insert({
        user_id: user.id,
        email: user.email,
        nombre,
        ip,
        user_agent: ua.slice(0, 300),
        dispositivo,
        exitoso: true,
      })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[log-login]', e)
    return NextResponse.json({ ok: false })
  }
}
