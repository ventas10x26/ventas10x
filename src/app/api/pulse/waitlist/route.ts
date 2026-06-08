// src/app/api/pulse/waitlist/route.ts
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

    const emailTrim  = email.trim().toLowerCase()
    const nombreTrim = nombre.trim()

    // Verificar si ya existe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existente } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('id, user_id')
      .ilike('email', emailTrim)
      .maybeSingle()

    if (existente) {
      // Ya registrado → asegurarse de que tenga créditos (idempotente)
      if (existente.user_id) {
        await supabaseAdmin.rpc('pulse_otorgar_creditos_bienvenida', { p_user_id: existente.user_id })
      }
      return NextResponse.json({ ok: true, existente: true })
    }

    // Insertar nuevo registro
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertado, error: insertErr } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .insert({
        email: emailTrim,
        nombre: nombreTrim,
        marca:  marca?.trim() || null,
        origen: 'landing_pulsemotor',
        tipo_acceso: 'creditos',
        metadata: {
          user_agent: req.headers.get('user-agent') || null,
          referer:    req.headers.get('referer') || null,
        },
      })
      .select('id, user_id')
      .single()

    if (insertErr) {
      console.error('[pulse/waitlist] insert error:', insertErr)
      return NextResponse.json({ error: 'Error al guardar. Intenta de nuevo.' }, { status: 500 })
    }

    // ── Otorgar 500 créditos de bienvenida ──
    // Solo si el registro ya tiene user_id (signup completado)
    // Si no, el cron diario los asignará cuando completen el signup
    if (insertado?.user_id) {
      try {
        await supabaseAdmin.rpc('pulse_otorgar_creditos_bienvenida', { p_user_id: insertado.user_id })
        console.log('[pulse/waitlist] créditos otorgados a:', emailTrim)
      } catch (creditosErr) {
        // No bloqueamos el registro si falla
        console.error('[pulse/waitlist] error otorgando créditos:', creditosErr)
      }
    }

    return NextResponse.json({ ok: true, existente: false })
  } catch (e) {
    console.error('[pulse/waitlist]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
