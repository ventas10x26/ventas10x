// src/app/api/pulse/onboarding/configure-agent/route.ts
// POST: configura el asistente IA del asesor KIA (onboarding demo)
// Persiste en pulse_waitlist y genera perfil/mensaje con Claude.
// EMAIL: dispara email de bienvenida en el primer onboarding con voz grabada.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

function detectarEspecializacion(texto: string): string {
  const t = texto.toLowerCase()
  if (t.includes('sportage')) return 'KIA Sportage Nuevos 🚗 (Línea SUV Premium)'
  if (t.includes('picanto')) return 'KIA Picanto Nuevos 🚗 (Línea Urban)'
  if (t.includes('k3') || t.includes('cross') || t.includes('cerato')) return 'KIA K3 & K3 Cross Nuevos 🚗 (Línea Evolution)'
  if (t.includes('niro') || t.includes('hibrid')) return 'KIA Niro Híbrido Nuevos 🚗 (Línea Eco)'
  if (t.includes('sorento')) return 'KIA Sorento Nuevos 🚗 (Línea Luxury SUV)'
  if (t.includes('ev6') || t.includes('ev9') || t.includes('electri')) return 'KIA EV6 / EV9 Eléctrico 🔋 (Línea Green-Tech)'
  return 'Portafolio Completo KIA Nuevos 🚗 (Gama Actual)'
}

function configFallback(nombre: string, estilo: string, obstaculo: string) {
  const primerNombre = nombre.trim().split(/\s+/)[0] || 'Asesor'
  const especializacion = detectarEspecializacion(`${estilo} ${obstaculo}`)
  return {
    perfil: 'Asesor de Ventas KIA 🚗',
    especializacion,
    propuesta_valor: 'Cerrar el 100% de tus leads de carros nuevos KIA en menos de 30 segundos por WhatsApp, resolver consultas sobre fichas técnicas del portafolio actual y simular financiaciones con KIA Crédito.',
    primer_mensaje: `¡Hola! Soy el asistente virtual de ${primerNombre}. Vi que estabas interesado en cotizar un nuevo KIA de nuestro catálogo actual. Te puedo enviar la ficha técnica o simular tu financiamiento con KIA Crédito al instante. ¿Te gustaría agendar un test drive esta semana? 🚗💨`,
    system_prompt: `Eres el asistente de ventas de ${nombre}, asesor KIA. Estilo: ${estilo.slice(0, 500)}. Obstáculo a resolver: ${obstaculo.slice(0, 300)}.`,
  }
}

async function generarConIA(
  nombreTrim: string, estiloTrim: string, obstaculoTrim: string,
  muestraVozTrim: string, primerNombre: string, fallback: ReturnType<typeof configFallback>
) {
  if (!process.env.ANTHROPIC_API_KEY) return fallback
  try {
    const { anthropic, CLAUDE_MODEL } = await import('@/lib/anthropic')
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      system: `Eres un experto en configuración de asistentes IA para asesores de ventas KIA en Colombia.
A partir del estilo de venta y obstáculos del asesor, genera la configuración de su agente WhatsApp.
Responde ÚNICAMENTE con JSON válido sin backticks ni texto adicional:
{
  "perfil": "título corto del perfil profesional, ej: Asesor de Ventas KIA 🚗",
  "especializacion": "línea KIA detectada con emoji",
  "propuesta_valor": "2-3 oraciones personalizadas",
  "primer_mensaje": "mensaje WhatsApp listo, máx 320 chars",
  "system_prompt": "instrucciones internas para el agente IA"
}
Tono colombiano, cercano, sin inventar precios exactos.`,
      messages: [{
        role: 'user',
        content: `Asesor: ${nombreTrim}\nEstilo de venta:\n${estiloTrim}\n\nMayor obstáculo:\n${obstaculoTrim}\n\nMuestra de voz:\n${muestraVozTrim}\n\nNombre corto: ${primerNombre}`,
      }],
    })
    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean) as Record<string, string>
    return {
      perfil:           parsed.perfil           || fallback.perfil,
      especializacion:  parsed.especializacion  || fallback.especializacion,
      propuesta_valor:  parsed.propuesta_valor  || fallback.propuesta_valor,
      primer_mensaje:   parsed.primer_mensaje   || fallback.primer_mensaje,
      system_prompt:    parsed.system_prompt    || fallback.system_prompt,
    }
  } catch (aiErr) {
    console.warn('[pulse/onboarding/configure-agent] IA fallback:', aiErr)
    return fallback
  }
}

async function persistirWaitlist(
  emailTrim: string, nombreTrim: string, metadata: Record<string, unknown>
): Promise<{ id: string | null; esNuevo: boolean }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existente, error: selectErr } = await (supabaseAdmin.from('pulse_waitlist') as any)
    .select('id, metadata')
    .ilike('email', emailTrim)
    .maybeSingle()

  if (selectErr) {
    console.error('[configure-agent] select:', selectErr)
    return { id: null, esNuevo: false }
  }

  const payload = {
    nombre: nombreTrim,
    marca: 'KIA',
    origen: 'landing_pulsemotor',
    metadata: {
      ...(existente?.metadata && typeof existente.metadata === 'object' ? existente.metadata : {}),
      ...metadata,
    },
  }

  if (existente?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .update(payload).eq('id', existente.id)
    if (updateErr) { console.error('[configure-agent] update:', updateErr); return { id: null, esNuevo: false } }
    return { id: existente.id as string, esNuevo: false }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: insertErr } = await (supabaseAdmin.from('pulse_waitlist') as any)
    .insert({ email: emailTrim, ...payload }).select('id').single()
  if (insertErr) { console.error('[configure-agent] insert:', insertErr); return { id: null, esNuevo: false } }
  return { id: (inserted?.id as string) ?? null, esNuevo: true }
}

// ── Sincronizar pulse_agentes automáticamente al completar onboarding ─────────
async function sincronizarPulseAgente(emailTrim: string): Promise<void> {
  try {
    const instanceName = emailTrim
      .replace('@', '_at_')
      .replace(/\./g, '_')
      .replace(/[^a-z0-9_]/gi, '')
      .toLowerCase()

    // Obtener user_id del usuario autenticado
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.find(u => u.email === emailTrim)
    const userId = user?.id ?? null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabaseAdmin as any
    const { data: existente } = await db
      .from('pulse_agentes')
      .select('id, user_id')
      .eq('instance_name', instanceName)
      .maybeSingle()

    if (existente) {
      // Actualizar bot_activo y user_id si falta
      const patch: Record<string, unknown> = { bot_activo: true }
      if (!existente.user_id && userId) patch.user_id = userId
      await db.from('pulse_agentes').update(patch).eq('instance_name', instanceName)
      console.log('[configure-agent] pulse_agentes actualizado:', instanceName)
    } else {
      await db.from('pulse_agentes').insert({
        user_id: userId,
        instance_name: instanceName,
        bot_activo: true,
        marca: 'KIA',
        followup_activo: true,
        followup_dia1: true,
        followup_dia3: true,
        followup_dia7: true,
        followup_msg_dia1: '¡Hola {nombre}! 👋 Soy {asesor} de KIA. Solo quería confirmar si pudiste ver la info del {modelo}. ¿Tienes alguna pregunta? 🚗',
        followup_msg_dia3: '¡Hola {nombre}! 😊 Quería saber si pudiste revisar el catálogo del {modelo}. Esta semana tenemos disponibilidad para test drive. ¿Te interesa?',
        followup_msg_dia7: 'Hola {nombre}, es mi último mensaje 🙏. Si en algún momento querés info sobre el {modelo} u otro vehículo KIA, acá estoy. ¡Que tengas un excelente día!',
      })
      console.log('[configure-agent] pulse_agentes CREADO:', instanceName)
    }
  } catch (e) {
    console.error('[configure-agent] sincronizarPulseAgente error:', e)
  }
}

function dispararEmailBienvenida(email: string, nombre: string, appUrl: string) {
  fetch(`${appUrl}/api/pulse/email-bienvenida`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, nombre }),
  }).catch((err) => console.warn('[configure-agent] email-bienvenida falló:', err))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, whatsapp, email, estilo_venta, obstaculo, muestra_voz, duracion_voz_seg } = body

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2)
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    if (!whatsapp || typeof whatsapp !== 'string' || whatsapp.replace(/\D/g, '').length < 10)
      return NextResponse.json({ error: 'WhatsApp inválido' }, { status: 400 })
    if (!email || typeof email !== 'string' || !email.includes('@'))
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    if (!estilo_venta || typeof estilo_venta !== 'string' || estilo_venta.trim().length < 8)
      return NextResponse.json({ error: 'Describe tu estilo de venta (mín. 8 caracteres)' }, { status: 400 })
    if (!obstaculo || typeof obstaculo !== 'string' || obstaculo.trim().length < 8)
      return NextResponse.json({ error: 'Describe tu mayor obstáculo (mín. 8 caracteres)' }, { status: 400 })

    const duracionOk = typeof duracion_voz_seg === 'number' && duracion_voz_seg >= 8
    const textoVozOk = typeof muestra_voz === 'string' && muestra_voz.trim().length >= 40
    if (!textoVozOk && !duracionOk)
      return NextResponse.json({ error: 'Graba al menos 8 segundos o una frase completa en el paso de voz' }, { status: 400 })

    const nombreTrim     = nombre.trim()
    const emailTrim      = email.trim().toLowerCase()
    const whatsappTrim   = whatsapp.trim()
    const estiloTrim     = estilo_venta.trim()
    const obstaculoTrim  = obstaculo.trim()
    const muestraVozTrim = (typeof muestra_voz === 'string' ? muestra_voz : '').trim()
    const duracionVoz    = typeof duracion_voz_seg === 'number' && duracion_voz_seg > 0 ? duracion_voz_seg : null
    const primerNombre   = nombreTrim.split(/\s+/)[0]

    const fallback    = configFallback(nombreTrim, estiloTrim, obstaculoTrim)
    const agentConfig = await generarConIA(nombreTrim, estiloTrim, obstaculoTrim, muestraVozTrim, primerNombre, fallback)

    const metadata = {
      onboarding_demo:  true,
      bot_activo:       true,   // ← FIX: siempre true al completar onboarding
      whatsapp:         whatsappTrim,
      estilo_venta:     estiloTrim,
      obstaculo:        obstaculoTrim,
      muestra_voz:      muestraVozTrim,
      duracion_voz_seg: duracionVoz,
      manejo_objeciones: '',
      respuestas_tipo:  '',
      agent_config:     agentConfig,
      configured_at:    new Date().toISOString(),
      updated_at:       new Date().toISOString(),
      user_agent:       req.headers.get('user-agent') || null,
    }

    const { id: agentId } = await persistirWaitlist(emailTrim, nombreTrim, metadata)

    // Sincronizar pulse_agentes en background (no bloquea la respuesta)
    sincronizarPulseAgente(emailTrim).catch(e =>
      console.error('[configure-agent] sync bg error:', e)
    )

    // Email de bienvenida
    if (textoVozOk || duracionOk) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsemotor.co'
      dispararEmailBienvenida(emailTrim, nombreTrim, appUrl)
    }

    return NextResponse.json({
      ok:       true,
      agent_id: agentId,
      saved:    !!agentId,
      ...agentConfig,
    })
  } catch (e) {
    console.error('[pulse/onboarding/configure-agent]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
