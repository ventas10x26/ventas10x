// Ruta destino: src/app/api/pulse/waitlist/route.ts
// FIX:
//   - Usa service role (evita RLS bloqueando el INSERT)
//   - Email ya registrado → retorna ok: true (no error) → frontend redirige igual
//   - Validaciones claras con mensajes específicos

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, nombre, marca } = body

    if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      return NextResponse.json({ error: 'Nombre requerido (mín. 2 caracteres)' }, { status: 400 })
    }

    const emailTrim = email.trim().toLowerCase()
    const nombreTrim = nombre.trim()

    // Verificar si ya existe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existente } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('id')
      .ilike('email', emailTrim)
      .maybeSingle()

    if (existente) {
      // Ya registrado → ok igual, el frontend redirige al onboarding
      return NextResponse.json({ ok: true, existente: true })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertErr } = await (supabaseAdmin.from('pulse_waitlist') as any).insert({
      email: emailTrim,
      nombre: nombreTrim,
      marca: marca?.trim() || null,
      origen: 'landing_pulsemotor',
      metadata: {
        user_agent: req.headers.get('user-agent') || null,
        referer: req.headers.get('referer') || null,
      },
    })

    if (insertErr) {
      console.error('[pulse/waitlist] insert error:', insertErr)
      return NextResponse.json({ error: 'Error al guardar. Intenta de nuevo.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, existente: false })
  } catch (e) {
    console.error('[pulse/waitlist]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
