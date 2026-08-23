// Ruta destino: src/app/api/webhooks/resend/route.ts
//
// Recibe los eventos de ciclo de vida de cada correo de onboarding (entregado, abierto,
// clic, rebotado, quejado) que dispara Resend y los cruza contra pulse_onboarding_envios
// por resend_email_id (guardado al enviar, ver onboarding-databridge-email.ts).
//
// email.opened y email.clicked SOLO llegan si el tracking de apertura/clics está activado
// en el dominio de envío (ventas10x.co) desde el dashboard de Resend — no hay forma de
// activarlo por API, es un toggle manual de una sola vez.
//
// Verificación de firma: Resend firma sus webhooks con el estándar Svix (headers
// svix-id/svix-timestamp/svix-signature, secreto whsec_...). Se verifica a mano acá en vez
// de sumar la dependencia `svix` — es un HMAC-SHA256 sobre "id.timestamp.body" con la mitad
// del secreto después de whsec_ decodificada de base64, comparado en tiempo constante.
// Sin RESEND_WEBHOOK_SECRET configurada, el endpoint responde 500 en vez de aceptar
// payloads sin verificar — más vale un webhook roto que uno que acepta cualquier POST.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface ResendWebhookPayload {
  type: string
  created_at: string
  data: {
    email_id?: string
    to?: string[]
    subject?: string
    [key: string]: unknown
  }
}

function verificarFirmaSvix(payload: string, svixId: string, svixTimestamp: string, svixSignature: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return false

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const mensajeFirmado = `${svixId}.${svixTimestamp}.${payload}`
  const firmaEsperada = createHmac('sha256', secretBytes).update(mensajeFirmado).digest('base64')

  // svix-signature puede traer varias firmas separadas por espacio ("v1,firma1 v1,firma2")
  // durante rotación de secretos -- alcanza con que UNA coincida.
  const firmasRecibidas = svixSignature.split(' ').map(f => f.split(',')[1]).filter(Boolean)

  const esperadaBuf = Buffer.from(firmaEsperada, 'base64')
  return firmasRecibidas.some(f => {
    const recibidaBuf = Buffer.from(f, 'base64')
    if (recibidaBuf.length !== esperadaBuf.length) return false
    return timingSafeEqual(esperadaBuf, recibidaBuf)
  })
}

// Mapea el tipo de evento de Resend a la columna que actualiza en pulse_onboarding_envios.
const COLUMNA_POR_EVENTO: Record<string, string> = {
  'email.delivered': 'entregado_at',
  'email.opened': 'abierto_at',
  'email.clicked': 'clic_at',
  'email.bounced': 'rebotado_at',
  'email.complained': 'quejado_at',
}

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_WEBHOOK_SECRET) {
    console.error('[webhooks/resend] RESEND_WEBHOOK_SECRET no configurada, rechazando por seguridad')
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 500 })
  }

  const svixId = req.headers.get('svix-id') || ''
  const svixTimestamp = req.headers.get('svix-timestamp') || ''
  const svixSignature = req.headers.get('svix-signature') || ''
  const rawBody = await req.text()

  if (!svixId || !svixTimestamp || !svixSignature || !verificarFirmaSvix(rawBody, svixId, svixTimestamp, svixSignature)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  let evento: ResendWebhookPayload
  try {
    evento = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const columna = COLUMNA_POR_EVENTO[evento.type]
  const emailId = evento.data?.email_id

  // Eventos que no nos interesan (email.sent, contact.*, domain.*, etc.) se confirman con
  // 200 igual -- Resend reintenta si no responde 2xx, y no hay nada que corregir acá.
  if (!columna || !emailId) {
    return NextResponse.json({ ok: true, ignorado: true })
  }

  const { error } = await supabase
    .from('pulse_onboarding_envios')
    .update({ [columna]: evento.created_at })
    .eq('resend_email_id', emailId)
    // No pisa un valor ya registrado (ej. dos aperturas del mismo correo): la primera
    // apertura es la que importa para medir el embudo, no la última.
    .is(columna, null)

  if (error) {
    console.error('[webhooks/resend] error actualizando tracking:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
