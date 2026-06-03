// src/app/api/pulse/playground/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTej36IuFT6HGZGKUvHGlestv9Ro1qyKXuZ88poK_diUl_6vOiU_QBKhBV7UGSUq7c3Z9g40pPtPNYr/pub?output=csv'

let catalogoCache: string | null = null
let catalogoCacheTime = 0
const CACHE_TTL = 60 * 60 * 1000

type VehiculoCatalogo = {
  linea: string
  año: number
  version: string
  precio: number
  trans: string
  comb: string
  specs: string
  bono: number
  colores: string
  ficha: string
}

let vehiculosCache: VehiculoCatalogo[] = []

async function obtenerCatalogo(): Promise<{ texto: string; vehiculos: VehiculoCatalogo[] }> {
  const ahora = Date.now()
  if (catalogoCache && ahora - catalogoCacheTime < CACHE_TTL) {
    return { texto: catalogoCache, vehiculos: vehiculosCache }
  }

  try {
    const res = await fetch(CSV_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) throw new Error(`CSV ${res.status}`)
    const csv = await res.text()
    const { texto, vehiculos } = parsearCSV(csv)
    catalogoCache = texto
    vehiculosCache = vehiculos
    catalogoCacheTime = ahora
    return { texto, vehiculos }
  } catch (e) {
    console.error('[playground] catalogo error:', e)
    return { texto: '', vehiculos: [] }
  }
}

function parsearCSV(csv: string): { texto: string; vehiculos: VehiculoCatalogo[] } {
  const lineas = csv.trim().split('\n')
  if (lineas.length < 2) return { texto: '', vehiculos: [] }

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
    trans: cols.findIndex(c => c.includes('transmis')),
    comb: cols.findIndex(c => c.includes('combustible')),
    specs: cols.findIndex(c => c.includes('especif') || c.includes('otras')),
    bono: cols.findIndex(c => c.includes('bono') && c.includes('monetario')),
    colores: cols.findIndex(c => c.includes('color')),
    ficha: cols.findIndex(c => c.includes('ficha')),
  }

  const vehiculos: VehiculoCatalogo[] = []

  for (let i = 1; i < lineas.length; i++) {
    const cells = lineas[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
    if (!cells[idx.linea]) continue
    if (cells[idx.activo]?.toUpperCase() === 'FALSE') continue
    if (cells[idx.activaV]?.toUpperCase() === 'FALSE') continue

    vehiculos.push({
      linea: cells[idx.linea] || '',
      año: parseInt(cells[idx.año] || '0'),
      version: cells[idx.version] || '',
      precio: parseInt(cells[idx.precio]?.replace(/\D/g, '') || '0'),
      trans: cells[idx.trans] || '',
      comb: cells[idx.comb] || '',
      specs: cells[idx.specs] || '',
      bono: parseInt(cells[idx.bono]?.replace(/\D/g, '') || '0'),
      colores: cells[idx.colores] || '',
      ficha: cells[idx.ficha] || '',
    })
  }

  const porLinea = vehiculos.reduce<Record<string, VehiculoCatalogo[]>>((acc, v) => {
    const k = v.linea.toUpperCase()
    if (!acc[k]) acc[k] = []
    acc[k].push(v)
    return acc
  }, {})

  const bloques: string[] = ['=== CATÁLOGO KIA COLOMBIA (PRECIOS VIGENTES) ===']
  for (const [linea, vers] of Object.entries(porLinea)) {
    bloques.push(`\n## KIA ${linea}`)
    for (const v of vers) {
      const p = v.precio > 0 ? `$${(v.precio / 1000000).toFixed(1)}M` : 'consultar'
      const b = v.bono > 0 ? ` | Bono: $${(v.bono / 1000000).toFixed(1)}M | Precio neto: $${((v.precio - v.bono) / 1000000).toFixed(1)}M` : ''
      const ficha = v.ficha ? ` | Ficha: ${v.ficha}` : ''
      bloques.push(`- ${v.version} ${v.año}: ${p}${b} | ${v.comb} | ${v.trans} | ${v.specs}${v.colores ? ` | Colores: ${v.colores}` : ''}${ficha}`)
    }
  }

  return { texto: bloques.join('\n'), vehiculos }
}

// Detectar si el mensaje es una solicitud de simulación de crédito
function esSimulacionCredito(mensaje: string): boolean {
  const lower = mensaje.toLowerCase()
  return (
    (lower.includes('inicial') || lower.includes('cuota') || lower.includes('financiar') || lower.includes('crédito') || lower.includes('credito') || lower.includes('plazo') || lower.includes('meses')) &&
    (lower.includes('inicial') || lower.includes('millones') || lower.includes('plazo') || lower.includes('meses'))
  )
}

// Extraer datos de simulación del mensaje y del historial
function extraerDatosSimulacion(mensaje: string, historial: Array<{ role: string; content: string }>, vehiculos: VehiculoCatalogo[]): {
  modelo: VehiculoCatalogo | null
  inicial: number
  plazo: number
} | null {
  // Combinar historial + mensaje para buscar datos
  const textoCompleto = [...historial.map(h => h.content), mensaje].join(' ').toLowerCase()

  // Buscar inicial
  const inicialMatch = textoCompleto.match(/(\d+)\s*m(?:illones?)?(?:\s+de\s+inicial|\s+inicial)/i) ||
    textoCompleto.match(/inicial\s+(?:de\s+)?(\d+)\s*m/i) ||
    textoCompleto.match(/(\d+)\s*m\s+(?:de\s+)?inicial/i)
  const inicial = inicialMatch ? parseInt(inicialMatch[1]) * 1_000_000 : 0

  // Buscar plazo
  const plazoMatch = textoCompleto.match(/(\d+)\s*meses/i) ||
    textoCompleto.match(/plazo\s+(?:de\s+)?(\d+)/i) ||
    textoCompleto.match(/a\s+(\d+)\s+meses/i)
  const plazo = plazoMatch ? parseInt(plazoMatch[1]) : 0

  // Buscar modelo en vehiculos
  let modeloEncontrado: VehiculoCatalogo | null = null
  for (const v of vehiculos) {
    const nombreCompleto = `${v.linea} ${v.version} ${v.año}`.toLowerCase()
    const lineaLower = v.linea.toLowerCase()
    const versionLower = v.version.toLowerCase()
    if (
      textoCompleto.includes(lineaLower) &&
      (textoCompleto.includes(versionLower) || textoCompleto.includes(v.año.toString()))
    ) {
      modeloEncontrado = v
      break
    }
    // Match solo por línea si no hay versión específica
    if (textoCompleto.includes(lineaLower) && !modeloEncontrado) {
      modeloEncontrado = v
    }
  }

  if (!inicial && !plazo && !modeloEncontrado) return null
  return { modelo: modeloEncontrado, inicial, plazo }
}

// Formatear simulación de crédito con saltos de línea reales
function formatearSimulacion(datos: { modelo: VehiculoCatalogo | null; inicial: number; plazo: number }): string {
  const { modelo, inicial, plazo } = datos
  if (!modelo || !inicial || !plazo) return ''

  const precioLista = modelo.precio
  const bono = modelo.bono || 0
  const precioNeto = precioLista - bono
  const montoFinanciar = precioNeto - inicial
  if (montoFinanciar <= 0) return ''

  const tasaMensual = 0.018
  const cuota = Math.round((montoFinanciar * tasaMensual * Math.pow(1 + tasaMensual, plazo)) / (Math.pow(1 + tasaMensual, plazo) - 1))

  const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`

  return [
    `Simulación KIA Crédito`,
    `Modelo: KIA ${modelo.linea} ${modelo.version} ${modelo.año}`,
    `Precio lista: ${fmt(precioLista)}`,
    bono > 0 ? `Bono: ${fmt(bono)}` : null,
    bono > 0 ? `Precio neto: ${fmt(precioNeto)}` : null,
    `Inicial: ${fmt(inicial)}`,
    `Monto a financiar: ${fmt(montoFinanciar)}`,
    `Plazo: ${plazo} meses`,
    `Cuota aprox: ${fmt(cuota)}/mes`,
    `Tasa ref: 1.8% mensual`,
    `Nota: cuota exacta la confirma el banco`,
  ].filter(Boolean).join('\n')
}

async function obtenerConfigAgente(email: string): Promise<{ systemPrompt: string; nombre: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('nombre, metadata')
      .ilike('email', email)
      .maybeSingle()

    if (!data) return { systemPrompt: '', nombre: 'el asesor' }
    const cfg = data.metadata?.agent_config as Record<string, unknown> | undefined
    return {
      systemPrompt: String(cfg?.system_prompt || ''),
      nombre: data.nombre || 'el asesor',
    }
  } catch (e) {
    console.error('[playground] obtenerConfigAgente error:', e)
    return { systemPrompt: '', nombre: 'el asesor' }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { mensaje, historial, email, systemPromptOverride } = await req.json()
    if (!mensaje?.trim()) return NextResponse.json({ error: 'mensaje requerido' }, { status: 400 })

    const agenteEmail = email || 'ricaza81@gmail.com'
    const { systemPrompt: systemPromptDB, nombre } = await obtenerConfigAgente(agenteEmail)
    const { texto: catalogo, vehiculos } = await obtenerCatalogo()
    const systemPrompt = systemPromptOverride ?? systemPromptDB

    // Sanitizar historial
    const historialLimpio: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const turn of (historial || []).slice(-6)) {
      const ultimo = historialLimpio[historialLimpio.length - 1]
      if (ultimo && ultimo.role === turn.role) continue
      historialLimpio.push(turn)
    }
    if (historialLimpio[historialLimpio.length - 1]?.role === 'user') historialLimpio.pop()

    // Detectar simulación de crédito — formatear en el servidor, no en Claude
    let simulacionFormateada: string | null = null
    if (esSimulacionCredito(mensaje) && vehiculos.length > 0) {
      const datos = extraerDatosSimulacion(mensaje, historial || [], vehiculos)
      if (datos?.modelo && datos.inicial > 0 && datos.plazo > 0) {
        simulacionFormateada = formatearSimulacion(datos)
      }
    }

    const { anthropic } = await import('@/lib/anthropic')

    const systemFinal = `${systemPrompt || `Eres el asistente de ventas de ${nombre}, asesor KIA.`}

${catalogo}

REGLAS ESTRICTAS:
- Responde en español colombiano, tono cercano y natural
- Máximo 2-3 oraciones — esto es WhatsApp
- No uses asteriscos ni markdown
- Suena como ${nombre}, no como un bot
- USA SOLO los precios del catálogo — NUNCA inventes precios, tasas ni fechas
- Si preguntan precio: da el precio exacto del catálogo incluyendo bono si aplica
- Si preguntan por ficha técnica: comparte el enlace exacto del catálogo
- Si el modelo no está en el catálogo: di "ese modelo lo verifico y te confirmo"
${simulacionFormateada ? '- La simulación de crédito ya fue calculada por el sistema — agrégala al final de tu respuesta tal como viene, sin modificarla' : '- Si mencionan inicial + plazo: di que vas a hacer la simulación con KIA Crédito y pide confirmar el modelo exacto si no lo tienes claro'}`

    const startTime = Date.now()

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemFinal,
      messages: [
        ...historialLimpio,
        { role: 'user', content: mensaje.trim() },
      ],
    })

    const latencia = Date.now() - startTime
    let respuesta = msg.content[0].type === 'text' ? msg.content[0].text : ''

    // Inyectar simulación formateada al final si existe
    if (simulacionFormateada) {
      // Remover cualquier intento de Claude de hacer la simulación
      respuesta = respuesta.replace(/simulaci[oó]n[\s\S]*?banco[^\n]*/gi, '').trim()
      respuesta = `${respuesta}\n\n${simulacionFormateada}`
    }

    return NextResponse.json({
      ok: true,
      respuesta,
      nombre,
      systemPrompt: systemPromptDB,
      catalogoCargado: catalogo.length > 0,
      esSimulacion: !!simulacionFormateada,
      meta: {
        modelo: 'claude-haiku-4-5-20251001',
        latencia_ms: latencia,
        input_tokens: msg.usage?.input_tokens || 0,
        output_tokens: msg.usage?.output_tokens || 0,
      },
    })
  } catch (e) {
    console.error('[playground] error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
