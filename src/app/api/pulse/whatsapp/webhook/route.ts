// src/app/api/pulse/whatsapp/webhook/route.ts
// Recibe mensajes entrantes de Evolution API y responde con Claude

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!

async function enviarMensaje(instanceName: string, phone: string, mensaje: string) {
  await fetch(`${EVO_URL}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
    body: JSON.stringify({
      number: phone,
      text: mensaje,
    }),
  })
}

async function obtenerAgenteConfig(instanceName: string) {
  // El instanceName es el slug del email del asesor
  // Reconstruir email aproximado para buscar en DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from('pulse_waitlist') as any)
    .select('nombre, metadata')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data) return null

  // Buscar por slug del email
  const row = data.find((r: { nombre: string; metadata: Record<string, unknown> }) => {
    const slug = r.metadata?.whatsapp_instance || ''
    return slug === instanceName
  }) || data[0] // fallback al primero si no hay match

  return row
}

async function generarRespuestaIA(
  mensajeUsuario: string,
  systemPrompt: string,
  nombreAsesor: string,
  historialChat: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const { anthropic, CLAUDE_MODEL } = await import('@/lib/anthropic')

  const messages = [
    ...historialChat.slice(-6), // últimos 6 mensajes para contexto
    { role: 'user' as const, content: mensajeUsuario },
  ]

  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 300,
    system: `${systemPrompt}

REGLAS CRÍTICAS:
- Responde SIEMPRE en español colombiano, tono cercano y natural
- Máximo 2-3 oraciones por mensaje — esto es WhatsApp, no un email
- No uses asteriscos ni markdown
- Suena como ${nombreAsesor}, no como un bot
- Si el lead pregunta precio exacto, ofrece simular la cuota con KIA Crédito
- Si quiere más info, ofrece enviar ficha técnica
- Nunca inventes datos técnicos del vehículo`,
    messages,
  })

  return msg.content[0].type === 'text' ? msg.content[0].text : null
}

// Almacén en memoria del historial de chat por número (simple, sin Redis)
// En producción usar Redis o Supabase
const chatHistory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Evolution API envía diferentes tipos de eventos
    const event = body.event || body.type
    const instanceName = body.instance || body.instanceName

    // Solo procesar mensajes entrantes
    if (event !== 'messages.upsert' && event !== 'MESSAGES_UPSERT') {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const messages = body.data?.messages || body.messages || []

    for (const msg of messages) {
      // Ignorar mensajes propios del asesor
      if (msg.key?.fromMe) continue

      // Ignorar mensajes de grupos
      if (msg.key?.remoteJid?.includes('@g.us')) continue

      const phone = msg.key?.remoteJid?.replace('@s.whatsapp.net', '') || ''
      const texto = msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption || ''

      if (!texto || !phone) continue

      // Obtener config del agente
      const agente = await obtenerAgenteConfig(instanceName)
      if (!agente) continue

      const systemPrompt = agente.metadata?.agent_config?.system_prompt ||
        `Eres el asistente de ventas de ${agente.nombre}, asesor KIA.`
      const nombreAsesor = agente.nombre || 'el asesor'

      // Obtener/crear historial
      const chatKey = `${instanceName}:${phone}`
      const historial = chatHistory.get(chatKey) || []

      // Generar respuesta con IA
      const respuesta = await generarRespuestaIA(texto, systemPrompt, nombreAsesor, historial)

      if (respuesta) {
        // Actualizar historial
        historial.push({ role: 'user', content: texto })
        historial.push({ role: 'assistant', content: respuesta })
        chatHistory.set(chatKey, historial.slice(-10)) // max 10 mensajes

        // Simular typing delay natural (1-2 segundos)
        await new Promise(r => setTimeout(r, 1200))

        // Enviar respuesta
        await enviarMensaje(instanceName, `${phone}@s.whatsapp.net`, respuesta)

        // Guardar en Supabase para el dashboard (opcional pero útil)
        console.log(`[webhook] ${instanceName} → ${phone}: ${respuesta.slice(0, 50)}...`)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[pulse/whatsapp/webhook]', e)
    return NextResponse.json({ ok: true }) // siempre 200 para Evolution API
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'pulse-whatsapp-webhook' })
}
