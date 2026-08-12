'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'
import { DataBridgeOrden, DataBridgePrototipos } from '@/components/pulse/DataBridgeShowcase'
import { createClient } from '@/lib/supabase/client'

const FONT      = "var(--font-inter), sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const BLUE      = '#2563EB'
const BLUE_2    = '#1D4ED8'

// Las 6 fuentes operativas que el cruce sabe reconocer (ver skill pulsemotor-strategy).
// El color del chip es decorativo por categoría — el acento de marca sigue siendo el azul.
const FUENTES = [
  { label: 'Inventario',   icon: '▦', color: BLUE },
  { label: 'Leads',        icon: '◎', color: '#8B5CF6' },
  { label: 'Financiación', icon: '≡', color: '#0D9488' },
  { label: 'Pólizas',      icon: '⛨', color: '#DB2777' },
  { label: 'Retomas',      icon: '⇄', color: '#4F46E5' },
  { label: 'Accesorios',   icon: '✦', color: '#F2A93B' },
]

const EJEMPLOS = ['Inventario y matrículas', 'Leads y financiación', 'Retomas y pólizas']

// Mismo límite que aplica el servidor (route.ts) — recortar acá también evita mandar
// payloads de varios MB que Vercel rechaza (límite de body de 4.5MB en API routes),
// y evita saturar localStorage con el guardado pendiente pre-cuenta.
const MAX_FILAS_POR_TABLA = 1000
const capSheetsParaEnvio = (sheets: { name: string; rows: Record<string, unknown>[] }[]) =>
  sheets.map(s => ({ name: s.name, rows: s.rows.slice(0, MAX_FILAS_POR_TABLA) }))

const PALETTE = ['#4f8ef7', '#34c97e', '#f7924f', '#c97fd4', '#f7d24f', '#22d3ee', '#fb7185', '#a3e635']

// Ruta de producto del marco estratégico v2 (ver skill pulsemotor-strategy) — se muestra
// después de detectar el esquema para que el prospecto vea hacia dónde escala esto, no
// solo el estado actual del prototipo.
const ROADMAP_PROTOTIPO = [
  { paso: '01 · Prototipar', titulo: 'Un flujo completo con tus datos', desc: 'El esquema que acabás de ver se convierte en un panel funcional — sin reconstruir nada desde cero.' },
  { paso: '02 · Desplegar', titulo: 'En producción con tu equipo', desc: 'El mismo modelo, conectado a tu WhatsApp Business real y al DMS o Excel que ya usás.' },
  { paso: '03 · Iterar', titulo: 'KPIs que cambian de prioridad', desc: 'El panel reordena qué indicador manda según dónde está la fuga o la oportunidad más grande de la semana.' },
  { paso: '04 · Predecir', titulo: 'Modelos entrenados con tus datos', desc: 'Probabilidad de cierre, mejor momento de contacto y propensión a renovación — entrenados sobre tu propio histórico, no supuestos genéricos.' },
]

interface Node3D {
  id: string; l: string; kind: 'table' | 'field'; table: string
  tipo?: string; color: string; isHub?: boolean; fieldCount?: number
  x: number; y: number; z: number; r: number
  px?: number; py?: number; depth?: number
}

interface Edge3D { a: string; b: string }

interface SheetData { name: string; rows: Record<string, unknown>[] }

interface FieldMatch { fieldA: string; fieldB: string; label: string; score: number }
interface TableRelation { a: string; b: string; matches: FieldMatch[] }

type Step = 'subir' | 'mapear' | 'relaciones' | 'prototipo' | 'confirmar'
const STEPS: { key: Step; label: string }[] = [
  { key: 'subir', label: 'Subir' },
  { key: 'mapear', label: 'Mapear' },
  { key: 'relaciones', label: 'Relaciones' },
  { key: 'prototipo', label: 'Prototipo' },
  { key: 'confirmar', label: 'Confirmar' },
]

const rand = (a: number, b: number) => Math.random() * (b - a) + a

// Aire alrededor del grafo al encuadrarlo. El margen inferior es mayor porque bajo cada
// nodo de tabla van dos líneas de texto (nombre + "N campos · clic para ver").
const FIT_PAD_X = 90
const FIT_PAD_Y = 100

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
}

function normalize(s: string): string {
  return stripAccents(s.toLowerCase()).replace(/[^a-z0-9]/g, '')
}

// Palabras demasiado genéricas para considerarse una coincidencia real por sí solas
// (compartirían "id"/"doc" casi cualquier par de campos sin estar relacionados).
const TOKEN_STOPWORDS = new Set(['id', 'doc', 'de', 'del', 'la', 'el', 'los', 'las'])

// Tokens del nombre de campo respetando límites de palabra (snake_case y camelCase),
// a diferencia de normalize() que los concatena en un solo string. Permite detectar
// "Nombre_Vendedor" <-> "VendedorFactura" por el token compartido "vendedor", aunque
// ninguno de los dos nombres completos esté contenido en el otro.
function nameTokens(raw: string): string[] {
  const spaced = raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
  return stripAccents(spaced.toLowerCase())
    .split(/\s+/)
    .filter(t => t.length >= 4 && !TOKEN_STOPWORDS.has(t))
}

function inferType(raw: unknown[]): string {
  const sample = raw.filter(v => v !== undefined && v !== null && String(v).trim() !== '').slice(0, 30).map(v => String(v).trim())
  if (!sample.length) return 'vacío'
  if (sample.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) return 'email'
  if (sample.every(v => v !== '' && !isNaN(Number(v)))) return 'número'
  if (sample.every(v => /^\d{4}-\d{2}-\d{2}/.test(v) || /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v))) return 'fecha'
  if (sample.every(v => /^[A-Za-z0-9-]{6,20}$/.test(v)) && sample.some(v => /[A-Za-z]/.test(v)) && sample.some(v => /\d/.test(v))) return 'identificador'
  return 'texto'
}

function isRealHeader(h: string): boolean {
  const t = h.trim()
  if (!t) return false
  if (/^__?empty/i.test(t)) return false
  if (/^column\d+$/i.test(t)) return false
  return true
}

function buildGraph(sheets: SheetData[]): { nodes: Node3D[]; edges: Edge3D[] } {
  const nodes: Node3D[] = []
  const edges: Edge3D[] = []
  const pi2 = Math.PI * 2
  const tableRadius = 170 + Math.max(0, sheets.length - 4) * 30

  interface ColInfo { id: string; table: string; norm: string }
  const cols: ColInfo[] = []

  sheets.forEach((sheet, si) => {
    const color = PALETTE[si % PALETTE.length]
    const angle = pi2 * si / Math.max(sheets.length, 1)
    const cx = Math.cos(angle) * tableRadius
    const cz = Math.sin(angle) * tableRadius
    const cy = (si % 2 === 0 ? -1 : 1) * 24
    const hubId = 'hub_' + si
    const headers = Object.keys(sheet.rows[0] || {}).filter(isRealHeader)
    const nF = headers.length
    nodes.push({ id: hubId, l: sheet.name, kind: 'table', table: sheet.name, color, fieldCount: nF, x: cx, y: cy, z: cz, r: 18 })

    const fieldRadius = 42 + Math.sqrt(nF) * 22
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))
    headers.forEach((h, fi) => {
      const rawValues = sheet.rows.map(r => r[h])
      const tipo = inferType(rawValues)
      const id = `f_${si}_${fi}`
      // distribución esférica (Fibonacci sphere) para que los campos se separen en las 3 dimensiones
      // y no colapsen en un solo anillo plano al rotar la vista
      const idx = fi + 0.5
      const phi = Math.acos(1 - (2 * idx) / nF)
      const theta = goldenAngle * fi
      const sx = Math.sin(phi) * Math.cos(theta) * fieldRadius
      const sy = Math.cos(phi) * fieldRadius * 0.7
      const sz = Math.sin(phi) * Math.sin(theta) * fieldRadius
      nodes.push({ id, l: h, kind: 'field', table: sheet.name, tipo, color, x: cx + sx, y: cy + sy, z: cz + sz, r: 9 })
      edges.push({ a: hubId, b: id })
      cols.push({ id, table: sheet.name, norm: normalize(h) })
    })
  })

  // campo cuyo nombre se repite en 3+ hojas: candidato a llave compartida (solo se marca, no se traza línea)
  const nameTableCount = new Map<string, Set<string>>()
  cols.forEach(c => {
    if (!nameTableCount.has(c.norm)) nameTableCount.set(c.norm, new Set())
    nameTableCount.get(c.norm)!.add(c.table)
  })
  cols.forEach(c => {
    if ((nameTableCount.get(c.norm)?.size ?? 0) >= 3) {
      const node = nodes.find(n => n.id === c.id)
      if (node) node.isHub = true
    }
  })

  return { nodes, edges }
}

function detectTableRelations(sheets: SheetData[]): TableRelation[] {
  interface ColInfo { table: string; field: string; norm: string; tokens: Set<string>; values: Set<string> }
  const cols: ColInfo[] = []
  sheets.forEach(sheet => {
    const headers = Object.keys(sheet.rows[0] || {}).filter(isRealHeader)
    headers.forEach(h => {
      const rawValues = sheet.rows.map(r => r[h])
      // stripAccents en los valores también — antes solo se le quitaban tildes al
      // nombre del campo, así que "María López" vs "Maria Lopez" no cruzaba por valor.
      const values = new Set(rawValues.filter(v => v !== undefined && v !== null && String(v).trim() !== '').map(v => stripAccents(String(v).trim().toLowerCase())))
      cols.push({ table: sheet.name, field: h, norm: normalize(h), tokens: new Set(nameTokens(h)), values })
    })
  })

  const pairMap = new Map<string, TableRelation>()
  for (let i = 0; i < cols.length; i++) {
    for (let j = i + 1; j < cols.length; j++) {
      const A = cols[i], B = cols[j]
      if (A.table === B.table) continue
      const nameMatch = A.norm.length >= 4 && B.norm.length >= 4 && (A.norm === B.norm || A.norm.includes(B.norm) || B.norm.includes(A.norm))
      const sharedTokens = new Set([...A.tokens].filter(t => B.tokens.has(t)))
      const sharedToken = !nameMatch && sharedTokens.size > 0
      let overlap = 0
      if (A.values.size >= 3 && B.values.size >= 3) {
        let inter = 0
        A.values.forEach(v => { if (B.values.has(v)) inter++ })
        overlap = inter / Math.min(A.values.size, B.values.size)
      }
      if (overlap < 0.5 && !nameMatch && !sharedToken) continue
      // El % siempre refleja la señal real de cada tipo de match — value overlap para "mismo
      // valor", cuánto del nombre más corto queda contenido en el más largo para "nombre
      // similar" (Jaccard de tokens compartidos para "palabra en común") — nunca se omite,
      // para no perder la noción de qué tan confiable es cada cruce.
      let label: string
      let score: number
      if (overlap >= 0.5) {
        score = overlap
        label = `mismo valor ${Math.round(score * 100)}%`
      } else if (nameMatch) {
        score = Math.min(A.norm.length, B.norm.length) / Math.max(A.norm.length, B.norm.length)
        label = `nombre similar ${Math.round(score * 100)}%`
      } else {
        const totalTokens = new Set([...A.tokens, ...B.tokens]).size
        score = totalTokens > 0 ? sharedTokens.size / totalTokens : 0
        label = `palabra en común ${Math.round(score * 100)}%`
      }
      const key = [A.table, B.table].sort().join('|')
      if (!pairMap.has(key)) pairMap.set(key, { a: A.table, b: B.table, matches: [] })
      pairMap.get(key)!.matches.push({ fieldA: A.field, fieldB: B.field, label, score })
    }
  }
  return Array.from(pairMap.values()).map(r => ({ ...r, matches: r.matches.sort((x, y) => y.score - x.score).slice(0, 6) }))
}

// Gris-azulado (baja probabilidad) → ámbar (media) → verde (alta) — el color del vector de
// unión pasa a comunicar qué tan confiable es el cruce, no solo si está en foco/hover.
const SCORE_COLOR_STOPS: [number, [number, number, number]][] = [
  [0, [148, 163, 184]],
  [0.5, [242, 169, 59]],
  [1, [16, 185, 129]],
]
function rgbForScore(score: number): [number, number, number] {
  const s = Math.max(0, Math.min(1, score))
  let lo = SCORE_COLOR_STOPS[0], hi = SCORE_COLOR_STOPS[SCORE_COLOR_STOPS.length - 1]
  for (let i = 0; i < SCORE_COLOR_STOPS.length - 1; i++) {
    if (s >= SCORE_COLOR_STOPS[i][0] && s <= SCORE_COLOR_STOPS[i + 1][0]) { lo = SCORE_COLOR_STOPS[i]; hi = SCORE_COLOR_STOPS[i + 1]; break }
  }
  const range = hi[0] - lo[0] || 1
  const t = (s - lo[0]) / range
  return [0, 1, 2].map(i => Math.round(lo[1][i] + (hi[1][i] - lo[1][i]) * t)) as [number, number, number]
}
function colorForScore(score: number, alpha: number): string {
  const [r, g, b] = rgbForScore(score)
  return `rgba(${r},${g},${b},${alpha})`
}

function visibleFieldIdsFor(allNodes: Node3D[], expanded: Set<string>, focusedRel: TableRelation | null): Set<string> {
  if (focusedRel) {
    const ids = new Set<string>()
    focusedRel.matches.forEach(m => {
      const fa = allNodes.find(n => n.kind === 'field' && n.table === focusedRel.a && n.l === m.fieldA)
      const fb = allNodes.find(n => n.kind === 'field' && n.table === focusedRel.b && n.l === m.fieldB)
      if (fa) ids.add(fa.id)
      if (fb) ids.add(fb.id)
    })
    return ids
  }
  return new Set(allNodes.filter(n => n.kind === 'field' && expanded.has(n.table)).map(n => n.id))
}

function visibleTableIdsFor(allNodes: Node3D[], focusedRel: TableRelation | null): Set<string> | null {
  if (!focusedRel) return null
  return new Set(allNodes.filter(n => n.kind === 'table' && (n.table === focusedRel.a || n.table === focusedRel.b)).map(n => n.id))
}

function computeTableStats(nodes: Node3D[]): { table: string; color: string; count: number }[] {
  const map = new Map<string, { color: string; count: number }>()
  nodes.filter(n => n.kind === 'field').forEach(n => {
    const cur = map.get(n.table) || { color: n.color, count: 0 }
    cur.count++
    map.set(n.table, cur)
  })
  return Array.from(map.entries()).map(([table, v]) => ({ table, color: v.color, count: v.count }))
}

function genDemoSheets(): SheetData[] {
  const vins = ['KNAJ23415P7012345', 'KNAJ23415P7098234', 'KNAJ23415P7055678', 'KNAJ23415P7011122', 'KNAJ23415P7099887', 'KNAJ23415P7044556']
  const cedulas = ['1023456789', '1098765432', '1045678912', '1076543219', '1034567891', '1087654321']
  const asesores = ['carlos.r@concesionario.com', 'maria.v@concesionario.com', 'andres.m@concesionario.com', 'karime.m@concesionario.com']
  const marcas = ['SUV Compacta', 'Sedán Urbano', 'Hatchback', 'Crossover', 'SUV Familiar', 'Van de Pasajeros']

  const ventas = vins.map((vin, i) => ({
    oportunidad_id: 'OP-' + (1000 + i),
    cliente_cedula: cedulas[i],
    vin,
    marca: marcas[i],
    precio: String(80000000 + i * 3500000),
    asesor_email: asesores[i % asesores.length],
    fecha_cierre: `2026-0${(i % 6) + 1}-1${i}`,
  }))

  const retomas = [
    { retoma_id: 'RT-200', VIN_Vehiculo: vins[0], marca_recibida: 'Toyota Corolla', valor_estimado: '28000000', asesor_email: asesores[0] },
    { retoma_id: 'RT-201', VIN_Vehiculo: vins[1], marca_recibida: 'Chevrolet Spark', valor_estimado: '19500000', asesor_email: asesores[1] },
    { retoma_id: 'RT-202', VIN_Vehiculo: vins[2], marca_recibida: 'Renault Logan', valor_estimado: '22000000', asesor_email: asesores[2] },
    { retoma_id: 'RT-203', VIN_Vehiculo: 'KNAJ99999P9999999', marca_recibida: 'Hyundai Tucson', valor_estimado: '34000000', asesor_email: asesores[3] },
  ]

  const financiacion = [
    { financiacion_id: 'FN-300', vin: vins[0], cliente_cedula: cedulas[0], banco: 'Bancolombia', tasa: '1.15' },
    { financiacion_id: 'FN-301', vin: vins[1], cliente_cedula: cedulas[1], banco: 'Davivienda', tasa: '1.20' },
    { financiacion_id: 'FN-302', vin: vins[2], cliente_cedula: cedulas[2], banco: 'Banco de Bogotá', tasa: '1.18' },
    { financiacion_id: 'FN-303', vin: vins[3], cliente_cedula: cedulas[3], banco: 'AV Villas', tasa: '1.22' },
    { financiacion_id: 'FN-304', vin: 'KNAJ88888P8888888', cliente_cedula: '9999999999', banco: 'Bancolombia', tasa: '1.15' },
  ]

  const polizas = [
    { poliza_id: 'PL-400', vin: vins[0], aseguradora: 'SURA', prima: '1200000' },
    { poliza_id: 'PL-401', vin: vins[2], aseguradora: 'Bolívar', prima: '1350000' },
    { poliza_id: 'PL-402', vin: vins[4], aseguradora: 'Mapfre', prima: '1180000' },
    { poliza_id: 'PL-403', vin: 'KNAJ77777P7777777', aseguradora: 'Allianz', prima: '1290000' },
  ]

  const asesoresSheet = asesores.map((email, i) => ({
    asesor_email: email,
    nombre: ['Carlos R.', 'María V.', 'Andrés M.', 'Karime M.'][i],
    meta_mensual: String(6 + i),
  }))

  return [
    { name: 'Ventas', rows: ventas },
    { name: 'Retomas', rows: retomas },
    { name: 'Financiacion', rows: financiacion },
    { name: 'Polizas', rows: polizas },
    { name: 'Asesores', rows: asesoresSheet },
  ]
}

// Este componente era antes 'page.tsx' completo, copiado aca sin cambiar
// ninguna linea de contenido o comportamiento (solo el nombre de la funcion).
// page.tsx ahora es un componente de servidor liviano que declara metadata
// propia de esta pagina y renderiza este componente.
export default function DataBridgeClient() {
  const [user, setUser]               = useState<{ nombre: string; email: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectNameError, setProjectNameError] = useState(false)
  const [projectNameFocused, setProjectNameFocused] = useState(false)
  const projectNameInputRef = useRef<HTMLInputElement>(null)
  const [anonProjects, setAnonProjects] = useState<{ id: string; name: string; createdAt: number; sheets: number; fields: number; relations: number }[]>([])
  const [autoDesplegando, setAutoDesplegando] = useState(false)
  const [autoDeployError, setAutoDeployError] = useState<string | null>(null)
  const [autoDeployRetryTick, setAutoDeployRetryTick] = useState(0)
  const autoDeployAttemptRef = useRef(false)
  const [phase, setPhase]             = useState<'upload' | 'processing' | 'selecting' | 'ready'>('upload')
  const [step, setStep]               = useState<Step>('subir')
  const [pendingSheets, setPendingSheets]         = useState<SheetData[]>([])
  const [selectedSheetNames, setSelectedSheetNames] = useState<Set<string>>(new Set())
  const [progPct, setProgPct]         = useState(0)
  const [progLabel, setProgLabel]     = useState('Leyendo archivo...')
  const [view, setView]               = useState<'3d' | 'top'>('3d')
  const [nodes, setNodes]             = useState<Node3D[]>([])
  const [edges, setEdges]             = useState<Edge3D[]>([])
  const [tooltip, setTooltip]         = useState<{ x: number; y: number; node: Node3D } | null>(null)
  const [stats, setStats]             = useState<{ table: string; color: string; count: number }[]>([])
  const [fullscreen, setFullscreen]   = useState(false)
  const [dragMode, setDragMode]       = useState<'rotate' | 'pan'>('rotate')
  const [tableRelations, setTableRelations] = useState<TableRelation[]>([])
  const [schemaHover, setSchemaHover] = useState<{ type: 'table'; table: string } | { type: 'relation'; rel: TableRelation } | null>(null)
  const [focusedRelation, setFocusedRelation] = useState<TableRelation | null>(null)
  const [schemaViewMode, setSchemaViewMode] = useState<'radial' | 'tables'>('radial')
  const [schemaFullscreen, setSchemaFullscreen] = useState(false)
  const [erLines, setErLines] = useState<{ key: string; x1: number; y1: number; x2: number; y2: number; rel: TableRelation; match: FieldMatch }[]>([])
  const [tablePositions, setTablePositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [loadedSheets, setLoadedSheets] = useState<SheetData[]>([])
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [relacionChat, setRelacionChat] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [relacionInput, setRelacionInput] = useState('')
  const [relacionLoading, setRelacionLoading] = useState(false)
  const [proyectosGuardados, setProyectosGuardados] = useState<{ id: string; nombre: string; created_at: string; tablas: number }[]>([])
  // Índice de proyectos: si el usuario ya tiene alguno, la pantalla abre mostrándolos en vez
  // de la caja de crear — antes vivían como una fila de pills al pie y se perdían de vista.
  // "Nuevo proyecto" salta a la caja de crear; quien todavía no tiene ninguno la ve directo.
  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [renombrandoId, setRenombrandoId] = useState<string | null>(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [confirmarBorrarId, setConfirmarBorrarId] = useState<string | null>(null)
  const [proyectoOcupadoId, setProyectoOcupadoId] = useState<string | null>(null)
  const [proyectosError, setProyectosError] = useState<string | null>(null)
  const [desplegando, setDesplegando] = useState(false)
  const [desplegarError, setDesplegarError] = useState<string | null>(null)

  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const camRef        = useRef({ rx: -25, ry: 30 })
  const panRef        = useRef({ x: 0, y: 0 })
  const zoomRef       = useRef(1)
  // Escala base del encuadre automático y la firma del estado con el que se calculó, para
  // recalcularla solo cuando cambia algo real (datos, tamaño, vista, expandir/contraer) y no
  // en cada cuadro de la rotación automática, que la haría latir.
  const fitScaleRef   = useRef(1)
  const fitSigRef     = useRef('')
  const interactedRef = useRef(false)
  const dragRef       = useRef({ on: false, x: 0, y: 0 })
  const animRef       = useRef<number>(0)
  const nodesRef      = useRef<Node3D[]>([])
  const edgesRef      = useRef<Edge3D[]>([])
  const hoverRef      = useRef<string | null>(null)
  const viewRef       = useRef<'3d' | 'top'>('3d')
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const uploadMoreRef = useRef<HTMLInputElement>(null)
  const expandedRef   = useRef<Set<string>>(new Set())
  const focusedRelationRef = useRef<TableRelation | null>(null)
  const clickStartRef = useRef({ x: 0, y: 0 })
  const dragCounterRef = useRef(0)
  const erContentRef = useRef<HTMLDivElement>(null)
  const erFieldRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const erDragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null)
  const erJustDraggedRef = useRef(false)

  const supabase = createClient()

  // El login con Google es una redirección completa a accounts.google.com y de vuelta —
  // getUser() disparado una sola vez al montar puede resolver ANTES de que termine de
  // procesarse el intercambio de sesión post-redirect (?code=...), dejando user=null para
  // siempre aunque la sesión sí se establezca un instante después. onAuthStateChange corrige
  // eso: se dispara de nuevo apenas la sesión queda lista, así que "Desplegar panel" recién
  // llegado de crear cuenta no se queda esperando un user que nunca actualiza.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ email: data.user.email ?? '', nombre: (data.user.user_metadata?.full_name as string) || data.user.email?.split('@')[0] || '' })
      setAuthChecked(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user
        ? { email: session.user.email ?? '', nombre: (session.user.user_metadata?.full_name as string) || session.user.email?.split('@')[0] || '' }
        : null)
      setAuthChecked(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Foco automático en "Nombre del proyecto" apenas se ve la caja de crear — al abrir la
  // página, o al venir del índice por "Nuevo proyecto". Mientras se muestra el índice el
  // input no está montado, así que el focus simplemente no hace nada.
  useEffect(() => {
    if (authChecked && phase === 'upload' && !autoDesplegando && !projectName) {
      projectNameInputRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, phase, autoDesplegando, mostrarCrear])

  // Paneles ya desplegados (persistidos de verdad en Supabase) del usuario logueado —
  // para poder volver a uno sin resubir los datos.
  useEffect(() => {
    if (!user) return
    fetch('/api/pulse/databridge/proyectos')
      .then(r => r.json())
      .then(data => { if (data.ok) setProyectosGuardados(data.proyectos) })
      .catch(() => {})
  }, [user])

  const guardarNombreProyecto = async (id: string) => {
    const limpio = nombreEditado.trim()
    const actual = proyectosGuardados.find(p => p.id === id)?.nombre
    if (!limpio || limpio === actual) { setRenombrandoId(null); return }
    setProyectoOcupadoId(id); setProyectosError(null)
    try {
      const res = await fetch('/api/pulse/databridge/proyectos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nombre: limpio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo renombrar')
      setProyectosGuardados(prev => prev.map(p => p.id === id ? { ...p, nombre: data.nombre } : p))
      setRenombrandoId(null)
    } catch (e) {
      setProyectosError(e instanceof Error ? e.message : 'No se pudo renombrar')
    } finally {
      setProyectoOcupadoId(null)
    }
  }

  const borrarProyecto = async (id: string) => {
    setProyectoOcupadoId(id); setProyectosError(null)
    try {
      const res = await fetch('/api/pulse/databridge/proyectos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo borrar')
      setProyectosGuardados(prev => prev.filter(p => p.id !== id))
      setConfirmarBorrarId(null)
    } catch (e) {
      setProyectosError(e instanceof Error ? e.message : 'No se pudo borrar')
    } finally {
      setProyectoOcupadoId(null)
    }
  }

  // Retoma el prototipo que quedó pendiente de guardar en localStorage (ver irACrearCuenta) apenas
  // detecta la sesión nueva post-signup, y lo despliega solo — sin esto, crear la cuenta devolvía
  // a un DataBridge vacío y el usuario tenía que rehacer todo el flujo desde cero.
  //
  // autoDeployAttemptRef evita reintentos duplicados: onAuthStateChange puede disparar setUser()
  // varias veces para el mismo login (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED...), cada vez
  // con un objeto nuevo, así que el efecto de abajo puede correr más de una vez para la misma
  // sesión — sin el ref, eso significaba intentar el POST repetidas veces.
  //
  // El payload NO se borra de localStorage hasta que el despliegue realmente tiene éxito — antes
  // se borraba antes de intentar el fetch, así que cualquier falla (red, timeout, error del
  // servidor) lo perdía para siempre y el usuario volvía a un DataBridge vacío sin ningún aviso,
  // sin rastro en consola y sin forma de reintentar.
  useEffect(() => {
    if (!user || autoDeployAttemptRef.current) return
    let raw: string | null = null
    try { raw = window.localStorage.getItem('pulse_databridge_pending_deploy') } catch {}
    if (!raw) return
    autoDeployAttemptRef.current = true
    setAutoDesplegando(true)
    setAutoDeployError(null)
    ;(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)
      try {
        const payload = JSON.parse(raw!)
        const res = await fetch('/api/pulse/databridge/proyectos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'El servidor rechazó el despliegue')
        try { window.localStorage.removeItem('pulse_databridge_pending_deploy') } catch {}
        window.location.href = `/pulse/databridge/panel/${data.id}`
      } catch (e) {
        console.error('[databridge] auto-despliegue pendiente falló:', e)
        setAutoDesplegando(false)
        setAutoDeployError(e instanceof Error ? e.message : 'No se pudo desplegar automáticamente')
      } finally {
        clearTimeout(timeoutId)
      }
    })()
  }, [user, autoDeployRetryTick])

  const reintentarAutoDeploy = () => {
    autoDeployAttemptRef.current = false
    setAutoDeployRetryTick(t => t + 1)
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('pulse_databridge_anon_projects')
      if (raw) setAnonProjects(JSON.parse(raw))
    } catch {}
  }, [])

  const saveAnonProject = (sheetsCount: number, fieldsCount: number, relationsCount: number, nombre?: string) => {
    const entry = {
      id: crypto.randomUUID(),
      name: (nombre ?? projectName).trim() || 'Proyecto sin título',
      createdAt: Date.now(),
      sheets: sheetsCount,
      fields: fieldsCount,
      relations: relationsCount,
    }
    setAnonProjects(prev => {
      const next = [entry, ...prev].slice(0, 5)
      try { window.localStorage.setItem('pulse_databridge_anon_projects', JSON.stringify(next)) } catch {}
      return next
    })
  }

  // Coordenadas proyectadas sin escala ni paneo. Se separan de project() porque el encuadre
  // automático necesita medir el grafo *antes* de saber con qué escala dibujarlo.
  const projectUnit = useCallback((x: number, y: number, z: number) => {
    if (viewRef.current === 'top') return { ux: x, uy: -z, depth: 1 }
    const rx = camRef.current.rx * Math.PI / 180
    const ry = camRef.current.ry * Math.PI / 180
    const y1 = y * Math.cos(rx) - z * Math.sin(rx)
    const z1 = y * Math.sin(rx) + z * Math.cos(rx)
    const x2 = x * Math.cos(ry) + z1 * Math.sin(ry)
    const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry)
    const fov = 500; const d = fov / (fov + z2 + 300)
    return { ux: x2 * d, uy: y1 * d, depth: z2 }
  }, [])

  // Escala que hace entrar el grafo completo en el canvas con aire. Antes salía solo de la
  // altura contra un alto de referencia fijo, así que en un panel ancho el diagrama quedaba
  // diminuto en el centro y desperdiciaba todo el espacio de los costados.
  const computeFitScale = useCallback((ns: Node3D[], W: number, H: number) => {
    if (!ns.length || W <= 0 || H <= 0) return 1
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    ns.forEach(n => {
      const { ux, uy } = projectUnit(n.x, n.y, n.z)
      if (ux < minX) minX = ux
      if (ux > maxX) maxX = ux
      if (uy < minY) minY = uy
      if (uy > maxY) maxY = uy
    })
    const gw = Math.max(1, maxX - minX)
    const gh = Math.max(1, maxY - minY)
    // En un canvas angosto o bajo (mobile) el margen fijo se come casi todo el ancho útil y
    // deja el grafo diminuto, así que se topea contra una fracción del lado correspondiente.
    const padX = Math.min(FIT_PAD_X, W * 0.12)
    const padY = Math.min(FIT_PAD_Y, H * 0.25)
    const s = Math.min((W - padX * 2) / gw, (H - padY * 2) / gh)
    return Math.min(2.6, Math.max(0.5, s))
  }, [projectUnit])

  const project = useCallback((x: number, y: number, z: number, W: number, H: number) => {
    const { ux, uy, depth } = projectUnit(x, y, z)
    const dimScale = fitScaleRef.current * zoomRef.current
    return {
      px: ux * dimScale + W / 2 + panRef.current.x,
      py: uy * dimScale + H / 2 + panRef.current.y,
      depth,
    }
  }, [projectUnit])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width / (window.devicePixelRatio || 1)
    const H = canvas.height / (window.devicePixelRatio || 1)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const focusedRel = focusedRelationRef.current
    const visibleFieldIds = visibleFieldIdsFor(nodesRef.current, expandedRef.current, focusedRel)
    const visibleTableIds = visibleTableIdsFor(nodesRef.current, focusedRel)
    const ns = nodesRef.current.filter(n => n.kind === 'table' ? (!visibleTableIds || visibleTableIds.has(n.id)) : visibleFieldIds.has(n.id))
    const es = edgesRef.current.filter(e => visibleFieldIds.has(e.b))
    if (!ns.length) return

    const fitSig = `${ns.length}|${Math.round(W)}x${Math.round(H)}|${viewRef.current}|${focusedRel ? focusedRel.a + '>' + focusedRel.b : ''}`
    if (fitSig !== fitSigRef.current) {
      fitSigRef.current = fitSig
      fitScaleRef.current = computeFitScale(ns, W, H)
    }

    const dimScale = fitScaleRef.current * zoomRef.current
    // La tipografía no sigue al zoom del encuadre: escalar el texto igual que la geometría
    // hacía que en pantalla completa los nombres de campo salieran a ~25px y se pisaran entre
    // sí. Los nodos siguen creciendo para llenar el panel; las etiquetas se mantienen en un
    // rango legible y compacto.
    const labelScale = Math.min(1.4, Math.max(1, 1 + (dimScale - 1) * 0.28))
    const ls = (px: number) => Math.round(px * labelScale)

    const proj = ns.map(n => ({ ...n, ...project(n.x, n.y, n.z, W, H) }))
    // Painter's algorithm: primero los lejanos (depth mayor), para que los cercanos queden
    // encima. Estaba al revés, así que un nodo del fondo podía tapar a uno del frente.
    proj.sort((a, b) => (b.depth ?? 0) - (a.depth ?? 0))

    const hoverId = hoverRef.current

    ctx.setLineDash([3, 4])
    es.forEach(e => {
      const a = proj.find(n => n.id === e.a)
      const b = proj.find(n => n.id === e.b)
      if (!a || !b) return
      ctx.beginPath(); ctx.moveTo(a.px!, a.py!); ctx.lineTo(b.px!, b.py!)
      ctx.strokeStyle = 'rgba(100,116,139,0.45)'
      ctx.lineWidth = Math.max(1, dimScale)
      ctx.stroke()
    })
    ctx.setLineDash([])

    if (focusedRel) {
      focusedRel.matches.forEach(m => {
        const a = proj.find(n => n.kind === 'field' && n.table === focusedRel.a && n.l === m.fieldA)
        const b = proj.find(n => n.kind === 'field' && n.table === focusedRel.b && n.l === m.fieldB)
        if (!a || !b) return
        ctx.beginPath(); ctx.moveTo(a.px!, a.py!); ctx.lineTo(b.px!, b.py!)
        ctx.strokeStyle = 'rgba(52,211,153,0.9)'
        ctx.lineWidth = Math.max(1.5, 2 * dimScale)
        ctx.stroke()
      })
    }

    // Pasada 1 — círculos. Van todos antes que cualquier texto para que ningún nodo dibujado
    // después le pase por encima a una etiqueta ya puesta.
    const radiusOf = (n: typeof proj[number]) => {
      const pscale = viewRef.current === '3d' ? (800 / (800 + (n.depth ?? 0) + 300)) : 1
      return n.r * pscale * dimScale
    }
    proj.forEach(n => {
      const c = n.color
      const r = radiusOf(n)
      ctx.beginPath(); ctx.arc(n.px!, n.py!, r + 3, 0, Math.PI * 2)
      ctx.fillStyle = c + '22'; ctx.fill()
      if (n.isHub) {
        ctx.beginPath(); ctx.arc(n.px!, n.py!, r + 6, 0, Math.PI * 2)
        ctx.strokeStyle = c + 'aa'; ctx.lineWidth = 1.5 * dimScale; ctx.stroke()
      }
      ctx.beginPath(); ctx.arc(n.px!, n.py!, r, 0, Math.PI * 2)
      ctx.fillStyle = c; ctx.fill()
      if (n.kind === 'table') {
        ctx.font = `700 ${ls(11)}px system-ui`; ctx.fillStyle = 'rgba(0,0,0,0.8)'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(n.l.slice(0, 3).toUpperCase(), n.px!, n.py!)
      }
    })

    // Pasada 2 — etiquetas con descarte por colisión. Al expandir una tabla, sus campos caen
    // muy juntos en la proyección y los nombres terminaban apilados unos sobre otros. Se
    // reservan las cajas ya ocupadas y se saltea el texto que no entra: la tabla y el campo
    // bajo el cursor tienen prioridad, y el detalle completo igual está en el panel lateral.
    const taken: { x0: number; y0: number; x1: number; y1: number }[] = []
    const overlaps = (x0: number, y0: number, x1: number, y1: number) =>
      taken.some(b => x0 < b.x1 && x1 > b.x0 && y0 < b.y1 && y1 > b.y0)
    // Escribe una línea centrada en cx. Con force=false abandona (y no escribe nada) si pisa
    // algo ya puesto, así no queda media etiqueta suelta sin su tipo de dato debajo.
    const line = (text: string, cx: number, top: number, font: string, color: string, force: boolean) => {
      if (!text) return true
      ctx.font = font
      const w = ctx.measureText(text).width
      const h = parseInt(font.match(/(\d+)px/)?.[1] ?? '11', 10)
      const box = { x0: cx - w / 2 - 2, y0: top - 1, x1: cx + w / 2 + 2, y1: top + h + 1 }
      if (!force && overlaps(box.x0, box.y0, box.x1, box.y1)) return false
      taken.push(box)
      ctx.fillStyle = color
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillText(text, cx, top)
      return true
    }

    // Las tablas son el ancla estructural: se colocan primero y nunca se descartan.
    proj.filter(n => n.kind === 'table').forEach(n => {
      const r = radiusOf(n)
      const expanded = expandedRef.current.has(n.table)
      line(n.l, n.px!, n.py! + r + ls(5), `700 ${ls(12)}px system-ui`, '#0f172a', true)
      line(`${n.fieldCount ?? 0} campos · ${expanded ? 'clic para contraer' : 'clic para ver'}`,
        n.px!, n.py! + r + ls(21), `${ls(10)}px system-ui`, '#64748b', true)
    })

    // Campos: el que está bajo el cursor primero (siempre legible), después de más cerca a
    // más lejos, que es el orden en que el ojo los prioriza.
    const fields = proj.filter(n => n.kind === 'field')
      .sort((a, b) => (a.id === hoverId ? -1 : b.id === hoverId ? 1 : (a.depth ?? 0) - (b.depth ?? 0)))
    fields.forEach(n => {
      const isHover = n.id === hoverId
      const r = radiusOf(n)
      const nameTop = n.py! + r + ls(4)
      // El tipo se separa por la altura real del nombre: con un offset fijo, al crecer la
      // tipografía las dos líneas se solapaban y el descarte terminaba comiéndose el tipo.
      const typeTop = nameTop + ls(11) + 3
      if (!isHover) {
        // Se mide el bloque completo (nombre + tipo) antes de escribir nada.
        ctx.font = `${ls(11)}px system-ui`
        const wName = ctx.measureText(n.l).width
        ctx.font = `${ls(9)}px system-ui`
        const wType = ctx.measureText(n.tipo || '').width
        const half = Math.max(wName, wType) / 2 + 2
        if (overlaps(n.px! - half, nameTop - 1, n.px! + half, typeTop + ls(9) + 1)) return
      }
      line(n.l, n.px!, nameTop, `${isHover ? '600 ' : ''}${ls(11)}px system-ui`, isHover ? '#0f172a' : '#475569', isHover)
      line(n.tipo || '', n.px!, typeTop, `${ls(9)}px system-ui`, n.color, isHover)
    })
  }, [project, computeFitScale])

  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
    draw()
  }, [nodes, edges, draw])

  useEffect(() => {
    expandedRef.current = expandedTables
    draw()
  }, [expandedTables, draw])

  useEffect(() => {
    focusedRelationRef.current = focusedRelation
    draw()
  }, [focusedRelation, draw])

  useEffect(() => {
    viewRef.current = view
    draw()
  }, [view, draw])

  useEffect(() => {
    if (phase !== 'ready') return
    let stopped = false
    const tick = () => {
      if (stopped) return
      if (!dragRef.current.on && !interactedRef.current) { camRef.current.ry += 0.12; draw() }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { stopped = true; cancelAnimationFrame(animRef.current) }
  }, [phase, draw])

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.parentElement!.getBoundingClientRect()
    canvas.width  = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)
    draw()
  }, [draw])

  // El canvas recién se monta cuando la fase deja de ser 'upload', así que un sync disparado
  // solo al montar la página corre con canvasRef en null y nunca se reintenta: el backing store
  // se queda en el 300x150 por defecto y el navegador lo estira por CSS (todo gigante, borroso
  // y con el aspecto deformado). El ResizeObserver sobre el contenedor lo mantiene igualado
  // pase lo que pase con el layout — montaje tardío, pantalla completa, sidebar plegado o
  // resize de ventana — sin depender de que cada cambio futuro acuerde de re-sincronizar.
  useEffect(() => {
    const parent = canvasRef.current?.parentElement
    if (!parent) return
    syncCanvasSize()
    const ro = new ResizeObserver(syncCanvasSize)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [phase, fullscreen, syncCanvasSize])

  useEffect(() => {
    document.body.style.overflow = (fullscreen || schemaFullscreen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [fullscreen, schemaFullscreen])

  useEffect(() => {
    if (!fullscreen && !schemaFullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setFullscreen(false)
      setSchemaFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, schemaFullscreen])

  const processSheets = (sheets: SheetData[], nombreProyecto?: string) => {
    const { nodes: n, edges: e } = buildGraph(sheets)
    const relations = detectTableRelations(sheets)
    setNodes(n); setEdges(e)
    setStats(computeTableStats(n))
    setTableRelations(relations)
    setSchemaHover(null)
    setFocusedRelation(null)
    setExpandedTables(new Set())
    setLoadedSheets(sheets)
    setPhase('ready')
    setStep('mapear')
    if (authChecked && !user) {
      saveAnonProject(sheets.length, n.filter(f => f.kind === 'field').length, relations.length, nombreProyecto)
    }
  }

  // suma las hojas nuevas a las ya cargadas (en vez de reemplazarlas) para poder
  // cruzar relaciones entre archivos subidos en momentos distintos
  const mergeWithLoaded = (newSheets: SheetData[]): SheetData[] => {
    if (!loadedSheets.length) return newSheets
    const existingNames = new Set(loadedSheets.map(s => s.name))
    const disambiguated = newSheets.map(s => {
      let name = s.name
      let i = 2
      while (existingNames.has(name)) { name = `${s.name} (${i})`; i++ }
      existingNames.add(name)
      return { ...s, name }
    })
    return [...loadedSheets, ...disambiguated]
  }

  const runProgress = (onDone: () => void) => {
    setPhase('processing')
    const steps = ['Leyendo archivo...', 'Detectando hojas...', 'Detectando columnas...', 'Infiriendo tipos de dato...', 'Construyendo grafo 3D...', 'Listo']
    let i = 0
    const iv = setInterval(() => {
      i++
      setProgPct(Math.round(i / steps.length * 100))
      setProgLabel(steps[Math.min(i, steps.length - 1)])
      if (i >= steps.length) {
        clearInterval(iv)
        setTimeout(onDone, 400)
      }
    }, 320)
  }

  // El nombre sugerido de un ejemplo hace las veces del campo obligatorio si está vacío —
  // se pasa explícito a processSheets porque el setState no llega a reflejarse antes de que
  // runProgress dispare el callback ya capturado en este render.
  const startDemo = (nombreSugerido?: string) => {
    const nombre = projectName.trim() || nombreSugerido?.trim() || ''
    if (!nombre) { requireProjectName(); return }
    if (nombre !== projectName) { setProjectName(nombre); setProjectNameError(false) }
    runProgress(() => processSheets(genDemoSheets(), nombre))
  }

  const elegirFuente = (etiqueta: string) => {
    if (!projectName.trim()) setProjectName(etiqueta)
    setProjectNameError(false)
    fileInputRef.current?.click()
  }

  const parseFiles = async (files: File[]): Promise<SheetData[]> => {
    const allSheets: SheetData[] = []
    for (const file of files) {
      const baseName = file.name.replace(/\.[^.]+$/, '')
      if (file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text()
        const data = JSON.parse(text)
        if (Array.isArray(data)) {
          allSheets.push({ name: baseName, rows: data })
        } else {
          const keys = Object.entries(data)
          keys.forEach(([name, rows]) => {
            allSheets.push({ name: keys.length > 1 ? `${baseName} - ${name}` : baseName, rows: rows as Record<string, unknown>[] })
          })
        }
      } else {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        workbook.SheetNames.forEach(name => {
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], { defval: '' })
          allSheets.push({ name: workbook.SheetNames.length > 1 ? `${baseName} - ${name}` : baseName, rows })
        })
      }
    }
    return allSheets.filter(s => s.rows.length > 0)
  }

  const requireProjectName = () => {
    if (projectName.trim()) return true
    setProjectNameError(true)
    projectNameInputRef.current?.focus()
    return false
  }

  const handleFiles = async (files: File[]) => {
    if (!requireProjectName()) return
    setPhase('processing')
    setProgLabel('Leyendo archivo...')
    setProgPct(15)
    try {
      const sheets = await parseFiles(files)
      if (!sheets.length) { runProgress(() => processSheets(loadedSheets.length ? loadedSheets : genDemoSheets())); return }
      if (sheets.length === 1) { runProgress(() => processSheets(mergeWithLoaded(sheets))); return }
      setPendingSheets(sheets)
      setSelectedSheetNames(new Set(sheets.map(s => s.name)))
      setPhase('selecting')
    } catch {
      runProgress(() => processSheets(loadedSheets.length ? loadedSheets : genDemoSheets()))
    }
  }

  const toggleSheetSelected = (name: string) => {
    setSelectedSheetNames(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name); else next.add(name)
      return next
    })
  }

  const confirmSheetSelection = () => {
    const selected = pendingSheets.filter(s => selectedSheetNames.has(s.name))
    if (!selected.length) return
    runProgress(() => processSheets(mergeWithLoaded(selected)))
  }

  const cancelSheetSelection = () => {
    setPendingSheets([])
    setSelectedSheetNames(new Set())
    setPhase(loadedSheets.length ? 'ready' : 'upload')
  }

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) handleFiles(files)
    e.target.value = ''
  }

  const onDropZoneDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!e.dataTransfer.types.includes('Files')) return
    dragCounterRef.current++
    setIsDraggingFile(true)
  }

  const onDropZoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes('Files')) e.dataTransfer.dropEffect = 'copy'
  }

  const onDropZoneDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
    if (dragCounterRef.current === 0) setIsDraggingFile(false)
  }

  const onDropZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDraggingFile(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length) handleFiles(files)
  }

  const setErFieldRef = (key: string) => (el: HTMLDivElement | null) => {
    if (el) erFieldRefs.current.set(key, el)
    else erFieldRefs.current.delete(key)
  }

  const ER_TABLE_WIDTH = 210
  const ER_TABLE_GAP = 20

  // Posición por defecto: mismo orden en fila que el layout original (antes de mover nada a mano).
  const getTablePos = (tableId: string, index: number) =>
    tablePositions.get(tableId) || { x: index * (ER_TABLE_WIDTH + ER_TABLE_GAP), y: 0 }

  const onTableHeaderMouseDown = (tableId: string, index: number) => (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const origin = getTablePos(tableId, index)
    const drag = { id: tableId, startX: e.clientX, startY: e.clientY, origX: origin.x, origY: origin.y, moved: false }
    erDragRef.current = drag

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - drag.startX
      const dy = ev.clientY - drag.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true
      setTablePositions(prev => {
        const next = new Map(prev)
        next.set(drag.id, { x: Math.max(0, drag.origX + dx), y: Math.max(0, drag.origY + dy) })
        return next
      })
      recomputeErLines()
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      erJustDraggedRef.current = drag.moved
      erDragRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const recomputeErLines = useCallback(() => {
    const content = erContentRef.current
    if (!content) return
    const originRect = content.getBoundingClientRect()
    const next: { key: string; x1: number; y1: number; x2: number; y2: number; rel: TableRelation; match: FieldMatch }[] = []
    tableRelations.forEach((rel, ri) => {
      rel.matches.forEach((m, mi) => {
        const aEl = erFieldRefs.current.get(`${rel.a}::${m.fieldA}`)
        const bEl = erFieldRefs.current.get(`${rel.b}::${m.fieldB}`)
        if (!aEl || !bEl) return
        const aRect = aEl.getBoundingClientRect()
        const bRect = bEl.getBoundingClientRect()
        const aIsLeft = aRect.left <= bRect.left
        const x1 = (aIsLeft ? aRect.right : aRect.left) - originRect.left
        const x2 = (aIsLeft ? bRect.left : bRect.right) - originRect.left
        const y1 = aRect.top + aRect.height / 2 - originRect.top
        const y2 = bRect.top + bRect.height / 2 - originRect.top
        next.push({ key: `${ri}_${mi}`, x1, y1, x2, y2, rel, match: m })
      })
    })
    setErLines(next)
  }, [tableRelations])

  useLayoutEffect(() => {
    if (schemaViewMode !== 'tables' || phase !== 'ready') return
    recomputeErLines()
    const onResize = () => recomputeErLines()
    window.addEventListener('resize', onResize)
    const content = erContentRef.current
    const ro = new ResizeObserver(() => recomputeErLines())
    if (content) ro.observe(content)
    return () => { window.removeEventListener('resize', onResize); ro.disconnect() }
  }, [schemaViewMode, phase, recomputeErLines])

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || phase !== 'ready') return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top
    if (dragRef.current.on) {
      const effectiveMode = e.shiftKey ? (dragMode === 'rotate' ? 'pan' : 'rotate') : dragMode
      if (effectiveMode === 'rotate') {
        camRef.current.ry += (mx - dragRef.current.x) * 0.4
        camRef.current.rx += (my - dragRef.current.y) * 0.4
        camRef.current.rx = Math.max(-80, Math.min(80, camRef.current.rx))
      } else {
        panRef.current.x += mx - dragRef.current.x
        panRef.current.y += my - dragRef.current.y
      }
      dragRef.current.x = mx; dragRef.current.y = my; draw(); return
    }
    const W = rect.width; const H = rect.height
    const dimScale = fitScaleRef.current * zoomRef.current
    const visibleFieldIds = visibleFieldIdsFor(nodesRef.current, expandedTables, focusedRelation)
    const visibleTableIds = visibleTableIdsFor(nodesRef.current, focusedRelation)
    const hit = nodesRef.current.find(n => {
      if (n.kind === 'field' && !visibleFieldIds.has(n.id)) return false
      if (n.kind === 'table' && visibleTableIds && !visibleTableIds.has(n.id)) return false
      const p = project(n.x, n.y, n.z, W, H)
      const s = view === '3d' ? (800 / (800 + (p.depth ?? 0) + 300)) : 1
      const dx = mx - p.px!; const dy = my - p.py!
      return dx * dx + dy * dy < (n.r * s * dimScale + 8) ** 2
    })
    const newHoverId = hit ? hit.id : null
    if (hoverRef.current !== newHoverId) { hoverRef.current = newHoverId; draw() }
    setTooltip(hit ? { x: Math.min(mx + 12, W - 260), y: Math.max(my - 60, 0), node: hit } : null)
  }

  const fieldsOfTable = (table: string): { l: string; tipo?: string }[] =>
    nodes.filter(n => n.kind === 'field' && n.table === table).map(n => ({ l: n.l, tipo: n.tipo }))

  const legendEntries = Array.from(new Map(nodes.filter(n => n.kind === 'table').map(n => [n.table, n.color])).entries())

  const schemaTables = nodes.filter(n => n.kind === 'table')
  const schemaPositions = new Map<string, { x: number; y: number }>()
  schemaTables.forEach((t, i) => {
    if (schemaTables.length <= 1) { schemaPositions.set(t.table, { x: 140, y: 140 }); return }
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / schemaTables.length
    schemaPositions.set(t.table, { x: 140 + Math.cos(angle) * 95, y: 140 + Math.sin(angle) * 95 })
  })

  const displayInfo = schemaHover ?? (focusedRelation ? { type: 'relation' as const, rel: focusedRelation } : null)

  const relatedFieldKeys = new Set<string>()
  tableRelations.forEach(rel => {
    rel.matches.forEach(m => {
      relatedFieldKeys.add(`${rel.a}::${m.fieldA}`)
      relatedFieldKeys.add(`${rel.b}::${m.fieldB}`)
    })
  })

  // Evaluación exhaustiva de una relación vía IA — el matching automático (nombre/token/
  // valores) de detectTableRelations es rápido pero se pierde relaciones reales cuando los
  // nombres de campo difieren mucho (ej. "Vend" en una hoja vs "ID_Asesor" en otra); acá el
  // usuario señala qué cruzar y Claude razona sobre los valores de muestra reales.
  const evaluarRelacion = async () => {
    const mensaje = relacionInput.trim()
    if (!mensaje || relacionLoading || loadedSheets.length < 2) return
    setRelacionChat(prev => [...prev, { role: 'user', text: mensaje }])
    setRelacionInput('')
    setRelacionLoading(true)
    try {
      const sheetsSummary = loadedSheets.map(sheet => {
        const headers = Object.keys(sheet.rows[0] || {}).filter(isRealHeader)
        return {
          name: sheet.name,
          fields: headers.map(h => {
            const rawValues = sheet.rows.map(r => r[h])
            const tipo = inferType(rawValues)
            const muestras = Array.from(new Set(
              rawValues.filter(v => v !== undefined && v !== null && String(v).trim() !== '').map(v => String(v).trim())
            )).slice(0, 6)
            return { name: h, tipo, muestras }
          }),
        }
      })
      const relacionesExistentes = tableRelations.map(r => ({ a: r.a, b: r.b, matches: r.matches.map(m => ({ fieldA: m.fieldA, fieldB: m.fieldB })) }))

      const res = await fetch('/api/pulse/databridge/evaluar-relacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, sheets: sheetsSummary, relacionesExistentes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error evaluando la relación')

      const encontradas = (data.encontradas || []) as { tablaA: string; campoA: string; tablaB: string; campoB: string; razon: string }[]

      if (encontradas.length > 0) {
        setTableRelations(prev => {
          const next = prev.map(r => ({ ...r, matches: [...r.matches] }))
          encontradas.forEach(f => {
            let rel = next.find(r => (r.a === f.tablaA && r.b === f.tablaB) || (r.a === f.tablaB && r.b === f.tablaA))
            const swapped = !!rel && rel.a === f.tablaB
            if (!rel) {
              rel = { a: f.tablaA, b: f.tablaB, matches: [] }
              next.push(rel)
            }
            const fieldA = swapped ? f.campoB : f.campoA
            const fieldB = swapped ? f.campoA : f.campoB
            const yaExiste = rel.matches.some(m => m.fieldA === fieldA && m.fieldB === fieldB)
            if (!yaExiste) rel.matches.push({ fieldA, fieldB, label: 'confirmado por IA 100%', score: 1 })
          })
          return next
        })
      }

      const resumen = encontradas.length > 0
        ? `${data.explicacion || 'Encontré nuevas relaciones.'} (${encontradas.map(f => `${f.tablaA}.${f.campoA} ↔ ${f.tablaB}.${f.campoB}`).join(', ')})`
        : (data.explicacion || 'No encontré relaciones nuevas con eso.')
      setRelacionChat(prev => [...prev, { role: 'assistant', text: resumen }])
    } catch (e) {
      setRelacionChat(prev => [...prev, { role: 'assistant', text: 'No pude evaluar la relación — intentá de nuevo en un momento.' }])
      console.error('[databridge] evaluarRelacion error:', e)
    } finally {
      setRelacionLoading(false)
    }
  }

  // Guarda el prototipo pendiente en localStorage apenas hay datos reales y todavía no hay
  // sesión — antes esto solo pasaba al hacer clic en "Crear cuenta y desplegar", así que
  // cualquier OTRA forma de salir de la página (ej. "Mi cuenta" en el sidebar para loguearse
  // con una cuenta YA existente, en vez de crear una nueva) dejaba el prototipo sin ningún
  // respaldo — se perdía en silencio, sin relación con el auto-despliegue post-signup.
  useEffect(() => {
    if (user || loadedSheets.length === 0) return
    try {
      window.localStorage.setItem('pulse_databridge_pending_deploy', JSON.stringify({
        nombre: projectName.trim() || 'Proyecto sin título',
        sheets: capSheetsParaEnvio(loadedSheets),
        relations: tableRelations,
      }))
    } catch {}
  }, [user, loadedSheets, tableRelations, projectName])

  const irACrearCuenta = () => { window.location.href = '/pulse/signup?from=databridge' }
  // /pulse/login solo vuelve a /pulse/databridge si recibe ?from=databridge — sin este link
  // dedicado, alguien con cuenta existente no tenía forma de loguearse sin perder el
  // prototipo (no había ningún link a /pulse/login en toda esta pantalla).
  const irAIniciarSesion = () => { window.location.href = '/pulse/login?from=databridge' }

  // Convierte el mockup del paso Prototipo en un panel real: persiste las hojas (hasta 1.000
  // filas c/u — recortado ACÁ, antes de mandarlas, no solo en el servidor: con datasets grandes
  // el body sin recortar superaba el límite de 4.5MB de las API routes de Vercel y la requestse
  // colgaba/fallaba en silencio, dejando la pestaña nueva en blanco para siempre) y las
  // relaciones detectadas en Supabase, y lo abre en una pestaña nueva — a diferencia del resto
  // del flujo, esto sí sobrevive a un refresh.
  const desplegarPanel = async () => {
    if (!user || desplegando || loadedSheets.length === 0) return
    setDesplegando(true)
    setDesplegarError(null)
    // Se abre la pestaña en blanco de forma síncrona (dentro del gesto de click) para que el
    // navegador no la trate como popup — recién después de tener el id real se le fija la URL.
    const nuevaVentana = window.open('', '_blank')
    // Timeout defensivo — sin esto, un request colgado (red, cold start) deja el botón en
    // "Desplegando…" para siempre, sin forma de reintentar.
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)
    try {
      const res = await fetch('/api/pulse/databridge/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: projectName.trim() || 'Proyecto sin título',
          sheets: capSheetsParaEnvio(loadedSheets),
          relations: tableRelations,
        }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo desplegar el panel')
      const url = `/pulse/databridge/panel/${data.id}`
      if (nuevaVentana) nuevaVentana.location.href = url
      else window.open(url, '_blank')
    } catch (e) {
      nuevaVentana?.close()
      const timedOut = e instanceof DOMException && e.name === 'AbortError'
      setDesplegarError(timedOut ? 'Tardó demasiado — probá de nuevo.' : e instanceof Error ? e.message : 'No se pudo desplegar el panel')
    } finally {
      clearTimeout(timeoutId)
      setDesplegando(false)
    }
  }

  // El índice manda mientras no haya trabajo en curso: si ya hay proyectos, la pantalla abre
  // en ellos. Quien no tiene ninguno —o pidió "Nuevo proyecto"— va derecho a la caja de crear.
  const vistaProyectos = authChecked && !!user && phase === 'upload' && !mostrarCrear
    && proyectosGuardados.length > 0 && !autoDesplegando
  const fechaCorta = (iso: string) => {
    const d = new Date(iso)
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const stepIndex = STEPS.findIndex(s => s.key === step)
  const canReachStep = (s: Step) => s === 'subir' || phase === 'ready'
  const canGoBack = stepIndex > 0
  const canGoNext = stepIndex < STEPS.length - 1 && phase === 'ready'

  return (
    <PulseAppShell userName={user?.nombre} userEmail={user?.email} theme="light">
      {/* Retomando el prototipo pendiente de antes de crear la cuenta (ver el efecto que lee
          pulse_databridge_pending_deploy) — pantalla completa para que quede claro que no
          hay que resubir nada, ya está en camino. */}
      {autoDesplegando && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(248,249,251,0.97)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', textAlign: 'center', padding: '20px' }}>
          <span style={{
            display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%',
            border: '3px solid #e2e8f0', borderTopColor: '#2563EB', animation: 'pmAutoDeploySpin 0.8s linear infinite',
          }} />
          <style>{`@keyframes pmAutoDeploySpin { to { transform: rotate(360deg); } } @media (prefers-reduced-motion: reduce) { [style*="pmAutoDeploySpin"] { animation: none; } }`}</style>
          <div style={{ fontFamily: FONT, fontSize: '16px', fontWeight: 800, color: '#0f172a', maxWidth: '380px' }}>
            Desplegando el panel que armaste antes de crear tu cuenta…
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', fontFamily: FONT_BODY }}>Ya volvemos con el link — no hace falta que resubas nada.</div>
        </div>
      )}
      {/* A diferencia de antes, una falla acá queda visible y con botón de reintentar — el
          payload sigue en localStorage (no se borra hasta que el despliegue tiene éxito). */}
      {autoDeployError && (
        <div style={{ position: 'sticky', top: 0, zIndex: 250, background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#b91c1c', fontFamily: FONT_BODY }}>
            No pudimos desplegar automáticamente el panel que armaste antes de crear tu cuenta ({autoDeployError}).
          </span>
          <button onClick={reintentarAutoDeploy} style={{ fontSize: '12px', fontWeight: 700, color: '#fff', background: '#dc2626', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: FONT }}>
            Reintentar
          </button>
        </div>
      )}
      {/* Al enfocar el nombre del proyecto, el resto de la página se difumina para que el
          campo obligatorio quede como único punto de atención — no bloquea clics porque
          quien quiere cancelar el foco solo necesita hacer click afuera. Se apaga apenas
          el campo tiene contenido (no espera a perder el foco) para dejar ver el paso
          siguiente, "Subí cualquier fuente de datos", en cuanto el proyecto ya tiene nombre. */}
      <style>{`
        .pm-projectname-scrim { opacity: 0; transition: opacity 0.2s ease; }
        .pm-projectname-scrim.is-active { opacity: 1; }
        @media (prefers-reduced-motion: reduce) { .pm-projectname-scrim { transition: none; } }
      `}</style>
      {/* Se exige además que la caja de crear esté a la vista: el input se auto-enfoca mientras
          todavía carga la lista de proyectos, y al pasar al índice se desmonta sin disparar su
          onBlur, así que sin esa condición el difuminado quedaba encendido para siempre. */}
      <div
        aria-hidden="true"
        className={`pm-projectname-scrim${projectNameFocused && !projectName.trim() && !vistaProyectos ? ' is-active' : ''}`}
        style={{
          position: 'fixed', inset: 0, zIndex: 140,
          background: 'rgba(15,23,42,0.32)',
          backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ background: '#f8f9fb', minHeight: '100%' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Estado inicial: una sola pregunta y un solo campo, centrados — el nombre del
            proyecto deja de ser un input perdido en el encabezado y pasa a ser el punto de
            entrada de toda la pantalla. Una vez cargados los datos, el encabezado se
            comprime para devolverle el espacio al visualizador. */}
        {vistaProyectos ? (
          <div style={{ padding: '20px 0 0' }}>
            <style>{`
              .pm-proy-card { transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
              .pm-proy-card:hover { border-color: #bfd0ec; box-shadow: 0 8px 24px rgba(15,23,42,0.08); transform: translateY(-2px); }
              /* Atenuadas, no ocultas: escondidas hasta el hover dejaban una franja vacía que
                 hacía ver la card incompleta, y encima volvían indescubribles las acciones. */
              .pm-proy-accion { opacity: .62; transition: opacity .15s ease; }
              .pm-proy-card:hover .pm-proy-accion, .pm-proy-card:focus-within .pm-proy-accion { opacity: 1; }
              @media (prefers-reduced-motion: reduce) {
                .pm-proy-card, .pm-proy-accion { transition: none; }
                .pm-proy-card:hover { transform: none; }
              }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.22)', borderRadius: '999px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px', fontFamily: FONT_BODY }}>
                  DataBridge 360
                </div>
                <h1 style={{ fontFamily: FONT, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 8px', color: '#0f172a' }}>
                  Tus <span style={{ color: BLUE }}>proyectos</span>
                </h1>
                <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.6, margin: 0, fontFamily: FONT_BODY }}>
                  {proyectosGuardados.length} {proyectosGuardados.length === 1 ? 'panel desplegado' : 'paneles desplegados'} · abrí uno para verlo o armá uno nuevo con otras fuentes.
                </p>
              </div>
              <button
                onClick={() => setMostrarCrear(true)}
                style={{ padding: '11px 20px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg, ${BLUE}, ${BLUE_2})`, color: '#fff', fontSize: '13.5px', fontWeight: 700, fontFamily: FONT, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                + Nuevo proyecto
              </button>
            </div>

            {proyectosError && (
              <div style={{ marginBottom: '14px', fontSize: '12.5px', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '9px 14px', fontFamily: FONT_BODY }}>
                {proyectosError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))', gap: '14px' }}>
              {proyectosGuardados.map(p => {
                const editando = renombrandoId === p.id
                const confirmando = confirmarBorrarId === p.id
                const ocupado = proyectoOcupadoId === p.id
                return (
                  <div
                    key={p.id}
                    className="pm-proy-card"
                    onClick={e => {
                      if (editando || confirmando) return
                      if ((e.target as HTMLElement).closest('a,button,input')) return
                      window.location.href = `/pulse/databridge/panel/${p.id}`
                    }}
                    style={{ background: '#ffffff', border: '1px solid #e3e8f0', borderRadius: '14px', padding: '16px 16px 12px', cursor: editando || confirmando ? 'default' : 'pointer', opacity: ocupado ? 0.55 : 1 }}
                  >
                    {editando ? (
                      <input
                        autoFocus
                        value={nombreEditado}
                        onChange={e => setNombreEditado(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') guardarNombreProyecto(p.id)
                          if (e.key === 'Escape') setRenombrandoId(null)
                        }}
                        onBlur={() => guardarNombreProyecto(p.id)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '6px 9px', borderRadius: '8px', border: `1px solid ${BLUE}`, fontSize: '14.5px', fontWeight: 700, fontFamily: FONT, color: '#0f172a', outline: 'none', marginBottom: '6px' }}
                      />
                    ) : (
                      <a
                        href={`/pulse/databridge/panel/${p.id}`}
                        style={{ display: 'block', fontSize: '14.5px', fontWeight: 700, fontFamily: FONT, color: '#0f172a', textDecoration: 'none', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {p.nombre}
                      </a>
                    )}

                    <div style={{ fontSize: '12px', color: '#64748b', fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', border: '1px solid #e3e8f0', borderRadius: '999px', padding: '2px 9px', fontWeight: 600, color: '#334155' }}>
                        {p.tablas} {p.tablas === 1 ? 'tabla' : 'tablas'}
                      </span>
                      <span>{fechaCorta(p.created_at)}</span>
                    </div>

                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #eef2f7', minHeight: '26px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {confirmando ? (
                        <>
                          <span style={{ fontSize: '12px', color: '#0f172a', fontFamily: FONT_BODY, whiteSpace: 'nowrap' }}>¿Borrar?</span>
                          <button
                            onClick={() => borrarProyecto(p.id)}
                            disabled={ocupado}
                            style={{ fontSize: '12px', fontWeight: 700, fontFamily: FONT_BODY, color: '#fff', background: '#dc2626', border: 'none', borderRadius: '7px', padding: '4px 11px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Sí, borrar
                          </button>
                          <button
                            onClick={() => setConfirmarBorrarId(null)}
                            style={{ fontSize: '12px', fontFamily: FONT_BODY, color: '#64748b', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <div className="pm-proy-accion" style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => { setProyectosError(null); setNombreEditado(p.nombre); setRenombrandoId(p.id) }}
                            style={{ fontSize: '12px', fontFamily: FONT_BODY, color: '#475569', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                          >
                            Renombrar
                          </button>
                          <button
                            onClick={() => { setProyectosError(null); setConfirmarBorrarId(p.id) }}
                            style={{ fontSize: '12px', fontFamily: FONT_BODY, color: '#94a3b8', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                          >
                            Borrar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : phase === 'upload' ? (
          <div style={{ textAlign: 'center', padding: '28px 0 0' }}>
            <style>{`
              @keyframes pmPromptPulse {
                0%, 100% { box-shadow: 0 6px 28px rgba(15,23,42,0.07), 0 0 0 0 rgba(37,99,235,0.35); border-color: #2563EB; }
                50%      { box-shadow: 0 6px 28px rgba(15,23,42,0.07), 0 0 0 9px rgba(37,99,235,0); border-color: #dbe3ef; }
              }
              .pm-prompt-box.is-empty { animation: pmPromptPulse 2.2s ease-in-out infinite; }
              .pm-fuente-btn { transition: transform .15s ease, border-color .15s ease; }
              .pm-fuente-btn:hover { transform: translateY(-2px); }
              @media (prefers-reduced-motion: reduce) {
                .pm-prompt-box.is-empty { animation: none; border-color: #2563EB; }
                .pm-fuente-btn { transition: none; }
              }
            `}</style>

            {/* Salida de vuelta al índice: si llegó acá desde "Nuevo proyecto", tiene que poder
                volverse sin depender del botón Atrás del navegador. */}
            {mostrarCrear && proyectosGuardados.length > 0 && (
              <div style={{ textAlign: 'left', marginBottom: '10px' }}>
                <button
                  onClick={() => setMostrarCrear(false)}
                  style={{ fontSize: '13px', fontFamily: FONT_BODY, color: '#64748b', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  ← Volver a tus proyectos
                </button>
              </div>
            )}

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.22)', borderRadius: '999px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '18px', fontFamily: FONT_BODY }}>
              DataBridge 360
            </div>
            <h1 style={{ fontFamily: FONT, fontSize: 'clamp(34px,5.5vw,62px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.02, margin: '0 0 14px', color: '#0f172a' }}>
              ¿Qué datos vamos a <span style={{ color: BLUE }}>ordenar</span>?
            </h1>
            <p style={{ fontSize: '15.5px', color: '#64748b', lineHeight: 1.6, margin: '0 auto 26px', fontFamily: FONT_BODY, maxWidth: '62ch' }}>
              Planillas sueltas, exportaciones del DMS que nunca cruzaron, el mismo campo con un nombre distinto en cada hoja. Subilas todas juntas y salen como un modelo de datos con sus relaciones.
            </p>

            {authChecked && (
              <>
                {/* Caja principal: nombre del proyecto + adjuntar, y toda ella es zona de
                    arrastre — no hace falta apuntarle a un dropzone aparte. */}
                <div
                  className={`pm-prompt-box${projectName.trim() ? '' : ' is-empty'}`}
                  onDragEnter={onDropZoneDragEnter}
                  onDragOver={onDropZoneDragOver}
                  onDragLeave={onDropZoneDragLeave}
                  onDrop={onDropZoneDrop}
                  style={{
                    position: 'relative', zIndex: 150,
                    maxWidth: '720px', margin: '0 auto', textAlign: 'left',
                    background: '#ffffff', borderRadius: '20px', padding: '18px 18px 14px',
                    border: `1px solid ${projectNameError ? '#ef4444' : isDraggingFile ? BLUE : '#dbe3ef'}`,
                    boxShadow: '0 6px 28px rgba(15,23,42,0.07)',
                  }}
                >
                  {isDraggingFile && (
                    <div style={{ position: 'absolute', inset: '6px', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(37,99,235,0.07)', border: `2px dashed ${BLUE}`, borderRadius: '16px', pointerEvents: 'none' }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', fontFamily: FONT }}>Soltá para cargar</div>
                      <div style={{ fontSize: '12px', color: BLUE, fontFamily: FONT_BODY }}>Excel · CSV · JSON</div>
                    </div>
                  )}
                  <input
                    ref={projectNameInputRef}
                    value={projectName}
                    onChange={e => { setProjectName(e.target.value); if (projectNameError) setProjectNameError(false) }}
                    onFocus={() => setProjectNameFocused(true)}
                    onBlur={() => setProjectNameFocused(false)}
                    onKeyDown={e => { if (e.key === 'Enter' && projectName.trim()) fileInputRef.current?.click() }}
                    placeholder="Nombrá tu proyecto — ej: Inventario y matrículas de julio"
                    required
                    aria-required="true"
                    aria-label="Nombre del proyecto"
                    aria-invalid={projectNameError}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 4px 14px', border: 'none', background: 'transparent', color: '#0f172a', fontSize: '17px', fontFamily: FONT_BODY, outline: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => { if (requireProjectName()) fileInputRef.current?.click() }}
                      title="Adjuntar archivos"
                      style={{ width: '32px', height: '32px', borderRadius: '10px', border: '1px solid #dbe3ef', background: '#ffffff', color: '#334155', fontSize: '18px', lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}
                    >
                      +
                    </button>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: FONT_BODY }}>
                      Arrastrá tus archivos acá · Excel, CSV o JSON · varias fuentes juntas
                    </span>
                    <button
                      onClick={() => { if (requireProjectName()) fileInputRef.current?.click() }}
                      title="Elegir archivos"
                      style={{ marginLeft: 'auto', width: '38px', height: '38px', borderRadius: '50%', border: 'none', background: `linear-gradient(135deg, ${BLUE}, ${BLUE_2})`, color: '#fff', fontSize: '16px', cursor: 'pointer', flexShrink: 0 }}
                    >
                      →
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.csv,.json" multiple style={{ display: 'none' }} onChange={onFileInputChange} />
                </div>

                {projectNameError && (
                  <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', fontFamily: FONT_BODY }}>
                    Ponele un nombre al proyecto antes de subir los archivos.
                  </div>
                )}

                {/* Fuentes que sabe cruzar — clic prellena el nombre y abre el selector. */}
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '26px' }}>
                  {FUENTES.map(f => (
                    <button
                      key={f.label}
                      onClick={() => elegirFuente(f.label)}
                      className="pm-fuente-btn"
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 6px' }}
                    >
                      <span style={{
                        width: '46px', height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', color: f.color, background: `${f.color}12`, border: `1px solid ${f.color}33`,
                      }}>{f.icon}</span>
                      <span style={{ fontSize: '11.5px', color: '#475569', fontFamily: FONT_BODY }}>{f.label}</span>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: FONT_BODY }}>o probá con datos de ejemplo</span>
                  {EJEMPLOS.map(e => (
                    <button
                      key={e}
                      onClick={() => startDemo(e)}
                      style={{ fontSize: '12px', fontFamily: FONT_BODY, color: '#334155', background: '#ffffff', border: '1px solid #dbe3ef', borderRadius: '999px', padding: '6px 14px', cursor: 'pointer' }}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                {!user && anonProjects.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#64748b', fontFamily: FONT_BODY, marginTop: '18px' }}>
                    Ya creaste {anonProjects.length} {anonProjects.length === 1 ? 'proyecto de prueba' : 'proyectos de prueba'} sin cuenta —{' '}
                    <button onClick={irACrearCuenta} style={{ color: BLUE, textDecoration: 'underline', background: 'transparent', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>creá tu cuenta para guardarlos →</button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.22)', borderRadius: '999px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px', fontFamily: FONT_BODY }}>
              DataBridge 360
            </div>
            <h1 style={{ fontFamily: FONT, fontSize: 'clamp(24px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 10px', color: '#0f172a' }}>
              {projectName.trim() || 'Tu proyecto'} — <span style={{ color: BLUE }}>estructura detectada</span>
            </h1>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, margin: 0, fontFamily: FONT_BODY }}>
              Cada hoja, sus campos y el tipo de dato de cada uno — conectados con líneas punteadas a su tabla de origen.
            </p>
          </div>
        )}

        {/* Stepper y navegación — solo cuando ya hay datos cargados: en el estado inicial la
            pantalla es una sola pregunta, sin pasos por delante todavía. */}
        {phase !== 'upload' && (<>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', marginTop: '24px' }}>
          {STEPS.map((s, i) => {
            const isDone = i < stepIndex
            const isCurrent = i === stepIndex
            const reachable = canReachStep(s.key)
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : '0 0 auto' }}>
                <button
                  onClick={() => reachable && setStep(s.key)}
                  disabled={!reachable}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', padding: '4px 0', cursor: reachable ? 'pointer' : 'default', fontFamily: FONT_BODY, whiteSpace: 'nowrap' }}
                >
                  <span style={{
                    width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, flexShrink: 0,
                    background: isDone ? 'rgba(16,185,129,0.15)' : isCurrent ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : '#f1f5f9',
                    color: isDone ? '#10b981' : isCurrent ? '#fff' : '#94a3b8',
                    border: isDone ? '1px solid rgba(16,185,129,0.4)' : isCurrent ? 'none' : '1px solid #d9dadc',
                  }}>
                    {isDone ? '✓' : i + 1}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#0f172a' : '#94a3b8' }}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: '1px', background: isDone ? 'rgba(16,185,129,0.3)' : '#e2e8f0', margin: '0 12px', minWidth: '16px' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Navegación entre pasos — arriba, espejo de la de abajo, para no tener que
            bajar toda la pantalla (el visualizador puede ser largo) solo para avanzar. */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button
            onClick={() => canGoBack && setStep(STEPS[stepIndex - 1].key)}
            disabled={!canGoBack}
            style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #d9dadc', background: 'transparent', color: canGoBack ? '#334155' : '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: canGoBack ? 'pointer' : 'default', fontFamily: FONT_BODY }}
          >
            ← Atrás
          </button>
          {stepIndex < STEPS.length - 1 ? (
            <button
              onClick={() => canGoNext && setStep(STEPS[stepIndex + 1].key)}
              disabled={!canGoNext}
              style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: canGoNext ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : '#e2e8f0', color: canGoNext ? '#fff' : '#475569', fontSize: '13px', fontWeight: 700, cursor: canGoNext ? 'pointer' : 'default', fontFamily: FONT }}
            >
              Avanzar →
            </button>
          ) : (
            <button
              onClick={() => { if (user) { window.location.href = '/pulse/dashboard' } else { irACrearCuenta() } }}
              style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#fff', fontSize: '13px', fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}
            >
              {user ? 'Ir al dashboard →' : 'Crear cuenta gratis →'}
            </button>
          )}
        </div>
        </>)}

        {phase === 'upload' && !vistaProyectos && (
          <>
            <DataBridgeOrden />
            <DataBridgePrototipos />
          </>
        )}

        <div style={{ position: 'relative' }}>
        <div style={{
          ...(fullscreen ? {
            position: 'fixed', inset: 0, zIndex: 200, background: '#080f1a',
            padding: '18px 20px', display: 'flex', gap: '20px', alignItems: 'stretch',
          } : {
            display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap',
          }),
        }}>
        {/* Visualizador */}
        {(step === 'subir' || step === 'mapear') && phase !== 'upload' && (
        <div style={fullscreen ? { flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column' } : { flex: '1 1 600px', minWidth: 0 }}>
        <div style={fullscreen ? {
          flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
        } : {
          background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '20px', padding: '20px', marginBottom: '20px',
        }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: FONT_BODY }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Mapa de campos</span>
              <span style={{ fontSize: '11px', color: phase === 'ready' ? '#10b981' : '#64748b', background: phase === 'ready' ? 'rgba(16,185,129,0.1)' : '#f1f5f9', border: `1px solid ${phase === 'ready' ? 'rgba(16,185,129,0.3)' : '#d9dadc'}`, borderRadius: '999px', padding: '2px 10px', fontWeight: 600 }}>
                {phase === 'processing' ? 'Procesando...' : phase === 'selecting' ? 'Elegí las hojas' : `${nodes.filter(n => n.kind === 'field').length} campos · ${nodes.filter(n => n.kind === 'table').length} tablas`}
              </span>
              {phase === 'ready' && focusedRelation && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#0284c7', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: '999px', padding: '2px 6px 2px 10px', fontWeight: 600 }}>
                  Solo relación: {focusedRelation.a} ↔ {focusedRelation.b}
                  <button onClick={() => setFocusedRelation(null)} title="Ver todo" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '13px', padding: '2px 4px', lineHeight: 1 }}>✕</button>
                </span>
              )}
            </div>
            {phase === 'ready' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['3d', 'top'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: view === v ? '1px solid rgba(14,165,233,0.4)' : '1px solid #d9dadc', background: view === v ? 'rgba(14,165,233,0.08)' : 'transparent', color: view === v ? '#0284c7' : '#64748b', fontWeight: view === v ? 600 : 400 }}>
                    {v === '3d' ? '3D' : 'Top'}
                  </button>
                ))}
                <div style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 2px' }} />
                {(['rotate', 'pan'] as const).map(m => (
                  <button key={m} onClick={() => setDragMode(m)} title={m === 'rotate' ? 'Arrastrar para rotar' : 'Arrastrar para mover'} style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: dragMode === m ? '1px solid rgba(14,165,233,0.4)' : '1px solid #d9dadc', background: dragMode === m ? 'rgba(14,165,233,0.08)' : 'transparent', color: dragMode === m ? '#0284c7' : '#64748b' }}>
                    {m === 'rotate' ? '⟳' : '🖐'}
                  </button>
                ))}
                <button onClick={() => { camRef.current = { rx: -25, ry: 30 }; panRef.current = { x: 0, y: 0 }; zoomRef.current = 1; interactedRef.current = false; setView('3d'); draw() }} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: '1px solid #d9dadc', background: 'transparent', color: '#64748b' }}>↺</button>
                <div style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 2px' }} />
                <button onClick={() => uploadMoreRef.current?.click()} title="Subir otro archivo" style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: '1px solid rgba(37,99,235,0.4)', background: 'rgba(37,99,235,0.1)', color: '#1D4ED8' }}>⬆ Subir otro</button>
                <input ref={uploadMoreRef} type="file" accept=".xlsx,.csv,.json" multiple style={{ display: 'none' }} onChange={onFileInputChange} />
                <button onClick={() => setFullscreen(f => !f)} title={fullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: '1px solid #d9dadc', background: 'transparent', color: '#64748b' }}>
                  {fullscreen ? '✕' : '⛶'}
                </button>
              </div>
            )}
          </div>

          {/* Canvas area */}
          <div
            style={{ position: 'relative', width: '100%', height: fullscreen ? '100%' : '400px', flex: fullscreen ? 1 : undefined, minHeight: 0, background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '14px', overflow: 'hidden', cursor: phase === 'ready' ? 'grab' : 'default' }}
            onMouseMove={onMouseMove}
            onMouseDown={e => { if (phase !== 'ready') return; interactedRef.current = true; const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); const sx = e.clientX - rect.left; const sy = e.clientY - rect.top; dragRef.current = { on: true, x: sx, y: sy }; clickStartRef.current = { x: sx, y: sy } }}
            onMouseUp={e => {
              dragRef.current.on = false
              if (phase !== 'ready' || !canvasRef.current) return
              const rect = canvasRef.current.getBoundingClientRect()
              const mx = e.clientX - rect.left; const my = e.clientY - rect.top
              const moved = (mx - clickStartRef.current.x) ** 2 + (my - clickStartRef.current.y) ** 2
              if (moved > 16) return
              const W = rect.width; const H = rect.height
              const dimScale = fitScaleRef.current * zoomRef.current
              const visibleTableIds = visibleTableIdsFor(nodesRef.current, focusedRelation)
              const hit = nodesRef.current.find(n => {
                if (n.kind !== 'table') return false
                if (visibleTableIds && !visibleTableIds.has(n.id)) return false
                const p = project(n.x, n.y, n.z, W, H)
                const s = view === '3d' ? (800 / (800 + (p.depth ?? 0) + 300)) : 1
                const dx = mx - p.px!; const dy = my - p.py!
                return dx * dx + dy * dy < (n.r * s * dimScale + 8) ** 2
              })
              if (!hit) return
              setExpandedTables(prev => {
                const next = new Set(prev)
                if (next.has(hit.table)) next.delete(hit.table); else next.add(hit.table)
                return next
              })
            }}
            onMouseLeave={() => { dragRef.current.on = false; hoverRef.current = null; setTooltip(null); draw() }}
            onWheel={e => { if (phase !== 'ready') return; e.preventDefault(); interactedRef.current = true; zoomRef.current = Math.min(3, Math.max(0.35, zoomRef.current - e.deltaY * 0.001)); draw() }}
            onDragEnter={onDropZoneDragEnter}
            onDragOver={onDropZoneDragOver}
            onDragLeave={onDropZoneDragLeave}
            onDrop={onDropZoneDrop}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(37,99,235,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(37,99,235,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />

            {/* Overlay de arrastrar y soltar */}
            {isDraggingFile && (
              <div style={{ position: 'absolute', inset: '8px', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(37,99,235,0.1)', border: '2px dashed rgba(37,99,235,0.6)', borderRadius: '12px', pointerEvents: 'none' }}>
                <div style={{ fontSize: '28px' }}>⬇</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: FONT }}>Soltá para cargar</div>
                <div style={{ fontSize: '12px', color: '#2563EB', fontFamily: FONT }}>Excel · CSV · JSON</div>
              </div>
            )}

            {/* Processing state */}
            {phase === 'processing' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 6 }}>
                <div style={{ fontSize: '32px' }}>🔍</div>
                <div style={{ fontSize: '13px', color: '#475569', fontFamily: FONT_BODY }}>{progLabel}</div>
                <div style={{ width: '200px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progPct}%`, background: 'linear-gradient(90deg,#2563EB,#1D4ED8)', borderRadius: '2px', transition: 'width .1s' }} />
                </div>
                <div style={{ fontSize: '12px', color: '#334155', fontFamily: FONT_BODY }}>{progPct}%</div>
              </div>
            )}

            {/* Selección de hojas */}
            {phase === 'selecting' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', zIndex: 7, padding: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: FONT }}>¿Qué hojas querés importar?</div>
                <div style={{ fontSize: '12px', color: '#475569', fontFamily: FONT_BODY }}>
                  Encontramos {pendingSheets.length} hojas — elegí cuáles cruzar
                </div>
                <div style={{ width: '100%', maxWidth: '420px', maxHeight: '220px', overflowY: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '6px' }}>
                  {pendingSheets.map(s => (
                    <label key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY }}>
                      <input type="checkbox" checked={selectedSheetNames.has(s.name)} onChange={() => toggleSheetSelected(s.name)} />
                      <span style={{ fontSize: '13px', color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                      <span style={{ fontSize: '11px', color: '#475569', flexShrink: 0 }}>{s.rows.length} filas</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                  <button onClick={() => setSelectedSheetNames(new Set(pendingSheets.map(s => s.name)))} style={{ background: 'transparent', border: 'none', color: '#2563EB', cursor: 'pointer', fontFamily: FONT_BODY, textDecoration: 'underline' }}>Todas</button>
                  <button onClick={() => setSelectedSheetNames(new Set())} style={{ background: 'transparent', border: 'none', color: '#2563EB', cursor: 'pointer', fontFamily: FONT_BODY, textDecoration: 'underline' }}>Ninguna</button>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button onClick={cancelSheetSelection} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #d9dadc', background: 'transparent', color: '#64748b', fontSize: '13px', cursor: 'pointer', fontFamily: FONT_BODY }}>Cancelar</button>
                  <button onClick={confirmSheetSelection} disabled={selectedSheetNames.size === 0} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: selectedSheetNames.size === 0 ? '#e2e8f0' : 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: selectedSheetNames.size === 0 ? '#94a3b8' : '#fff', fontSize: '13px', fontWeight: 700, cursor: selectedSheetNames.size === 0 ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
                    Continuar ({selectedSheetNames.size}) →
                  </button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

            {/* Tooltip */}
            {tooltip && (
              <div style={{ position: 'absolute', left: tooltip.x, top: tooltip.y, background: 'rgba(13,27,46,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', pointerEvents: 'none', fontFamily: FONT_BODY, lineHeight: 1.6, zIndex: 10, maxWidth: '260px', maxHeight: '320px', overflow: 'hidden' }}>
                {tooltip.node.kind === 'field' && (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>{tooltip.node.table}.{tooltip.node.l}</div>
                    <div style={{ color: tooltip.node.color }}>Tipo: {tooltip.node.tipo}</div>
                    {tooltip.node.isHub && <div style={{ color: '#475569', marginTop: '2px' }}>Aparece en varias hojas</div>}
                  </>
                )}
                {tooltip.node.kind === 'table' && (() => {
                  const fields = fieldsOfTable(tooltip.node.table)
                  const expanded = expandedTables.has(tooltip.node.table)
                  return (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: '2px' }}>{tooltip.node.l}</div>
                      <div style={{ color: tooltip.node.color }}>Tabla / hoja · {fields.length} campos</div>
                      <div style={{ color: '#7dd3fc', marginTop: '2px' }}>Clic para {expanded ? 'contraer' : 'expandir'}</div>
                      <div style={{ color: '#94a3b8', marginTop: '4px', fontSize: '11px', lineHeight: 1.5 }}>
                        {fields.slice(0, 16).map((f, i) => <div key={i}>· {f.l} <span style={{ color: '#475569' }}>({f.tipo})</span></div>)}
                        {fields.length > 16 && <div style={{ color: '#475569' }}>+{fields.length - 16} más</div>}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            {/* Hint */}
            {phase === 'ready' && (
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '11px', color: '#334155', fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: '4px' }}>
                clic en una tabla para expandir · {dragMode === 'rotate' ? 'arrastrá para rotar' : 'arrastrá para mover'}
              </div>
            )}
          </div>

          {/* Leyenda */}
          {legendEntries.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '14px', flexShrink: 0 }}>
              {legendEntries.map(([label, c]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontFamily: FONT_BODY }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
        )}

        {/* Esquema de relaciones 2D */}
        {step === 'relaciones' && (
        <div style={schemaFullscreen ? {
          position: 'fixed', inset: 0, zIndex: 200, background: '#0B0D0C',
          padding: '20px 24px', overflowY: 'auto',
        } : { flex: schemaViewMode === 'tables' ? '1 1 520px' : (fullscreen ? '0 0 320px' : '0 1 300px'), minWidth: schemaViewMode === 'tables' ? '380px' : '260px', background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '20px', padding: '20px', overflowY: fullscreen ? 'auto' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', fontFamily: FONT_BODY, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Esquema de relaciones</span>
            <span style={{ fontSize: '11px', color: tableRelations.length ? '#10b981' : '#64748b', background: tableRelations.length ? 'rgba(16,185,129,0.1)' : '#f1f5f9', border: `1px solid ${tableRelations.length ? 'rgba(16,185,129,0.3)' : '#d9dadc'}`, borderRadius: '999px', padding: '2px 10px', fontWeight: 600 }}>
              {tableRelations.length} {tableRelations.length === 1 ? 'relación' : 'relaciones'}
            </span>
            {phase === 'ready' && (
              <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                {(['radial', 'tables'] as const).map(v => (
                  <button key={v} onClick={() => setSchemaViewMode(v)} title={v === 'radial' ? 'Vista compacta' : 'Vista de tablas (estilo Supabase)'} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: schemaViewMode === v ? '1px solid rgba(14,165,233,0.4)' : '1px solid #d9dadc', background: schemaViewMode === v ? 'rgba(14,165,233,0.08)' : 'transparent', color: schemaViewMode === v ? '#0284c7' : '#64748b', fontWeight: schemaViewMode === v ? 600 : 400 }}>
                    {v === 'radial' ? '◎ Radial' : '▦ Tablas'}
                  </button>
                ))}
                <div style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 2px' }} />
                <button onClick={() => setSchemaFullscreen(f => !f)} title={schemaFullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: '1px solid #d9dadc', background: 'transparent', color: '#64748b' }}>
                  {schemaFullscreen ? '✕' : '⛶'}
                </button>
              </div>
            )}
          </div>

          {phase === 'ready' && tableRelations.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', fontSize: '10px', color: '#94a3b8', fontFamily: FONT_BODY }}>
              <span>Color del vector = probabilidad de mismo valor</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '14px', height: '3px', borderRadius: '2px', background: colorForScore(0.1, 1) }} />baja</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '14px', height: '3px', borderRadius: '2px', background: colorForScore(0.5, 1) }} />media</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '14px', height: '3px', borderRadius: '2px', background: colorForScore(1, 1) }} />alta</span>
            </div>
          )}

          {phase !== 'ready' ? (
            <div style={{ fontSize: '12px', color: '#475569', fontFamily: FONT_BODY }}>Subí tus hojas para ver el esquema.</div>
          ) : (
            <>
              {schemaViewMode === 'tables' ? (
                <div style={{ overflow: 'auto', maxHeight: schemaFullscreen ? 'calc(100vh - 220px)' : '380px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                  {(() => {
                    const boxes = schemaTables.map((t, i) => {
                      const fields = fieldsOfTable(t.table)
                      const pos = getTablePos(t.id, i)
                      const height = 34 + fields.length * 26
                      return { t, i, fields, pos, height }
                    })
                    const containerW = Math.max(400, ...boxes.map(b => b.pos.x + ER_TABLE_WIDTH)) + 20
                    const containerH = Math.max(200, ...boxes.map(b => b.pos.y + b.height)) + 20
                    return (
                  <div ref={erContentRef} style={{ position: 'relative', width: `${containerW}px`, height: `${containerH}px` }}>
                    {boxes.map(({ t, i, fields, pos }) => (
                        <div key={t.id} style={{ position: 'absolute', left: `${pos.x}px`, top: `${pos.y}px`, width: `${ER_TABLE_WIDTH}px`, background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '10px', overflow: 'hidden' }}>
                          <div
                            onMouseDown={onTableHeaderMouseDown(t.id, i)}
                            onClick={() => { if (erJustDraggedRef.current) { erJustDraggedRef.current = false; return }; setSchemaHover({ type: 'table', table: t.table }) }}
                            title="Arrastrá para mover la tabla"
                            style={{ background: t.color, color: 'rgba(0,0,0,0.82)', fontWeight: 700, fontSize: '12px', padding: '8px 10px', fontFamily: FONT_BODY, cursor: 'grab', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', userSelect: 'none' }}>
                            {t.table}
                          </div>
                          <div>
                            {fields.map((f, fi) => {
                              const key = `${t.table}::${f.l}`
                              const related = relatedFieldKeys.has(key)
                              return (
                                <div key={fi} ref={setErFieldRef(key)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', fontSize: '11px', fontFamily: FONT_BODY, borderTop: fi === 0 ? 'none' : '1px solid #f1f5f9', background: related ? 'rgba(52,211,153,0.07)' : 'transparent' }}>
                                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: related ? '#10b981' : '#d9dadc', flexShrink: 0 }} />
                                  <span style={{ color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.l}</span>
                                  <span style={{ color: '#64748b', flexShrink: 0, fontSize: '10px' }}>{f.tipo}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                    ))}
                    <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }} width="100%" height="100%">
                      {(() => {
                        const isActive = (l: typeof erLines[number]) => focusedRelation === l.rel || (schemaHover?.type === 'relation' && schemaHover.rel === l.rel)
                        const hasActive = erLines.some(isActive)
                        const renderLine = (l: typeof erLines[number]) => {
                          const active = isActive(l)
                          const isFocused = focusedRelation === l.rel
                          const dx = Math.max(24, Math.abs(l.x2 - l.x1) * 0.5)
                          const path = `M ${l.x1} ${l.y1} C ${l.x1 + dx} ${l.y1}, ${l.x2 - dx} ${l.y2}, ${l.x2} ${l.y2}`
                          const alpha = active ? 0.95 : hasActive ? 0.15 : 0.6
                          return (
                            <path key={l.key} d={path} fill="none"
                              stroke={colorForScore(l.match.score, alpha)}
                              strokeWidth={active ? 2.4 : 1.3}
                              strokeDasharray={isFocused ? undefined : '4 3'}
                              style={{ cursor: 'pointer', pointerEvents: 'stroke', filter: active ? `drop-shadow(0 0 4px ${colorForScore(l.match.score, 0.5)})` : undefined }}
                              onMouseEnter={() => setSchemaHover({ type: 'relation', rel: l.rel })}
                              onMouseLeave={() => setSchemaHover(null)}
                              onClick={() => setFocusedRelation(prev => prev === l.rel ? null : l.rel)}
                            />
                          )
                        }
                        // Las relaciones activas (foco o hover) se dibujan al final para quedar
                        // en primer plano por encima del resto, con brillo para destacarlas.
                        return <>{erLines.filter(l => !isActive(l)).map(renderLine)}{erLines.filter(isActive).map(renderLine)}</>
                      })()}
                    </svg>
                  </div>
                    )
                  })()}
                </div>
              ) : (
              <svg viewBox="0 0 280 280" style={{ width: '100%', maxWidth: schemaFullscreen ? '480px' : undefined, height: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'block', margin: schemaFullscreen ? '0 auto' : undefined }}>
                {(() => {
                  const isActive = (r: TableRelation) => focusedRelation === r || (schemaHover?.type === 'relation' && schemaHover.rel === r)
                  const hasActive = tableRelations.some(isActive)
                  const renderRel = (r: TableRelation, i: number) => {
                    const p1 = schemaPositions.get(r.a); const p2 = schemaPositions.get(r.b)
                    if (!p1 || !p2) return null
                    const strength = Math.min(1, r.matches.length / 3)
                    const bestScore = Math.max(0, ...r.matches.map(m => m.score))
                    const active = isActive(r)
                    const alpha = active ? 0.95 : hasActive ? 0.15 : 0.65
                    return (
                      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                        stroke={colorForScore(bestScore, alpha)}
                        strokeWidth={(active ? 2 : 1) + strength * 1.5}
                        strokeDasharray="4 3"
                        onMouseEnter={() => setSchemaHover({ type: 'relation', rel: r })}
                        onMouseLeave={() => setSchemaHover(null)}
                        onClick={() => setFocusedRelation(prev => prev === r ? null : r)}
                        style={{ cursor: 'pointer', filter: active ? `drop-shadow(0 0 3px ${colorForScore(bestScore, 0.55)})` : undefined }}
                      />
                    )
                  }
                  // Igual que en la vista de tablas: la relación activa se dibuja al final
                  // (primer plano) y las demás se atenúan para que resalte.
                  return <>
                    {tableRelations.map((r, i) => !isActive(r) ? renderRel(r, i) : null)}
                    {tableRelations.map((r, i) => isActive(r) ? renderRel(r, i) : null)}
                  </>
                })()}
                {schemaTables.map(t => {
                  const p = schemaPositions.get(t.table)!
                  return (
                    <g key={t.id} onMouseEnter={() => setSchemaHover({ type: 'table', table: t.table })} onMouseLeave={() => setSchemaHover(null)} style={{ cursor: 'pointer' }}>
                      <circle cx={p.x} cy={p.y} r={20} fill={t.color} />
                      <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" fill="rgba(0,0,0,0.8)">{t.table.slice(0, 3).toUpperCase()}</text>
                      <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize="9" fill="#64748b">{t.table.length > 14 ? t.table.slice(0, 12) + '…' : t.table}</text>
                    </g>
                  )
                })}
              </svg>
              )}

              <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', fontFamily: FONT_BODY, lineHeight: 1.6, minHeight: '60px' }}>
                {!displayInfo && (tableRelations.length === 0
                  ? 'No se detectaron relaciones entre tablas.'
                  : 'Pasá el mouse sobre una tabla o línea para ver el detalle · hacé clic en una línea para verla en el mapa 3D.')}
                {displayInfo?.type === 'table' && (() => {
                  const related = tableRelations.filter(r => r.a === displayInfo.table || r.b === displayInfo.table)
                  return (
                    <>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>{displayInfo.table}</div>
                      {related.length === 0
                        ? <div>Sin relaciones con otras tablas.</div>
                        : related.map((r, i) => (
                            <div key={i}>↔ {r.a === displayInfo.table ? r.b : r.a} ({r.matches.length} campo{r.matches.length !== 1 ? 's' : ''})</div>
                          ))}
                    </>
                  )
                })()}
                {displayInfo?.type === 'relation' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{displayInfo.rel.a} ↔ {displayInfo.rel.b}</div>
                      {focusedRelation === displayInfo.rel && <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '999px', padding: '1px 8px', fontWeight: 600 }}>en el mapa 3D</span>}
                    </div>
                    {displayInfo.rel.matches.map((m, i) => (
                      <div key={i}>{m.fieldA} ↔ {m.fieldB} <span style={{ color: '#94a3b8' }}>({m.label})</span></div>
                    ))}
                    <button onClick={() => setFocusedRelation(prev => prev === displayInfo.rel ? null : displayInfo.rel)} style={{ marginTop: '6px', background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: '11px', textDecoration: 'underline', padding: 0 }}>
                      {focusedRelation === displayInfo.rel ? 'Ver todo en el mapa 3D' : 'Ver solo estos campos en el mapa 3D →'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        )}

        {/* Chat para evaluar relaciones a fondo con IA — el matching automático se pierde
            cruces reales cuando los nombres de campo difieren mucho entre hojas. */}
        {step === 'relaciones' && (
        <div style={{ flex: '1 1 100%', background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', fontFamily: FONT_BODY }}>Evaluar una relación a fondo</span>
            <span style={{ fontSize: '10px', color: '#2563EB', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '999px', padding: '1px 8px', fontWeight: 600 }}>IA</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontFamily: FONT_BODY, marginBottom: '14px' }}>
            {loadedSheets.length < 2
              ? 'Necesitás al menos 2 hojas cargadas para cruzar relaciones.'
              : 'Decile qué campos sospechás que están relacionados aunque el nombre no coincida — Claude revisa los valores reales de ambas hojas.'}
          </div>

          {relacionChat.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px', maxHeight: '280px', overflowY: 'auto' }}>
              {relacionChat.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    fontSize: '12.5px', lineHeight: 1.5, fontFamily: FONT_BODY, padding: '9px 12px', borderRadius: '10px',
                    background: m.role === 'user' ? 'rgba(37,99,235,0.1)' : '#f8fafc',
                    border: `1px solid ${m.role === 'user' ? 'rgba(37,99,235,0.3)' : '#e2e8f0'}`,
                    color: '#0f172a',
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {relacionLoading && (
                <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#94a3b8', fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
                    border: '2px solid #e2e8f0', borderTopColor: '#2563EB', animation: 'pmRelSpin 0.7s linear infinite',
                  }} />
                  Evaluando…
                </div>
              )}
            </div>
          )}
          <style>{`@keyframes pmRelSpin { to { transform: rotate(360deg); } } @media (prefers-reduced-motion: reduce) { [style*="pmRelSpin"] { animation: none; } }`}</style>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={relacionInput}
              onChange={e => setRelacionInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); evaluarRelacion() } }}
              disabled={loadedSheets.length < 2 || relacionLoading}
              placeholder='Ej: "Vend en Pedidos debería ser el mismo asesor que ASESOR en Asignaciones"'
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #d9dadc', background: loadedSheets.length < 2 ? '#f1f5f9' : '#ffffff', color: '#0f172a', fontSize: '13px', fontFamily: FONT_BODY, outline: 'none' }}
            />
            <button
              onClick={evaluarRelacion}
              disabled={!relacionInput.trim() || loadedSheets.length < 2 || relacionLoading}
              style={{
                padding: '10px 18px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 700, fontFamily: FONT, whiteSpace: 'nowrap',
                cursor: (!relacionInput.trim() || loadedSheets.length < 2 || relacionLoading) ? 'default' : 'pointer',
                background: (!relacionInput.trim() || loadedSheets.length < 2 || relacionLoading) ? '#e2e8f0' : 'linear-gradient(135deg,#2563EB,#1D4ED8)',
                color: (!relacionInput.trim() || loadedSheets.length < 2 || relacionLoading) ? '#94a3b8' : '#ffffff',
              }}
            >
              Evaluar →
            </button>
          </div>
        </div>
        )}

        {/* Prototipo — ruta de producto del marco estratégico v2: no solo "detectamos tu
            esquema", sino "esto es lo que se puede construir con él, y hacia dónde escala". */}
        {step === 'prototipo' && (
        <div style={{ flex: '1 1 600px', minWidth: 0, background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '7px', flexShrink: 0, fontSize: '11px',
                  background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                }}>✨</div>
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#1D4ED8' }}>
                  Generado por IA a partir de tu esquema
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-geist-sans), sans-serif', fontSize: 'clamp(20px,2.6vw,26px)', fontWeight: 550, letterSpacing: '-0.02em', lineHeight: 1.18, color: '#0f172a', marginBottom: '10px' }}>
                Tu panel, armado solo — sin escribir una línea
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, maxWidth: '58ch', marginBottom: '18px' }}>
                A partir de los datos que subiste, así queda el prototipo de panel para tu concesionario: <strong style={{ color: '#0f172a', fontWeight: 600 }}>esto ya corrió sobre tus datos reales</strong>, no es un diseño de referencia.
              </div>
              {(() => {
                const nTablas = nodes.filter(n => n.kind === 'table').length
                const nRel = tableRelations.length
                const chip = (num: number, label: string, sub: string, green?: boolean) => (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', flex: '1 1 150px', minWidth: '140px',
                    background: green ? 'rgba(14,159,110,0.08)' : 'rgba(37,99,235,0.09)',
                    border: `1px solid ${green ? 'rgba(14,159,110,0.22)' : 'rgba(37,99,235,0.28)'}`,
                  }}>
                    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: '19px', color: green ? '#0e9f6e' : '#1D4ED8', lineHeight: 1 }}>{num}</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.3 }}>
                      {label}
                      <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{sub}</span>
                    </div>
                  </div>
                )
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {chip(nTablas, nTablas === 1 ? 'Tabla' : 'Tablas', 'mapeada' + (nTablas === 1 ? '' : 's') + ' automáticamente')}
                    {chip(nRel, nRel === 1 ? 'Relación' : 'Relaciones', 'detectada' + (nRel === 1 ? '' : 's') + ' entre hojas')}
                    {chip(0, 'Líneas de código', 'escritas por vos', true)}
                  </div>
                )
              })()}
            </div>
            <div style={{
              flexShrink: 0, width: '250px',
              background: 'linear-gradient(160deg, rgba(37,99,235,0.09), rgba(37,99,235,0.02))',
              border: '1px solid rgba(37,99,235,0.28)', borderRadius: '16px', padding: '18px',
            }}>
              <style>{`
                @keyframes pmDesplegarGlow {
                  0%, 100% { box-shadow: 0 2px 10px rgba(37,99,235,0.24), 0 0 0 0 rgba(37,99,235,0.3); }
                  50%      { box-shadow: 0 4px 18px rgba(37,99,235,0.36), 0 0 24px 4px rgba(37,99,235,0.26); }
                }
                @keyframes pmDesplegarSheen { 0% { transform: translateX(-140%) skewX(-18deg); } 60%, 100% { transform: translateX(220%) skewX(-18deg); } }
                @keyframes pmDesplegarBadge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
                .pm-desplegar-btn { position: relative; overflow: hidden; animation: pmDesplegarGlow 2.8s ease-in-out infinite; }
                .pm-desplegar-btn::after {
                  content: ''; position: absolute; top: 0; left: 0; width: 32%; height: 100%;
                  background: linear-gradient(115deg, transparent, rgba(255,255,255,0.55), transparent);
                  animation: pmDesplegarSheen 3.6s ease-in-out infinite;
                  pointer-events: none;
                }
                .pm-desplegar-badge { animation: pmDesplegarBadge 2.4s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) {
                  .pm-desplegar-btn, .pm-desplegar-btn::after, .pm-desplegar-badge { animation: none; }
                }
              `}</style>
              <div className={desplegando ? undefined : 'pm-desplegar-badge'} style={{
                width: '36px', height: '36px', borderRadius: '10px', marginBottom: '10px',
                background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px',
                boxShadow: '0 4px 10px rgba(37,99,235,0.3)',
              }}>🚀</div>
              <div style={{ fontFamily: FONT, fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '5px', lineHeight: 1.25 }}>Desplegá tu panel 360°</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: '11.5px', color: '#64748b', lineHeight: 1.55, marginBottom: '14px' }}>
                Datos reales, siempre a mano, listos para compartir con tu equipo — no una promesa, un link.
              </div>
              <button
                onClick={() => { if (!user) { irACrearCuenta(); return }; desplegarPanel() }}
                disabled={desplegando || loadedSheets.length === 0}
                className={desplegando ? undefined : 'pm-desplegar-btn'}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 700, fontFamily: FONT, whiteSpace: 'nowrap',
                  cursor: desplegando ? 'default' : 'pointer',
                  background: desplegando ? '#e2e8f0' : 'linear-gradient(135deg,#2563EB,#1D4ED8)',
                  color: desplegando ? '#94a3b8' : '#ffffff',
                  transition: 'transform .15s ease',
                }}
                onMouseEnter={e => { if (!desplegando) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {desplegando ? 'Desplegando…' : user ? 'Desplegar panel →' : 'Crear cuenta y desplegar →'}
              </button>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: FONT_BODY, marginTop: '8px' }}>
                {user ? 'Guarda hasta 1.000 filas por tabla, de verdad esta vez.' : 'Gratis, sin tarjeta — guarda hasta 1.000 filas por tabla.'}
              </div>
              {!user && (
                <button onClick={irAIniciarSesion} style={{ display: 'block', marginTop: '6px', fontSize: '10px', color: '#94a3b8', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT_BODY, textDecoration: 'underline' }}>
                  ¿Ya tenés cuenta? Iniciá sesión
                </button>
              )}
              {desplegarError && (
                <div style={{ fontSize: '11px', color: '#e5484d', fontFamily: FONT_BODY, marginTop: '6px' }}>{desplegarError}</div>
              )}
            </div>
          </div>

          <div style={{ background: '#080f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px', marginTop: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontFamily: FONT, fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>Panel 360° · Tu concesionario</span>
              <span style={{ fontSize: '10px', color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '999px', padding: '2px 8px', fontWeight: 600 }}>prototipo</span>
            </div>
            {stats.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`, gap: '10px' }}>
                {stats.slice(0, 4).map(s => {
                  const rows = loadedSheets.find(sh => sh.name === s.table)?.rows.length ?? 0
                  return (
                    <div key={s.table} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px', minWidth: 0 }}>
                      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', fontFamily: FONT_BODY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.table}</div>
                      <div style={{ fontFamily: FONT, fontSize: '20px', fontWeight: 800, color: s.color }}>{rows.toLocaleString('es-CO')}</div>
                      <div style={{ fontSize: '10px', color: '#475569', fontFamily: FONT_BODY }}>registros</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ fontFamily: FONT_BODY, fontSize: '12px', color: '#64748b' }}>Subí tus datos para ver el prototipo con tus propias cifras.</div>
            )}
          </div>

          <div style={{ fontFamily: FONT_BODY, fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Cómo escala esto</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1px', background: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            {ROADMAP_PROTOTIPO.map(r => (
              <div key={r.paso} style={{ background: '#ffffff', padding: '16px' }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: '11px', fontWeight: 700, color: '#2563EB', marginBottom: '8px' }}>{r.paso}</div>
                <div style={{ fontFamily: FONT, fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{r.titulo}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: '11.5px', color: '#64748b', lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Confirmar */}
        {step === 'confirmar' && (
        <div style={{ flex: '1 1 600px', minWidth: 0, background: '#ffffff', border: '1px solid #d9dadc', borderRadius: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', fontFamily: FONT_BODY, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Resumen del proyecto</span>
            <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px', padding: '2px 10px', fontWeight: 600 }}>
              {nodes.filter(n => n.kind === 'table').length} tablas · {nodes.filter(n => n.kind === 'field').length} campos · {tableRelations.length} {tableRelations.length === 1 ? 'relación' : 'relaciones'}
            </span>
          </div>

          {stats.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length},1fr)`, gap: '10px', marginBottom: '20px' }}>
              {stats.map(s => (
                <div key={s.table} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontFamily: FONT, fontSize: '24px', fontWeight: 800, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', fontFamily: FONT_BODY }}>Campos · {s.table}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px', fontFamily: FONT }}>¿Todo listo?</div>
              <div style={{ fontSize: '13px', color: '#64748b', fontFamily: FONT_BODY }}>Podés subir más fuentes cuando quieras — la IA vuelve a cruzar todo automáticamente.</div>
            </div>
            <label style={{ padding: '11px 20px', borderRadius: '10px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
              Subir otra fuente →
              <input type="file" accept=".xlsx,.csv,.json" multiple style={{ display: 'none' }} onChange={onFileInputChange} />
            </label>
          </div>
        </div>
        )}
        </div>

        </div>

        {/* Navegación entre pasos */}
        {phase !== 'upload' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <button
            onClick={() => canGoBack && setStep(STEPS[stepIndex - 1].key)}
            disabled={!canGoBack}
            style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #d9dadc', background: 'transparent', color: canGoBack ? '#334155' : '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: canGoBack ? 'pointer' : 'default', fontFamily: FONT_BODY }}
          >
            ← Atrás
          </button>
          {stepIndex < STEPS.length - 1 ? (
            <button
              onClick={() => canGoNext && setStep(STEPS[stepIndex + 1].key)}
              disabled={!canGoNext}
              style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: canGoNext ? 'linear-gradient(135deg,#2563EB,#1D4ED8)' : '#e2e8f0', color: canGoNext ? '#fff' : '#475569', fontSize: '13px', fontWeight: 700, cursor: canGoNext ? 'pointer' : 'default', fontFamily: FONT }}
            >
              Avanzar →
            </button>
          ) : (
            <button
              onClick={() => { if (user) { window.location.href = '/pulse/dashboard' } else { irACrearCuenta() } }}
              style={{ display: 'inline-block', padding: '10px 22px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#fff', fontSize: '13px', fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}
            >
              {user ? 'Ir al dashboard →' : 'Crear cuenta gratis →'}
            </button>
          )}
        </div>
        )}
      </div>
      </div>
    </PulseAppShell>
  )
}
