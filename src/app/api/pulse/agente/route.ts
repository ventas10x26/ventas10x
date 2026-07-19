// src/app/api/pulse/agente/route.ts
// GET: carga configuración del agente IA del asesor (pulse_waitlist.metadata)
// PUT: guarda personalización + upsert automático en pulse_agentes

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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolverEmail(req: NextRequest): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email) return user.email.trim().toLowerCase()

  const q = req.nextUrl.searchParams.get('email')
  if (q && q.includes('@')) return q.trim().toLowerCase()

  return null
}

async function resolverUserId(req: NextRequest): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// Marca real capturada en /pulse/signup (user_metadata.pulse_marca) — nunca asumir KIA
// como default (ver skill pulsemotor-strategy, "no casarse con ninguna marca de autos").
async function resolverMarcaAuth(req: NextRequest): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const marca = user?.user_metadata?.pulse_marca
  return typeof marca === 'string' && marca.trim() ? marca.trim() : null
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

// ── Sincronizar pulse_agentes automáticamente ─────────────────────────────────
// Se llama en cada PUT para garantizar que el registro exista
async function sincronizarPulseAgente(
  email: string,
  userId: string | null,
  botActivo: boolean,
  marca: string | null
): Promise<void> {
  try {
    // Derivar instance_name del email (igual que el webhook)
    const instanceName = email
      .toLowerCase()
      .replace('@', '_at_')
      .replace(/\./g, '_')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseAdmin as any

    // Verificar si ya existe
    const { data: existente } = await db
      .from('pulse_agentes')
      .select('id, user_id, marca')
      .eq('instance_name', instanceName)
      .maybeSingle()

    const marcaFinal = marca || 'tu marca'

    if (existente) {
      // Actualizar user_id si falta, bot_activo, y marca solo si aún no tenía una real
      const patch: Record<string, unknown> = { bot_activo: botActivo }
      if (!existente.user_id && userId) patch.user_id = userId
      if (marca && !existente.marca) patch.marca = marca
      await db
        .from('pulse_agentes')
        .update(patch)
        .eq('instance_name', instanceName)
      console.log('[pulse/agente] pulse_agentes actualizado:', instanceName)
    } else {
      // Crear nuevo registro con defaults — marca real del asesor, nunca hardcodeada
      await db
        .from('pulse_agentes')
        .insert({
          user_id: userId,
          instance_name: instanceName,
          bot_activo: botActivo,
          marca: marcaFinal,
          followup_activo: true,
          followup_dia1: true,
          followup_dia3: true,
          followup_dia7: true,
          followup_msg_dia1: `¡Hola {nombre}! 👋 Soy {asesor} de ${marcaFinal}. Solo quería confirmar si pudiste ver la info del {modelo}. ¿Tienes alguna pregunta? 🚗`,
          followup_msg_dia3: `¡Hola {nombre}! 😊 Quería saber si pudiste revisar el catálogo del {modelo}. Esta semana tenemos disponibilidad para test drive. ¿Te interesa?`,
          followup_msg_dia7: `Hola {nombre}, es mi último mensaje 🙏. Si en algún momento querés info sobre el {modelo} u otro vehículo de ${marcaFinal}, acá estoy. ¡Que tengas un excelente día!`,
        })
      console.log('[pulse/agente] pulse_agentes CREADO:', instanceName)
    }
  } catch (e) {
    // No romper el flujo principal si esto falla
    console.error('[pulse/agente] sincronizarPulseAgente error:', e)
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

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

    // Sincronizar pulse_agentes en el GET también (garantiza existencia al cargar la página)
    const userId = await resolverUserId(req)
    const botActivo = (meta as any)?.bot_activo !== false
    const marcaAuth = await resolverMarcaAuth(req)
    sincronizarPulseAgente(email, userId, botActivo, agente.marca || marcaAuth).catch(e =>
      console.error('[pulse/agente GET] sync bg error:', e)
    )

    return NextResponse.json({ ok: true, agente: { ...agente, voz_historial } })
  } catch (e) {
    console.error('[pulse/agente GET]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}

// ── PUT ───────────────────────────────────────────────────────────────────────

async function regenerarConIA(
  nombre: string,
  meta: PulseAgentMetadata
): Promise<PulseAgentMetadata['agent_config']> {
  const marca = meta.marca?.trim() || 'vehículos nuevos (marca no especificada por el asesor)'
  const { anthropic, CLAUDE_MODEL } = await import('@/lib/anthropic')
  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1400,
    system: `Experto en asistentes IA para asesores de venta de vehículos nuevos en Colombia.
Genera la configuración para un asesor de la marca: ${marca}. Nunca asumas otra marca.
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
Marca: ${marca}
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

    // ── Sincronizar pulse_agentes automáticamente ──────────────────────────
    const userId = await resolverUserId(req)
    const botActivo = (meta as any)?.bot_activo !== false
    const marcaAuth = await resolverMarcaAuth(req)
    await sincronizarPulseAgente(email, userId, botActivo, meta.marca || marcaAuth)

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
