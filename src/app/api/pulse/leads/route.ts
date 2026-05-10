// Ruta destino: src/app/api/pulse/leads/route.ts
//
// GET:  lista de leads del vendedor autenticado
// POST: crear nuevo lead manual
//
// Nota: la clasificación con IA (extraer nombre/teléfono/modelo) viene en Pack 3.
// Este endpoint solo guarda el texto crudo + datos básicos por ahora.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

// =====================================================
// GET: lista de leads del vendedor
// =====================================================
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('pulse_leads') as any)
      .select('id, nombre, telefono, modelo, score, estado, texto_origen, canal, capturado_at, contactado_at, created_at')
      .eq('vendedor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[pulse/leads GET] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, leads: data || [] })
  } catch (e) {
    console.error('[pulse/leads GET]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}

// =====================================================
// POST: crear nuevo lead manual
// =====================================================
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { texto_origen, canal } = body

    // Validaciones
    if (!texto_origen || typeof texto_origen !== 'string' || texto_origen.trim().length < 10) {
      return NextResponse.json(
        { error: 'El texto del lead es muy corto. Pegá al menos un par de líneas.' },
        { status: 400 }
      )
    }

    // Obtener org activa
    const active = await getActiveOrg()
    if (!active) {
      return NextResponse.json(
        { error: 'No se encontró organización activa. Completá tu perfil primero.' },
        { status: 400 }
      )
    }

    // Por ahora guardamos sin clasificar.
    // En Pack 3 agregamos llamada a Anthropic para extraer nombre/teléfono/modelo/score.
    const nuevoLead = {
      vendedor_id: user.id,
      org_id: active.org.id,
      texto_origen: texto_origen.trim(),
      canal: canal || 'otro',
      estado: 'nuevo',
      capturado_at: new Date().toISOString(),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lead, error: insertErr } = await (supabase.from('pulse_leads') as any)
      .insert(nuevoLead)
      .select('id, created_at')
      .single()

    if (insertErr) {
      console.error('[pulse/leads POST] insert error:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // Registrar evento (no bloqueante si falla)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('pulse_eventos') as any).insert({
        lead_id: lead.id,
        vendedor_id: user.id,
        tipo: 'lead_capturado',
        payload: { canal: canal || 'otro' },
      })
    } catch (evErr) {
      console.error('[pulse/leads POST] evento error:', evErr)
    }

    return NextResponse.json({
      ok: true,
      lead_id: lead.id,
      created_at: lead.created_at,
    })
  } catch (e) {
    console.error('[pulse/leads POST]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}
