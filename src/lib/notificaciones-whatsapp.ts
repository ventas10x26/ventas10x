// Ruta destino: src/lib/notificaciones-whatsapp.ts
// Helper para enviar mensajes al WhatsApp del vendedor vía CallMeBot.
// Es un servicio gratuito que el vendedor activa enviando un mensaje desde su WhatsApp.

type LeadNotificacion = {
  nombre: string
  whatsapp: string
  interes?: string
  fuente: 'bot_landing' | 'bot_ia' | 'formulario' | string
}

type ConfigVendedor = {
  callmebot_apikey?: string | null
  callmebot_telefono?: string | null
  notif_whatsapp_activa?: boolean | null
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'

/**
 * Envía un mensaje de WhatsApp al vendedor con los datos del lead nuevo.
 * Es no-bloqueante: si falla, solo loguea el error pero no rompe el flujo.
 */
export async function notificarLeadPorWhatsApp(
  vendedor: ConfigVendedor,
  lead: LeadNotificacion,
  vendedorNombre: string = 'Asesor'
): Promise<{ ok: boolean; error?: string }> {
  // Validar que el vendedor tiene la notificación configurada
  if (!vendedor.notif_whatsapp_activa) {
    return { ok: false, error: 'Notificaciones WhatsApp desactivadas' }
  }

  if (!vendedor.callmebot_apikey || !vendedor.callmebot_telefono) {
    return { ok: false, error: 'CallMeBot no configurado' }
  }

  // Limpiar el teléfono (solo dígitos)
  const telefono = vendedor.callmebot_telefono.replace(/\D/g, '')
  if (telefono.length < 8) {
    return { ok: false, error: 'Teléfono inválido' }
  }

  // Limpiar WhatsApp del lead
  const waLead = (lead.whatsapp || '').replace(/\D/g, '')

  const fuenteLabel =
    lead.fuente === 'bot_landing'
      ? 'Bot Landing'
      : lead.fuente === 'bot_ia'
      ? 'Bot IA'
      : 'Formulario'

  // Mensaje con formato amigable
  const mensaje = [
    `🔥 *NUEVO LEAD!*`,
    ``,
    `Hola ${vendedorNombre}, tienes un prospecto listo para contactar.`,
    ``,
    `👤 *${lead.nombre}*`,
    `📱 ${lead.whatsapp}`,
    lead.interes ? `🎯 Interés: ${lead.interes}` : null,
    `📍 Fuente: ${fuenteLabel}`,
    ``,
    `*Responder al lead:*`,
    `wa.me/${waLead}`,
    ``,
    `Ver en dashboard:`,
    `${BASE_URL}/dashboard/leads`,
  ]
    .filter(Boolean)
    .join('\n')

  // Construir URL de CallMeBot
  const url = new URL('https://api.callmebot.com/whatsapp.php')
  url.searchParams.set('phone', telefono)
  url.searchParams.set('apikey', vendedor.callmebot_apikey)
  url.searchParams.set('text', mensaje)

  try {
    // CallMeBot acepta GET. Timeout corto para no bloquear el flujo.
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const text = await res.text()
      console.error('[notif-whatsapp] CallMeBot rechazó:', res.status, text)
      return { ok: false, error: `CallMeBot error ${res.status}` }
    }

    return { ok: true }
  } catch (e) {
    console.error('[notif-whatsapp] Error de red:', e)
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return { ok: false, error: msg }
  }
}

/**
 * Envía un mensaje de prueba al vendedor para validar la configuración.
 */
export async function probarCallMeBot(
  apikey: string,
  telefono: string
): Promise<{ ok: boolean; error?: string }> {
  const tel = telefono.replace(/\D/g, '')
  if (tel.length < 8) return { ok: false, error: 'Teléfono inválido' }

  const mensaje = [
    `✅ *Configuración exitosa!*`,
    ``,
    `Tu cuenta de Ventas10x ya puede enviarte notificaciones de leads por WhatsApp.`,
    ``,
    `Cuando llegue un lead nuevo desde tu bot o landing, recibirás un mensaje aquí con sus datos.`,
    ``,
    `${BASE_URL}/dashboard`,
  ].join('\n')

  const url = new URL('https://api.callmebot.com/whatsapp.php')
  url.searchParams.set('phone', tel)
  url.searchParams.set('apikey', apikey)
  url.searchParams.set('text', mensaje)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `CallMeBot rechazó: ${text.substring(0, 200)}` }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return { ok: false, error: msg }
  }
}
