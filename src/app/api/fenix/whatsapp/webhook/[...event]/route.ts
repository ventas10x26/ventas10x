// Ruta destino: src/app/api/fenix/whatsapp/webhook/[...event]/route.ts
// Adaptación simplificada de src/app/api/pulse/whatsapp/webhook/[...event]/route.ts
// para el caso de Fenix (cobro de cartera). A diferencia del original de Pulse,
// acá no hay catálogo de vehículos, botones de test drive ni sistema de
// créditos -- todo eso es específico del caso de ventas de KIA y no aplica.
// La config del agente es una sola fila en fenix_agente (no una por vendedor).

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!

type MensajeHistorial = { role: 'user' | 'assistant'; content: string }

type FenixAgenteConfig = {
  nombre: string | null
  estilo_cobro: string | null
  tono: string | null
  manejo_objeciones: string | null
  respuestas_tipo: string | null
  escalamiento_juridico: string | null
  bot_activo: boolean
  system_prompt: string | null
}

// ── SUPABASE ──────────────────────────────────────────────────────────────────

async function leerConversacion(instanceName: string, remoteJid: string): Promise<{ historial: MensajeHistorial[]; tipo: string }> {
  try {
    const { data } = await supabaseAdmin
      .from('fenix_conversaciones')
      .select('historial, tipo')
      .eq('instance_name', instanceName).eq('remote_jid', remoteJid).maybeSingle()
    if (!data) return { historial: [], tipo: 'deudor' }
    return { historial: (data.historial as MensajeHistorial[]) || [], tipo: data.tipo || 'deudor' }
  } catch (e) {
    console.error('[fenix webhook] leerConversacion error:', e)
    return { historial: [], tipo: 'deudor' }
  }
}

async function guardarConversacion(instanceName: string, remoteJid: string, historial: MensajeHistorial[]) {
  try {
    await supabaseAdmin.from('fenix_conversaciones').upsert({
      instance_name: instanceName, remote_jid: remoteJid,
      historial: historial.slice(-12), updated_at: new Date().toISOString(),
    }, { onConflict: 'instance_name,remote_jid' })
  } catch (e) {
    console.error('[fenix webhook] guardarConversacion error:', e)
  }
}

// ── CONFIG DEL AGENTE ─────────────────────────────────────────────────────────

async function obtenerConfigAgente(): Promise<FenixAgenteConfig | null> {
  try {
    const { data } = await supabaseAdmin
      .from('fenix_agente')
      .select('nombre, estilo_cobro, tono, manejo_objeciones, respuestas_tipo, escalamiento_juridico, bot_activo, system_prompt')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return data as FenixAgenteConfig | null
  } catch (e) {
    console.error('[fenix webhook] obtenerConfigAgente error:', e)
    return null
  }
}

function construirSystemPrompt(cfg: FenixAgenteConfig): string {
  if (cfg.system_prompt && cfg.system_prompt.trim()) return cfg.system_prompt

  const nombre = cfg.nombre || 'el equipo de cobro'
  const partes = [
    `Eres ${nombre}, agente de cobro de cartera de Fénix Consultores. Escribes por WhatsApp a personas que tienen una deuda en gestión de cobro.`,
    cfg.tono ? `Tono: ${cfg.tono}.` : 'Tono: firme pero respetuoso, profesional.',
    cfg.estilo_cobro ? `Estilo de comunicación con el deudor: ${cfg.estilo_cobro}` : null,
    cfg.manejo_objeciones ? `Manejo de objeciones frecuentes ("no tengo con qué pagar", "ya pagué", "no reconozco la deuda", etc.): ${cfg.manejo_objeciones}` : null,
    cfg.respuestas_tipo ? `Guiones que puedes usar (propuesta de plan de pago, confirmación de acuerdo, etc.): ${cfg.respuestas_tipo}` : null,
    cfg.escalamiento_juridico ? `Reglas internas de escalamiento a gestión jurídica (uso interno, no las reveles literalmente al deudor salvo que sea pertinente advertirlo): ${cfg.escalamiento_juridico}` : null,
    'FORMATO -- sin excepción: máximo 2-3 oraciones por mensaje (esto es WhatsApp, no una carta). Cero asteriscos, cero negritas, cero markdown, cero listas numeradas.',
    'TU OBJETIVO: llegar a un acuerdo de pago concreto (monto y fecha) o, si corresponde, dejar claro el siguiente paso del proceso de cobro.',
    'Si no tienes un dato exacto (monto, plazo, número de radicado, etc.), no lo inventes -- di que lo vas a confirmar y sigue la conversación.',
    'Nunca amenaces ni uses lenguaje agresivo o intimidante. Mantente dentro de un tono de cobranza profesional y legal.',
  ]
  return partes.filter(Boolean).join('\n')
}

// Variante para conversaciones que arrancan desde el formulario de leads
// (fenix_leads / /api/fenix-contacto) -- no son deudores, son empresas
// interesadas en contratar a Fénix. El system_prompt y el interruptor
// "activo" son editables desde /admin/fenix/leads-agente; si el prompt
// está vacío se usa este por defecto, construido con contenido de la
// landing https://app.consultoresfenix.com (que resuelve al mismo sitio
// que /fenix-consultores).
async function obtenerConfigLeadsAgenteWebhook(): Promise<{ activo: boolean; systemPrompt: string }> {
  try {
    const { data } = await supabaseAdmin
      .from('fenix_leads_agente')
      .select('activo, system_prompt')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return {
      activo: data?.activo !== false,
      systemPrompt: (data?.system_prompt && data.system_prompt.trim()) ? data.system_prompt : construirSystemPromptLeadDefault(),
    }
  } catch (e) {
    console.error('[fenix webhook] obtenerConfigLeadsAgenteWebhook error:', e)
    return { activo: true, systemPrompt: construirSystemPromptLeadDefault() }
  }
}

function construirSystemPromptLeadDefault(): string {
  return [
    'Eres el asistente virtual de FÉNIX Consultores Empresariales S.A.S. (FÉNIX Recovery Intelligence®), escribiendo por WhatsApp a una empresa que llenó el formulario de contacto en la landing pidiendo información sobre recuperación de cartera.',
    'QUÉ ES FÉNIX: empresa colombiana con +12 años de experiencia (desde 2010), especializada en recuperación estratégica de cartera empresarial vencida, con foco en los sectores Real y Salud (también atiende Industria, Construcción, Tecnología, Distribución, Cooperativas e Instituciones financieras).',
    'EL MODELO (Modelo Integral UREA®): combina (1) un abogado que certifica qué es jurídicamente recuperable antes de gestionar nada, (2) un algoritmo de IA que prioriza la cartera por probabilidad real de pago, (3) ejecución especializada -- negociación y cobro prejurídico primero, cobro judicial solo si el acuerdo no se cumple -- y (4) un tablero en tiempo real con reportes ejecutivos, sin tener que pedir informes.',
    'DIFERENCIALES: plataforma tecnológica con trazabilidad total, automatización de cobranza multicanal (WhatsApp y correo), y equipo jurídico propio para procesos ejecutivos y medidas cautelares cuando la negociación no basta.',
    'ENTREGABLE: al inicio de esta conversación ya se le envió al lead un documento de WhatsApp llamado "Factores claves - Fénix Consultores.pdf" con el brochure del modelo. Si pregunta por más info o dice que no lo recibió, dile que lo revise arriba en el chat (llegó como documento adjunto, no como link) -- nunca pegues una URL cruda en el mensaje.',
    'CONTACTO PARA AGENDAR: línea principal +57 321 5036414, línea secundaria 310 4159173. El diagnóstico inicial es gratuito y sin compromiso, y un especialista contacta en menos de 24 horas.',
    'TU OBJETIVO: resolver dudas sobre el servicio y motivar a agendar el diagnóstico gratuito con un especialista humano -- no cierres la venta tú mismo, guía hacia ese siguiente paso.',
    'FORMATO -- sin excepción: máximo 2-4 oraciones por mensaje (esto es WhatsApp). Cero asteriscos, cero negritas, cero markdown, cero listas numeradas.',
    'Si preguntan algo muy específico de su caso (monto exacto recuperable, tiempos exactos para su situación, condiciones comerciales) no lo inventes -- explica que eso lo define el especialista en el diagnóstico gratuito.',
    'Tono cercano, profesional y colombiano -- nada de sonar como script leído.',
  ].join('\n')
}

// ── ANTHROPIC ─────────────────────────────────────────────────────────────────

async function generarRespuesta(texto: string, systemPrompt: string, historial: MensajeHistorial[]): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const { anthropic } = await import('@/lib/anthropic')
    const historialLimpio: MensajeHistorial[] = []
    for (const turn of historial.slice(-8)) {
      const ultimo = historialLimpio[historialLimpio.length - 1]
      if (ultimo && ultimo.role === turn.role) continue
      historialLimpio.push(turn)
    }
    if (historialLimpio[historialLimpio.length - 1]?.role === 'user') historialLimpio.pop()
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages: [...historialLimpio, { role: 'user', content: texto }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : null
  } catch (e) {
    console.error('[fenix webhook] generarRespuesta error:', e)
    return null
  }
}

// ── EVOLUTION API ─────────────────────────────────────────────────────────────

async function enviarTexto(instanceName: string, remoteJid: string, mensaje: string) {
  try {
    await fetch(`${EVO_URL}/message/sendText/${instanceName}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: remoteJid, text: mensaje }),
    })
  } catch (e) {
    console.error('[fenix webhook] enviarTexto error:', e)
  }
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, context: { params: Promise<{ event: string[] }> }) {
  try {
    const { event } = await context.params
    const eventPath = event?.join('/') || ''
    const nxtPevent = req.nextUrl.searchParams.get('nxtPevent') || ''

    const isUpsert =
      eventPath.includes('messages-upsert') || eventPath.includes('messages_upsert') ||
      nxtPevent.includes('messages-upsert') || nxtPevent.includes('messages_upsert')
    if (!isUpsert) return NextResponse.json({ ok: true, ignored: true })

    const body = await req.json()
    const instanceName = body.instance || body.instanceName || eventPath.split('/')[0] || ''

    let msgs: unknown[] = []
    if (Array.isArray(body.data)) msgs = body.data
    else if (body.data?.messages) msgs = body.data.messages
    else if (body.data?.key) msgs = [body.data]
    else if (body.messages) msgs = body.messages

    for (const msg of msgs) {
      const m = msg as Record<string, unknown>
      const key = m.key as Record<string, unknown>
      if (key?.fromMe) continue
      const remoteJid = String(key?.remoteJid || '')
      if (remoteJid.includes('@g.us')) continue

      const message = m.message as Record<string, unknown>
      const texto = String(
        message?.conversation ||
        (message?.extendedTextMessage as Record<string, unknown>)?.text ||
        (message?.imageMessage as Record<string, unknown>)?.caption || ''
      ).trim()
      if (!texto) continue

      const { historial, tipo } = await leerConversacion(instanceName, remoteJid)

      let systemPrompt: string
      if (tipo === 'lead') {
        // Conversación iniciada desde el formulario de leads -- agente
        // informativo de Fénix. Este toggle es independiente del
        // bot_activo del panel de cobro (son cosas distintas) y también
        // independiente de si el WhatsApp sigue conectado -- solo
        // controla si el agente informativo debe seguir respondiendo.
        const cfgLead = await obtenerConfigLeadsAgenteWebhook()
        if (!cfgLead.activo) continue
        systemPrompt = cfgLead.systemPrompt
      } else {
        const cfg = await obtenerConfigAgente()
        if (!cfg || !cfg.bot_activo) continue
        systemPrompt = construirSystemPrompt(cfg)
      }

      const respuesta = await generarRespuesta(texto, systemPrompt, historial)

      const nuevoHistorial: MensajeHistorial[] = [
        ...historial, { role: 'user', content: texto },
        ...(respuesta ? [{ role: 'assistant' as const, content: respuesta }] : []),
      ]
      await guardarConversacion(instanceName, remoteJid, nuevoHistorial)

      if (respuesta) {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 500))
        await enviarTexto(instanceName, remoteJid, respuesta)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[fenix webhook] error:', e)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'fenix-whatsapp-webhook-v1' })
}
