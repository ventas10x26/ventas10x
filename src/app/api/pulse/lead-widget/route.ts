// Ruta destino: src/app/api/pulse/lead-widget/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Número que recibe la notificación de cada lead nuevo del widget/sección "Hablar con ventas"
const PULSE_WHATSAPP_DESTINO = '573004339418'

async function notificarWhatsAppPulse(lead: {
  nombre: string
  empresa: string
  email: string
  telefono: string
  mensaje: string
}) {
  const apikey = process.env.PULSE_CALLMEBOT_APIKEY
  if (!apikey) {
    console.error('[pulse/lead-widget] PULSE_CALLMEBOT_APIKEY no configurada, no se envía WhatsApp')
    return
  }

  const texto = [
    `🟠 *NUEVO LEAD - PULSE MOTOR*`,
    ``,
    `👤 ${lead.nombre}`,
    lead.empresa ? `🏢 ${lead.empresa}` : null,
    `📧 ${lead.email}`,
    `📱 ${lead.telefono}`,
    lead.mensaje ? `📝 ${lead.mensaje}` : null,
    ``,
    `Responder: wa.me/${lead.telefono.replace(/\D/g, '')}`,
  ].filter(Boolean).join('\n')

  const url = new URL('https://api.callmebot.com/whatsapp.php')
  url.searchParams.set('phone', PULSE_WHATSAPP_DESTINO)
  url.searchParams.set('apikey', apikey)
  url.searchParams.set('text', texto)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(url.toString(), { method: 'GET', signal: controller.signal })
    if (!res.ok) {
      console.error('[pulse/lead-widget] CallMeBot rechazó:', res.status, await res.text())
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, empresa, email, telefono, mensaje } = await req.json()

    if (!nombre || !email || !telefono) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const lead = {
      nombre: String(nombre).trim(),
      empresa: String(empresa || '').trim(),
      email: String(email).trim().toLowerCase(),
      telefono: String(telefono).trim(),
      mensaje: String(mensaje || '').trim(),
    }

    const { error: dbError } = await supabase.from('pulse_lead_widget').insert({
      nombre: lead.nombre,
      empresa: lead.empresa || null,
      email: lead.email,
      telefono: lead.telefono,
      mensaje: lead.mensaje || null,
      fuente: 'widget_hablar_con_ventas',
    })

    if (dbError) {
      console.error('[pulse/lead-widget] Supabase error:', dbError)
      // No bloqueamos la respuesta al usuario — igual intentamos notificar
    }

    // Notificación por WhatsApp, best-effort (no bloquea la respuesta al usuario)
    notificarWhatsAppPulse(lead).catch(err =>
      console.error('[pulse/lead-widget] Error notificando WhatsApp:', err)
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pulse/lead-widget] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
