// Ruta destino: src/lib/whatsapp-cloud-api.ts
//
// Capa compartida sobre la WhatsApp Business Platform oficial de Meta (Cloud
// API) -- reemplaza a Evolution API/Baileys, que terminó con la línea de
// Fénix restringida por patrón de envío masivo detectado como spam. Esta
// librería es genérica a propósito: no sabe nada de Fénix, Pulse ni
// Ventas10x -- recibe una `CuentaWhatsapp` (fila de whatsapp_cuentas) como
// parámetro en cada función, así un mismo motor sirve para:
//
// - Fénix y Pulse: una cuenta por negocio, administrada a mano.
// - Ventas10x: una cuenta POR ASESOR que se suscribe a la plataforma --
//   multi-tenant real. Cuando llegue esa etapa, el alta de cada cuenta se
//   hace vía WhatsApp Embedded Signup (Meta lo exige para que un mismo App
//   gestione WABAs de terceros) en vez de crearla a mano como Fénix/Pulse.
//
// Diferencia clave frente a Evolution API que hay que tener siempre presente:
// un mensaje de plantilla NO abre la ventana de 24h de mensajería libre.
// Solo un mensaje ENTRANTE del usuario abre esa ventana. Fuera de ella, todo
// tiene que ir por plantilla pre-aprobada por Meta -- no se puede mandar
// texto libre "porque sí" como hacía Evolution API, y ese control es
// justamente lo que evita que un número vuelva a quedar restringido.

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export type CuentaWhatsapp = {
  id: string
  proyecto: 'fenix' | 'pulse' | 'ventas10x'
  tenant_id: string | null
  nombre_visible: string
  numero_whatsapp: string
  phone_number_id: string
  waba_id: string
  access_token: string
  webhook_verify_token: string
  estado: 'activo' | 'suspendido' | 'pendiente_verificacion'
}

type ComponentePlantilla =
  | { type: 'header'; parameters: Array<{ type: 'text'; text: string } | { type: 'document'; document: { link: string; filename?: string } } | { type: 'image'; image: { link: string } } | { type: 'video'; video: { link: string } }> }
  | { type: 'body'; parameters: Array<{ type: 'text'; text: string }> }
  | { type: 'button'; sub_type: 'quick_reply' | 'url'; index: string; parameters: Array<{ type: 'payload'; payload: string } | { type: 'text'; text: string }> }

async function llamarGraphAPI(cuenta: CuentaWhatsapp, endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${GRAPH_BASE}/${cuenta.phone_number_id}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cuenta.access_token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    // El shape de error de Graph API trae error.message y error.error_subcode
    // -- se preserva el JSON crudo para que el clasificador de errores (a
    // construir junto con este módulo) pueda distinguir causas: plantilla no
    // aprobada, ventana de 24h cerrada, número de destino inválido, token
    // vencido, cuenta restringida, etc.
    throw new Error(`WhatsApp Cloud API rechazó la solicitud: ${res.status} ${JSON.stringify(data)}`)
  }
  return data
}

// Normaliza el número a formato E.164 sin '+' (lo que espera Graph API en el
// campo "to") -- acepta con o sin espacios/guiones/paréntesis de entrada.
function normalizarDestino(numero: string): string {
  return numero.replace(/\D/g, '')
}

// Envía un mensaje de PLANTILLA pre-aprobada -- la única forma válida de
// iniciar contacto con alguien que nunca escribió antes (fuera de la
// ventana de 24h). `nombrePlantilla` debe coincidir EXACTO con el nombre
// aprobado en Meta Template Manager para esta cuenta.
export async function enviarPlantilla(
  cuenta: CuentaWhatsapp,
  destino: string,
  nombrePlantilla: string,
  idioma: string,
  componentes: ComponentePlantilla[] = []
) {
  return llamarGraphAPI(cuenta, 'messages', {
    messaging_product: 'whatsapp',
    to: normalizarDestino(destino),
    type: 'template',
    template: {
      name: nombrePlantilla,
      language: { code: idioma },
      components: componentes,
    },
  })
}

// Mensaje de texto libre -- SOLO funciona dentro de las 24h desde el último
// mensaje entrante de esa persona. Fuera de esa ventana, Graph API rechaza
// con el error 131047 ("re-engagement message") -- hay que usar
// enviarPlantilla() en ese caso.
export async function enviarTexto(cuenta: CuentaWhatsapp, destino: string, texto: string) {
  return llamarGraphAPI(cuenta, 'messages', {
    messaging_product: 'whatsapp',
    to: normalizarDestino(destino),
    type: 'text',
    text: { body: texto, preview_url: true },
  })
}

// Documento/imagen/video por URL pública -- también sujeto a la ventana de
// 24h salvo que vaya como header de una plantilla (ver enviarPlantilla).
export async function enviarDocumento(cuenta: CuentaWhatsapp, destino: string, url: string, filename?: string, caption?: string) {
  return llamarGraphAPI(cuenta, 'messages', {
    messaging_product: 'whatsapp',
    to: normalizarDestino(destino),
    type: 'document',
    document: { link: url, filename, caption },
  })
}

export async function enviarImagen(cuenta: CuentaWhatsapp, destino: string, url: string, caption?: string) {
  return llamarGraphAPI(cuenta, 'messages', {
    messaging_product: 'whatsapp',
    to: normalizarDestino(destino),
    type: 'image',
    image: { link: url, caption },
  })
}

export async function enviarVideo(cuenta: CuentaWhatsapp, destino: string, url: string, caption?: string) {
  return llamarGraphAPI(cuenta, 'messages', {
    messaging_product: 'whatsapp',
    to: normalizarDestino(destino),
    type: 'video',
    video: { link: url, caption },
  })
}

// Marca un mensaje entrante como leído -- opcional pero recomendado (el
// check azul le da al lead una señal de que hay alguien del otro lado).
export async function marcarLeido(cuenta: CuentaWhatsapp, messageId: string) {
  return llamarGraphAPI(cuenta, 'messages', {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  })
}

// ─── Mensajes interactivos nativos ───
//
// Botones y listas de verdad (no texto con formato) -- solo funcionan
// DENTRO de la ventana de 24h, igual que enviarTexto(). Para ofrecer
// botones a alguien que nunca escribió, hay que usarlos como componente de
// una plantilla aprobada (ver ComponentePlantilla en enviarPlantilla), no
// con estas funciones.

export type BotonRespuestaRapida = { id: string; titulo: string } // titulo: máx 20 caracteres, lo impone WhatsApp

// Hasta 3 botones de respuesta rápida debajo del mensaje. El `id` es lo que
// vuelve en el webhook cuando el usuario toca el botón (interactive.
// button_reply.id) -- se usa para lógica de negocio, no se muestra al
// usuario (lo que ve es `titulo`).
export async function enviarBotones(
  cuenta: CuentaWhatsapp,
  destino: string,
  texto: string,
  botones: BotonRespuestaRapida[],
  opciones: { header?: string; footer?: string } = {}
) {
  if (botones.length === 0 || botones.length > 3) {
    throw new Error('enviarBotones acepta entre 1 y 3 botones (límite de WhatsApp)')
  }
  return llamarGraphAPI(cuenta, 'messages', {
    messaging_product: 'whatsapp',
    to: normalizarDestino(destino),
    type: 'interactive',
    interactive: {
      type: 'button',
      ...(opciones.header ? { header: { type: 'text', text: opciones.header } } : {}),
      body: { text: texto },
      ...(opciones.footer ? { footer: { text: opciones.footer } } : {}),
      action: {
        buttons: botones.map((b) => ({ type: 'reply', reply: { id: b.id, title: b.titulo } })),
      },
    },
  })
}

export type FilaLista = { id: string; titulo: string; descripcion?: string }
export type SeccionLista = { titulo?: string; filas: FilaLista[] }

// Lista desplegable -- útil cuando hay más de 3 opciones (los botones
// tienen tope de 3). `boton` es el texto del botón que abre el menú (ej.
// "Ver opciones"), máx 20 caracteres.
export async function enviarLista(
  cuenta: CuentaWhatsapp,
  destino: string,
  texto: string,
  boton: string,
  secciones: SeccionLista[],
  opciones: { header?: string; footer?: string } = {}
) {
  return llamarGraphAPI(cuenta, 'messages', {
    messaging_product: 'whatsapp',
    to: normalizarDestino(destino),
    type: 'interactive',
    interactive: {
      type: 'list',
      ...(opciones.header ? { header: { type: 'text', text: opciones.header } } : {}),
      body: { text: texto },
      ...(opciones.footer ? { footer: { text: opciones.footer } } : {}),
      action: {
        button: boton,
        sections: secciones.map((s) => ({
          ...(s.titulo ? { title: s.titulo } : {}),
          rows: s.filas.map((f) => ({ id: f.id, title: f.titulo, ...(f.descripcion ? { description: f.descripcion } : {}) })),
        })),
      },
    },
  })
}

// ─── Webhook entrante ───
//
// Meta manda TODO en un único payload anidado, muy distinto al formato de
// Evolution API. Estas funciones lo normalizan a una forma simple para que
// el resto del código (los handlers por proyecto) no tenga que lidiar con
// la forma cruda de Graph API.

export type MensajeEntrante = {
  phoneNumberId: string // qué número de LOS NUESTROS recibió esto -- clave para enrutar a la cuenta correcta
  from: string // número del lead, en formato E.164 sin '+'
  messageId: string
  timestamp: string
  tipo: 'text' | 'image' | 'document' | 'audio' | 'video' | 'button' | 'interactive' | 'otro'
  texto: string | null // el contenido legible, cualquiera sea el tipo (texto plano, o el título del botón presionado)
}

// Parsea el body crudo del webhook POST de Meta y devuelve la lista de
// mensajes entrantes normalizados. Devuelve array vacío para eventos que no
// son mensajes (ej. actualizaciones de estado "delivered"/"read" de
// mensajes que NOSOTROS enviamos -- esos no necesitan respuesta).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsearWebhookEntrante(body: any): MensajeEntrante[] {
  const resultado: MensajeEntrante[] = []
  const entradas = body?.entry || []
  for (const entrada of entradas) {
    for (const change of entrada.changes || []) {
      const value = change.value
      const phoneNumberId = value?.metadata?.phone_number_id
      for (const msg of value?.messages || []) {
        let texto: string | null = null
        let tipo: MensajeEntrante['tipo'] = 'otro'
        if (msg.type === 'text') { tipo = 'text'; texto = msg.text?.body ?? null }
        else if (msg.type === 'button') { tipo = 'button'; texto = msg.button?.text ?? null }
        else if (msg.type === 'interactive') {
          tipo = 'interactive'
          texto = msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? null
        }
        else if (msg.type === 'image') tipo = 'image'
        else if (msg.type === 'document') tipo = 'document'
        else if (msg.type === 'audio') tipo = 'audio'
        else if (msg.type === 'video') tipo = 'video'

        resultado.push({
          phoneNumberId,
          from: msg.from,
          messageId: msg.id,
          timestamp: msg.timestamp,
          tipo,
          texto,
        })
      }
    }
  }
  return resultado
}

// Verificación del handshake GET que Meta hace una sola vez al configurar
// el webhook (y cada vez que se cambia la URL). Se compara contra el
// webhook_verify_token de la cuenta correspondiente -- como en este punto
// todavía no sabemos qué cuenta es (Meta no manda el phone_number_id en el
// handshake), se acepta si el token coincide con CUALQUIER cuenta activa.
export function verificarHandshakeWebhook(
  params: { mode: string | null; token: string | null; challenge: string | null },
  tokensValidos: string[]
): string | null {
  if (params.mode === 'subscribe' && params.token && tokensValidos.includes(params.token)) {
    return params.challenge
  }
  return null
}
