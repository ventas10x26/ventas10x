// Ruta destino: src/lib/fenix-lead-pipeline.ts
//
// Lógica compartida para procesar un lead de Fenix Consultores venga de
// donde venga -- el formulario propio de la landing (/api/fenix-contacto)
// o un formulario nativo de Meta Lead Ads en Facebook/Instagram
// (/api/fenix/meta-leads/webhook). Ambos puntos de entrada arman un
// LeadFenix con la misma forma y llaman a procesarLeadFenix -- así el
// email al equipo, el aviso por WhatsApp interno y la autorespuesta al
// lead se comportan idénticos sin importar el origen.
//
// La autorespuesta al LEAD migró de Evolution API a WhatsApp Cloud API
// (ver whatsapp-cloud-api.ts) -- Evolution quedó fuera de servicio tras la
// restricción de la línea por patrón de envío masivo. El aviso interno al
// equipo (notificarWhatsAppFenix, más abajo) sigue por CallMeBot -- es un
// servicio totalmente distinto, no relacionado con Evolution ni con esta
// migración.

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { enviarTexto, enviarImagen, enviarVideo, type CuentaWhatsapp } from '@/lib/whatsapp-cloud-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cuenta de Resend propia de Fenix, distinta de la que usa el resto de
// Ventas10x. Cliente perezoso: si FENIX_RESEND_API_KEY no está configurada
// todavía, el throw solo tumba el envío de ese correo puntual (atrapado por
// Promise.allSettled en procesarLeadFenix), no el módulo entero.
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

// Mismo instance_name que usa fenix-whatsapp-cloud-handler.ts para las
// conversaciones nuevas -- así el admin panel (Leads y pipeline,
// Conversaciones) ve todo en un solo lugar sin importar si el hilo empezó
// por autorespuesta o porque el lead escribió primero.
const INSTANCE_NAME = 'fenix_cobranza'
const ENTREGABLE_URL = 'https://zicdmwihdslyydjuuqgq.supabase.co/storage/v1/object/public/fenix-public/cartera-fenix.jpg'
const VIDEO_URL = 'https://zicdmwihdslyydjuuqgq.supabase.co/storage/v1/object/public/fenix-public/fenix-video.mp4'

export type LeadFenix = {
  empresa: string
  nombre: string
  email: string
  telefono: string
  mensaje: string
}

// Resuelve LA cuenta de Cloud API de producción de Fénix -- distinta de la
// de pruebas (whatsapp_cuentas.es_prueba) que solo sirve para validar el
// webhook con números de prueba de Meta. Si en el futuro hay más de una
// cuenta de producción para Fénix, esto debería recibir un criterio más
// específico; hoy con una sola alcanza con excluir la de pruebas.
async function obtenerCuentaFenixProduccion(): Promise<CuentaWhatsapp> {
  const { data, error } = await supabase
    .from('whatsapp_cuentas')
    .select('*')
    .eq('proyecto', 'fenix')
    .eq('estado', 'activo')
    .eq('es_prueba', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) {
    throw new Error('No se encontró una cuenta de WhatsApp Cloud API de producción para Fénix en whatsapp_cuentas (proyecto=fenix, estado=activo, es_prueba=false)')
  }
  return data as CuentaWhatsapp
}

async function guardarLead(lead: LeadFenix, fuente: string): Promise<string | null> {
  const { data, error } = await supabase.from('fenix_leads').insert({
    empresa: lead.empresa,
    nombre: lead.nombre,
    email: lead.email,
    telefono: lead.telefono,
    mensaje: lead.mensaje || null,
    fuente,
  }).select('id').single()
  if (error) throw new Error(error.message)
  return data?.id ?? null
}

function htmlLeadFenix(lead: LeadFenix, fuente: string) {
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
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#F5A455;letter-spacing:1.2px;text-transform:uppercase;">Nuevo lead — Fénix Consultores · ${fuente}</p>
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

async function enviarEmailFenix(lead: LeadFenix, fuente: string) {
  const { error } = await getResendFenix().emails.send({
    from: FENIX_EMAIL_FROM,
    to: FENIX_EMAIL_DESTINOS,
    replyTo: lead.email,
    subject: `Nuevo lead — ${lead.empresa} (${lead.nombre})`,
    html: htmlLeadFenix(lead, fuente),
  })
  if (error) throw new Error(error.message || 'Resend rechazó el envío')
}

// Aviso INTERNO al equipo de Fénix -- vía CallMeBot, un servicio aparte de
// Evolution/Cloud API que no participa de la migración. Se deja igual.
async function notificarWhatsAppFenix(lead: LeadFenix, fuente: string) {
  const apikey = process.env.FENIX_CALLMEBOT_APIKEY
  if (!apikey) throw new Error('FENIX_CALLMEBOT_APIKEY no configurada')

  const texto = [
    `🔥 *NUEVO LEAD - FENIX CONSULTORES* (${fuente})`,
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

// ── Autorespuesta de WhatsApp AL LEAD (no al equipo) ───────────────────────────
type LeadsAgenteConfig = {
  activo: boolean
  mensaje_bienvenida: string | null
  nombre_archivo_entregable: string | null
  pregunta_cierre: string | null
  video_activo: boolean
  video_caption: string | null
}

const DEFAULT_MENSAJE_BIENVENIDA = [
  '¡Hola {nombre}! 👋 Soy el asistente virtual de FÉNIX Consultores. Gracias por tu interés en recuperar la cartera vencida de {empresa}.',
  'Combinamos IA, una plataforma de gestión trazable y un equipo jurídico especializado para recuperar cartera empresarial (llevamos +12 años, sectores Real y Salud).',
  'Te comparto nuestro brochure con el detalle del modelo 👇',
].join('\n\n')
const DEFAULT_NOMBRE_ARCHIVO = 'Recuperación estratégica de cartera — Fénix Consultores'
const DEFAULT_PREGUNTA_CIERRE = '¿Qué necesitas? -- ¿quieres saber cómo aplica a tu sector, tiempos de recuperación, o prefieres agendar el diagnóstico gratuito con un especialista?'
const DEFAULT_VIDEO_CAPTION = 'Un video corto para conocernos mejor 🎥'

async function obtenerConfigLeadsAgente(): Promise<LeadsAgenteConfig> {
  try {
    const { data } = await supabase
      .from('fenix_leads_agente')
      .select('activo, mensaje_bienvenida, nombre_archivo_entregable, pregunta_cierre, video_activo, video_caption')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return {
      activo: data?.activo !== false,
      mensaje_bienvenida: data?.mensaje_bienvenida || null,
      nombre_archivo_entregable: data?.nombre_archivo_entregable || null,
      pregunta_cierre: data?.pregunta_cierre || null,
      video_activo: data?.video_activo !== false,
      video_caption: data?.video_caption || null,
    }
  } catch (e) {
    console.error('[fenix-lead-pipeline] obtenerConfigLeadsAgente error:', e)
    return { activo: true, mensaje_bienvenida: null, nombre_archivo_entregable: null, pregunta_cierre: null, video_activo: true, video_caption: null }
  }
}

function mensajeBienvenidaLead(lead: LeadFenix, plantilla: string): string {
  return plantilla
    .replaceAll('{nombre}', lead.nombre.trim().split(/\s+/)[0] || lead.nombre)
    .replaceAll('{empresa}', lead.empresa)
}

export type AutorespuestaEnviada = {
  intro: string
  nombreArchivo: string
  preguntaCierre: string
  mensajeCompleto: string
}

// IMPORTANTE: esto solo funciona si el lead está DENTRO de la ventana de
// 24h (acaba de escribir por el formulario y por eso Meta cuenta esto como
// respuesta) -- ver el comentario grande sobre plantillas en
// whatsapp-cloud-api.ts. Si algún día esto se dispara fuera de esa ventana
// (p.ej. un reenvío manual días después), Graph API lo va a rechazar con
// el error 131047 y hay que pasar a enviarPlantilla() en su lugar.
export async function enviarAutorespuestaLead(lead: LeadFenix, opciones: { forzar?: boolean } = {}): Promise<AutorespuestaEnviada | null> {
  const digitos = lead.telefono.replace(/\D/g, '')
  if (!digitos) throw new Error('Teléfono del lead vacío tras limpiar')
  // Sin sufijo @s.whatsapp.net (eso era de Evolution) -- mismo formato de
  // remote_jid que usa fenix-whatsapp-cloud-handler.ts para que, cuando
  // este lead responda, el webhook encuentre esta misma fila en vez de
  // crear una segunda conversación duplicada.
  const remoteJid = digitos

  const cfg = await obtenerConfigLeadsAgente()
  if (!cfg.activo && !opciones.forzar) return null // desactivado desde el panel -- el lead ya quedó guardado y avisado al equipo por los otros canales

  const cuenta = await obtenerCuentaFenixProduccion()

  const intro = mensajeBienvenidaLead(lead, cfg.mensaje_bienvenida || DEFAULT_MENSAJE_BIENVENIDA)
  const captionEntregable = cfg.nombre_archivo_entregable || DEFAULT_NOMBRE_ARCHIVO
  const preguntaCierre = cfg.pregunta_cierre || DEFAULT_PREGUNTA_CIERRE

  await enviarTexto(cuenta, remoteJid, intro)
  await new Promise((r) => setTimeout(r, 900))
  await enviarImagen(cuenta, remoteJid, ENTREGABLE_URL, captionEntregable)

  const historialEnviados: { role: 'assistant'; content: string }[] = [
    { role: 'assistant', content: intro },
    { role: 'assistant', content: `[Imagen enviada: ${captionEntregable}]` },
  ]
  const partesMensaje = [intro, `🖼️ Imagen enviada: ${captionEntregable}`]

  if (cfg.video_activo) {
    const videoCaption = cfg.video_caption || DEFAULT_VIDEO_CAPTION
    await new Promise((r) => setTimeout(r, 900))
    await enviarVideo(cuenta, remoteJid, VIDEO_URL, videoCaption)
    historialEnviados.push({ role: 'assistant', content: `[Video enviado: ${videoCaption}]` })
    partesMensaje.push(`🎥 Video enviado: ${videoCaption}`)
  }

  await new Promise((r) => setTimeout(r, 900))
  await enviarTexto(cuenta, remoteJid, preguntaCierre)
  historialEnviados.push({ role: 'assistant', content: preguntaCierre })
  partesMensaje.push(preguntaCierre)

  // phone_number_id queda registrado desde este primer mensaje -- así la
  // conversación aparece con la caja de "responder" habilitada en
  // /admin/fenix/conversaciones desde el minuto uno, sin esperar a que el
  // lead escriba de vuelta.
  const { error } = await supabase.from('fenix_conversaciones').upsert({
    instance_name: INSTANCE_NAME,
    remote_jid: remoteJid,
    tipo: 'lead',
    historial: historialEnviados,
    phone_number_id: cuenta.phone_number_id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'instance_name,remote_jid' })
  if (error) throw new Error(error.message)

  const mensajeCompleto = partesMensaje.join('\n\n')
  return { intro, nombreArchivo: captionEntregable, preguntaCierre, mensajeCompleto }
}

// Deja constancia en fenix_leads de cuándo se envió la autorespuesta y qué
// decía, para que el admin lo muestre en el modal del lead (tanto para
// envíos automáticos como para el botón manual de "Enviar autorespuesta").
export async function marcarAutorespuestaEnviada(leadId: string, mensajeCompleto: string) {
  const { error } = await supabase
    .from('fenix_leads')
    .update({ autorespuesta_enviada_at: new Date().toISOString(), autorespuesta_mensaje: mensajeCompleto })
    .eq('id', leadId)
  if (error) console.error('[fenix-lead-pipeline] marcarAutorespuestaEnviada error:', error)
}

// Mueve el lead de "nuevo" a "contactado" apenas se le envía la
// autorespuesta -- ya no espera a que el lead responda, "contactado"
// significa "ya se le escribió", no "ya escribió de vuelta". Solo mueve si
// sigue en "nuevo" (no pisa una etapa que el equipo ya haya movido a mano,
// ni un envío manual repetido sobre un lead que ya avanzó en el pipeline).
export async function marcarLeadContactadoPorId(leadId: string) {
  const { error } = await supabase
    .from('fenix_leads')
    .update({ etapa: 'contactado' })
    .eq('id', leadId)
    .eq('etapa', 'nuevo')
  if (error) console.error('[fenix-lead-pipeline] marcarLeadContactadoPorId error:', error)
}

export type ResultadoProcesarLead = {
  guardado: boolean
  email: boolean
  whatsappEquipo: boolean
  autorespuesta: boolean
}

// Punto de entrada único: guarda el lead, avisa al equipo por correo y por
// WhatsApp, y le manda la autorespuesta al lead. El guardado va primero (es
// rápido, un simple insert) para tener el id del lead y así poder marcar en
// fenix_leads cuándo se envió la autorespuesta y qué decía -- los otros tres
// canales corren en paralelo después, cada uno independiente de los demás
// (igual que ya hacía /api/fenix-contacto). `fuente` identifica de dónde
// vino el lead (landing_fenix_consultores, meta_ads_leadgen, etc.).
export async function procesarLeadFenix(lead: LeadFenix, fuente: string): Promise<ResultadoProcesarLead> {
  let leadId: string | null = null
  let guardadoOk = false
  try {
    leadId = await guardarLead(lead, fuente)
    guardadoOk = true
  } catch (e) {
    console.error(`[fenix-lead-pipeline:${fuente}] no se guardó en Supabase:`, e)
  }

  const [porEmail, porWhatsApp, autorespuesta] = await Promise.allSettled([
    enviarEmailFenix(lead, fuente),
    notificarWhatsAppFenix(lead, fuente),
    enviarAutorespuestaLead(lead),
  ])

  if (porEmail.status === 'rejected') console.error(`[fenix-lead-pipeline:${fuente}] email falló:`, porEmail.reason)
  if (porWhatsApp.status === 'rejected') console.error(`[fenix-lead-pipeline:${fuente}] whatsapp al equipo falló:`, porWhatsApp.reason)
  if (autorespuesta.status === 'rejected') console.error(`[fenix-lead-pipeline:${fuente}] autorespuesta al lead falló:`, autorespuesta.reason)

  if (autorespuesta.status === 'fulfilled' && autorespuesta.value && leadId) {
    await marcarAutorespuestaEnviada(leadId, autorespuesta.value.mensajeCompleto)
    await marcarLeadContactadoPorId(leadId)
  }

  return {
    guardado: guardadoOk,
    email: porEmail.status === 'fulfilled',
    whatsappEquipo: porWhatsApp.status === 'fulfilled',
    autorespuesta: autorespuesta.status === 'fulfilled' && !!autorespuesta.value,
  }
}
