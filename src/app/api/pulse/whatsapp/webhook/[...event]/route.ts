// src/app/api/pulse/whatsapp/webhook/[...event]/route.ts

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

async function obtenerConfigAgente(instanceName: string): Promise<{
  systemPrompt: string
  nombre: string
  botActivo: boolean
}> {
  const defaultResult = { systemPrompt: '', nombre: 'el asesor', botActivo: true }

  try {
    // 1. Obtener el número de teléfono de la instancia desde Evolution API
    let telefonoInstancia: string | null = null
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${instanceName}`, {
        headers: { apikey: EVO_KEY },
      })
      if (res.ok) {
        const data = await res.json()
        // ownerJid = "573004339418@s.whatsapp.net"
        const ownerJid = String(data?.instance?.ownerJid || '')
        const match = ownerJid.match(/^(\d+)@/)
        if (match) telefonoInstancia = match[1] // "573004339418"
      }
    } catch (e) {
      console.error('[webhook] no pudo obtener ownerJid:', e)
    }

    console.log('[webhook] telefonoInstancia:', telefonoInstancia)

    // 2. Buscar en pulse_waitlist por número de teléfono (en metadata->whatsapp)
    if (telefonoInstancia) {
      // Normalizar: sin 57 al inicio para comparar
      const numeroCorto = telefonoInstancia.replace(/^57/, '')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabaseAdmin.from('pulse_waitlist') as any)
        .select('nombre, metadata')
        .not('metadata', 'is', null)

      if (rows && Array.isArray(rows)) {
        for (const row of rows) {
          const meta = row.metadata as Record<string, unknown>
          const whatsapp = String(meta?.whatsapp || '').replace(/\D/g, '').replace(/^57/, '')
          if (whatsapp && whatsapp === numeroCorto) {
            const cfg = meta?.agent_config as Record<string, unknown> | undefined
            const botActivo = meta?.bot_activo !== false
            console.log('[webhook] agente encontrado por teléfono:', row.nombre, 'bot_activo:', botActivo)
            return {
              systemPrompt: String(cfg?.system_prompt || ''),
              nombre: row.nombre || 'el asesor',
              botActivo,
            }
          }
        }
      }
    }

    // 3. Fallback por email reconstruido desde instanceName
    const emailGuess = instanceName
      .replace('_at_', '@')
      .replace(/_([^_]+)$/, '.$1')
      .replace(/_/g, '.')
      .replace(/\.([^.]+)@/, '_$1@')

    console.log('[webhook] fallback email guess:', emailGuess)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('nombre, metadata')
      .ilike('email', emailGuess)
      .maybeSingle()

    if (data) {
      const cfg = data.metadata?.agent_config as Record<string, unknown> | undefined
      const botActivo = data.metadata?.bot_activo !== false
      console.log('[webhook] agente por email:', data.nombre, 'bot_activo:', botActivo)
      return {
        systemPrompt: String(cfg?.system_prompt || ''),
        nombre: data.nombre || 'el asesor',
        botActivo,
      }
    }

    // 4. Último fallback: cualquier agente con agent_config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fallback } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('nombre, metadata')
      .not('metadata->agent_config', 'is', null)
      .limit(1)
      .maybeSingle()

    if (fallback) {
      const cfg = fallback.metadata?.agent_config as Record<string, unknown> | undefined
      const botActivo = fallback.metadata?.bot_activo !== false
      console.log('[webhook] fallback genérico:', fallback.nombre, 'bot_activo:', botActivo)
      return {
        systemPrompt: String(cfg?.system_prompt || ''),
        nombre: fallback.nombre || 'el asesor',
        botActivo,
      }
    }

    return defaultResult
  } catch (e) {
    console.error('[webhook] obtenerConfigAgente error:', e)
    return defaultResult
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

    const historialLimpio: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const turn of historial.slice(-6)) {
      const ultimo = historialLimpio[historialLimpio.length - 1]
      if (ultimo && ultimo.role === turn.role) continue
      historialLimpio.push(turn)
    }
    if (historialLimpio[historialLimpio.length - 1]?.role === 'user') {
      historialLimpio.pop()
    }

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      system: systemPrompt
        ? `${systemPrompt}

REGLAS ESTRICTAS:
- Responde en español colombiano, tono cercano y natural
- Máximo 2-3 oraciones — esto es WhatsApp
- No uses asteriscos ni markdown
- Suena como ${nombre}, no como un bot
- NUNCA inventes datos: ciudad, precios exactos, tasas, fechas de entrega
- Si no sabes algo con certeza, di "te confirmo ese dato" o "déjame verificar"
- Si mencionan inicial + crédito + plazo: di que vas a simular la cuota con KIA Crédito y pide confirmar el modelo exacto
- Si quieren ver el carro: ofrece enviar la foto y el enlace del concesionario`
        : `Eres el asistente de ventas de ${nombre}, asesor KIA. Responde en español colombiano, de forma natural y cercana. Máximo 2-3 oraciones. NUNCA inventes datos que no te hayan dado.`,
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
    const instanceName = body.instance || body.instanceName || eventPath.split('/')[0] || ''

    let msgs: unknown[] = []
    if (Array.isArray(body.data)) msgs = body.data
    else if (body.data?.messages) msgs = body.data.messages
    else if (body.data?.key) msgs = [body.data]
    else if (body.messages) msgs = body.messages

    console.log(`[webhook] instance: ${instanceName}, msgs: ${msgs.length}`)

    // Obtener config del agente incluyendo bot_activo
    const { systemPrompt, nombre, botActivo } = await obtenerConfigAgente(instanceName)

    if (!botActivo) {
      console.log('[webhook] bot INACTIVO para instancia:', instanceName, '— ignorando mensajes')
      return NextResponse.json({ ok: true, paused: true })
    }

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
