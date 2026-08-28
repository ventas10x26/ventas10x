// Ruta destino: src/app/api/pulse/whatsapp-meta/webhook/route.ts
//
// Webhook para la API oficial de WhatsApp de Meta (Cloud API), aislado a propósito del
// webhook legacy de Evolution API en /api/pulse/whatsapp/webhook/[...event] -- ese está
// profundamente acoplado a la operación KIA/Almotores actual (catálogo CSV, prompt
// hardcodeado, funciones de envío específicas de Evolution/Baileys). Mezclar los dos
// habría sido cualquier cosa menos quirúrgico. Este es el canal NUEVO para probar el
// agente de Pulse Motor sobre el canal oficial de Meta, sin tocar lo que ya funciona.
//
// GET: handshake de verificación que exige Meta al conectar el webhook (hub.mode +
// hub.verify_token + hub.challenge). Sin esto, Meta ni siquiera deja guardar la URL.
//
// POST: mensajes entrantes reales. Estructura de Meta, nada que ver con el formato de
// Evolution -- entry[].changes[].value.messages[].
//
// Seguridad: Meta firma cada POST con X-Hub-Signature-256 (HMAC-SHA256 sobre el body,
// con el App Secret de la app de Meta -- NO el token de acceso ni el verify token, son
// tres secretos distintos). Se verifica si META_WA_APP_SECRET está configurada; si no,
// se deja pasar con una advertencia en logs -- a propósito más permisivo que el webhook
// de Resend, porque en el sandbox inicial el App Secret puede no estar a mano todavía.
// Antes de conectar un número real de un concesionario, esto debe pasar a ser un rechazo
// duro como el de /api/webhooks/resend.

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

// v25.0 confirmada como la version actual directamente desde el curl de ejemplo que
// muestra el propio asistente de configuracion de Meta (antes tenia v21.0, tambien
// soportada, pero mejor alineado a lo que Meta esta mostrando hoy mismo).
const GRAPH_API_VERSION = 'v25.0'

interface MetaWebhookPayload {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      field: string
      value: {
        messaging_product: string
        metadata?: { phone_number_id: string }
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: string
          text?: { body: string }
        }>
      }
    }>
  }>
}

function verificarFirmaMeta(rawBody: string, signatureHeader: string): boolean {
  const appSecret = process.env.META_WA_APP_SECRET
  if (!appSecret) {
    console.warn('[whatsapp-meta/webhook] META_WA_APP_SECRET no configurada -- aceptando sin verificar firma (solo aceptable en sandbox)')
    return true
  }
  const firmaEsperada = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const a = Buffer.from(firmaEsperada)
  const b = Buffer.from(signatureHeader)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

async function generarRespuesta(texto: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return 'Recibido: ' + texto
  try {
    const { anthropic } = await import('@/lib/anthropic')
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: 'Sos el agente de ventas de Pulse Motor, respondiendo por WhatsApp a nombre de un concesionario que está probando la conexión con el canal oficial de Meta. Tono cálido, directo, en español colombiano. Máximo 2 oraciones, cero markdown, cero listas. Si el mensaje suena a una prueba de conexión, confirmá que todo llegó bien y preguntá en qué podés ayudar.',
      messages: [{ role: 'user', content: texto }],
    })
    return msg.content[0]?.type === 'text' ? msg.content[0].text : 'Recibido: ' + texto
  } catch (e) {
    console.error('[whatsapp-meta/webhook] error generando respuesta:', e)
    return 'Recibido: ' + texto
  }
}

async function enviarTextoMeta(phoneNumberId: string, to: string, mensaje: string) {
  const token = process.env.META_WA_ACCESS_TOKEN
  if (!token) { console.error('[whatsapp-meta/webhook] META_WA_ACCESS_TOKEN no configurada'); return }
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: mensaje },
      }),
    })
    if (!res.ok) console.error('[whatsapp-meta/webhook] Graph API rechazó el envío:', res.status, await res.text())
  } catch (e) {
    console.error('[whatsapp-meta/webhook] error enviando por Graph API:', e)
  }
}

// ─── GET — verificación del webhook (una sola vez, al conectar en Meta) ───
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token && token === process.env.META_WA_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Verificación fallida' }, { status: 403 })
}

// ─── POST — mensajes entrantes ───
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature-256') || ''

  if (!verificarFirmaMeta(rawBody, signature)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  let payload: MetaWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  try {
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const { value } = change
        const phoneNumberId = value.metadata?.phone_number_id
        for (const msg of value.messages || []) {
          if (msg.type !== 'text' || !msg.text?.body || !phoneNumberId) continue
          console.log('[whatsapp-meta/webhook] mensaje de', msg.from, ':', msg.text.body)
          const respuesta = await generarRespuesta(msg.text.body)
          await enviarTextoMeta(phoneNumberId, msg.from, respuesta)
        }
      }
    }
  } catch (e) {
    // Meta reintenta si no responde 200 -- se loguea el error pero igual se confirma
    // recepción, para no entrar en un loop de reintentos sobre un mensaje que ya falló.
    console.error('[whatsapp-meta/webhook] error procesando payload:', e)
  }

  return NextResponse.json({ ok: true })
}
