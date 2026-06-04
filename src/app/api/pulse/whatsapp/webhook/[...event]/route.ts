// src/app/api/pulse/whatsapp/webhook/[...event]/route.ts

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

async function obtenerCatalogo(): Promise<VehiculoMedia[]> {
  const ahora = Date.now()
  if (catalogoCache.length > 0 && ahora - catalogoCacheTime < CACHE_TTL) return catalogoCache
  try {
    const res = await fetch(CSV_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) { console.error('[webhook] CSV error:', res.status); return [] }
    const csv = await res.text()
    console.log('[webhook] CSV primera linea:', csv.split('\n')[0].slice(0, 300))
    const vehiculos = parsearCSVMedia(csv)
    console.log('[webhook] vehiculos parseados:', vehiculos.length)
    catalogoCache = vehiculos
    catalogoCacheTime = ahora
    return vehiculos
  } catch (e) {
    console.error('[webhook] catalogo error:', e)
    return []
  }
}

function parsearCSVMedia(csv: string): VehiculoMedia[] {
  const lineas = csv.trim().split('\n')
  if (lineas.length < 2) return []

  const primera = lineas[0]
  // Detectar separador: tab o coma
  const sep = primera.split('\t').length > primera.split(',').length ? '\t' : ','
  const cols = primera.split(sep).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().trim())

  console.log('[webhook] separador:', sep === '\t' ? 'TAB' : 'COMA', '| columnas:', cols.length)
  console.log('[webhook] cols:', cols.slice(0, 22).join(' | '))

  const idx = {
    linea: cols.findIndex(c => c.includes('línea') || c === 'linea'),
    año: cols.findIndex(c => c.includes('año') || c === 'ano'),
    activo: cols.findIndex(c => c === 'activo'),
    version: cols.findIndex(c => c === 'versión' || c === 'version'),
    activaV: cols.findIndex(c => c === 'activa'),
    precio: cols.findIndex(c => c.includes('precio')),
    bono: cols.findIndex(c => c.includes('bono') && c.includes('monetario')),
    ficha: cols.findIndex(c => c.includes('ficha')),
    imagen: cols.findIndex(c => c.includes('imagen') || c.includes('image') || c.includes('foto')),
    specs: cols.findIndex(c => c.includes('especif') || c.includes('otras')),
    comb: cols.findIndex(c => c.includes('combustible')),
  }

  console.log('[webhook] idx imagen:', idx.imagen, '| idx ficha:', idx.ficha, '| idx linea:', idx.linea)

  const vehiculos: VehiculoMedia[] = []
  for (let i = 1; i < lineas.length; i++) {
    const cells = lineas[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
    if (!cells[idx.linea]) continue
    if (cells[idx.activo]?.toUpperCase() === 'FALSE') continue
    if (cells[idx.activaV]?.toUpperCase() === 'FALSE') continue

    vehiculos.push({
      linea: cells[idx.linea] || '',
      version: cells[idx.version] || '',
      año: parseInt(cells[idx.año] || '0'),
      precio: parseInt(cells[idx.precio]?.replace(/\D/g, '') || '0'),
      bono: parseInt(cells[idx.bono]?.replace(/\D/g, '') || '0'),
      fichaTecnica: cells[idx.ficha] || '',
      imagenUrl: idx.imagen >= 0 ? (cells[idx.imagen] || '') : '',
      specs: cells[idx.specs] || '',
      combustible: cells[idx.comb] || '',
    })
  }
  return vehiculos
}

function detectarModelo(texto: string, vehiculos: VehiculoMedia[]): VehiculoMedia | null {
  const lower = texto.toLowerCase()
  for (const v of vehiculos) {
    const linea = v.linea.toLowerCase()
    const version = v.version.toLowerCase()
    if (lower.includes(linea) && lower.includes(version)) return v
  }
  for (const v of vehiculos) {
    if (lower.includes(v.linea.toLowerCase())) return v
  }
  return null
}

function extraerDatosCredito(texto: string, historial: Array<{ role: string; content: string }>): { inicial: number; plazo: number } {
  const textoCompleto = [...historial.map(h => h.content), texto].join(' ')

  const inicialMatch =
    textoCompleto.match(/(\d+)\s*m(?:illones?)?\s*(?:de\s+)?inicial/i) ||
    textoCompleto.match(/inicial\s+(?:de\s+)?(\d+)\s*m/i) ||
    textoCompleto.match(/(\d+)\s*m\s+(?:de\s+)?inicial/i)
  const inicial = inicialMatch ? parseInt(inicialMatch[1]) * 1_000_000 : 0

  const plazoMatch =
    textoCompleto.match(/(\d+)\s*meses/i) ||
    textoCompleto.match(/a\s+(\d+)\s+meses/i) ||
    textoCompleto.match(/plazo\s+(?:de\s+)?(\d+)/i)
  const plazo = plazoMatch ? parseInt(plazoMatch[1]) : 0

  return { inicial, plazo }
}

function calcularCuota(precioNeto: number, inicial: number, plazo: number): number {
  const monto = precioNeto - inicial
  if (monto <= 0 || plazo <= 0) return 0
  const tasa = 0.018
  return Math.round((monto * tasa * Math.pow(1 + tasa, plazo)) / (Math.pow(1 + tasa, plazo) - 1))
}

function esSimulacion(texto: string): boolean {
  const lower = texto.toLowerCase()
  return (lower.includes('meses') || lower.includes('plazo') || lower.includes('cuota') || lower.includes('credito') || lower.includes('crédito') || lower.includes('financiar')) &&
    (lower.includes('inicial') || lower.includes('millones') || lower.includes('meses'))
}

async function enviarTexto(instanceName: string, remoteJid: string, mensaje: string) {
  try {
    await fetch(`${EVO_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: remoteJid, text: mensaje }),
    })
  } catch (e) { console.error('[webhook] enviarTexto error:', e) }
}

async function enviarImagen(instanceName: string, remoteJid: string, imagenUrl: string, caption: string) {
  try {
    console.log('[webhook] enviando imagen:', imagenUrl.slice(0, 60))
    const res = await fetch(`${EVO_URL}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: remoteJid, mediatype: 'image', media: imagenUrl, caption }),
    })
    const data = await res.json()
    console.log('[webhook] enviarImagen resultado:', res.status, JSON.stringify(data).slice(0, 100))
  } catch (e) { console.error('[webhook] enviarImagen error:', e) }
}

async function enviarFicha(instanceName: string, remoteJid: string, url: string, linea: string, año: number) {
  try {
    console.log('[webhook] enviando ficha:', url.slice(0, 60))
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

async function obtenerConfigAgente(instanceName: string): Promise<{ systemPrompt: string; nombre: string; botActivo: boolean }> {
  const defaultResult = { systemPrompt: '', nombre: 'el asesor', botActivo: true }
  try {
    let telefonoInstancia: string | null = null
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${instanceName}`, { headers: { apikey: EVO_KEY } })
      if (res.ok) {
        const data = await res.json()
        const ownerJid = String(data?.instance?.ownerJid || '')
        const match = ownerJid.match(/^(\d+)@/)
        if (match) telefonoInstancia = match[1]
      }
    } catch { /* continuar */ }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (supabaseAdmin.from('pulse_waitlist') as any).select('nombre, metadata').not('metadata', 'is', null)

    if (rows && Array.isArray(rows)) {
      if (telefonoInstancia) {
        const numeroCorto = telefonoInstancia.replace(/^57/, '')
        for (const row of rows) {
          const meta = row.metadata as Record<string, unknown>
          const w = String(meta?.whatsapp || '').replace(/\D/g, '').replace(/^57/, '')
          if (w && w === numeroCorto) {
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
    }
    return defaultResult
  } catch (e) {
    console.error('[webhook] obtenerConfigAgente error:', e)
    return defaultResult
  }
}

async function generarRespuesta(
  texto: string,
  systemPrompt: string,
  nombre: string,
  historial: Array<{ role: 'user' | 'assistant'; content: string }>,
  catalogoTexto: string
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const { anthropic } = await import('@/lib/anthropic')

    const historialLimpio: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const turn of historial.slice(-6)) {
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

REGLAS ESTRICTAS:
- Responde en español colombiano, tono cercano y natural
- Máximo 2-3 oraciones — esto es WhatsApp
- No uses asteriscos ni markdown
- Suena como ${nombre}, no como un bot
- USA SOLO los precios del catálogo — NUNCA inventes precios, tasas ni fechas
- Si no sabes algo con certeza, di "te confirmo ese dato"
- No menciones que envías fotos o fichas — ya se envían automáticamente`,
      messages: [...historialLimpio, { role: 'user', content: texto }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : null
  } catch (e) {
    console.error('[webhook] generarRespuesta error:', e)
    return null
  }
}

const chatHistory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>()
const mediaEnviada = new Map<string, Set<string>>()

export async function POST(req: NextRequest, context: { params: Promise<{ event: string[] }> }) {
  try {
    const { event } = await context.params
    const eventPath = event?.join('/') || ''
    const nxtPevent = req.nextUrl.searchParams.get('nxtPevent') || ''

    const isMessagesUpsert =
      eventPath.includes('messages-upsert') || eventPath.includes('messages_upsert') ||
      nxtPevent.includes('messages-upsert') || nxtPevent.includes('messages_upsert')

    if (!isMessagesUpsert) return NextResponse.json({ ok: true, ignored: true })

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
          const p = v.precio > 0 ? `$${(v.precio / 1_000_000).toFixed(1)}M` : ''
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
      const texto = String(
        message?.conversation ||
        (message?.extendedTextMessage as Record<string, unknown>)?.text ||
        (message?.imageMessage as Record<string, unknown>)?.caption || ''
      ).trim()
      if (!texto) continue

      console.log(`[webhook] mensaje de ${remoteJid}: "${texto}"`)

      const chatKey = `${instanceName}:${remoteJid}`
      const historial = chatHistory.get(chatKey) || []

      // Detectar modelo mencionado
      const modeloDetectado = vehiculos.length > 0 ? detectarModelo(texto, vehiculos) : null
      const mediaYaEnviada = mediaEnviada.get(chatKey) || new Set()
      const esPrimera = modeloDetectado ? !mediaYaEnviada.has(modeloDetectado.linea) : false

      // Detectar si tiene datos para simular crédito
      let simulacion: string | null = null
      if (esSimulacion(texto) && modeloDetectado) {
        const { inicial, plazo } = extraerDatosCredito(texto, historial)
        if (inicial > 0 && plazo > 0) {
          const precioNeto = modeloDetectado.precio - modeloDetectado.bono
          const cuota = calcularCuota(precioNeto, inicial, plazo)
          if (cuota > 0) {
            const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`
            simulacion = [
              `Simulación KIA Crédito`,
              `Modelo: KIA ${modeloDetectado.linea} ${modeloDetectado.version} ${modeloDetectado.año}`,
              `Precio lista: ${fmt(modeloDetectado.precio)}`,
              modeloDetectado.bono > 0 ? `Bono: ${fmt(modeloDetectado.bono)}` : null,
              modeloDetectado.bono > 0 ? `Precio neto: ${fmt(precioNeto)}` : null,
              `Inicial: ${fmt(inicial)}`,
              `Monto a financiar: ${fmt(precioNeto - inicial)}`,
              `Plazo: ${plazo} meses`,
              `Cuota aprox: ${fmt(cuota)}/mes`,
              `Tasa ref: 1.8% mensual`,
              `Nota: cuota exacta la confirma el banco`,
            ].filter(Boolean).join('\n')
          }
        }
      }

      // Generar respuesta conversacional
      const respuesta = await generarRespuesta(texto, systemPrompt, nombre, historial, catalogoTexto)

      if (respuesta) {
        historial.push({ role: 'user', content: texto })
        historial.push({ role: 'assistant', content: respuesta })
        chatHistory.set(chatKey, historial.slice(-10))

        await new Promise(r => setTimeout(r, 800 + Math.random() * 600))
        await enviarTexto(instanceName, remoteJid, respuesta)
        console.log(`[webhook] texto enviado: "${respuesta.slice(0, 60)}"`)
      }

      // Enviar simulación si existe
      if (simulacion) {
        await new Promise(r => setTimeout(r, 600))
        await enviarTexto(instanceName, remoteJid, simulacion)
        console.log('[webhook] simulacion enviada')
      }

      // Enviar imagen en primera mención
      if (modeloDetectado && esPrimera && modeloDetectado.imagenUrl) {
        await new Promise(r => setTimeout(r, 800))
        await enviarImagen(instanceName, remoteJid, modeloDetectado.imagenUrl, `KIA ${modeloDetectado.linea} ${modeloDetectado.version} ${modeloDetectado.año}`)
      }

      // Enviar ficha en primera mención
      if (modeloDetectado && esPrimera && modeloDetectado.fichaTecnica) {
        await new Promise(r => setTimeout(r, 600))
        await enviarFicha(instanceName, remoteJid, modeloDetectado.fichaTecnica, modeloDetectado.linea, modeloDetectado.año)
      }

      // Marcar modelo como enviado
      if (modeloDetectado && esPrimera) {
        mediaYaEnviada.add(modeloDetectado.linea)
        mediaEnviada.set(chatKey, mediaYaEnviada)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[webhook] error:', e)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'pulse-whatsapp-webhook' })
}
