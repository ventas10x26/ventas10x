// Ruta destino: src/app/api/pulse/demo-contacto/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Número que recibe la notificación de cada solicitud de demo de Pulse Motor
const PULSE_DEMO_WHATSAPP_DESTINO = '573004339418'

async function notificarWhatsAppDemo(lead: {
  concesionario: string
  nombre: string
  email: string
  telefono: string
  mensaje: string
}) {
  const apikey = process.env.PULSE_DEMO_CALLMEBOT_APIKEY
  if (!apikey) {
    throw new Error('PULSE_DEMO_CALLMEBOT_APIKEY no configurada')
  }

  const texto = [
    `🚗 *NUEVA SOLICITUD DE DEMO - PULSE MOTOR*`,
    ``,
    `🏢 *${lead.concesionario}*`,
    `👤 ${lead.nombre}`,
    `📧 ${lead.email}`,
    `📱 ${lead.telefono}`,
    lead.mensaje ? `📝 ${lead.mensaje}` : null,
    ``,
    `Responder: wa.me/${lead.telefono.replace(/\D/g, '')}`,
  ].filter(Boolean).join('\n')

  const url = new URL('https://api.callmebot.com/whatsapp.php')
  url.searchParams.set('phone', PULSE_DEMO_WHATSAPP_DESTINO)
  url.searchParams.set('apikey', apikey)
  url.searchParams.set('text', texto)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(url.toString(), { method: 'GET', signal: controller.signal })
    if (!res.ok) {
      throw new Error(`CallMeBot rechazó la solicitud: ${res.status} ${await res.text()}`)
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { concesionario, nombre, email, telefono, mensaje } = await req.json()

    if (!concesionario || !nombre || !email || !telefono) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const lead = {
      concesionario: String(concesionario).trim(),
      nombre: String(nombre).trim(),
      email: String(email).trim().toLowerCase(),
      telefono: String(telefono).trim(),
      mensaje: String(mensaje || '').trim(),
    }

    await notificarWhatsAppDemo(lead)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pulse/demo-contacto] Error:', err)
    return NextResponse.json({ error: 'No pudimos enviar la solicitud. Intenta de nuevo o escríbenos directo por WhatsApp.' }, { status: 502 })
  }
}
