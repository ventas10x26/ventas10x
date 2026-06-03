// src/app/api/pulse/whatsapp/webhook/[...event]/route.ts
// Versión con envío automático de imagen + ficha técnica al mencionar un modelo

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

// Cache catálogo
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
    if (!res.ok) return []
    const csv = await res.text()
    const vehiculos = parsearCSVMedia(csv)
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
  const sep = primera.includes('\t') ? '\t' : ','
  const cols = primera.split(sep).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())

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

// Detectar modelo mencionado en el texto
function detectarModelo(texto: string, vehiculos: VehiculoMedia[]): VehiculoMedia | null {
  const lower = texto.toLowerCase()
  
  // Buscar por línea + versión
  for (const v of vehiculos) {
    const linea = v.linea.toLowerCase()
    const version = v.version.toLowerCase()
    if (lower.includes(linea) && lower.includes(version)) return v
  }
  
  // Buscar solo por línea
  for (const v of vehiculos) {
    const linea = v.linea.toLowerCase()
    if (lower.includes(linea)) return v
  }
  
  return null
}

// Detectar si el mensaje pide imagen o ficha
function pideFicha(texto: string): boolean {
  const lower = texto.toLowerCase()
  return lower.includes('ficha') || lower.includes('especificaci') || lower.includes('técnica') || lower.includes('tecnica')
}

function pideImagen(texto: string): boolean {
  const lower = texto.toLowerCase()
  return lower.includes('foto') || lower.includes('imagen') || lower.includes('ver') || lower.includes('manda') || lower.includes('muestra') || lower.includes('cómo es') || lower.includes('como es')
}

function esPrimeraMencionModelo(texto: string, historial: Array<{ role: string; content: string }>, vehiculos: VehiculoMedia[]): boolean {
  // Si el modelo no fue mencionado antes en el historial, es la primera vez
  const modelo = detectarModelo(texto, vehiculos)
  if (!modelo) return false
  
  const linea = modelo.linea.toLowerCase()
  const historialTexto = historial.map(h => h.content).join(' ').toLowerCase()
  return !historialTexto.includes(linea)
}

async function enviarTexto(instanceName: string, remoteJid: string, mensaje: string) {
  try {
    await fetch(`${EVO_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number: remoteJid, text: mensaje }),
    })
  } catch (e) {
    console.error('[webhook] enviarTexto error:', e)
  }
}

async function enviarImagen(instanceName: string, remoteJid: string, imagenUrl: string, caption: string) {
  try {
    const res = await fetch(`${EVO_URL}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({
        number: remoteJid,
        mediatype: 'image',
        media: imagenUrl,
        caption,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[webhook] enviarImagen error:', res.status, err)
    }
  } catch (e) {
    console.error('[webhook] enviarImagen error:', e)
  }
}

async function enviarDocumento(instanceName: string, remoteJid: string, url: string, nombre: string) {
  try {
    await fetch(`${EVO_URL}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({
        number: remoteJid,
        mediatype: 'document',
        media: url,
        fileName: nombre,
        caption: `Ficha técnica ${nombre}`,
      }),
    })
  } catch (e) {
    console.error('[webhook] enviarDocumento error:', e)
  }
}

async function obtenerConfigAgente(instanceName: string): Promise<{
  systemPrompt: string
  nombre: string
  botActivo: boolean
}> {
  const defaultResult = { systemPrompt: '', nombre: 'el asesor', botActivo: true }
  try {
    // Obtener número de la instancia
    let telefonoInstancia: string | null = null
    try {
      const res = await fetch(`${EVO_URL}/instance/connectionState/${instanceName}`, {
        headers: { apikey: EVO_KEY },
      })
      if (res.ok) {
        const data = await res.json()
        const ownerJid = String(data?.instance?.ownerJid || '')
        const match = ownerJid.match(/^(\d+)@/)
        if (match) telefonoInstancia = match[1]
      }
    } catch { /* continuar */ }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('nombre, metadata')
      .not('metadata', 'is', null)

    if (rows && Array.isArray(rows)) {
      // Buscar por número
      if (telefonoInstancia) {
        const numeroCorto = telefonoInstancia.replace(/^57/, '')
        for (const row of rows) {
          const meta = row.metadata as Record<string, unknown>
          const w = String(meta?.whatsapp || '').replace(/\D/g, '').replace(/^57/, '')
          if (w && w === numeroCorto) {
            const cfg = meta?.agent_config as Record<string, unknown> | undefined
            return {
              systemPrompt: String(cfg?.system_prompt || ''),
              nombre: row.nombre || 'el asesor',
              botActivo: meta?.bot_activo !== false,
            }
          }
        }
      }

      // Fallback: primer registro con agent_config
      for (const row of rows) {
        const meta = row.metadata as Record<string, unknown>
        if (meta?.agent_config) {
          const cfg = meta.agent_config as Record<string, unknown>
          return {
            systemPrompt: String(cfg?.system_prompt || ''),
            nombre: row.nombre || 'el asesor',
            botActivo: meta?.bot_activo !== false,
          }
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

    const systemFinal = `${systemPrompt || `Eres el asistente de ventas de ${nombre}, asesor KIA.`}

${catalogoTexto}

REGLAS ESTRICTAS:
- Responde en español colombiano, tono cercano y natural
- Máximo 2-3 oraciones — esto es WhatsApp
- No uses asteriscos ni markdown
- Suena como ${nombre}, no como un bot
- USA SOLO los precios del catálogo — NUNCA inventes precios, tasas ni fechas
- Si no sabes algo con certeza, di "te confirmo ese dato" o "déjame verificar"
- Si mencionan inicial + crédito + plazo: confirma el modelo y di que vas a simular con KIA Crédito
- No menciones que vas a enviar imagen o ficha — ya se envían automáticamente`

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      system: systemFinal,
      messages: [
        ...historialLimpio,
        { role: 'user', content: texto },
      ],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : null
  } catch (e) {
    console.error('[webhook] generarRespuesta error:', e)
    return null
  }
}

const chatHistory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>()
// Rastrear si ya enviamos media por conversación+modelo para no repetir
const mediaEnviada = new Map<string, Set<string>>()

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ event: string[] }> }
) {
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

    if (!botActivo) {
      console.log('[webhook] bot INACTIVO:', instanceName)
      return NextResponse.json({ ok: true, paused: true })
    }

    // Cargar catálogo
    const vehiculos = await obtenerCatalogo()
    const catalogoTexto = vehiculos.length > 0
      ? '=== CATÁLOGO KIA ===\n' + vehiculos.map(v => {
          const p = v.precio > 0 ? `$${(v.precio / 1000000).toFixed(1)}M` : ''
          const b = v.bono > 0 ? ` (bono $${(v.bono / 1000000).toFixed(1)}M)` : ''
          return `- KIA ${v.linea} ${v.version} ${v.año}: ${p}${b} | ${v.combustible} | ${v.specs}`
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
        (message?.imageMessage as Record<string, unknown>)?.caption ||
        ''
      ).trim()

      if (!texto) continue

      console.log(`[webhook] mensaje de ${remoteJid}: "${texto}"`)

      const chatKey = `${instanceName}:${remoteJid}`
      const historial = chatHistory.get(chatKey) || []

      // Generar respuesta de texto
      const respuesta = await generarRespuesta(texto, systemPrompt, nombre, historial, catalogoTexto)

      if (respuesta) {
        historial.push({ role: 'user', content: texto })
        historial.push({ role: 'assistant', content: respuesta })
        chatHistory.set(chatKey, historial.slice(-10))

        await new Promise(r => setTimeout(r, 1000 + Math.random() * 800))
        await enviarTexto(instanceName, remoteJid, respuesta)
        console.log(`[webhook] respondido: "${respuesta.slice(0, 60)}..."`)
      }

      // Enviar imagen + ficha automáticamente si hay modelo mencionado
      if (vehiculos.length > 0) {
        const modeloDetectado = detectarModelo(texto, vehiculos)

        if (modeloDetectado) {
          const mediaKey = `${chatKey}:${modeloDetectado.linea}`
          const mediaYaEnviada = mediaEnviada.get(chatKey) || new Set()
          const esPrimera = !mediaYaEnviada.has(modeloDetectado.linea)
          const quereFicha = pideFicha(texto)
          const quereImagen = pideImagen(texto)

          // Enviar imagen: primera mención O cuando la pide explícitamente
          if (modeloDetectado.imagenUrl && (esPrimera || quereImagen)) {
            await new Promise(r => setTimeout(r, 800))
            const caption = `KIA ${modeloDetectado.linea} ${modeloDetectado.version} ${modeloDetectado.año}`
            await enviarImagen(instanceName, remoteJid, modeloDetectado.imagenUrl, caption)
            console.log(`[webhook] imagen enviada: ${modeloDetectado.linea}`)
          }

          // Enviar ficha: primera mención O cuando la pide explícitamente
          if (modeloDetectado.fichaTecnica && (esPrimera || quereFicha)) {
            await new Promise(r => setTimeout(r, 600))
            const nombreFicha = `Ficha_KIA_${modeloDetectado.linea}_${modeloDetectado.año}.pdf`
            await enviarDocumento(instanceName, remoteJid, modeloDetectado.fichaTecnica, nombreFicha)
            console.log(`[webhook] ficha enviada: ${modeloDetectado.linea}`)
          }

          // Marcar modelo como ya enviado
          mediaYaEnviada.add(modeloDetectado.linea)
          mediaEnviada.set(chatKey, mediaYaEnviada)
          void mediaKey
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
  return NextResponse.json({ ok: true, service: 'pulse-whatsapp-webhook' })
}
