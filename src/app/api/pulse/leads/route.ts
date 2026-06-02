// src/app/api/pulse/leads/route.ts
//
// GET:  lista de leads del vendedor autenticado
// POST: crear nuevo lead manual con extracción IA de datos

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
// Extraer datos del lead con IA
// =====================================================
interface LeadExtraido {
  nombre: string
  telefono: string | null
  modelo: string | null
  urgencia: string
  score: number
}

async function extraerDatosLead(texto: string): Promise<LeadExtraido> {
  const fallback: LeadExtraido = {
    nombre: 'Sin nombre',
    telefono: null,
    modelo: null,
    urgencia: 'media',
    score: 5,
  }

  try {
    const { anthropic } = await import('@/lib/anthropic')
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: `Extrae datos de un lead automotriz. Responde SOLO con JSON válido, sin explicaciones ni markdown.
Formato exacto:
{
  "nombre": "nombre completo o 'Sin nombre'",
  "telefono": "solo dígitos con código país colombiano ej: 573001234567, o null si no hay",
  "modelo": "modelo de auto mencionado o null",
  "urgencia": "alta | media | baja según el texto",
  "score": número del 1 al 10 según intención de compra
}`,
      messages: [
        { role: 'user', content: texto },
      ],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return {
      nombre: parsed.nombre || fallback.nombre,
      telefono: parsed.telefono || null,
      modelo: parsed.modelo || null,
      urgencia: ['alta', 'media', 'baja'].includes(parsed.urgencia) ? parsed.urgencia : 'media',
      score: typeof parsed.score === 'number' ? Math.min(10, Math.max(1, parsed.score)) : 5,
    }
  } catch (e) {
    console.error('[pulse/leads] extraerDatosLead error:', e)
    return fallback
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

    if (!texto_origen || typeof texto_origen !== 'string' || texto_origen.trim().length < 10) {
      return NextResponse.json(
        { error: 'El texto del lead es muy corto. Pegá al menos un par de líneas.' },
        { status: 400 }
      )
    }

    const active = await getActiveOrg()
    if (!active) {
      return NextResponse.json(
        { error: 'No se encontró organización activa. Completá tu perfil primero.' },
        { status: 400 }
      )
    }

    // Extraer datos con IA
    console.log('[pulse/leads POST] extrayendo datos con IA...')
    const extraido = await extraerDatosLead(texto_origen.trim())
    console.log('[pulse/leads POST] extraído:', extraido)

    const nuevoLead = {
      vendedor_id: user.id,
      org_id: active.org.id,
      texto_origen: texto_origen.trim(),
      canal: canal || 'otro',
      estado: 'nuevo',
      capturado_at: new Date().toISOString(),
      // Datos extraídos por IA
      nombre: extraido.nombre,
      telefono: extraido.telefono,
      modelo: extraido.modelo,
      urgencia: extraido.urgencia,
      score: extraido.score,
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

    // Registrar evento (no bloqueante)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('pulse_eventos') as any).insert({
        lead_id: lead.id,
        vendedor_id: user.id,
        tipo: 'lead_capturado',
        payload: { canal: canal || 'otro', score: extraido.score },
      })
    } catch (evErr) {
      console.error('[pulse/leads POST] evento error:', evErr)
    }

    return NextResponse.json({
      ok: true,
      lead_id: lead.id,
      created_at: lead.created_at,
      extraido,
    })
  } catch (e) {
    console.error('[pulse/leads POST]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}
