// Ruta destino: src/app/api/fenix-contacto/route.ts
//
// Recibe los leads del formulario principal y del widget flotante (ambos usan
// FenixLeadForm, que postea aquí). El lead se guarda, se avisa por correo y
// por WhatsApp en paralelo: que la solicitud se dé por recibida no depende de
// que un solo canal esté arriba — si Supabase, Resend o CallMeBot fallan por
// separado, los otros dos igual dejan constancia del lead.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cuenta de Resend propia de Fenix, distinta de la que usa el resto de
// Ventas10x — de ahí la variable de entorno separada en vez de reusar
// RESEND_API_KEY. El dominio consultoresfenix.com ya está verificado en
// esa cuenta, así que el remitente sale de ahí y no del sandbox de Resend.
//
// El cliente se construye perezosamente (solo al enviar) y no aquí arriba:
// el SDK de Resend lanza una excepción si la key es undefined, y eso pasaba
// al CARGAR el módulo — antes de que el try/catch de abajo pudiera hacer
// nada. Con FENIX_RESEND_API_KEY todavía sin configurar en Vercel, ese
// throw tumbaba la ruta entera (también el guardado en Supabase y el aviso
// de WhatsApp), justo lo que Promise.allSettled más abajo existe para
// evitar. Mismo patrón que ya usa src/lib/email-helpers.ts para esto.
let _resendFenix: Resend | null = null
function getResendFenix(): Resend {
  const apiKey = process.env.FENIX_RESEND_API_KEY
  if (!apiKey) throw new Error('FENIX_RESEND_API_KEY no configurada')
  if (!_resendFenix) _resendFenix = new Resend(apiKey)
  return _resendFenix
}
const FENIX_EMAIL_FROM = 'Fénix Consultores <notificaciones@consultoresfenix.com>'
const FENIX_EMAIL_DESTINOS = [
  'gerencia@consultoresfenix.com',
  'fenixconsultoresempresariales@gmail.com',
  'ricaza81@gmail.com',
]

// Número fijo de Fenix Consultores que recibe la notificación de cada lead nuevo
const FENIX_WHATSAPP_DESTINO = '573104159173'

type LeadFenix = {
  empresa: string
  nombre: string
  email: string
  telefono: string
  mensaje: string
}

async function guardarLead(lead: LeadFenix) {
  const { error } = await supabase.from('fenix_leads').insert({
    empresa: lead.empresa,
    nombre: lead.nombre,
    email: lead.email,
    telefono: lead.telefono,
    mensaje: lead.mensaje || null,
    fuente: 'landing_fenix_consultores',
  })
  if (error) throw new Error(error.message)
}

function htmlLeadFenix(lead: LeadFenix) {
  const soloDigitos = lead.telefono.replace(/\D/g, '')
  const fila = (etiqueta: string, valor: string) => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #2A241C;font-size:13px;color:#B0A594;width:150px;vertical-align:top;">${etiqueta}</td>
      <td style="padding:9px 0;border-bottom:1px solid #2A241C;font-size:14px;color:#F7F4EF;font-weight:600;">${valor}</td>
    </tr>`

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Nuevo lead — Fénix Consultores</title></head>
<body style="margin:0;padding:0;background:#14100C;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#F7F4EF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#14100C;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="background:#1B1712;border:1px solid #2A241C;border-top:3px solid #F5821F;border-radius:16px;padding:34px 30px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#F5A455;letter-spacing:1.2px;text-transform:uppercase;">Nuevo lead — Fénix Consultores</p>
            <h1 style="margin:0 0 20px;font-size:23px;font-weight:700;line-height:1.3;color:#F7F4EF;">${lead.empresa}</h1>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${fila('Nombre de contacto', lead.nombre)}
              ${fila('Correo', `<a href="mailto:${lead.email}" style="color:#F5A455;text-decoration:none;">${lead.email}</a>`)}
              ${fila('WhatsApp', `<a href="https://wa.me/${soloDigitos}" style="color:#F5A455;text-decoration:none;">${lead.telefono}</a>`)}
              ${lead.mensaje ? fila('Qué necesita', lead.mensaje) : ''}
            </table>
            <table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
              <tr>
                <td style="background:#F5821F;border-radius:10px;padding:12px 24px;">
                  <a href="https://wa.me/${soloDigitos}" style="color:#12100C;font-size:14px;font-weight:700;text-decoration:none;">Responder por WhatsApp →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 0 0;text-align:center;">
            <p style="margin:0;font-size:11px;color:#5C5548;">Fénix Consultores Empresariales S.A.S. · fenix-consultores</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function enviarEmailFenix(lead: LeadFenix) {
  const { error } = await getResendFenix().emails.send({
    from: FENIX_EMAIL_FROM,
    to: FENIX_EMAIL_DESTINOS,
    // Responder al correo cae directo en el buzón del prospecto, sin copiar la dirección.
    replyTo: lead.email,
    subject: `Nuevo lead — ${lead.empresa} (${lead.nombre})`,
    html: htmlLeadFenix(lead),
  })
  if (error) throw new Error(error.message || 'Resend rechazó el envío')
}

async function notificarWhatsAppFenix(lead: LeadFenix) {
  const apikey = process.env.FENIX_CALLMEBOT_APIKEY
  if (!apikey) throw new Error('FENIX_CALLMEBOT_APIKEY no configurada')

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
      throw new Error(`CallMeBot rechazó la solicitud: ${res.status} ${await res.text()}`)
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

    const lead: LeadFenix = {
      empresa: String(empresa).trim(),
      nombre: String(nombre).trim(),
      email: String(email).trim().toLowerCase(),
      telefono: String(telefono).trim(),
      mensaje: String(mensaje || '').trim(),
    }

    // Los tres en paralelo: ninguno le agrega su latencia a los otros, y la
    // caída de uno no le cuesta el lead entero a los demás.
    const [guardado, porEmail, porWhatsApp] = await Promise.allSettled([
      guardarLead(lead),
      enviarEmailFenix(lead),
      notificarWhatsAppFenix(lead),
    ])

    if (guardado.status === 'rejected') {
      console.error('[fenix-contacto] no se guardó en Supabase:', guardado.reason)
    }
    if (porEmail.status === 'rejected') {
      console.error('[fenix-contacto] email falló:', porEmail.reason)
    }
    if (porWhatsApp.status === 'rejected') {
      console.error('[fenix-contacto] whatsapp falló:', porWhatsApp.reason)
    }

    // Solo se rechaza si el lead no quedó registrado en ningún lado. Mientras
    // esté guardado o haya salido un aviso, la solicitud está recibida.
    if (guardado.status === 'rejected' && porEmail.status === 'rejected' && porWhatsApp.status === 'rejected') {
      return NextResponse.json({ error: 'No pudimos enviar la solicitud. Intenta de nuevo.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[fenix-contacto] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
