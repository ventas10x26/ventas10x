// src/app/api/pulse/whatsapp/webhook/[...event]/route.ts
// Evolution API v2 llama a /webhook/{instanceName}/{event}
// Esta route catch-all captura cualquier sub-path

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!

async function enviarMensaje(instanceName: string, remoteJid: string, mensaje: string) {
  try {
    await fetch(`${EVO_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
      body: JSON.stringify({ number: remoteJid, text: mensaje }),
    })
  } catch (e) {
    console.error('[webhook] enviarMensaje error:', e)
  }
}

async function obtenerSystemPrompt(instanceName: string): Promise<{ systemPrompt: string; nombre: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('nombre, metadata')
      .limit(100)

    if (!data) return { systemPrompt: '', nombre: 'el asesor' }

    // Buscar por slug del email
    const row = data.find((r: { nombre: string; metadata: Record<string, unknown> }) => {
      const email = r.metadata?.whatsapp_instance_name || ''
      if (email === instanceName) return true
      // También intentar reconstruir desde el email
      const emailGuess = Object.keys(r.metadata || {}).find(k => k === 'whatsapp')
      return !!emailGuess
    })

    // Si no hay match exacto, tomar el primero que tenga agent_config
    const agente = row || data.find((r: { metadata: Record<string, unknown> }) =>
      r.metadata?.agent_config?.system_prompt
    )

    if (!agente) return { systemPrompt: '', nombre: 'el asesor' }

    return {
      systemPrompt: agente.metadata?.agent_config?.system_prompt || '',
      nombre: agente.nombre || 'el asesor',
    }
  } catch {
    return { systemPrompt: '', nombre: 'el asesor' }
  }
}

async function generarRespuesta(
  texto: string,
  systemPrompt: string,
  nombre: string,
  historial: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const { anthropic, CLAUDE_MODEL } = await import('@/lib/anthropic')
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 250,
      system: systemPrompt
        ? `${systemPrompt}

REGLAS:
- Responde en español colombiano, tono cercano y natural
- Máximo 2-3 oraciones — esto es WhatsApp
- No uses asteriscos ni markdown
- Suena como ${nombre}, no como un bot
- Si preguntan precio, ofrece simular cuota con KIA Crédito
- Si quieren más info, ofrece enviar ficha técnica`
        : `Eres el asistente de ventas de ${nombre}, asesor KIA. Responde en español colombiano, de forma natural y cercana. Máximo 2-3 oraciones.`,
      messages: [
        ...historial.slice(-6),
        { role: 'user', content: texto },
      ],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : null
  } catch (e) {
    console.error('[webhook] generarRespuesta error:', e)
    return null
  }
}

// Historial en memoria por conversación
const chatHistory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>()

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ event: string[] }> }
) {
  try {
    const { event } = await context.params
    const eventPath = event?.join('/') || ''
    console.log(`[webhook] POST /${eventPath}`)

    // Solo procesar mensajes — ignorar otros eventos
    if (!eventPath.includes('messages-upsert') && !eventPath.includes('messages_upsert')) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const body = await req.json()
    console.log('[webhook] body keys:', Object.keys(body))

    // Evolution API v2 estructura: { data: { key, message, ... } } o array
    const instanceName = body.instance || body.instanceName || eventPath.split('/')[0] || ''

    // Los mensajes pueden venir en diferentes estructuras
    let msgs: unknown[] = []
    if (Array.isArray(body.data)) {
      msgs = body.data
    } else if (body.data?.messages) {
      msgs = body.data.messages
    } else if (body.data?.key) {
      msgs = [body.data] // un solo mensaje
    } else if (body.messages) {
      msgs = body.messages
    }

    console.log(`[webhook] instance: ${instanceName}, msgs: ${msgs.length}`)

    for (const msg of msgs) {
      const m = msg as Record<string, unknown>
      const key = m.key as Record<string, unknown>

      // Ignorar mensajes propios
      if (key?.fromMe) continue

      // Ignorar grupos
      const remoteJid = String(key?.remoteJid || '')
      if (remoteJid.includes('@g.us')) continue

      // Extraer texto
      const message = m.message as Record<string, unknown>
      const texto = String(
        message?.conversation ||
        (message?.extendedTextMessage as Record<string, unknown>)?.text ||
        (message?.imageMessage as Record<string, unknown>)?.caption ||
        ''
      ).trim()

      if (!texto) continue

      console.log(`[webhook] mensaje de ${remoteJid}: "${texto}"`)

      // Obtener config del agente
      const { systemPrompt, nombre } = await obtenerSystemPrompt(instanceName)

      // Historial
      const chatKey = `${instanceName}:${remoteJid}`
      const historial = chatHistory.get(chatKey) || []

      // Generar respuesta
      const respuesta = await generarRespuesta(texto, systemPrompt, nombre, historial)

      if (respuesta) {
        historial.push({ role: 'user', content: texto })
        historial.push({ role: 'assistant', content: respuesta })
        chatHistory.set(chatKey, historial.slice(-10))

        // Delay natural
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 800))

        await enviarMensaje(instanceName, remoteJid, respuesta)
        console.log(`[webhook] respondido: "${respuesta.slice(0, 60)}..."`)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[webhook] error:', e)
    return NextResponse.json({ ok: true }) // siempre 200
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'pulse-whatsapp-webhook' })
}
