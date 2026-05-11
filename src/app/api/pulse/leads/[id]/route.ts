// Ruta destino: src/app/api/pulse/leads/[id]/route.ts
//
// PATCH: actualizar campos del lead (estado, contactado_at, etc.)
// GET:   obtener un lead específico

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ESTADOS_VALIDOS = ['nuevo', 'contactado', 'interesado', 'test_drive', 'cerrado', 'perdido']
const CAMPOS_PERMITIDOS = ['estado', 'contactado_at', 'cerrado_at', 'notas']

// =====================================================
// PATCH: actualizar lead
// =====================================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    
    // Filtrar solo campos permitidos
    const updates: Record<string, string | null> = {}
    for (const campo of CAMPOS_PERMITIDOS) {
      if (campo in body) {
        updates[campo] = body[campo]
      }
    }

    // Validar estado si viene
    if (updates.estado && !ESTADOS_VALIDOS.includes(updates.estado)) {
      return NextResponse.json(
        { error: `Estado inválido. Válidos: ${ESTADOS_VALIDOS.join(', ')}` },
        { status: 400 }
      )
    }

    // Si pasa a 'cerrado' y no tiene cerrado_at, lo marcamos
    if (updates.estado === 'cerrado' && !updates.cerrado_at) {
      updates.cerrado_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    // Verificar ownership y obtener estado anterior
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: leadAnterior, error: ownerErr } = await (supabase.from('pulse_leads') as any)
      .select('id, estado, contactado_at')
      .eq('id', id)
      .eq('vendedor_id', user.id)
      .single()

    if (ownerErr || !leadAnterior) {
      return NextResponse.json({ error: 'Lead no encontrado o sin permisos' }, { status: 404 })
    }

    // Update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: leadActualizado, error: updateErr } = await (supabase.from('pulse_leads') as any)
      .update(updates)
      .eq('id', id)
      .eq('vendedor_id', user.id)
      .select('*')
      .single()

    if (updateErr) {
      console.error('[pulse/leads PATCH] update error:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Registrar evento si cambió el estado
    if (updates.estado && updates.estado !== leadAnterior.estado) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('pulse_eventos') as any).insert({
          lead_id: id,
          vendedor_id: user.id,
          tipo: 'estado_cambiado',
          payload: { de: leadAnterior.estado, a: updates.estado },
        })
      } catch (evErr) {
        console.error('[pulse/leads PATCH] evento error:', evErr)
      }
    }

    return NextResponse.json({ ok: true, lead: leadActualizado })
  } catch (e) {
    console.error('[pulse/leads PATCH]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}

// =====================================================
// GET: obtener un lead específico
// =====================================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lead, error } = await (supabase.from('pulse_leads') as any)
      .select('*')
      .eq('id', id)
      .eq('vendedor_id', user.id)
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, lead })
  } catch (e) {
    console.error('[pulse/leads GET id]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}