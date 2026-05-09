// Ruta destino: src/app/api/dashboard/kit-difusion-historial/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Trae las ultimas 20 estrategias del usuario, mas la activa primero
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('vendedor_estrategias') as any)
      .select('id, instruccion, industria, copies_wa, copies_ig, asunto_email, cuerpo_email, hashtags, estrategia, activa, created_at')
      .eq('vendedor_id', user.id)
      .order('activa', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[kit-difusion-historial] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data || []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activa = rows.find((e: any) => e.activa) || null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historial = rows.map((e: any) => ({
      id: e.id,
      instruccion: e.instruccion,
      industria: e.industria,
      activa: e.activa,
      created_at: e.created_at,
      // Resumen para mostrar en dropdown sin cargar todo
      total_dias_estrategia: Array.isArray(e.estrategia) ? e.estrategia.length : 0,
    }))

    return NextResponse.json({
      ok: true,
      activa, // estrategia completa lista para aplicar
      historial, // version corta para dropdown
    })
  } catch (e) {
    console.error('[kit-difusion-historial]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
