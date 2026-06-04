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

REGLAS — SEGUIR EN ORDEN:
1. Español colombiano, tono cálido y humano — como un amigo que vende carros, no un robot
2. Máximo 2-3 oraciones — esto es WhatsApp, no un correo
3. NUNCA asteriscos, negritas ni markdown de ningún tipo
4. USA SOLO precios del catálogo — NUNCA inventes precios ni especificaciones
5. Si el modelo no está en el catálogo, di que no lo tienes disponible actualmente y ofrece una alternativa
6. NUNCA digas "te confirmo con finanzas", "voy a consultar" ni "déjame verificar" — responde directo
7. NUNCA preguntes datos que el cliente ya mencionó (modelo, ciudad, inicial, plazo, presupuesto)
8. NUNCA digas "las fotos están en camino", "ya te mando las fotos", "te envío la ficha" — las fotos y fichas se envían automáticamente por otro sistema, TÚ NUNCA las mencionas
9. Si el cliente pregunta por cuota o crédito: di que la simulación ya está siendo calculada y llegará en un momento — NUNCA calcules ni menciones cuotas tú mismo
10. SIEMPRE termina tu mensaje con una pregunta que avance el proceso — nunca dejes un mensaje sin pregunta de cierre
11. PROHIBIDO: "KIA Crédito", "KIA Financia", "KIA Financial" — SIEMPRE usa "alternativas de crédito con diferentes bancos" o "financiamiento bancario"
12. Ejemplos de preguntas de cierre: "¿Cuándo te gustaría conocerlo en persona?", "¿Te agendamos un test drive esta semana?", "¿Quieres explorar otro plazo?", "¿Tienes dudas sobre el financiamiento?"
13. Después de recibir inicial y plazo: di solo que la simulación está siendo procesada y pregunta por test drive
14. El objetivo es avanzar hacia la cita o el cierre — cada mensaje debe acercar al cliente un paso más`,
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

      // Si tocó "Sí quiero agendar Test Drive" → respuesta especial
      if (btnId === 'btn_test_drive_si') {
        await new Promise(r => setTimeout(r, 800))
        await enviarTexto(instanceName, remoteJid,
          `¡Perfecto! Me alegra mucho. Te voy a pasar con ${nombre} para coordinar el día y hora que mejor te quede. Nos vemos pronto en el concesionario. 🤝`)
        console.log('[webhook] lead agendó test drive')
        continue
      }
      if (btnId === 'btn_test_drive_no') {
        await new Promise(r => setTimeout(r, 800))
        await enviarTexto(instanceName, remoteJid,
          `Tranquilo, no hay afán. ¿Hay algo más que quieras saber del vehículo para terminar de decidirte?`)
        console.log('[webhook] lead no se decide aún')
        continue
      }

      console.log(`[webhook] mensaje: "${texto}"`)

      // Leer conversación persistida desde Supabase
      const conv = await leerConversacion(instanceName, remoteJid)
      // FIX v5: recuperar también el modelo ya identificado en requests anteriores
      const { historial, mediaEnviada, modeloDetectado: modeloPersistido } = conv

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
        if (false) { // bloque legacy — mantener estructura
          await new Promise(r => setTimeout(r, 500))
          await enviarTexto(instanceName, remoteJid, '')
          console.log('[webhook] seguimiento enviado:', msgSeguimiento.slice(0, 60))
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[webhook] error:', e)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'pulse-whatsapp-webhook-v13' })
}
