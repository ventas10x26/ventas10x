// Ruta destino: src/app/api/leads/actividades/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

// GET /api/leads/actividades?lead_id=xxx
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const lead_id = req.nextUrl.searchParams.get('lead_id')
    if (!lead_id) return NextResponse.json({ error: 'lead_id requerido' }, { status: 400 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 403 })

    const [actividadesRes, recordatoriosRes] = await Promise.all([
      supabase
        .from('lead_actividades')
        .select('*')
        .eq('lead_id', lead_id)
        .eq('org_id', active.org.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('lead_recordatorios')
        .select('*')
        .eq('lead_id', lead_id)
        .eq('org_id', active.org.id)
        .eq('completado', false)
        .order('fecha_recordatorio', { ascending: true })
        .limit(1),
    ])

    return NextResponse.json({
      actividades: actividadesRes.data || [],
      recordatorio: recordatoriosRes.data?.[0] || null,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST /api/leads/actividades
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 403 })

    const body = await req.json()
    const { lead_id, tipo, descripcion, fecha_recordatorio } = body

    if (!lead_id || !descripcion) {
      return NextResponse.json({ error: 'lead_id y descripcion requeridos' }, { status: 400 })
    }

    // Guardar actividad
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: actividad, error: actErr } = await (supabase as any)
      .from('lead_actividades')
      .insert({
        lead_id,
        org_id: active.org.id,
        user_id: user.id,
        tipo: tipo || 'nota',
        descripcion,
      })
      .select()
      .single()

    if (actErr) return NextResponse.json({ error: actErr.message }, { status: 500 })

    // Si hay recordatorio, guardarlo
    let recordatorio = null
    if (fecha_recordatorio) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rec } = await (supabase as any)
        .from('lead_recordatorios')
        .insert({
          lead_id,
          org_id: active.org.id,
          user_id: user.id,
          descripcion,
          fecha_recordatorio,
        })
        .select()
        .single()
      recordatorio = rec
    }

    return NextResponse.json({ ok: true, actividad, recordatorio })
  } catch (e) {
    console.error('[actividades POST]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}

// PATCH /api/leads/actividades — marcar recordatorio como completado
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()
    const { recordatorio_id } = body
    if (!recordatorio_id) return NextResponse.json({ error: 'recordatorio_id requerido' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('lead_recordatorios')
      .update({ completado: true })
      .eq('id', recordatorio_id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
