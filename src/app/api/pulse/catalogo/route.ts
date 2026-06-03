// src/app/api/pulse/catalogo/route.ts
// Lee el catálogo KIA desde Google Sheets CSV y lo cachea 1 hora

import { NextResponse } from 'next/server'

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTej36IuFT6HGZGKUvHGlestv9Ro1qyKXuZ88poK_diUl_6vOiU_QBKhBV7UGSUq7c3Z9g40pPtPNYr/pub?output=csv'

// Cache en memoria — se resetea con cada deploy (Vercel)
let cacheData: string | null = null
let cacheTime = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hora

type Vehiculo = {
  id: string
  referencia: string
  linea: string
  año: number
  tipo: string
  version: string
  precio: number
  transmision: string
  traccion: string
  combustible: string
  specs: string
  bono: number
  colores: string
  oneLiner: string
  fichaTecnica: string
}

function parsearCSV(csv: string): Vehiculo[] {
  const lineas = csv.trim().split('\n')
  if (lineas.length < 2) return []

  const headers = lineas[0].split('\t').map(h => h.trim())
  // Detectar separador
  const sep = headers.length > 1 ? '\t' : ','
  const cols = lineas[0].split(sep).map(h => h.trim().toLowerCase())

  const idx = {
    id: cols.findIndex(c => c.includes('versión id') || c.includes('version id')),
    ref: cols.findIndex(c => c.includes('referencia')),
    linea: cols.findIndex(c => c.includes('línea') || c.includes('linea')),
    año: cols.findIndex(c => c.includes('año') || c.includes('ano')),
    tipo: cols.findIndex(c => c.includes('tipo')),
    activo: cols.findIndex(c => c === 'activo'),
    version: cols.findIndex(c => c === 'versión' || c === 'version'),
    activaV: cols.findIndex(c => c === 'activa'),
    precio: cols.findIndex(c => c.includes('precio')),
    trans: cols.findIndex(c => c.includes('transmis')),
    trac: cols.findIndex(c => c.includes('tracc')),
    comb: cols.findIndex(c => c.includes('combustible')),
    specs: cols.findIndex(c => c.includes('especif') || c.includes('otras')),
    bono: cols.findIndex(c => c.includes('bono') && c.includes('monetario')),
    colores: cols.findIndex(c => c.includes('color')),
    oneLiner: cols.findIndex(c => c.includes('one liner') || c.includes('oneliner')),
    ficha: cols.findIndex(c => c.includes('ficha')),
  }

  const vehiculos: Vehiculo[] = []

  for (let i = 1; i < lineas.length; i++) {
    const cells = lineas[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
    if (!cells[idx.linea]) continue

    // Solo activos
    const activo = cells[idx.activo]?.toUpperCase()
    const activaV = cells[idx.activaV]?.toUpperCase()
    if (activo === 'FALSE' || activaV === 'FALSE') continue

    const precio = parseInt(cells[idx.precio]?.replace(/\D/g, '') || '0')
    const bono = parseInt(cells[idx.bono]?.replace(/\D/g, '') || '0')

    vehiculos.push({
      id: cells[idx.id] || '',
      referencia: cells[idx.ref] || '',
      linea: cells[idx.linea] || '',
      año: parseInt(cells[idx.año] || '0'),
      tipo: cells[idx.tipo] || '',
      version: cells[idx.version] || '',
      precio,
      transmision: cells[idx.trans] || '',
      traccion: cells[idx.trac] || '',
      combustible: cells[idx.comb] || '',
      specs: cells[idx.specs] || '',
      bono,
      colores: cells[idx.colores] || '',
      oneLiner: cells[idx.oneLiner] || '',
      fichaTecnica: cells[idx.ficha] || '',
    })
  }

  return vehiculos
}

function formatearParaPrompt(vehiculos: Vehiculo[]): string {
  // Agrupar por línea
  const porLinea = vehiculos.reduce<Record<string, Vehiculo[]>>((acc, v) => {
    const key = v.linea.toUpperCase()
    if (!acc[key]) acc[key] = []
    acc[key].push(v)
    return acc
  }, {})

  const bloques: string[] = []

  for (const [linea, versiones] of Object.entries(porLinea)) {
    const lines: string[] = [`## KIA ${linea}`]
    for (const v of versiones) {
      const precioFmt = v.precio > 0 ? `$${(v.precio / 1000000).toFixed(1)}M` : 'consultar'
      const bonoFmt = v.bono > 0 ? ` (bono: $${(v.bono / 1000000).toFixed(1)}M)` : ''
      const precioNeto = v.bono > 0 ? ` → precio neto: $${((v.precio - v.bono) / 1000000).toFixed(1)}M` : ''
      lines.push(
        `- ${v.version} ${v.año}: ${precioFmt}${bonoFmt}${precioNeto} | ${v.combustible} | ${v.transmision} | ${v.specs}${v.colores ? ` | Colores: ${v.colores}` : ''}${v.fichaTecnica ? ` | Ficha: ${v.fichaTecnica}` : ''}`
      )
    }
    bloques.push(lines.join('\n'))
  }

  return bloques.join('\n\n')
}

async function obtenerCatalogo(): Promise<{ texto: string; vehiculos: Vehiculo[] }> {
  const ahora = Date.now()
  if (cacheData && ahora - cacheTime < CACHE_TTL) {
    return { texto: cacheData, vehiculos: [] }
  }

  const res = await fetch(CSV_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`CSV fetch error: ${res.status}`)

  const csv = await res.text()
  const vehiculos = parsearCSV(csv)
  const texto = formatearParaPrompt(vehiculos)

  cacheData = texto
  cacheTime = ahora

  return { texto, vehiculos }
}

export async function GET() {
  try {
    const { texto, vehiculos } = await obtenerCatalogo()
    return NextResponse.json({ ok: true, texto, count: vehiculos.length, cached: cacheTime > 0 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// Exportar para uso interno
export { obtenerCatalogo }
