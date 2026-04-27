// Ruta destino: src/app/api/suscripciones/mi-plan/route.ts
// Devuelve la suscripción activa del vendedor + historial de pagos

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Suscripción más reciente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: suscripcion } = await (supabase.from('suscripciones') as any)
      .select('*')
      .eq('vendedor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Historial de pagos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pagos } = await (supabase.from('pagos') as any)
      .select('id, plan, periodo, monto, estado, motivo_rechazo, created_at, aprobado_at')
      .eq('vendedor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      suscripcion: suscripcion || null,
      pagos: pagos || [],
    })
  } catch (error) {
    console.error('[mi-plan] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
