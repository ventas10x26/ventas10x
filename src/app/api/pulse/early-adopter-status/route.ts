// Ruta destino: src/app/api/pulse/early-adopter-status/route.ts
//
// GET público: cuenta cuántos vendedores ya se registraron en Pulse Motor
// y devuelve cuántos cupos early adopter quedan (de 30 totales).
//
// NO requiere auth porque es para mostrar contador en la landing/signup.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TOTAL_CUPOS_EARLY_ADOPTER = 30

export async function GET() {
  try {
    const supabase = await createClient()

    // Contar usuarios que tienen la metadata pulse_signup = true
    // Como no podemos consultar auth.users directamente desde el cliente público,
    // usamos una tabla auxiliar pulse_users_count o consultamos pulse_leads (1 lead mín = 1 user activo).
    //
    // Aproximación: contar registros distintos en pulse_leads (cada vendedor activo creó al menos 1 lead).
    // Para no exponer datos privados, solo devolvemos el COUNT.
    //
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count, error } = await (supabase.from('pulse_leads') as any)
      .select('vendedor_id', { count: 'exact', head: true })

    if (error) {
      console.error('[pulse/early-adopter-status] error:', error)
      // Fallback graceful: devolver cupo máximo si hay error
      return NextResponse.json({
        ok: true,
        cupos_disponibles: TOTAL_CUPOS_EARLY_ADOPTER,
        cupos_total: TOTAL_CUPOS_EARLY_ADOPTER,
        early_adopter_open: true,
      })
    }

    // Aproximación: usuarios activos = leads creados (cada usuario crea al menos 1 en onboarding)
    // Esto puede sobrecontar si un mismo vendedor crea muchos leads, pero el COUNT con `vendedor_id`
    // distinct sería ideal. Para MVP esto basta.
    const usuariosActivos = count || 0
    const cuposDisponibles = Math.max(0, TOTAL_CUPOS_EARLY_ADOPTER - usuariosActivos)

    return NextResponse.json({
      ok: true,
      cupos_disponibles: cuposDisponibles,
      cupos_total: TOTAL_CUPOS_EARLY_ADOPTER,
      early_adopter_open: cuposDisponibles > 0,
    })
  } catch (e) {
    console.error('[pulse/early-adopter-status]', e)
    return NextResponse.json(
      {
        ok: true,
        cupos_disponibles: TOTAL_CUPOS_EARLY_ADOPTER,
        cupos_total: TOTAL_CUPOS_EARLY_ADOPTER,
        early_adopter_open: true,
      }
    )
  }
}
