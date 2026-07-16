// Ruta destino: src/app/api/fenix-contacto/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Número fijo de Fenix Consultores que recibe la notificación de cada lead nuevo
const FENIX_WHATSAPP_DESTINO = '573104159173'

async function notificarWhatsAppFenix(lead: {
  empresa: string
  nombre: string
  email: string
  telefono: string
  mensaje: string
}) {
  const apikey = process.env.FENIX_CALLMEBOT_APIKEY
  if (!apikey) {
    console.error('[fenix-contacto] FENIX_CALLMEBOT_APIKEY no configurada, no se envía WhatsApp')
    return
  }

  const texto = [
    `🔥 *NUEVO LEAD - FENIX CONSULTORES*`,
    ``,
    `🏢 *${lead.empresa}*`,
    `👤 ${lead.nombre}`,
    `📧 ${lead.email}`,
    `📱 ${lead.telefono}`,
    lead.mensaje ? `📝 ${lead.mensaje}` : null,
    ``,
    `Responder: wa.me/${lead.telefono.replace(/\D/g, '')}`,
  ].filter(Boolean).join('\n')

  const url = new URL('https://api.callmebot.com/whatsapp.php')
  url.searchParams.set('phone', FENIX_WHATSAPP_DESTINO)
  url.searchParams.set('apikey', apikey)
  url.searchParams.set('text', texto)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(url.toString(), { method: 'GET', signal: controller.signal })
    if (!res.ok) {
      console.error('[fenix-contacto] CallMeBot rechazó:', res.status, await res.text())
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { empresa, nombre, email, telefono, mensaje } = await req.json()

    if (!empresa || !nombre || !email || !telefono) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const lead = {
      empresa: String(empresa).trim(),
      nombre: String(nombre).trim(),
      email: String(email).trim().toLowerCase(),
      telefono: String(telefono).trim(),
      mensaje: String(mensaje || '').trim(),
    }

    const { error: dbError } = await supabase.from('fenix_leads').insert({
      empresa: lead.empresa,
      nombre: lead.nombre,
      email: lead.email,
      telefono: lead.telefono,
      mensaje: lead.mensaje || null,
      fuente: 'landing_fenix_consultores',
    })

    if (dbError) {
      console.error('[fenix-contacto] Supabase error:', dbError)
      // No bloqueamos la respuesta al usuario — igual intentamos notificar
    }

    // Notificación por WhatsApp, best-effort (no bloquea la respuesta al usuario)
    notificarWhatsAppFenix(lead).catch(err =>
      console.error('[fenix-contacto] Error notificando WhatsApp:', err)
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[fenix-contacto] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
