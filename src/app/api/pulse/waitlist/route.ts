// Ruta destino: src/app/api/pulse/waitlist/route.ts
//
// POST: guarda email en pulse_waitlist
// GET: (futuro) lista de waitlist solo para owner

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, nombre, marca } = body

    // Validación básica
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar si el email ya existe (para no duplicar)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existente } = await (supabase.from('pulse_waitlist') as any)
      .select('id')
      .ilike('email', email.trim())
      .maybeSingle()

    if (existente) {
      // No fallar, devolver ok pero sin duplicar
      return NextResponse.json({
        ok: true,
        message: 'Ya estabas en la lista. Te avisamos cuando esté listo.',
      })
    }

    // Insertar nuevo registro
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertErr } = await (supabase.from('pulse_waitlist') as any).insert({
      email: email.trim().toLowerCase(),
      nombre: nombre.trim(),
      marca: marca || null,
      origen: 'landing_pulsemotor',
      metadata: {
        user_agent: req.headers.get('user-agent') || null,
        referer: req.headers.get('referer') || null,
      },
    })

    if (insertErr) {
      console.error('[pulse/waitlist] insert error:', insertErr)
      return NextResponse.json(
        { error: 'No pudimos guardar tu email. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[pulse/waitlist]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}
