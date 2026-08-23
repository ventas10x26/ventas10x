// Ruta destino: src/app/api/pulse/admin/onboarding-envios/route.ts
//
// Lista pulse_onboarding_envios para la pantalla de seguimiento (/pulse/admin/onboarding-envios).
// Mismo patrón de auth que /api/pulse/admin/proyectos y /api/pulse/admin/leads: bearer token
// + PULSE_ADMIN_EMAILS, RLS de la tabla no permite lectura directa desde el cliente.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const ADMINS = (process.env.PULSE_ADMIN_EMAILS || 'ricaza81@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 })

    const { data: { user }, error: authErr } = await admin.auth.getUser(token)
    if (authErr || !user?.email) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    if (!ADMINS.includes(user.email.toLowerCase())) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const { data: envios, error } = await admin
      .from('pulse_onboarding_envios')
      .select('id, email, touch, enviado_at, entregado_at, abierto_at, clic_at, rebotado_at, quejado_at')
      .order('enviado_at', { ascending: false })
      .limit(500)

    if (error) throw new Error(error.message)

    return NextResponse.json({ envios: envios || [] })
  } catch (e) {
    console.error('[api/pulse/admin/onboarding-envios]', e)
    return NextResponse.json({ error: 'No pudimos leer los envíos' }, { status: 500 })
  }
}
