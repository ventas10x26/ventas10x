// src/app/api/pulse/whatsapp/webhook/[...event]/route.ts
// v5 — aliases detección + modelo persistido entre requests

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTej36IuFT6HGZGKUvHGlestv9Ro1qyKXuZ88poK_diUl_6vOiU_QBKhBV7UGSUq7c3Z9g40pPtPNYr/pub?output=csv'

// Cache del catálogo (válido dentro de la misma instancia de Vercel)
let catalogoCache: VehiculoMedia[] = []
let catalogoCacheTime = 0
const CACHE_TTL = 60 * 60 * 1000

type VehiculoMedia = {
  linea: string
  version: string
  año: number
  precio: number
  bono: number
  fichaTecnica: string
  imagenUrl: string
  specs: string
  combustible: string
}

type MensajeHistorial = { role: 'user' | 'assistant'; content: string }

// ── SUPABASE: leer/escribir conversación ─────────────────────────────────────

async function leerConversacion(instanceName: string, remoteJid: string): Promise<{
  historial: MensajeHistorial[]
  modeloDetectado: string | null
  mediaEnviada: string[]
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.from('pulse_conversaciones') as any)
      .select('historial, modelo_detectado, media_enviada')
      .eq('instance_name', instanceName)
      .eq('remote_jid', remoteJid)
      .maybeSingle()

    if (!data) return { historial: [], modeloDetectado: null, mediaEnviada: [] }
    return {
      historial: (data.historial as MensajeHistorial[]) || [],
      modeloDetectado: data.modelo_detectado || null,
      mediaEnviada: (data.media_enviada as string[]) || [],
    }
  } catch (e) {
    console.error('[webhook] leerConversacion error:', e)
    return { historial: [], modeloDetectado: null, mediaEnviada: [] }
  }
}

async function guardarConversacion(
  instanceName: string,
  remoteJid: string,
  historial: MensajeHistorial[],
  modeloDetectado: string | null,
  mediaEnviada: string[]
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('pulse_conversaciones') as any)
      .upsert({
        instance_name: instanceName,
        remote_jid: remoteJid,
        historial: historial.slice(-12), // máximo 12 mensajes
        modelo_detectado: modeloDetectado,
        media_enviada: mediaEnviada,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'instance_name,remote_jid' })
  } catch (e) {
    console.error('[webhook] guardarConversacion error:', e)
  }
}

// ── CATÁLOGO ─────────────────────────────────────────────────────────────────

async function obtenerCatalogo(): Promise<VehiculoMedia[]> {
  const ahora = Date.now()
  if (catalogoCache.length > 0 && ahora - catalogoCacheTime < CACHE_TTL) return catalogoCache
  try {
    const res = await fetch(CSV_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) { console.error('[webhook] CSV error:', res.status); return [] }
    const csv = await res.text()
    const primera = csv.split('\n')[0]
    console.log('[webhook] CSV cols:', primera.slice(0, 200))
    const vehiculos = parsearCSV(csv)
    console.log('[webhook] vehiculos:', vehiculos.length, '| con imagen:', vehiculos.filter(v => v.imagenUrl).length)
    catalogoCache = vehiculos
    catalogoCacheTime = ahora
    return vehiculos
  } catch (e) {
    console.error('[webhook] catalogo error:', e)
    return []
  }
}

// Parser CSV completo RFC 4180 — maneja:
// 1. Comas dentro de celdas entre comillas: "1.0L 66HP, Transmision de 5 Velocidades"
// 2. Saltos de línea dentro de celdas: descripciones multilínea del NEW STONIC
function parsearCSV(csv: string): VehiculoMedia[] {
  // Tokenizar caracter a caracter respetando comillas y saltos de línea dentro de celdas
  const filas: string[][] = []
  let filaActual: string[] = []
  let celda = ''
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i]
    const siguiente = csv[i + 1]

    if (ch === '"') {
      if (inQuotes && siguiente === '"') { celda += '"'; i++ } // comilla escapada ""
      else { inQuotes = !inQuotes }
    } else if (ch === ',' && !inQuotes) {
      filaActual.push(celda.trim())
      celda = ''
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && siguiente === '\n') i++ // CRLF
      filaActual.push(celda.trim())
      if (filaActual.some(c => c !== '')) filas.push(filaActual)
      filaActual = []
      celda = ''
    } else {
      celda += ch
    }
  }
  // última celda/fila
  if (celda.trim() || filaActual.length > 0) {
    filaActual.push(celda.trim())
    if (filaActual.some(c => c !== '')) filas.push(filaActual)
  }

  if (filas.length < 2) return []

  const cols = filas[0].map(h => h.toLowerCase())
  const sep = 'COMA' // siempre coma en Google Sheets CSV
  console.log('[webhook] sep:', sep, '| total cols:', cols.length)

  const idx = {
    linea: cols.findIndex(c => c.includes('línea') || c === 'linea'),
    año: cols.findIndex(c => c.includes('año') || c === 'ano'),
    activo: cols.findIndex(c => c === 'activo'),
    version: cols.findIndex(c => c === 'versión' || c === 'version'),
    activaV: cols.findIndex(c => c === 'activa'),
    precio: cols.findIndex(c => c.includes('precio')),
    bono: cols.findIndex(c => c.includes('bono') && c.includes('monetario')),
    ficha: cols.findIndex(c => c.includes('ficha')),
    imagen: cols.findIndex(c => c.includes('imagen') || c.includes('foto')),
    specs: cols.findIndex(c => c.includes('especif') || c.includes('otras')),
    comb: cols.findIndex(c => c.includes('combustible')),
  }

  console.log('[webhook] idx: linea=' + idx.linea + ' imagen=' + idx.imagen + ' ficha=' + idx.ficha)

  const vehiculos: VehiculoMedia[] = []
  for (let i = 1; i < filas.length; i++) {
    const cells = filas[i]
    if (!cells[idx.linea]) continue
    if (cells[idx.activo]?.toUpperCase() === 'FALSE') continue
    if (cells[idx.activaV]?.toUpperCase() === 'FALSE') continue
    const imagenUrl = idx.imagen >= 0 ? (cells[idx.imagen] || '') : ''
    // Validar que imagen_url sea imagen real (no PDF)
    if (imagenUrl && imagenUrl.toLowerCase().endsWith('.pdf')) continue
    vehiculos.push({
      linea: cells[idx.linea] || '',
      version: cells[idx.version] || '',
      año: parseInt(cells[idx.año] || '0'),
      precio: parseInt(cells[idx.precio]?.replace(/\D/g, '') || '0'),
      bono: parseInt(cells[idx.bono]?.replace(/\D/g, '') || '0'),
      fichaTecnica: cells[idx.ficha] || '',
      imagenUrl,
      specs: cells[idx.specs] || '',
      combustible: cells[idx.comb] || '',
    })
  }
  return vehiculos
}

// ── DETECCIÓN Y CÁLCULO ───────────────────────────────────────────────────────

// FIX v5: Aliases — palabras que el cliente dice → fragmento real en v.linea del CSV
// El CSV usa "NEW PICANTO", "NEW SORENTO", "NEW STONIC" pero el cliente dice solo el nombre
const ALIASES_MODELO: Record<string, string> = {
  'picanto': 'new picanto',
  'sorento': 'new sorento',
  'stonic': 'new stonic',
}

function detectarModelo(textoCompleto: string, vehiculos: VehiculoMedia[]): VehiculoMedia | null {
  const lower = textoCompleto.toLowerCase()

  // Expandir aliases antes de comparar
  let textoExpandido = lower
  for (const [alias, real] of Object.entries(ALIASES_MODELO)) {
    if (lower.includes(alias) && !lower.includes(real)) {
      textoExpandido = textoExpandido.replace(new RegExp(alias, 'g'), real)
    }
  }

  // Match exacto línea + versión
  for (const v of vehiculos) {
    if (
      textoExpandido.includes(v.linea.toLowerCase()) &&
      textoExpandido.includes(v.version.toLowerCase())
    ) return v
  }
  // Match solo línea
  for (const v of vehiculos) {
    if (textoExpandido.includes(v.linea.toLowerCase())) return v
  }
  return null
}

function extraerNumeros(textoCompleto: string): { inicial: number; plazo: number } {
  // Patrones explícitos con contexto
  const inicialMatch =
    textoCompleto.match(/(\d+)\s*m(?:illones?)?\s*(?:de\s+)?inicial/i) ||
    textoCompleto.match(/inicial\s+(?:de\s+)?(\d+)\s*m/i) ||
    textoCompleto.match(/(\d+)\s*m\s+(?:de\s+)?inicial/i) ||
    textoCompleto.match(/inicial[:\s]+\$?(\d+[\.,]?\d*)\s*m/i) ||
    // "doy 30M", "tengo 30M", "con 30M", "son 30M", número seguido de M sin contexto explícito
    textoCompleto.match(/(?:doy|tengo|con|son|inicial\s+de)\s+(\d+)\s*m(?:illones?)?/i) ||
    // Solo "30M" o "30 millones" como mensaje corto (<=10 chars limpio)
    (textoCompleto.trim().replace(/[^\d]/g, '').length <= 4 &&
     textoCompleto.match(/^\s*(\d+)\s*m(?:illones?)?\s*$/i)) || null
  const inicial = inicialMatch ? parseInt(inicialMatch[1].replace(/\./g, '')) * 1_000_000 : 0

  const plazoMatch =
    textoCompleto.match(/(\d+)\s*meses/i) ||
    textoCompleto.match(/a\s+(\d+)\s+meses/i) ||
    textoCompleto.match(/plazo\s+(?:de\s+)?(\d+)/i) ||
    // Solo número entre 12-120 como mensaje corto (plazo en meses)
    (textoCompleto.trim().match(/^\s*(\d+)\s*$/) &&
     parseInt(textoCompleto.trim()) >= 12 &&
     parseInt(textoCompleto.trim()) <= 120
       ? textoCompleto.trim().match(/^\s*(\d+)\s*$/) : null)
  const plazo = plazoMatch ? parseInt(plazoMatch[1]) : 0

  return { inicial, plazo }
}

function calcularSimulacion(modelo: VehiculoMedia, inicial: number, plazo: number): string | null {
  const precioNeto = modelo.precio - modelo.bono
  const monto = precioNeto - inicial
  if (monto <= 0 || plazo <= 0) return null
  const tasa = 0.018
  const cuota = Math.round((monto * tasa * Math.pow(1 + tasa, plazo)) / (Math.pow(1 + tasa, plazo) - 1))
  const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`
  return [
    'Simulación financiamiento bancario',
    `Modelo: KIA ${modelo.linea} ${modelo.version} ${modelo.año}`,
    `Precio lista: ${fmt(modelo.precio)}`,
    modelo.bono > 0 ? `Bono: ${fmt(modelo.bono)}` : null,
    modelo.bono > 0 ? `Precio neto: ${fmt(precioNeto)}` : null,
    `Inicial: ${fmt(inicial)}`,
    `Monto a financiar: ${fmt(monto)}`,
    `Plazo: ${plazo} meses`,
    `Cuota aprox: ${fmt(cuota)}/mes`,
    `Tasa ref: 1.8% mensual (referencia — varía según banco)`,
    `Nota: cuota exacta la confirma el banco`,
  ].filter(Boolean).join('\n')
}

// ── CITAS ────────────────────────────────────────────────────────────────────

async function registrarCita(
  remoteJid: string,
  instanceName: string,
  diaTexto: string,
  horaTexto: string
): Promise<void> {
  try {
    // Buscar el lead por remoteJid (teléfono)
    const telefono = remoteJid.replace('@s.whatsapp.net', '').replace(/^57/, '')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: leads } = await (supabaseAdmin.from('pulse_leads') as any)
      .select('id, vendedor_id, nombre')
      .or(`telefono.ilike.%${telefono}%`)
      .order('created_at', { ascending: false })
      .limit(1)

    const lead = leads?.[0]
    if (!lead) { console.log('[cita] lead no encontrado para:', telefono); return }

    // Insertar cita
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('pulse_citas') as any)
      .upsert({
        lead_id: lead.id,
        vendedor_id: lead.vendedor_id,
        remote_jid: remoteJid,
        dia_texto: diaTexto,
        hora_texto: horaTexto,
        estado: 'pendiente',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'lead_id' })

    // Mover lead a estado test_drive
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('pulse_leads') as any)
      .update({ estado: 'test_drive', updated_at: new Date().toISOString() })
      .eq('id', lead.id)

    // Notificar al asesor por WhatsApp
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('whatsapp, nombre')
      .eq('id', lead.vendedor_id)
      .maybeSingle()

    if (profile?.whatsapp) {
      const numAsesor = profile.whatsapp.replace(/\D/g, '').replace(/^57/, '')
      const msgAsesor = `🗓️ Test Drive agendado
Lead: ${lead.nombre}
Día: ${diaTexto}
Hora: ${horaTexto}
Teléfono: +57${telefono}`
      await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: process.env.EVOLUTION_API_KEY! },
        body: JSON.stringify({ number: `57${numAsesor}`, text: msgAsesor }),
      })
      console.log('[cita] asesor notificado:', profile.nombre)
    }

    console.log('[cita] ✅ registrada — lead:', lead.nombre, '|', diaTexto, horaTexto)
  } catch (e) {
    console.error('[cita] error:', e)
  }
}

function extraerDiaHora(historial: { role: string; content: string }[]): { dia: string; hora: string } {
  const textoHistorial = historial.map(h => h.content).join(' ').toLowerCase()

  const dias = ['lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado', 'domingo']
  const dia = dias.find(d => textoHistorial.includes(d)) || ''

  const horaMatch =
    textoHistorial.match(/(\d{1,2})\s*(?:pm|am)/i) ||
    textoHistorial.match(/(\d{1,2})\s*(?:de la tarde|de la mañana)/i)
  const hora = horaMatch ? horaMatch[0] : (
    textoHistorial.includes('mañana') ? 'en la mañana' :
    textoHistorial.includes('tarde') ? 'en la tarde' : ''
  )

  return { dia, hora }
}

// ── EVOLUTION API ─────────────────────────────────────────────────────────────

async function enviarTexto(instanceName: string, remoteJid: string, mensaje: string) {
  try {
    await fetch(`${EVO_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: remoteJid, text: mensaje }),
    })
  } catch (e) { console.error('[webhook] enviarTexto error:', e) }
}

async function enviarBotonesTestDrive(instanceName: string, remoteJid: string, nombreModelo: string) {
  try {
    console.log('[webhook] enviando botones test drive')
    const res = await fetch(`${EVO_URL}/message/sendButtons/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({
        number: remoteJid,
        title: '¿Quieres conocerlo en persona?',
        description: `Te espero en el concesionario para que pruebes el ${nombreModelo} y lo sientas tú mismo.`,
        footer: 'KIA Colombia',
        buttons: [
          { buttonId: 'btn_test_drive_si', buttonText: { displayText: '✅ Sí, quiero agendar Test Drive' }, type: 1 },
          { buttonId: 'btn_test_drive_no', buttonText: { displayText: '🤔 Aún no me decido' }, type: 1 },
        ],
      }),
    })
    console.log('[webhook] botones status:', res.status)
    if (!res.ok) {
      // Fallback a texto si botones no están soportados en esta versión de Evolution
      const err = await res.text()
      console.log('[webhook] botones fallback a texto, error:', err.slice(0, 100))
      await enviarTexto(instanceName, remoteJid,
        `¿Te gustaría agendar un Test Drive del ${nombreModelo}?\n\nResponde:\n1️⃣ Sí, quiero agendar\n2️⃣ Aún no me decido`)
    }
  } catch (e) {
    console.error('[webhook] enviarBotonesTestDrive error:', e)
    await enviarTexto(instanceName, remoteJid,
      `¿Te gustaría agendar un Test Drive del ${nombreModelo}?\n\nResponde:\n1️⃣ Sí, quiero agendar\n2️⃣ Aún no me decido`)
  }
}

async function enviarImagen(instanceName: string, remoteJid: string, url: string, caption: string) {
  try {
    console.log('[webhook] enviando imagen:', url.slice(0, 80))
    const res = await fetch(`${EVO_URL}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: remoteJid, mediatype: 'image', media: url, caption }),
    })
    console.log('[webhook] imagen status:', res.status)
  } catch (e) { console.error('[webhook] enviarImagen error:', e) }
}

async function enviarFicha(instanceName: string, remoteJid: string, url: string, linea: string, año: number) {
  try {
    console.log('[webhook] enviando ficha:', url.slice(0, 80))
    await fetch(`${EVO_URL}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({
        number: remoteJid,
        mediatype: 'document',
        media: url,
        fileName: `Ficha_KIA_${linea}_${año}.pdf`,
        caption: `Ficha técnica KIA ${linea} ${año}`,
      }),
    })
  } catch (e) { console.error('[webhook] enviarFicha error:', e) }
}

// ── CONFIG AGENTE ─────────────────────────────────────────────────────────────

async function obtenerConfigAgente(instanceName: string): Promise<{ systemPrompt: string; nombre: string; botActivo: boolean }> {
  const def = { systemPrompt: '', nombre: 'el asesor', botActivo: true }
  try {
    let telefonoInstancia: string | null = null
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${instanceName}`, { headers: { apikey: EVO_KEY } })
      if (res.ok) {
        const data = await res.json()
        const match = String(data?.instance?.ownerJid || '').match(/^(\d+)@/)
        if (match) telefonoInstancia = match[1]
      }
    } catch { /* continuar */ }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (supabaseAdmin.from('pulse_waitlist') as any).select('nombre, metadata').not('metadata', 'is', null)
    if (!rows || !Array.isArray(rows)) return def

    if (telefonoInstancia) {
      const corto = telefonoInstancia.replace(/^57/, '')
      for (const row of rows) {
        const meta = row.metadata as Record<string, unknown>
        const w = String(meta?.whatsapp || '').replace(/\D/g, '').replace(/^57/, '')
        if (w && w === corto) {
          const cfg = meta?.agent_config as Record<string, unknown> | undefined
          return { systemPrompt: String(cfg?.system_prompt || ''), nombre: row.nombre || 'el asesor', botActivo: meta?.bot_activo !== false }
        }
      }
    }
    for (const row of rows) {
      const meta = row.metadata as Record<string, unknown>
      if (meta?.agent_config) {
        const cfg = meta.agent_config as Record<string, unknown>
        return { systemPrompt: String(cfg?.system_prompt || ''), nombre: row.nombre || 'el asesor', botActivo: meta?.bot_activo !== false }
      }
    }
    return def
  } catch (e) {
    console.error('[webhook] obtenerConfigAgente error:', e)
    return def
  }
}

// ── ANTHROPIC ─────────────────────────────────────────────────────────────────

async function generarRespuesta(
  texto: string,
  systemPrompt: string,
  nombre: string,
  historial: MensajeHistorial[],
  catalogoTexto: string
): Promise<string | null> {
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
      max_tokens: 250,
      system: `${systemPrompt || `Eres el asistente de ventas de ${nombre}, asesor KIA.`}

${catalogoTexto}

IDENTIDAD:
Eres un asesor KIA experto, humano y cercano. Hablas como un amigo de confianza que conoce cada carro a fondo y quiere ayudar al cliente a tomar la mejor decisión — no como un vendedor desesperado. Sabes que este lead está comparando opciones en otros concesionarios y tienes muy poco tiempo para ganarte su atención.

TU ÚNICO OBJETIVO: llevar al lead a un test drive en el concesionario. Ahí se cierran todas las dudas. Ahí se cierra la venta.

FORMATO — SIN EXCEPCIÓN:
- Máximo 2-3 oraciones por mensaje — esto es WhatsApp
- CERO asteriscos, negritas, markdown, listas con guiones o numeradas
- Tono cálido, directo, colombiano — nunca robótico ni corporativo

SOBRE PRECIOS Y DATOS TÉCNICOS:
- NUNCA inventes precios, cuotas, especificaciones ni disponibilidad
- Si el dato exacto está en el catálogo que tienes → úsalo
- Si NO tienes el dato exacto → di "eso te lo confirmo en el concesionario cuando lo veas en persona" y redirige al test drive
- NUNCA digas "te confirmo", "voy a consultar" ni "déjame verificar"

SOBRE FOTOS, FICHAS Y SIMULACIONES:
- NUNCA menciones que envías fotos, fichas o simulaciones — llegan automáticamente por otro canal
- Si el cliente pregunta por la cuota: di que la simulación está siendo procesada y llegará en un momento

SOBRE FINANCIAMIENTO:
- NUNCA menciones "KIA Crédito", "KIA Financia" ni "KIA Financial"
- Usa siempre: "opciones de financiamiento con diferentes bancos"

ESTRATEGIA DE CONVERSACIÓN:
1. Engancha con el beneficio más relevante para ese cliente (familia, economía, status, tecnología)
2. Genera deseo — hazle imaginar cómo se siente manejar ese carro
3. Maneja objeciones con empatía, no con argumentos — "entiendo, por eso mismo te propongo que lo pruebes"
4. SIEMPRE termina con una pregunta que avance hacia el test drive
5. Si el cliente duda o compara con otra marca: valida su proceso, destaca 1 diferencial KIA y propón el test drive como la forma de decidir con seguridad

PREGUNTAS DE CIERRE (rotar según contexto):
- "¿Cuándo te gustaría venir a conocerlo en persona?"
- "¿Tienes 30 minutos esta semana para probarlo en la carretera?"
- "¿Qué día te queda mejor para el test drive, entre semana o el fin de semana?"
- "El test drive no compromete nada — es solo para que lo sientas tú mismo. ¿Cuándo vamos?"

REGLA DE ORO: si no sabes algo con certeza, no lo inventes. Invita al test drive. Ahí están todas las respuestas.`,
      messages: [...historialLimpio, { role: 'user', content: texto }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : null
  } catch (e) {
    console.error('[webhook] generarRespuesta error:', e)
    return null
  }
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, context: { params: Promise<{ event: string[] }> }) {
  try {
    const { event } = await context.params
    const eventPath = event?.join('/') || ''
    const nxtPevent = req.nextUrl.searchParams.get('nxtPevent') || ''

    const isUpsert =
      eventPath.includes('messages-upsert') || eventPath.includes('messages_upsert') ||
      nxtPevent.includes('messages-upsert') || nxtPevent.includes('messages_upsert')
    if (!isUpsert) return NextResponse.json({ ok: true, ignored: true })

    const body = await req.json()
    const instanceName = body.instance || body.instanceName || eventPath.split('/')[0] || ''

    let msgs: unknown[] = []
    if (Array.isArray(body.data)) msgs = body.data
    else if (body.data?.messages) msgs = body.data.messages
    else if (body.data?.key) msgs = [body.data]
    else if (body.messages) msgs = body.messages

    console.log(`[webhook] instance: ${instanceName}, msgs: ${msgs.length}`)

    const { systemPrompt, nombre, botActivo } = await obtenerConfigAgente(instanceName)
    if (!botActivo) { console.log('[webhook] bot INACTIVO'); return NextResponse.json({ ok: true, paused: true }) }

    const vehiculos = await obtenerCatalogo()
    const catalogoTexto = vehiculos.length > 0
      ? '=== CATÁLOGO KIA ===\n' + vehiculos.map(v => {
          const p = `$${(v.precio / 1_000_000).toFixed(1)}M`
          const b = v.bono > 0 ? ` (bono $${(v.bono / 1_000_000).toFixed(1)}M, neto $${((v.precio - v.bono) / 1_000_000).toFixed(1)}M)` : ''
          return `KIA ${v.linea} ${v.version} ${v.año}: ${p}${b} | ${v.combustible} | ${v.specs}`
        }).join('\n')
      : ''

    for (const msg of msgs) {
      const m = msg as Record<string, unknown>
      const key = m.key as Record<string, unknown>
      if (key?.fromMe) continue
      const remoteJid = String(key?.remoteJid || '')
      if (remoteJid.includes('@g.us')) continue

      const message = m.message as Record<string, unknown>
      // Detectar respuesta a botones (buttonsResponseMessage)
      const btnResponse = message?.buttonsResponseMessage as Record<string, unknown> | undefined
      const btnId = String(btnResponse?.selectedButtonId || '')
      const btnText = String(btnResponse?.selectedDisplayText || '')
      const texto = String(
        btnText ||
        message?.conversation ||
        (message?.extendedTextMessage as Record<string, unknown>)?.text ||
        (message?.imageMessage as Record<string, unknown>)?.caption || ''
      ).trim()
      if (!texto) continue

      // Leer conversación ANTES de la detección de botones (necesitamos historial)
      const conv = await leerConversacion(instanceName, remoteJid)
      const { historial, mediaEnviada, modeloDetectado: modeloPersistido } = conv

      // Detectar respuesta a botones de test drive — nativo (btnId) o texto plano (fallback)
      const textoLower = texto.toLowerCase().trim()
      const esConfirmacionTestDrive = 
        btnId === 'btn_test_drive_si' ||
        textoLower === '1' || textoLower === '1.' ||
        textoLower === 'si' || textoLower === 'sí' ||
        textoLower === 'sí, quiero agendar' || textoLower === 'si, quiero agendar' ||
        textoLower.includes('quiero agendar')
      const esNegacionTestDrive =
        btnId === 'btn_test_drive_no' ||
        textoLower === '2' || textoLower === '2.' ||
        textoLower === 'aún no me decido' || textoLower === 'aun no me decido' ||
        textoLower === 'no' || textoLower === 'todavía no' || textoLower === 'todavia no'

      // Solo aplicar si el historial reciente incluye oferta de test drive
      const historialReciente = historial.slice(-4).map(h => h.content).join(' ').toLowerCase()
      const hayOfertaTestDrive = historialReciente.includes('test drive') || historialReciente.includes('agendar')

      if (hayOfertaTestDrive && esConfirmacionTestDrive) {
        await new Promise(r => setTimeout(r, 800))
        await enviarTexto(instanceName, remoteJid,
          `¡Perfecto, te espero en el concesionario! 🤝 ¿Qué día de esta semana te viene mejor para el test drive?`)
        // Guardar en historial
        await guardarConversacion(instanceName, remoteJid, [
          ...historial,
          { role: 'user', content: texto },
          { role: 'assistant', content: `¡Perfecto, te espero en el concesionario! ¿Qué día te viene mejor?` },
        ], modeloPersistido || null, mediaEnviada)
        console.log('[webhook] lead confirmó test drive')
        continue
      }
      if (hayOfertaTestDrive && esNegacionTestDrive) {
        await new Promise(r => setTimeout(r, 800))
        await enviarTexto(instanceName, remoteJid,
          `Sin afán, cuando quieras. ¿Hay algo más del vehículo que quieras conocer para terminar de decidirte?`)
        await guardarConversacion(instanceName, remoteJid, [
          ...historial,
          { role: 'user', content: texto },
          { role: 'assistant', content: `Sin afán. ¿Hay algo más que quieras conocer?` },
        ], modeloPersistido || null, mediaEnviada)
        console.log('[webhook] lead no se decide')
        continue
      }

      console.log(`[webhook] mensaje: "${texto}"`)

      // TEST TEMPORAL — responde a "test_botones" con botones de prueba
      if (texto.trim().toLowerCase() === 'test_botones') {
        await enviarBotonesTestDrive(instanceName, remoteJid, 'KIA NEW PICANTO VIBRANT 2027')
        console.log('[webhook] test botones enviado')
        continue
      }

      // conversación ya leída arriba antes de detección de botones

      // Texto completo = historial + mensaje actual para detección
      const textoCompleto = [...historial.map(h => h.content), texto].join(' ')

      // FIX v5: detectar por texto expandido con aliases, o recuperar el modelo persistido
      const modeloDetectadoPorTexto = vehiculos.length > 0 ? detectarModelo(textoCompleto, vehiculos) : null
      // Recuperar modelo persistido: formato puede ser "LINEA|||VERSION" o solo "LINEA"
      const modeloDetectado = modeloDetectadoPorTexto ?? (() => {
        if (!modeloPersistido) return null
        if (modeloPersistido.includes('|||')) {
          const [linea, version] = modeloPersistido.split('|||')
          return vehiculos.find(v => v.linea === linea && v.version === version) ?? null
        }
        return vehiculos.find(v => v.linea === modeloPersistido) ?? null
      })()

      const esPrimera = modeloDetectado ? !mediaEnviada.includes(modeloDetectado.linea) : false

      // Extraer inicial y plazo del historial completo
      const { inicial, plazo } = extraerNumeros(textoCompleto)
      console.log(`[webhook] modelo: ${modeloDetectado?.linea || 'ninguno'} | inicial: ${inicial} | plazo: ${plazo}`)

      // Calcular simulación si hay suficientes datos
      let simulacion: string | null = null
      if (modeloDetectado && inicial > 0 && plazo > 0) {
        simulacion = calcularSimulacion(modeloDetectado, inicial, plazo)
        console.log('[webhook] simulacion calculada:', simulacion ? 'SI' : 'NO')
      }

      // Generar respuesta conversacional
      const respuesta = await generarRespuesta(texto, systemPrompt, nombre, historial, catalogoTexto)

      // Actualizar historial
      const nuevoHistorial: MensajeHistorial[] = [
        ...historial,
        { role: 'user', content: texto },
        ...(respuesta ? [{ role: 'assistant' as const, content: respuesta }] : []),
      ]
      const nuevaMediaEnviada = [...mediaEnviada]
      if (modeloDetectado && esPrimera) nuevaMediaEnviada.push(modeloDetectado.linea)

      // Preservar modelo persistido — guardar linea+version para match exacto posterior
      const modeloKeyActual = modeloDetectado ? `${modeloDetectado.linea}|||${modeloDetectado.version}` : null
      const modeloAGuardar = modeloKeyActual || modeloPersistido || null
      await guardarConversacion(instanceName, remoteJid, nuevoHistorial, modeloAGuardar, nuevaMediaEnviada)

      // Detectar cita confirmada — cuando el historial tiene día + hora acordados
      const historialTexto = nuevoHistorial.map(h => h.content).join(' ').toLowerCase()
      const tieneDia = ['lunes','martes','miércoles','miercoles','jueves','viernes','sábado','sabado'].some(d => historialTexto.includes(d))
      const tieneHora = /\d{1,2}\s*(pm|am)|en la tarde|en la mañana|2pm|3pm|4pm|10am|11am/.test(historialTexto)
      const citaYaRegistrada = historialTexto.includes('está anotado') || historialTexto.includes('esta anotado') || historialTexto.includes('confirmado')
      if (tieneDia && tieneHora && !citaYaRegistrada) {
        const { dia, hora } = extraerDiaHora(nuevoHistorial)
        if (dia && hora) {
          await registrarCita(remoteJid, instanceName, dia, hora)
          console.log('[webhook] cita detectada y registrada:', dia, hora)
        }
      }

      // Enviar respuesta conversacional
      if (respuesta) {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 500))
        await enviarTexto(instanceName, remoteJid, respuesta)
        console.log(`[webhook] texto enviado: "${respuesta.slice(0, 60)}"`)
      }

      // Enviar simulación de crédito
      if (simulacion) {
        await new Promise(r => setTimeout(r, 600))
        await enviarTexto(instanceName, remoteJid, simulacion)
        console.log('[webhook] simulacion enviada')

        // Botones de agendamiento tras simulación
        await new Promise(r => setTimeout(r, 1800))
        const nombreModelo = modeloDetectado
          ? `KIA ${modeloDetectado.linea} ${modeloDetectado.version} ${modeloDetectado.año}`
          : 'el vehículo'
        await enviarBotonesTestDrive(instanceName, remoteJid, nombreModelo)
      }

      // Enviar imagen (primera mención del modelo)
      if (modeloDetectado && esPrimera && modeloDetectado.imagenUrl) {
        await new Promise(r => setTimeout(r, 800))
        await enviarImagen(instanceName, remoteJid, modeloDetectado.imagenUrl, `KIA ${modeloDetectado.linea} ${modeloDetectado.version} ${modeloDetectado.año}`)
      }

      // Enviar ficha técnica (primera mención del modelo)
      if (modeloDetectado && esPrimera && modeloDetectado.fichaTecnica) {
        await new Promise(r => setTimeout(r, 600))
        await enviarFicha(instanceName, remoteJid, modeloDetectado.fichaTecnica, modeloDetectado.linea, modeloDetectado.año)

        // Botones de agendamiento tras enviar catálogo completo
        await new Promise(r => setTimeout(r, 1500))
        const nombreModeloFicha = modeloDetectado
          ? `KIA ${modeloDetectado.linea} ${modeloDetectado.version} ${modeloDetectado.año}`
          : 'el vehículo'
        await enviarBotonesTestDrive(instanceName, remoteJid, nombreModeloFicha)

      }
    }

    // ── TEST TEMPORAL BOTONES — eliminar después de verificar ──
    // Envía "test_botones" por WhatsApp para probar si Evolution soporta botones nativos
    // Si llegan botones tocables → ✅ funcionan. Si llega texto 1️⃣/2️⃣ → usar otro endpoint.

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[webhook] error:', e)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'pulse-whatsapp-webhook-v16' })
}
