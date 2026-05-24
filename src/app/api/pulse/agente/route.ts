// GET: carga configuración del agente IA del asesor (pulse_waitlist.metadata)
// PUT: guarda personalización (voz, objeciones, prompts, etc.)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import {
  dtoToMetadata,
  metadataToDTO,
  type PulseAgenteDTO,
  type PulseAgentMetadata,
  type PulseVozMuestraPublica,
} from '@/lib/pulse-agent'
import { historialConUrlsFirmadas } from '@/lib/pulse-voz-storage'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function resolverEmail(req: NextRequest): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email) return user.email.trim().toLowerCase()

  const q = req.nextUrl.searchParams.get('email')
  if (q && q.includes('@')) return q.trim().toLowerCase()

  return null
}

async function cargarPorEmail(email: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin.from('pulse_waitlist') as any)
    .select('id, email, nombre, metadata')
    .ilike('email', email)
    .maybeSingle()

  if (error) {
    console.error('[pulse/agente] select:', error)
    return { row: null, error: error.message }
  }
  return { row: data, error: null }
}

export async function GET(req: NextRequest) {
  try {
    const email = await resolverEmail(req)
    if (!email) {
      return NextResponse.json(
        { error: 'Inicia sesión o indica el email del onboarding' },
        { status: 401 }
      )
    }

    const { row, error } = await cargarPorEmail(email)
    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    const agente = metadataToDTO(row, email)
    if (!agente) {
      return NextResponse.json({
        ok: true,
        agente: null,
        message: 'Aún no configuraste tu agente. Completa el onboarding demo primero.',
      })
    }

    const meta = (row.metadata && typeof row.metadata === 'object'
      ? row.metadata
      : {}) as PulseAgentMetadata

    let voz_historial = await historialConUrlsFirmadas(supabaseAdmin, meta)

    if (voz_historial.length === 0 && agente.muestra_voz.trim()) {
      const legacy: PulseVozMuestraPublica = {
        id: 'legacy-inicial',
        created_at: agente.configured_at || agente.updated_at || new Date().toISOString(),
        transcripcion: agente.muestra_voz,
        duracion_seg: agente.duracion_voz_seg ?? 0,
        storage_path: null,
        solo_transcripcion: true,
        origen: 'onboarding',
        audio_url: null,
      }
      voz_historial = [legacy]
    }

    return NextResponse.json({ ok: true, agente: { ...agente, voz_historial } })
  } catch (e) {
    console.error('[pulse/agente GET]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}

async function regenerarConIA(
  nombre: string,
  meta: PulseAgentMetadata
): Promise<PulseAgentMetadata['agent_config']> {
  const { anthropic, CLAUDE_MODEL } = await import('@/lib/anthropic')
  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1400,
    system: `Experto en asistentes IA para asesores KIA Colombia.
Responde SOLO JSON válido:
{
  "perfil": "string",
  "especializacion": "string",
  "propuesta_valor": "string",
  "primer_mensaje": "string max 320 chars",
  "system_prompt": "instrucciones internas detalladas"
}`,
    messages: [
      {
        role: 'user',
        content: `Asesor: ${nombre}
Estilo: ${meta.estilo_venta || ''}
Obstáculo: ${meta.obstaculo || ''}
Voz: ${meta.muestra_voz || ''}
Objeciones: ${meta.manejo_objeciones || ''}
Respuestas tipo: ${meta.respuestas_tipo || ''}`,
      },
    ],
  })
  const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(clean)
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const emailBody = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null
    const emailAuth = await resolverEmail(req)
    const email = emailAuth || emailBody

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 401 })
    }

    const { row, error: selectErr } = await cargarPorEmail(email)
    if (selectErr) {
      return NextResponse.json({ error: selectErr }, { status: 500 })
    }
    if (!row?.id) {
      return NextResponse.json(
        { error: 'No encontramos tu agente. Completa primero /pulse/onboarding-demo' },
        { status: 404 }
      )
    }

    const prevMeta = (row.metadata && typeof row.metadata === 'object'
      ? row.metadata
      : {}) as PulseAgentMetadata

    const patch = body as Partial<PulseAgenteDTO>
    let meta = dtoToMetadata(
      {
        ...metadataToDTO(row, email)!,
        ...patch,
        nombre: patch.nombre ?? row.nombre,
      },
      prevMeta
    )

    if (body.regenerar_ia === true && process.env.ANTHROPIC_API_KEY) {
      try {
        const cfg = await regenerarConIA(patch.nombre || row.nombre, meta)
        meta = { ...meta, agent_config: { ...meta.agent_config!, ...cfg } }
      } catch (aiErr) {
        console.warn('[pulse/agente] regenerar_ia:', aiErr)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .update({
        nombre: (patch.nombre || row.nombre || '').trim() || row.nombre,
        metadata: meta,
      })
      .eq('id', row.id)

    if (updateErr) {
      console.error('[pulse/agente] update:', updateErr)
      return NextResponse.json({ error: 'No pudimos guardar los cambios' }, { status: 500 })
    }

    const agente = metadataToDTO(
      { id: row.id, email: row.email, nombre: patch.nombre || row.nombre, metadata: meta },
      email
    )

    return NextResponse.json({ ok: true, agente })
  } catch (e) {
    console.error('[pulse/agente PUT]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}
