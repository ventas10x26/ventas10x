// Ruta destino: src/app/api/pulse/demo-contacto/route.ts
//
// Recibe las solicitudes de demo: el formulario de la landing (PulseDemoForm) y el registro
// que abre el panel de /pulse/demo.
//
// El lead se GUARDA en Supabase y además se avisa por correo y por WhatsApp. Que la solicitud
// se dé por recibida depende de que quede registrada en alguna parte, no de que un servicio
// externo esté arriba: el visitante no tiene por qué quedar trabado porque CallMeBot esté
// caído. Antes el WhatsApp era el único camino Y además tumbaba la petición, así que una
// falla suya devolvía 502 y el lead se perdía entero, sin dejar rastro de este lado.
//
// Disparador de onboarding: en paralelo a las tres tareas de arriba, se dispara el correo
// que lleva al lead a crear su primer proyecto en /pulse/databridge (ver
// onboarding-databridge-email.ts). Corre en el mismo Promise.allSettled pero fuera del gate
// de éxito/error de la respuesta: si el aviso interno y el guardado ya salieron bien, la
// solicitud está recibida sin importar si este correo puntual falla.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { enviarOnboardingDatabridge } from '@/lib/pulse/onboarding-databridge-email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Pulse Motor <agente@ventas10x.co>'

// Número que recibe la notificación de cada solicitud de demo de Pulse Motor
const PULSE_DEMO_WHATSAPP_DESTINO = '573004339418'

// Último recurso si no hay nada configurado por entorno. Es el mismo destino que usa
// /api/pulse/contacto: sin esto, un deploy sin PULSE_LEADS_EMAIL ni ADMIN_EMAILS se queda
// sin destinatario y el correo falla en silencio — que fue justo lo que pasó.
const DESTINO_FALLBACK = 'ricaza81@gmail.com'

interface LeadDemo {
  concesionario: string
  nombre: string
  email: string
  telefono: string
  mensaje: string
}

/** A dónde llega el aviso: PULSE_LEADS_EMAIL → primero de ADMIN_EMAILS → DESTINO_FALLBACK. */
function destinatarios(): string[] {
  const propio = process.env.PULSE_LEADS_EMAIL?.trim()
  if (propio) {
    const lista = propio.split(',').map(e => e.trim()).filter(Boolean)
    if (lista.length) return lista
  }
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  if (admins.length) return admins.slice(0, 1)
  return [DESTINO_FALLBACK]
}

/** El registro durable. Si esto entra, el lead ya no se puede perder aunque no salga ningún aviso. */
async function guardarLead(lead: LeadDemo) {
  const notas = [`Concesionario: ${lead.concesionario}`, lead.mensaje].filter(Boolean).join(' · ')
  const { error } = await supabase.from('pulse_contactos').insert({
    nombre: lead.nombre,
    email: lead.email,
    telefono: lead.telefono,
    fuente: 'demo_panel',
    notas,
  })
  if (error) throw new Error(error.message)
}

function htmlLeadDemo(lead: LeadDemo) {
  const soloDigitos = lead.telefono.replace(/\D/g, '')
  const fila = (etiqueta: string, valor: string) => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #2A2620;font-size:13px;color:#9B958A;width:130px;vertical-align:top;">${etiqueta}</td>
      <td style="padding:9px 0;border-bottom:1px solid #2A2620;font-size:14px;color:#F3EFE7;font-weight:600;">${valor}</td>
    </tr>`

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Nueva solicitud de demo</title></head>
<body style="margin:0;padding:0;background:#0B0D0C;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#F3EFE7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0D0C;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="background:#14120F;border:1px solid #2A2620;border-top:3px solid #2563EB;border-radius:16px;padding:34px 30px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#7BA4F5;letter-spacing:1.2px;text-transform:uppercase;">Nueva solicitud de demo</p>
            <h1 style="margin:0 0 20px;font-size:23px;font-weight:700;line-height:1.3;color:#F3EFE7;">${lead.concesionario}</h1>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${fila('Nombre', lead.nombre)}
              ${fila('Correo', `<a href="mailto:${lead.email}" style="color:#7BA4F5;text-decoration:none;">${lead.email}</a>`)}
              ${fila('WhatsApp', `<a href="https://wa.me/${soloDigitos}" style="color:#7BA4F5;text-decoration:none;">${lead.telefono}</a>`)}
              ${lead.mensaje ? fila('Mensaje', lead.mensaje) : ''}
            </table>
            <table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
              <tr>
                <td style="background:#2563EB;border-radius:10px;padding:12px 24px;">
                  <a href="https://wa.me/${soloDigitos}" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Responder por WhatsApp →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 0 0;text-align:center;">
            <p style="margin:0;font-size:11px;color:#4A453D;">Pulse Motor · pulsemotor.co</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function enviarEmail(lead: LeadDemo) {
  const to = destinatarios()
  if (!to.length) throw new Error('Sin destinatario: configurá PULSE_LEADS_EMAIL o ADMIN_EMAILS')

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    // Responder al correo cae directo en el buzón del prospecto, sin copiar la dirección.
    replyTo: lead.email,
    subject: `Demo — ${lead.concesionario} (${lead.nombre})`,
    html: htmlLeadDemo(lead),
  })
  if (error) throw new Error(error.message || 'Resend rechazó el envío')
}

async function notificarWhatsAppDemo(lead: LeadDemo) {
  const apikey = process.env.PULSE_DEMO_CALLMEBOT_APIKEY
  if (!apikey) throw new Error('PULSE_DEMO_CALLMEBOT_APIKEY no configurada')

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

    const lead: LeadDemo = {
      concesionario: String(concesionario).trim(),
      nombre: String(nombre).trim(),
      email: String(email).trim().toLowerCase(),
      telefono: String(telefono).trim(),
      mensaje: String(mensaje || '').trim(),
    }

    // Los cuatro en paralelo: ninguno le agrega su latencia a los otros, y la caída de uno no
    // puede volver a costar un lead. El onboarding va al final del array a propósito — el
    // gate de éxito/error de abajo solo mira los primeros tres, así que una falla puntual de
    // Resend en ESTE correo no puede tumbar la respuesta al visitante.
    const [guardado, porEmail, porWhatsApp, porOnboarding] = await Promise.allSettled([
      guardarLead(lead),
      enviarEmail(lead),
      notificarWhatsAppDemo(lead),
      enviarOnboardingDatabridge({ nombre: lead.nombre, email: lead.email, origen: 'demo' }),
    ])

    if (guardado.status === 'rejected') {
      console.error('[pulse/demo-contacto] no se guardó en Supabase:', guardado.reason)
    }
    if (porEmail.status === 'rejected') {
      console.error('[pulse/demo-contacto] email falló:', porEmail.reason)
    }
    if (porWhatsApp.status === 'rejected') {
      console.error('[pulse/demo-contacto] whatsapp falló:', porWhatsApp.reason)
    }
    if (porOnboarding.status === 'rejected') {
      console.error('[pulse/demo-contacto] onboarding email falló:', porOnboarding.reason)
    }

    // Solo se rechaza si el lead no quedó registrado en ningún lado. Mientras esté guardado o
    // haya salido un aviso, la solicitud está recibida y el visitante puede pasar al panel.
    if (guardado.status === 'rejected' && porEmail.status === 'rejected' && porWhatsApp.status === 'rejected') {
      return NextResponse.json(
        { error: 'No pudimos enviar la solicitud. Intenta de nuevo o escríbenos directo por WhatsApp.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pulse/demo-contacto] Error:', err)
    return NextResponse.json(
      { error: 'No pudimos enviar la solicitud. Intenta de nuevo o escríbenos directo por WhatsApp.' },
      { status: 502 }
    )
  }
}
