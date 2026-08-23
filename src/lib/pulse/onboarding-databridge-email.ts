// Ruta destino: src/lib/pulse/onboarding-databridge-email.ts
//
// Secuencia de onboarding hacia DataBridge para leads que descargaron el ebook o pidieron
// la demo (ver /api/pulse/ebook y /api/pulse/demo-contacto). Tres touches, siempre con la
// misma salida (crear el primer proyecto en /pulse/databridge) pero ángulos distintos:
//
//   Touch 1 (inmediato, al capturar el lead) — presenta DataBridge, la mitad del producto
//   que no se ve en la demo. Se dispara síncrono desde las rutas de captura.
//   Touch 2 (+3 días, vía cron) — baja la fricción: no hace falta que los datos estén
//   perfectos, son minutos, no un compromiso.
//   Touch 3 (+7 días, vía cron) — última automática. Ofrece una alternativa humana (que
//   respondan el correo) y dice explícitamente que no hay más correos automáticos después
//   de este — la secuencia se corta sola, no queda enfriando al contacto indefinidamente.
//
// La secuencia se detiene de inmediato en tres casos (ver /api/cron/pulse-databridge-followup):
// el lead ya creó un proyecto (objetivo cumplido), se dio de baja (unsubscribed_at), o ya
// completó las 3 touches. Nunca hay una cuarta.
//
// Cada correo lleva un link de baja firmado (HMAC) para que nadie pueda desuscribir el
// correo de otra persona adivinando la URL — ver /api/pulse/onboarding/unsub.

import { createHmac } from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Pulse Motor <agente@ventas10x.co>'

// Fallback deliberado: si todavía no se configuró PULSE_UNSUB_SECRET, el link de baja sigue
// funcionando (firmado con la service role key) en vez de quedar roto en producción. Configurar
// PULSE_UNSUB_SECRET aparte es lo recomendado, no lo obligatorio para que esto no falle en frío.
const UNSUB_SECRET = process.env.PULSE_UNSUB_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'pulse-unsub-fallback'

export type OrigenOnboarding = 'ebook' | 'demo'
export type TouchOnboarding = 1 | 2 | 3

interface LeadOnboarding {
  nombre: string
  email: string
  origen: OrigenOnboarding
}

function tokenBaja(email: string): string {
  return createHmac('sha256', UNSUB_SECRET).update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
}

function linkBaja(email: string): string {
  const params = new URLSearchParams({ email: email.trim().toLowerCase(), token: tokenBaja(email) })
  return `https://pulsemotor.co/api/pulse/onboarding/unsub?${params.toString()}`
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

// ─── Envoltorio común — header de marca + footer con baja, igual en los 3 touches ───
function envolver(cuerpoHtml: string, email: string, footerContexto: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Pulse Motor</title></head>
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
            ${cuerpoHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:28px 0 0;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#6B6459;">— Equipo Pulse Motor</p>
            <p style="margin:0 0 10px;font-size:11px;color:#4A453D;">Recibiste este correo ${footerContexto}</p>
            <p style="margin:0;font-size:11px;color:#4A453D;"><a href="${linkBaja(email)}" style="color:#6B6459;text-decoration:underline;">No quiero recibir más correos sobre esto</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function botonCTA() {
  return `<table cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
    <tr>
      <td style="background:#2563EB;border-radius:10px;padding:13px 26px;">
        <a href="https://pulsemotor.co/pulse/databridge" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Probá con tus propios datos →</a>
      </td>
    </tr>
  </table>`
}

// ─── Touch 1 — presenta DataBridge (inmediato, al capturar el lead) ───
function cuerpoTouch1(lead: LeadOnboarding) {
  const primerNombre = lead.nombre.trim().split(/\s+/)[0] || 'Hola'
  const { apertura } = COPY_POR_ORIGEN[lead.origen]
  return `
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

    ${botonCTA()}
    <p style="margin:0;font-size:12px;color:#6B6459;">Gratis, sin tarjeta — subís un Excel o CSV y en minutos ves el esquema de tu concesionario, ordenado.</p>`
}

// ─── Touch 2 (+3 días) — baja la fricción, no repite el pitch de touch 1 ───
function cuerpoTouch2(lead: LeadOnboarding) {
  const primerNombre = lead.nombre.trim().split(/\s+/)[0] || 'Hola'
  return `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#7BA4F5;letter-spacing:1.2px;text-transform:uppercase;">DataBridge 360</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.35;color:#F3EFE7;">${primerNombre}, ¿tenés 10 minutos y un Excel a mano?</h1>

    <p style="margin:0 0 16px;font-size:14px;color:#C9C3B8;line-height:1.65;">No hace falta que tus datos estén ordenados, completos ni "listos" — es justo al revés: DataBridge existe para el Excel real, con nombres de campo inconsistentes y hojas que nunca se cruzaron.</p>

    <p style="margin:0 0 22px;font-size:14px;color:#9B958A;line-height:1.65;">Subís lo que ya tenés —el de retomas, el de leads, el que te manda el DMS, cualquiera— y en minutos ves el esquema completo: qué tablas hay, qué campos tiene cada una, y qué relaciones encontró la IA entre ellas.</p>

    <p style="margin:0 0 26px;font-size:14px;color:#C9C3B8;line-height:1.65;">No es un compromiso ni el primer paso de una implementación larga. Es ver, en tu propia operación, si esto sirve.</p>

    ${botonCTA()}
    <p style="margin:0;font-size:12px;color:#6B6459;">Gratis, sin tarjeta — guarda hasta 1.000 filas por tabla.</p>`
}

// ─── Touch 3 (+7 días) — última automática, tono humano, corta la secuencia sola ───
function cuerpoTouch3(lead: LeadOnboarding) {
  const primerNombre = lead.nombre.trim().split(/\s+/)[0] || 'Hola'
  return `
    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#7BA4F5;letter-spacing:1.2px;text-transform:uppercase;">Último correo sobre esto</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.35;color:#F3EFE7;">${primerNombre}, quizás no era el momento — y está bien</h1>

    <p style="margin:0 0 16px;font-size:14px;color:#C9C3B8;line-height:1.65;">Te escribimos dos veces sobre DataBridge y todavía no lo probaste. Puede que ahora no sea prioridad, y no vamos a seguir insistiendo por correo: este es el último automático que te mandamos sobre esto.</p>

    <p style="margin:0 0 22px;font-size:14px;color:#9B958A;line-height:1.65;">Si en algún momento querés ordenar los datos de tu concesionario, el link de siempre sigue ahí. Y si preferís que alguien de nuestro equipo lo haga con vos en una llamada de 15 minutos en vez de subir los archivos solo, respondé este correo — lo coordinamos directo.</p>

    ${botonCTA()}
    <p style="margin:0;font-size:12px;color:#6B6459;">Sin apuro. El link no vence.</p>`
}

const CUERPOS: Record<TouchOnboarding, (lead: LeadOnboarding) => string> = {
  1: cuerpoTouch1,
  2: cuerpoTouch2,
  3: cuerpoTouch3,
}

const ASUNTOS: Record<TouchOnboarding, string> = {
  1: 'Antes del agente: así ordena Pulse Motor los datos de tu concesionario',
  2: '¿Tenés 10 minutos y un Excel a mano?',
  3: 'Último correo sobre esto (a menos que quieras)',
}

/** Fire-and-forget: se llama en paralelo al guardado del lead o desde el cron de seguimiento. */
export async function enviarOnboardingDatabridge(lead: LeadOnboarding, touch: TouchOnboarding = 1) {
  const { footer } = COPY_POR_ORIGEN[lead.origen]
  const { error } = await resend.emails.send({
    from: FROM,
    to: [lead.email],
    subject: ASUNTOS[touch],
    html: envolver(CUERPOS[touch](lead), lead.email, footer),
  })
  if (error) throw new Error(error.message || 'Resend rechazó el envío de onboarding')
}
