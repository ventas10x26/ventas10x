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
    const emailGuess = instanceName
      .replace('_at_', '@')
      .replace(/_([^_]+)$/, '.$1')
      .replace(/_/g, '.')
      .replace(/\.([^.]+)@/, '_$1@')

    console.log('[webhook] buscando agente para instance:', instanceName, 'email guess:', emailGuess)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('nombre, metadata')
      .ilike('email', emailGuess)
      .maybeSingle()

    if (!data) {
      console.log('[webhook] no encontrado por email, buscando cualquier agente con agent_config')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fallback } = await (supabaseAdmin.from('pulse_waitlist') as any)
        .select('nombre, metadata')
        .not('metadata->agent_config', 'is', null)
        .limit(1)
        .maybeSingle()

      if (!fallback) return { systemPrompt: '', nombre: 'el asesor' }

      const cfg = fallback.metadata?.agent_config as Record<string, unknown> | undefined
      console.log('[webhook] usando fallback agente:', fallback.nombre)
      return {
        systemPrompt: String(cfg?.system_prompt || ''),
        nombre: fallback.nombre || 'el asesor',
      }
    }

    const cfg = data.metadata?.agent_config as Record<string, unknown> | undefined
    console.log('[webhook] agente encontrado:', data.nombre, 'system_prompt length:', String(cfg?.system_prompt || '').length)
    return {
      systemPrompt: String(cfg?.system_prompt || ''),
      nombre: data.nombre || 'el asesor',
    }
  } catch (e) {
    console.error('[webhook] obtenerSystemPrompt error:', e)
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
    const { anthropic } = await import('@/lib/anthropic')

    // Sanitizar historial: Anthropic rechaza 400 si hay roles consecutivos iguales
    const historialLimpio: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const turn of historial.slice(-6)) {
      const ultimo = historialLimpio[historialLimpio.length - 1]
      if (ultimo && ultimo.role === turn.role) continue
      historialLimpio.push(turn)
    }

    // El array de messages debe terminar en 'assistant' antes del nuevo 'user'
    if (historialLimpio[historialLimpio.length - 1]?.role === 'user') {
      historialLimpio.pop()
    }

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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
        ...historialLimpio,
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
    const nxtPevent = req.nextUrl.searchParams.get('nxtPevent') || ''
    console.log(`[webhook] POST /${eventPath} nxtPevent=${nxtPevent}`)

    const isMessagesUpsert =
      eventPath.includes('messages-upsert') ||
      eventPath.includes('messages_upsert') ||
      nxtPevent.includes('messages-upsert') ||
      nxtPevent.includes('messages_upsert')

    if (!isMessagesUpsert) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const body = await req.json()
    console.log('[webhook] body keys:', Object.keys(body))

    const instanceName = body.instance || body.instanceName || eventPath.split('/')[0] || ''

    let msgs: unknown[] = []
    if (Array.isArray(body.data)) {
      msgs = body.data
    } else if (body.data?.messages) {
      msgs = body.data.messages
    } else if (body.data?.key) {
      msgs = [body.data]
    } else if (body.messages) {
      msgs = body.messages
    }

    console.log(`[webhook] instance: ${instanceName}, msgs: ${msgs.length}`)

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
        (message?.imageMessage as Record<string, unknown>)?.caption ||
        ''
      ).trim()

      if (!texto) continue

      console.log(`[webhook] mensaje de ${remoteJid}: "${texto}"`)

      const { systemPrompt, nombre } = await obtenerSystemPrompt(instanceName)

      const chatKey = `${instanceName}:${remoteJid}`
      const historial = chatHistory.get(chatKey) || []

      const respuesta = await generarRespuesta(texto, systemPrompt, nombre, historial)

      if (respuesta) {
        historial.push({ role: 'user', content: texto })
        historial.push({ role: 'assistant', content: respuesta })
        chatHistory.set(chatKey, historial.slice(-10))

        await new Promise(r => setTimeout(r, 1000 + Math.random() * 800))

        await enviarMensaje(instanceName, remoteJid, respuesta)
        console.log(`[webhook] respondido: "${respuesta.slice(0, 60)}..."`)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[webhook] error:', e)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'pulse-whatsapp-webhook' })
}
