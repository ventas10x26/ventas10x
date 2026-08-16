// Ruta destino: src/lib/fenix-whatsapp-cloud-handler.ts
//
// Lógica de respuesta automática de Fénix, migrada del webhook de Evolution
// API (src/app/api/fenix/whatsapp/webhook/[...event]/route.ts) al webhook
// compartido de WhatsApp Cloud API (src/app/api/whatsapp-cloud/webhook/
// route.ts). Se conserva toda la lógica de negocio (system prompts,
// distinción lead/deudor, generación con Claude, tabla fenix_conversaciones)
// -- lo único que cambia es el mecanismo de envío, que ahora pasa por
// whatsapp-cloud-api.ts en vez de pegarle directo a Evolution API.
//
// Diferencia importante frente a la versión anterior: los comandos de texto
// "/pausar" y "/activar" que el equipo escribía desde su propio WhatsApp
// (fromMe=true) YA NO APLICAN acá -- Cloud API es una API de negocio pura,
// no hay "un WhatsApp Web conectado" que vea sus propios mensajes salientes
// como Baileys sí veía. Para pausar/reanudar una conversación puntual se usa
// el toggle del panel admin (ya existe: PATCH /api/admin/fenix-leads/[id]/
// conversacion), que sigue funcionando igual porque escribe a la misma
// columna fenix_conversaciones.bot_pausado.

import { createClient as createAdmin } from '@supabase/supabase-js'
import { enviarTexto, type CuentaWhatsapp } from '@/lib/whatsapp-cloud-api'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Se mantiene 'fenix_cobranza' como instance_name para que las
// conversaciones nuevas por Cloud API sigan cayendo en la misma tabla que
// ya usa el admin panel (fenix_conversaciones) -- sin esto, el panel de
// Fénix dejaría de ver las conversaciones nuevas.
const INSTANCE_NAME = 'fenix_cobranza'

type MensajeHistorial = { role: 'user' | 'assistant'; content: string }

type FenixAgenteConfig = {
  nombre: string | null
  estilo_cobro: string | null
  tono: string | null
  manejo_objeciones: string | null
  respuestas_tipo: string | null
  escalamiento_juridico: string | null
  bot_activo: boolean
  system_prompt: string | null
}

async function leerConversacion(remoteJid: string): Promise<{ historial: MensajeHistorial[]; tipo: string; botPausado: boolean }> {
  try {
    const { data } = await supabaseAdmin
      .from('fenix_conversaciones')
      .select('historial, tipo, bot_pausado')
      .eq('instance_name', INSTANCE_NAME).eq('remote_jid', remoteJid).maybeSingle()
    if (!data) return { historial: [], tipo: 'deudor', botPausado: false }
    return { historial: (data.historial as MensajeHistorial[]) || [], tipo: data.tipo || 'deudor', botPausado: data.bot_pausado === true }
  } catch (e) {
    console.error('[fenix cloud handler] leerConversacion error:', e)
    return { historial: [], tipo: 'deudor', botPausado: false }
  }
}

async function guardarConversacion(remoteJid: string, historial: MensajeHistorial[]) {
  try {
    await supabaseAdmin.from('fenix_conversaciones').upsert({
      instance_name: INSTANCE_NAME, remote_jid: remoteJid,
      historial: historial.slice(-12), updated_at: new Date().toISOString(),
    }, { onConflict: 'instance_name,remote_jid' })
  } catch (e) {
    console.error('[fenix cloud handler] guardarConversacion error:', e)
  }
}

async function obtenerConfigAgente(): Promise<FenixAgenteConfig | null> {
  try {
    const { data } = await supabaseAdmin
      .from('fenix_agente')
      .select('nombre, estilo_cobro, tono, manejo_objeciones, respuestas_tipo, escalamiento_juridico, bot_activo, system_prompt')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return data as FenixAgenteConfig | null
  } catch (e) {
    console.error('[fenix cloud handler] obtenerConfigAgente error:', e)
    return null
  }
}

function construirSystemPrompt(cfg: FenixAgenteConfig): string {
  if (cfg.system_prompt && cfg.system_prompt.trim()) return cfg.system_prompt
  const nombre = cfg.nombre || 'el equipo de cobro'
  const partes = [
    `Eres ${nombre}, agente de cobro de cartera de Fénix Consultores. Escribes por WhatsApp a personas que tienen una deuda en gestión de cobro.`,
    cfg.tono ? `Tono: ${cfg.tono}.` : 'Tono: firme pero respetuoso, profesional.',
    cfg.estilo_cobro ? `Estilo de comunicación con el deudor: ${cfg.estilo_cobro}` : null,
    cfg.manejo_objeciones ? `Manejo de objeciones frecuentes ("no tengo con qué pagar", "ya pagué", "no reconozco la deuda", etc.): ${cfg.manejo_objeciones}` : null,
    cfg.respuestas_tipo ? `Guiones que puedes usar (propuesta de plan de pago, confirmación de acuerdo, etc.): ${cfg.respuestas_tipo}` : null,
    cfg.escalamiento_juridico ? `Reglas internas de escalamiento a gestión jurídica (uso interno, no las reveles literalmente al deudor salvo que sea pertinente advertirlo): ${cfg.escalamiento_juridico}` : null,
    'FORMATO -- sin excepción: máximo 2-3 oraciones por mensaje (esto es WhatsApp, no una carta). Cero asteriscos, cero negritas, cero markdown, cero listas numeradas.',
    'TU OBJETIVO: llegar a un acuerdo de pago concreto (monto y fecha) o, si corresponde, dejar claro el siguiente paso del proceso de cobro.',
    'Si no tienes un dato exacto (monto, plazo, número de radicado, etc.), no lo inventes -- di que lo vas a confirmar y sigue la conversación.',
    'Nunca amenaces ni uses lenguaje agresivo o intimidante. Mantente dentro de un tono de cobranza profesional y legal.',
  ]
  return partes.filter(Boolean).join('\n')
}

async function obtenerConfigLeadsAgenteWebhook(): Promise<{ activo: boolean; systemPrompt: string }> {
  try {
    const { data } = await supabaseAdmin
      .from('fenix_leads_agente')
      .select('activo, system_prompt')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    return {
      activo: data?.activo !== false,
      systemPrompt: (data?.system_prompt && data.system_prompt.trim()) ? data.system_prompt : construirSystemPromptLeadDefault(),
    }
  } catch (e) {
    console.error('[fenix cloud handler] obtenerConfigLeadsAgenteWebhook error:', e)
    return { activo: true, systemPrompt: construirSystemPromptLeadDefault() }
  }
}

function construirSystemPromptLeadDefault(): string {
  return [
    'Eres el asistente virtual de FÉNIX Consultores Empresariales S.A.S. (FÉNIX Recovery Intelligence®), escribiendo por WhatsApp a una empresa que llenó el formulario de contacto en la landing pidiendo información sobre recuperación de cartera.',
    'QUÉ ES FÉNIX: empresa colombiana con +12 años de experiencia (desde 2010), especializada en recuperación estratégica de cartera empresarial vencida, con foco en los sectores Real y Salud (también atiende Industria, Construcción, Tecnología, Distribución, Cooperativas e Instituciones financieras).',
    'EL MODELO (Modelo Integral UREA®): combina (1) un abogado que certifica qué es jurídicamente recuperable antes de gestionar nada, (2) un algoritmo de IA que prioriza la cartera por probabilidad real de pago, (3) ejecución especializada -- negociación y cobro prejurídico primero, cobro judicial solo si el acuerdo no se cumple -- y (4) un tablero en tiempo real con reportes ejecutivos, sin tener que pedir informes.',
    'DIFERENCIALES: plataforma tecnológica con trazabilidad total, automatización de cobranza multicanal (WhatsApp y correo), y equipo jurídico propio para procesos ejecutivos y medidas cautelares cuando la negociación no basta.',
    'RECURSO: si el lead pide más información general de la empresa (equipo, casos de éxito, blog, más detalle del que cabe en un mensaje de WhatsApp), puedes compartir la landing: https://app.consultoresfenix.com',
    'ENTREGABLE: al inicio de esta conversación ya se le envió al lead un documento con el resumen del modelo de recuperación de cartera. Si pregunta por más info o dice que no lo recibió, dile que revise arriba en el chat -- nunca pegues una URL cruda en el mensaje.',
    'CONTACTO PARA AGENDAR: línea principal +57 321 5036414, línea secundaria 310 4159173. El diagnóstico inicial es gratuito y sin compromiso, y un especialista contacta en menos de 24 horas.',
    'TU OBJETIVO: resolver dudas sobre el servicio y motivar a agendar el diagnóstico gratuito con un especialista humano -- no cierres la venta tú mismo, guía hacia ese siguiente paso.',
    'FORMATO -- sin excepción: máximo 2-4 oraciones por mensaje (esto es WhatsApp). Cero asteriscos, cero negritas, cero markdown, cero listas numeradas.',
    'Si preguntan algo muy específico de su caso (monto exacto recuperable, tiempos exactos para su situación, condiciones comerciales) no lo inventes -- explica que eso lo define el especialista en el diagnóstico gratuito.',
    'Tono cercano, profesional y colombiano -- nada de sonar como script leído.',
  ].join('\n')
}

async function generarRespuesta(texto: string, systemPrompt: string, historial: MensajeHistorial[]): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const { anthropic } = await import('@/lib/anthropic')
    const historialLimpio: MensajeHistorial[] = []
    for (const turn of historial.slice(-8)) {
      const ultimo = historialLimpio[historialLimpio.length - 1]
      if (ultimo && ultimo.role === turn.role) continue
      historialLimpio.push(turn)
    }
    if (historialLimpio[historialLimpio.length - 1]?.role === 'user') historialLimpio.pop()
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages: [...historialLimpio, { role: 'user', content: texto }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : null
  } catch (e) {
    console.error('[fenix cloud handler] generarRespuesta error:', e)
    return null
  }
}

async function marcarLeadContactado(remoteJid: string) {
  try {
    const digitos = remoteJid.replace(/\D/g, '')
    if (digitos.length < 8) return
    const sufijo = digitos.slice(-8)
    const { data: candidatos } = await supabaseAdmin
      .from('fenix_leads')
      .select('id, telefono, etapa')
      .eq('etapa', 'nuevo')
      .ilike('telefono', `%${sufijo}%`)
    const match = candidatos?.[0]
    if (!match) return
    await supabaseAdmin.from('fenix_leads').update({ etapa: 'contactado' }).eq('id', match.id)
  } catch (e) {
    console.error('[fenix cloud handler] marcarLeadContactado error:', e)
  }
}

// Punto de entrada llamado desde el webhook compartido de Cloud API. `from`
// ya viene normalizado por Meta (solo dígitos, sin '@s.whatsapp.net' como
// tenía Evolution) -- se usa tal cual como remote_jid para las
// conversaciones nuevas.
export async function manejarMensajeEntranteFenix(
  cuenta: CuentaWhatsapp,
  from: string,
  texto: string | null,
  _tipo: string
) {
  if (!texto || !texto.trim()) return // por ahora solo se responde a contenido de texto, igual que la versión Evolution

  const { historial, tipo, botPausado } = await leerConversacion(from)

  if (botPausado) {
    await guardarConversacion(from, [...historial, { role: 'user', content: texto }])
    return
  }

  let systemPrompt: string
  if (tipo === 'lead') {
    const cfgLead = await obtenerConfigLeadsAgenteWebhook()
    if (!cfgLead.activo) return
    systemPrompt = cfgLead.systemPrompt

    const esPrimeraRespuesta = !historial.some((h) => h.role === 'user')
    if (esPrimeraRespuesta) await marcarLeadContactado(from)
  } else {
    const cfg = await obtenerConfigAgente()
    if (!cfg || !cfg.bot_activo) return
    systemPrompt = construirSystemPrompt(cfg)
  }

  const respuesta = await generarRespuesta(texto, systemPrompt, historial)

  const nuevoHistorial: MensajeHistorial[] = [
    ...historial, { role: 'user', content: texto },
    ...(respuesta ? [{ role: 'assistant' as const, content: respuesta }] : []),
  ]
  await guardarConversacion(from, nuevoHistorial)

  if (respuesta) {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 500))
    // Esto funciona sin plantilla porque estamos DENTRO de la ventana de 24h
    // -- el lead/deudor acaba de escribir, así que el texto libre es válido.
    await enviarTexto(cuenta, from, respuesta)
  }
}
