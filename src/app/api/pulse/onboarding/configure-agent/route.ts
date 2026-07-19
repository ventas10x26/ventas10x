// src/app/api/pulse/onboarding/configure-agent/route.ts
// POST: configura el asistente IA del asesor de vehículos nuevos (onboarding demo) —
// agnóstico de marca, ver skill pulsemotor-strategy
// Persiste en pulse_waitlist y genera perfil/mensaje con Claude.
// EMAIL: dispara email de bienvenida en el primer onboarding con voz grabada.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Detección de línea/versión SOLO para KIA — la marca líder del piloto (Almotores) tiene
// nomenclatura conocida y vale la pena el detalle. Para cualquier otra marca (o sin marca
// definida) no inventamos nombres de modelo: devolvemos un portafolio genérico de esa marca.
// Ver skill pulsemotor-strategy: "no casarse con ninguna marca de autos".
function detectarEspecializacionKIA(texto: string): string {
  const t = texto.toLowerCase()
  if (t.includes('sportage')) return 'KIA Sportage Nuevos 🚗 (Línea SUV Premium)'
  if (t.includes('picanto')) return 'KIA Picanto Nuevos 🚗 (Línea Urban)'
  if (t.includes('k3') || t.includes('cross') || t.includes('cerato')) return 'KIA K3 & K3 Cross Nuevos 🚗 (Línea Evolution)'
  if (t.includes('niro') || t.includes('hibrid')) return 'KIA Niro Híbrido Nuevos 🚗 (Línea Eco)'
  if (t.includes('sorento')) return 'KIA Sorento Nuevos 🚗 (Línea Luxury SUV)'
  if (t.includes('ev6') || t.includes('ev9') || t.includes('electri')) return 'KIA EV6 / EV9 Eléctrico 🔋 (Línea Green-Tech)'
  return 'Portafolio Completo KIA Nuevos 🚗 (Gama Actual)'
}

function detectarEspecializacion(texto: string, marca: string): string {
  if (marca.toUpperCase() === 'KIA') return detectarEspecializacionKIA(texto)
  return `Portafolio de ${marca} Nuevos 🚗 (Gama Actual)`
}

function configFallback(nombre: string, estilo: string, obstaculo: string, marcaInput: string) {
  const marca = marcaInput.trim() || 'tu marca'
  const primerNombre = nombre.trim().split(/\s+/)[0] || 'Asesor'
  const especializacion = detectarEspecializacion(`${estilo} ${obstaculo}`, marca)
  return {
    perfil: `Asesor de Ventas ${marca} 🚗`,
    especializacion,
    propuesta_valor: `Cerrar el 100% de tus leads de carros nuevos ${marca} en menos de 30 segundos por WhatsApp y resolver consultas sobre fichas técnicas del portafolio actual.`,
    primer_mensaje: `¡Hola! Soy el asistente virtual de ${primerNombre}. Vi que estabas interesado en cotizar un ${marca} nuevo de nuestro catálogo actual. Te puedo enviar la ficha técnica o simular tu financiamiento al instante. ¿Te gustaría agendar un test drive esta semana? 🚗💨`,
    system_prompt: `Eres el asistente de ventas de ${nombre}, asesor ${marca}. Estilo: ${estilo.slice(0, 500)}. Obstáculo a resolver: ${obstaculo.slice(0, 300)}.`,
  }
}

async function generarConIA(
  nombreTrim: string, marcaTrim: string, estiloTrim: string, obstaculoTrim: string,
  muestraVozTrim: string, primerNombre: string, fallback: ReturnType<typeof configFallback>
) {
  if (!process.env.ANTHROPIC_API_KEY) return fallback
  const marca = marcaTrim || 'la marca del asesor (no especificada — no asumas ninguna)'
  try {
    const { anthropic, CLAUDE_MODEL } = await import('@/lib/anthropic')
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      system: `Eres un experto en configuración de asistentes IA para asesores de ventas de vehículos nuevos en Colombia.
El asesor vende la marca: ${marca}. Nunca asumas otra marca ni inventes modelos que no correspondan a ella.
A partir del estilo de venta y obstáculos del asesor, genera la configuración de su agente WhatsApp.
Responde ÚNICAMENTE con JSON válido sin backticks ni texto adicional:
{
  "perfil": "título corto del perfil profesional, ej: Asesor de Ventas ${marca} 🚗",
  "especializacion": "línea de ${marca} detectada con emoji",
  "propuesta_valor": "2-3 oraciones personalizadas",
  "primer_mensaje": "mensaje WhatsApp listo, máx 320 chars",
  "system_prompt": "instrucciones internas para el agente IA"
}
Tono colombiano, cercano, sin inventar precios exactos.`,
      messages: [{
        role: 'user',
        content: `Asesor: ${nombreTrim}\nMarca: ${marca}\nEstilo de venta:\n${estiloTrim}\n\nMayor obstáculo:\n${obstaculoTrim}\n\nMuestra de voz:\n${muestraVozTrim}\n\nNombre corto: ${primerNombre}`,
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
  emailTrim: string, nombreTrim: string, marcaTrim: string, metadata: Record<string, unknown>
): Promise<{ id: string | null; esNuevo: boolean }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existente, error: selectErr } = await (supabaseAdmin.from('pulse_waitlist') as any)
    .select('id, metadata, marca')
    .ilike('email', emailTrim)
    .maybeSingle()

  if (selectErr) {
    console.error('[configure-agent] select:', selectErr)
    return { id: null, esNuevo: false }
  }

  const payload = {
    nombre: nombreTrim,
    // Nunca pisar una marca real ya guardada con un valor vacío del formulario.
    marca: marcaTrim || existente?.marca || null,
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
async function sincronizarPulseAgente(emailTrim: string, marcaTrim: string): Promise<void> {
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
      .select('id, user_id, marca')
      .eq('instance_name', instanceName)
      .maybeSingle()

    const marcaFinal = marcaTrim || 'tu marca'

    if (existente) {
      // Actualizar bot_activo, user_id si falta, y marca solo si aún no tenía una real
      const patch: Record<string, unknown> = { bot_activo: true }
      if (!existente.user_id && userId) patch.user_id = userId
      if (marcaTrim && !existente.marca) patch.marca = marcaTrim
      await db.from('pulse_agentes').update(patch).eq('instance_name', instanceName)
      console.log('[configure-agent] pulse_agentes actualizado:', instanceName)
    } else {
      await db.from('pulse_agentes').insert({
        user_id: userId,
        instance_name: instanceName,
        bot_activo: true,
        marca: marcaFinal,
        followup_activo: true,
        followup_dia1: true,
        followup_dia3: true,
        followup_dia7: true,
        followup_msg_dia1: `¡Hola {nombre}! 👋 Soy {asesor} de ${marcaFinal}. Solo quería confirmar si pudiste ver la info del {modelo}. ¿Tienes alguna pregunta? 🚗`,
        followup_msg_dia3: `¡Hola {nombre}! 😊 Quería saber si pudiste revisar el catálogo del {modelo}. Esta semana tenemos disponibilidad para test drive. ¿Te interesa?`,
        followup_msg_dia7: `Hola {nombre}, es mi último mensaje 🙏. Si en algún momento querés info sobre el {modelo} u otro vehículo de ${marcaFinal}, acá estoy. ¡Que tengas un excelente día!`,
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

// Si el formulario no mandó marca, revisamos si ya quedó guardada en el signup
// (user_metadata.pulse_marca) antes de recurrir a un genérico — nunca a "KIA" por default.
async function resolverMarcaFallback(emailTrim: string): Promise<string> {
  try {
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.find(u => u.email === emailTrim)
    const marca = user?.user_metadata?.pulse_marca
    return typeof marca === 'string' && marca.trim() ? marca.trim() : ''
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nombre, whatsapp, email, estilo_venta, obstaculo, muestra_voz, duracion_voz_seg, marca } = body

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
    const marcaTrim      = (typeof marca === 'string' ? marca.trim() : '') || await resolverMarcaFallback(emailTrim)

    const fallback    = configFallback(nombreTrim, estiloTrim, obstaculoTrim, marcaTrim)
    const agentConfig = await generarConIA(nombreTrim, marcaTrim, estiloTrim, obstaculoTrim, muestraVozTrim, primerNombre, fallback)

    const metadata = {
      onboarding_demo:  true,
      bot_activo:       true,   // ← FIX: siempre true al completar onboarding
      marca:            marcaTrim || undefined,
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

    const { id: agentId } = await persistirWaitlist(emailTrim, nombreTrim, marcaTrim, metadata)

    // Sincronizar pulse_agentes en background (no bloquea la respuesta)
    sincronizarPulseAgente(emailTrim, marcaTrim).catch(e =>
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
