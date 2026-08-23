// Ruta destino: src/lib/pulse/onboarding-databridge-email.ts
//
// Dispara un correo de onboarding a los leads que descargaron el ebook o pidieron la demo
// (ver /api/pulse/ebook y /api/pulse/demo-contacto) empujándolos a crear su primer proyecto
// en /pulse/databridge.
//
// POR QUÉ ESTE CORREO EXISTE. Quien baja el ebook o pide la demo conoce la promesa del
// agente de WhatsApp, pero no necesariamente sabe que Pulse Motor primero ordena los datos
// del concesionario antes de que el agente pueda funcionar bien — DataBridge es la mitad
// del producto que no se ve en la demo. Este correo traduce esa idea al lenguaje del
// concesionario (Excel disperso, nombres de campo que no coinciden, nada cruzado entre
// hojas) sin nombrar ninguna herramienta de terceros — la referencia conceptual es "unificar
// múltiples fuentes en un solo modelo gobernado antes de poder analizar nada en serio", el
// mismo principio detrás de cualquier plataforma de datos empresarial seria, expresado acá
// con los mismos ejemplos que ya usa el resto del sitio (Vend/ID_Asesor, "no arrancás de
// cero") para que la voz de marca no cambie de un lugar a otro.
//
// Se llama en paralelo al guardado del lead (fire-and-forget, mismo patrón que
// /api/pulse/databridge/proyectos POST): si el envío falla, se loguea y sigue — jamás debe
// tumbar la captura del lead, que ya quedó guardada en Supabase antes de llegar acá.

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Pulse Motor <agente@ventas10x.co>'

export type OrigenOnboarding = 'ebook' | 'demo'

interface LeadOnboarding {
  nombre: string
  email: string
  origen: OrigenOnboarding
}

const COPY_POR_ORIGEN: Record<OrigenOnboarding, { apertura: string; footer: string }> = {
  ebook: {
    apertura: 'Gracias por bajar la guía de rentabilidad por unidad.',
    footer: 'porque descargaste la guía de rentabilidad en pulsemotor.co',
  },
  demo: {
    apertura: 'Gracias por pedir la demo — ya la tenemos agendada.',
    footer: 'porque pediste una demo en pulsemotor.co',
  },
}

function htmlOnboarding(lead: LeadOnboarding) {
  const primerNombre = lead.nombre.trim().split(/\s+/)[0] || 'Hola'
  const { apertura, footer } = COPY_POR_ORIGEN[lead.origen]

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Antes del agente</title></head>
<body style="margin:0;padding:0;background:#0B0D0C;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#F3EFE7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0D0C;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="padding:0 0 24px 0;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="display:inline-table;">
              <tr>
                <td style="background:linear-gradient(135deg,#2563EB,#1D4ED8);border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:16px;">⚡</td>
                <td style="padding-left:10px;font-size:17px;font-weight:700;letter-spacing:-0.3px;color:#F3EFE7;">Pulse Motor</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#14120F;border:1px solid #2A2620;border-top:3px solid #2563EB;border-radius:16px;padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#7BA4F5;letter-spacing:1.2px;text-transform:uppercase;">DataBridge 360 · La base de todo</p>
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.35;color:#F3EFE7;">${primerNombre}, hay una parte de Pulse Motor que todavía no viste</h1>

            <p style="margin:0 0 16px;font-size:14px;color:#C9C3B8;line-height:1.65;">${apertura} El agente de WhatsApp es la parte visible. Lo que lo hace funcionar bien —y lo que en la mayoría de los concesionarios todavía no existe— pasa antes: un modelo único y limpio de tus datos.</p>

            <p style="margin:0 0 22px;font-size:14px;color:#9B958A;line-height:1.65;">Hoy esos datos probablemente viven repartidos: el Excel del DMS, la hoja de retomas, el CRM de leads, las cotizaciones de pólizas — cada uno con sus propios nombres de campo, sin cruzarse entre sí.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
              <tr>
                <td style="padding:0 0 12px;border-bottom:1px solid #2A2620;">
                  <p style="margin:0;font-size:13.5px;color:#F3EFE7;"><strong style="color:#7BA4F5;">Normaliza los nombres</strong> — "Vend" en una hoja y "ID_Asesor" en otra quedan reconocidos como el mismo dato.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #2A2620;">
                  <p style="margin:0;font-size:13.5px;color:#F3EFE7;"><strong style="color:#7BA4F5;">Encuentra las relaciones</strong> — cruza los valores reales entre tablas, no solo los nombres de columna.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;">
                  <p style="margin:0;font-size:13.5px;color:#F3EFE7;"><strong style="color:#7BA4F5;">Arma un modelo único</strong> — una sola versión limpia y conectada de tu operación, no quince archivos sueltos.</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 26px;font-size:14px;color:#C9C3B8;line-height:1.65;">Es el paso que hace posible todo lo demás — desde un agente que no se confunde con datos inconsistentes, hasta reportes que por fin cuadran.</p>

            <table cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
              <tr>
                <td style="background:#2563EB;border-radius:10px;padding:13px 26px;">
                  <a href="https://pulsemotor.co/pulse/databridge" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Probá con tus propios datos →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;color:#6B6459;">Gratis, sin tarjeta — subís un Excel o CSV y en minutos ves el esquema de tu concesionario, ordenado.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 0 0;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#6B6459;">— Equipo Pulse Motor</p>
            <p style="margin:0;font-size:11px;color:#4A453D;">Recibiste este correo ${footer}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** Fire-and-forget: se llama en paralelo al guardado del lead, nunca bloquea la respuesta. */
export async function enviarOnboardingDatabridge(lead: LeadOnboarding) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: [lead.email],
    subject: 'Antes del agente: así ordena Pulse Motor los datos de tu concesionario',
    html: htmlOnboarding(lead),
  })
  if (error) throw new Error(error.message || 'Resend rechazó el envío de onboarding')
}
