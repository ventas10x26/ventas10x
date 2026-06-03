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

async function obtenerCatalogo(): Promise<string> {
  const ahora = Date.now()
  if (catalogoCache && ahora - catalogoCacheTime < CACHE_TTL) return catalogoCache

  try {
    const res = await fetch(CSV_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) throw new Error(`CSV ${res.status}`)
    const csv = await res.text()
    const texto = parsearCSV(csv)
    catalogoCache = texto
    catalogoCacheTime = ahora
    return texto
  } catch (e) {
    console.error('[playground] catalogo error:', e)
    return ''
  }
}

function parsearCSV(csv: string): string {
  const lineas = csv.trim().split('\n')
  if (lineas.length < 2) return ''

  // Detectar separador
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
    tipo: cols.findIndex(c => c.includes('tipo')),
  }

  type V = { linea: string; año: number; version: string; precio: number; trans: string; comb: string; specs: string; bono: number; colores: string; ficha: string; tipo: string }
  const vehiculos: V[] = []

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
      tipo: cells[idx.tipo] || '',
    })
  }

  // Agrupar por línea
  const porLinea = vehiculos.reduce<Record<string, V[]>>((acc, v) => {
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

  return bloques.join('\n')
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

    if (!mensaje?.trim()) {
      return NextResponse.json({ error: 'mensaje requerido' }, { status: 400 })
    }

    const agenteEmail = email || 'ricaza81@gmail.com'
    const { systemPrompt: systemPromptDB, nombre } = await obtenerConfigAgente(agenteEmail)
    const catalogo = await obtenerCatalogo()
    const systemPrompt = systemPromptOverride ?? systemPromptDB

    // Sanitizar historial — idéntico al webhook
    const historialLimpio: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const turn of (historial || []).slice(-6)) {
      const ultimo = historialLimpio[historialLimpio.length - 1]
      if (ultimo && ultimo.role === turn.role) continue
      historialLimpio.push(turn)
    }
    if (historialLimpio[historialLimpio.length - 1]?.role === 'user') {
      historialLimpio.pop()
    }

    const { anthropic } = await import('@/lib/anthropic')

    // System prompt IDÉNTICO al webhook + catálogo inyectado
    const systemFinal = `${systemPrompt || `Eres el asistente de ventas de ${nombre}, asesor KIA.`}

${catalogo}

REGLAS ESTRICTAS:
- Responde en español colombiano, tono cercano y natural
- Respuestas cortas (2-3 oraciones) EXCEPTO cuando hagas simulaciones de crédito
- No uses asteriscos ni markdown en ningún caso
- Suena como ${nombre}, no como un bot
- USA SOLO los precios del catálogo — NUNCA inventes precios, tasas ni fechas
- Si preguntan precio: da el precio exacto del catálogo incluyendo bono si aplica
- Si mencionan inicial + plazo: calcula cuota = (precio_neto - inicial) / plazo * 1.018 y RESPONDE OBLIGATORIAMENTE en este formato exacto con cada dato en su propia línea:
Modelo: [nombre completo]
Precio lista: $[X]M
Bono: $[X]M
Precio neto: $[X]M
Inicial: $[X]M
Monto a financiar: $[X]M
Plazo: [X] meses
Cuota aprox: $[X]/mes
Tasa ref: 1.8% mensual
Nota: cuota exacta la confirma el banco
- Si quieren ficha técnica: comparte el enlace exacto del catálogo
- Si el modelo no está en el catálogo: di "ese modelo lo verifico y te confirmo"
- NUNCA uses asteriscos, guiones decorativos ni markdown`

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
    const respuesta = msg.content[0].type === 'text' ? msg.content[0].text : null

    return NextResponse.json({
      ok: true,
      respuesta,
      nombre,
      systemPrompt: systemPromptDB,
      catalogoCargado: catalogo.length > 0,
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
