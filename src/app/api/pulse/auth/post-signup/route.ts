// Ruta destino: src/app/api/pulse/auth/post-signup/route.ts
//
// POST autenticado: se llama después del signup en Supabase Auth.
// Evalúa si el usuario califica como early adopter (cupos disponibles)
// y actualiza su metadata. También crea el registro inicial en pulse_users.
//
// IMPORTANTE: este endpoint debe llamarse desde el cliente DESPUÉS del signup,
// para que la sesión esté activa.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TOTAL_CUPOS_EARLY_ADOPTER = 30

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar si ya tiene flag (para evitar reasignaciones)
    const yaTieneFlag = user.user_metadata?.pulse_early_adopter
    if (yaTieneFlag !== undefined) {
      return NextResponse.json({
        ok: true,
        early_adopter: !!yaTieneFlag,
        already_assigned: true,
      })
    }

    // Contar usuarios actuales con flag early_adopter
    // Para MVP: contamos vendedores activos (con leads). Aproximación válida.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase.from('pulse_leads') as any)
      .select('vendedor_id', { count: 'exact', head: true })

    const usuariosActivos = count || 0
    const cuposDisponibles = TOTAL_CUPOS_EARLY_ADOPTER - usuariosActivos
    const esEarlyAdopter = cuposDisponibles > 0

    // Actualizar metadata del usuario con flag early adopter
    const { error: updateErr } = await supabase.auth.updateUser({
      data: {
        pulse_early_adopter: esEarlyAdopter,
        pulse_early_adopter_assigned_at: new Date().toISOString(),
        pulse_early_adopter_codigo: esEarlyAdopter ? 'PULSE_EARLY_9' : null,
      },
    })

    if (updateErr) {
      console.error('[pulse/auth/post-signup] update error:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      early_adopter: esEarlyAdopter,
      cupos_disponibles: Math.max(0, cuposDisponibles - 1),
      mensaje: esEarlyAdopter
        ? '🎉 ¡Felicitaciones! Sos uno de los primeros 30. Precio especial $9 USD/mes los primeros 3 meses.'
        : 'Bienvenido a Pulse Motor.',
    })
  } catch (e) {
    console.error('[pulse/auth/post-signup]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}
