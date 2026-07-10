'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'
import { createClient } from '@/lib/supabase/client'

const FONT      = "'Syne', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

const PALETTE = ['#4f8ef7', '#34c97e', '#f7924f', '#c97fd4', '#f7d24f', '#22d3ee', '#fb7185', '#a3e635']

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

const rand = (a: number, b: number) => Math.random() * (b - a) + a

const BASE_DIM = 400
const dimScaleFor = (h: number) => Math.min(2.2, Math.max(1, h / BASE_DIM))

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').replace(/[^a-z0-9]/g, '')
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
  interface ColInfo { table: string; field: string; norm: string; values: Set<string> }
  const cols: ColInfo[] = []
  sheets.forEach(sheet => {
    const headers = Object.keys(sheet.rows[0] || {}).filter(isRealHeader)
    headers.forEach(h => {
      const rawValues = sheet.rows.map(r => r[h])
      const values = new Set(rawValues.filter(v => v !== undefined && v !== null && String(v).trim() !== '').map(v => String(v).trim().toLowerCase()))
      cols.push({ table: sheet.name, field: h, norm: normalize(h), values })
    })
  })

  const pairMap = new Map<string, TableRelation>()
  for (let i = 0; i < cols.length; i++) {
    for (let j = i + 1; j < cols.length; j++) {
      const A = cols[i], B = cols[j]
      if (A.table === B.table) continue
      const nameMatch = A.norm.length >= 4 && B.norm.length >= 4 && (A.norm === B.norm || A.norm.includes(B.norm) || B.norm.includes(A.norm))
      let overlap = 0
      if (A.values.size >= 3 && B.values.size >= 3) {
        let inter = 0
        A.values.forEach(v => { if (B.values.has(v)) inter++ })
        overlap = inter / Math.min(A.values.size, B.values.size)
      }
      if (overlap < 0.5 && !nameMatch) continue
      const label = overlap >= 0.5 ? `mismo valor ${Math.round(overlap * 100)}%` : 'nombre similar'
      const key = [A.table, B.table].sort().join('|')
      if (!pairMap.has(key)) pairMap.set(key, { a: A.table, b: B.table, matches: [] })
      pairMap.get(key)!.matches.push({ fieldA: A.field, fieldB: B.field, label, score: overlap })
    }
  }
  return Array.from(pairMap.values()).map(r => ({ ...r, matches: r.matches.sort((x, y) => y.score - x.score).slice(0, 6) }))
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
  const asesores = ['carlos.r@kia.co', 'maria.v@kia.co', 'andres.m@kia.co', 'karime.m@kia.co']
  const marcas = ['KIA Sportage', 'KIA Picanto', 'KIA Rio', 'KIA Stonic', 'KIA Sorento', 'KIA Carnival']

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

export default function DataBridgePage() {
  const [user, setUser]               = useState<{ nombre: string; email: string } | null>(null)
  const [phase, setPhase]             = useState<'upload' | 'processing' | 'selecting' | 'ready'>('upload')
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
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const camRef        = useRef({ rx: -25, ry: 30 })
  const panRef        = useRef({ x: 0, y: 0 })
  const zoomRef       = useRef(1)
  const interactedRef = useRef(false)
  const dragRef       = useRef({ on: false, x: 0, y: 0 })
  const animRef       = useRef<number>(0)
  const nodesRef      = useRef<Node3D[]>([])
  const edgesRef      = useRef<Edge3D[]>([])
  const hoverRef      = useRef<string | null>(null)
  const viewRef       = useRef<'3d' | 'top'>('3d')
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const expandedRef   = useRef<Set<string>>(new Set())
  const clickStartRef = useRef({ x: 0, y: 0 })

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ email: data.user.email ?? '', nombre: (data.user.user_metadata?.full_name as string) || data.user.email?.split('@')[0] || '' })
    })
  }, [])

  const project = useCallback((x: number, y: number, z: number, W: number, H: number) => {
    const dimScale = dimScaleFor(H) * zoomRef.current
    const px0 = W / 2 + panRef.current.x
    const py0 = H / 2 + panRef.current.y
    if (viewRef.current === 'top') return { px: x * dimScale + px0, py: -z * dimScale + py0, depth: 1 }
    const rx = camRef.current.rx * Math.PI / 180
    const ry = camRef.current.ry * Math.PI / 180
    const y1 = y * Math.cos(rx) - z * Math.sin(rx)
    const z1 = y * Math.sin(rx) + z * Math.cos(rx)
    const x2 = x * Math.cos(ry) + z1 * Math.sin(ry)
    const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry)
    const fov = 500; const d = fov / (fov + z2 + 300)
    return { px: x2 * d * dimScale + px0, py: y1 * d * dimScale + py0, depth: z2 }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width / (window.devicePixelRatio || 1)
    const H = canvas.height / (window.devicePixelRatio || 1)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const visibleFieldIds = new Set(nodesRef.current.filter(n => n.kind === 'field' && expandedRef.current.has(n.table)).map(n => n.id))
    const ns = nodesRef.current.filter(n => n.kind === 'table' || visibleFieldIds.has(n.id))
    const es = edgesRef.current.filter(e => visibleFieldIds.has(e.b))
    if (!ns.length) return

    const dimScale = dimScaleFor(H) * zoomRef.current
    const fs = (px: number) => Math.round(px * dimScale)

    const proj = ns.map(n => ({ ...n, ...project(n.x, n.y, n.z, W, H) }))
    proj.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0))

    const hoverId = hoverRef.current

    ctx.setLineDash([3, 4])
    es.forEach(e => {
      const a = proj.find(n => n.id === e.a)
      const b = proj.find(n => n.id === e.b)
      if (!a || !b) return
      ctx.beginPath(); ctx.moveTo(a.px!, a.py!); ctx.lineTo(b.px!, b.py!)
      ctx.strokeStyle = 'rgba(148,163,184,0.35)'
      ctx.lineWidth = Math.max(1, dimScale)
      ctx.stroke()
    })
    ctx.setLineDash([])

    proj.forEach(n => {
      const c = n.color
      const pscale = viewRef.current === '3d' ? (800 / (800 + (n.depth ?? 0) + 300)) : 1
      const r = n.r * pscale * dimScale
      ctx.beginPath(); ctx.arc(n.px!, n.py!, r + 3, 0, Math.PI * 2)
      ctx.fillStyle = c + '22'; ctx.fill()
      if (n.isHub) {
        ctx.beginPath(); ctx.arc(n.px!, n.py!, r + 6, 0, Math.PI * 2)
        ctx.strokeStyle = c + 'aa'; ctx.lineWidth = 1.5 * dimScale; ctx.stroke()
      }
      ctx.beginPath(); ctx.arc(n.px!, n.py!, r, 0, Math.PI * 2)
      ctx.fillStyle = c; ctx.fill()
      if (n.kind === 'table') {
        const expanded = expandedRef.current.has(n.table)
        ctx.font = `700 ${fs(11)}px system-ui`; ctx.fillStyle = 'rgba(0,0,0,0.8)'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(n.l.slice(0, 3).toUpperCase(), n.px!, n.py!)
        ctx.font = `700 ${fs(12)}px system-ui`; ctx.fillStyle = '#e2e8f0'
        ctx.textBaseline = 'top'
        ctx.fillText(n.l, n.px!, n.py! + r + fs(5))
        ctx.font = `${fs(10)}px system-ui`; ctx.fillStyle = '#64748b'
        ctx.fillText(`${n.fieldCount ?? 0} campos · ${expanded ? 'clic para contraer' : 'clic para ver'}`, n.px!, n.py! + r + fs(21))
      } else {
        const isHover = n.id === hoverId
        ctx.font = `${isHover ? '600 ' : ''}${fs(11)}px system-ui`; ctx.fillStyle = isHover ? '#f8fafc' : '#cbd5e1'
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'
        ctx.fillText(n.l, n.px!, n.py! + r + fs(4))
        ctx.font = `${fs(9)}px system-ui`; ctx.fillStyle = c
        ctx.fillText(n.tipo || '', n.px!, n.py! + r + fs(17))
      }
    })
  }, [project])

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

  useEffect(() => {
    syncCanvasSize()
    window.addEventListener('resize', syncCanvasSize)
    return () => window.removeEventListener('resize', syncCanvasSize)
  }, [syncCanvasSize])

  useEffect(() => {
    const t = setTimeout(syncCanvasSize, 60)
    return () => clearTimeout(t)
  }, [fullscreen, syncCanvasSize])

  useEffect(() => {
    document.body.style.overflow = fullscreen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [fullscreen])

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const processSheets = (sheets: SheetData[]) => {
    const { nodes: n, edges: e } = buildGraph(sheets)
    setNodes(n); setEdges(e)
    setStats(computeTableStats(n))
    setTableRelations(detectTableRelations(sheets))
    setSchemaHover(null)
    setExpandedTables(new Set())
    setPhase('ready')
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

  const startDemo = () => runProgress(() => processSheets(genDemoSheets()))

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

  const handleFiles = async (files: File[]) => {
    setPhase('processing')
    setProgLabel('Leyendo archivo...')
    setProgPct(15)
    try {
      const sheets = await parseFiles(files)
      if (!sheets.length) { runProgress(() => processSheets(genDemoSheets())); return }
      if (sheets.length === 1) { runProgress(() => processSheets(sheets)); return }
      setPendingSheets(sheets)
      setSelectedSheetNames(new Set(sheets.map(s => s.name)))
      setPhase('selecting')
    } catch {
      runProgress(() => processSheets(genDemoSheets()))
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
    runProgress(() => processSheets(selected))
  }

  const cancelSheetSelection = () => {
    setPendingSheets([])
    setSelectedSheetNames(new Set())
    setPhase('upload')
  }

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) handleFiles(files)
    e.target.value = ''
  }

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
    const dimScale = dimScaleFor(H) * zoomRef.current
    const hit = nodesRef.current.find(n => {
      if (n.kind === 'field' && !expandedTables.has(n.table)) return false
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

  return (
    <PulseAppShell userName={user?.nombre} userEmail={user?.email}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '999px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px', fontFamily: FONT_BODY }}>
            DataBridge 360
          </div>
          <h1 style={{ fontFamily: FONT, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, letterSpacing: '-.5px', margin: '0 0 10px', color: '#f8fafc' }}>
            Estructura de tus hojas<br />
            <span style={{ background: 'linear-gradient(135deg,#0ea5e9,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>campos y tipos en 3D</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, margin: 0, fontFamily: FONT_BODY }}>
            Subí tu Excel, CSV o JSON. La IA detecta cada hoja, sus campos y el tipo de dato de cada uno — conectados con líneas punteadas a su tabla de origen.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Visualizador */}
        <div style={{ flex: '1 1 600px', minWidth: 0 }}>
        <div style={fullscreen ? {
          position: 'fixed', inset: 0, zIndex: 200, background: '#080f1a',
          padding: '18px 20px', display: 'flex', flexDirection: 'column',
        } : {
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px', marginBottom: '20px',
        }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: FONT_BODY }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Mapa de campos</span>
              <span style={{ fontSize: '11px', color: phase === 'ready' ? '#10b981' : '#64748b', background: phase === 'ready' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${phase === 'ready' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '999px', padding: '2px 10px', fontWeight: 600 }}>
                {phase === 'upload' ? 'Esperando datos' : phase === 'processing' ? 'Procesando...' : phase === 'selecting' ? 'Elegí las hojas' : `${nodes.filter(n => n.kind === 'field').length} campos · ${nodes.filter(n => n.kind === 'table').length} tablas`}
              </span>
            </div>
            {phase === 'ready' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['3d', 'top'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: view === v ? '1px solid rgba(14,165,233,0.5)' : '1px solid rgba(255,255,255,0.1)', background: view === v ? 'rgba(14,165,233,0.1)' : 'transparent', color: view === v ? '#7dd3fc' : '#64748b', fontWeight: view === v ? 600 : 400 }}>
                    {v === '3d' ? '3D' : 'Top'}
                  </button>
                ))}
                <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
                {(['rotate', 'pan'] as const).map(m => (
                  <button key={m} onClick={() => setDragMode(m)} title={m === 'rotate' ? 'Arrastrar para rotar' : 'Arrastrar para mover'} style={{ fontSize: '13px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: dragMode === m ? '1px solid rgba(14,165,233,0.5)' : '1px solid rgba(255,255,255,0.1)', background: dragMode === m ? 'rgba(14,165,233,0.1)' : 'transparent', color: dragMode === m ? '#7dd3fc' : '#64748b' }}>
                    {m === 'rotate' ? '⟳' : '🖐'}
                  </button>
                ))}
                <button onClick={() => { camRef.current = { rx: -25, ry: 30 }; panRef.current = { x: 0, y: 0 }; zoomRef.current = 1; interactedRef.current = false; setView('3d'); draw() }} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b' }}>↺</button>
                <button onClick={() => setFullscreen(f => !f)} title={fullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b' }}>
                  {fullscreen ? '✕' : '⛶'}
                </button>
              </div>
            )}
          </div>

          {/* Canvas area */}
          <div
            style={{ position: 'relative', width: '100%', height: fullscreen ? '100%' : '400px', flex: fullscreen ? 1 : undefined, minHeight: 0, background: '#080f1a', borderRadius: '14px', overflow: 'hidden', cursor: phase === 'ready' ? 'grab' : 'default' }}
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
              const dimScale = dimScaleFor(H) * zoomRef.current
              const hit = nodesRef.current.find(n => {
                if (n.kind !== 'table') return false
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
          >
            {/* Fondo de partículas */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(14,165,233,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(16,185,129,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

            {/* Upload state */}
            {phase === 'upload' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', zIndex: 5 }}>
                <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>⬆</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', fontFamily: FONT }}>Subí tu inventario</div>
                  <div style={{ fontSize: '13px', color: '#475569', fontFamily: FONT_BODY }}>Excel · CSV · JSON — podés elegir varios archivos juntos</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {['Excel', 'CSV', 'JSON'].map(f => (
                      <span key={f} style={{ fontSize: '11px', color: '#334155', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '3px 10px', fontFamily: FONT_BODY }}>{f}</span>
                    ))}
                  </div>
                </div>
                <button onClick={startDemo} style={{ marginTop: '6px', fontSize: '12px', color: '#7dd3fc', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, textDecoration: 'underline' }}>
                  o probá con datos de ejemplo →
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.csv,.json" multiple style={{ display: 'none' }} onChange={onFileInputChange} />
              </div>
            )}

            {/* Processing state */}
            {phase === 'processing' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 6 }}>
                <div style={{ fontSize: '32px' }}>🔍</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', fontFamily: FONT_BODY }}>{progLabel}</div>
                <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progPct}%`, background: 'linear-gradient(90deg,#0ea5e9,#10b981)', borderRadius: '2px', transition: 'width .1s' }} />
                </div>
                <div style={{ fontSize: '12px', color: '#334155', fontFamily: FONT_BODY }}>{progPct}%</div>
              </div>
            )}

            {/* Selección de hojas */}
            {phase === 'selecting' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', zIndex: 7, padding: '20px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', fontFamily: FONT }}>¿Qué hojas querés importar?</div>
                <div style={{ fontSize: '12px', color: '#475569', fontFamily: FONT_BODY }}>
                  Encontramos {pendingSheets.length} hojas — elegí cuáles cruzar
                </div>
                <div style={{ width: '100%', maxWidth: '420px', maxHeight: '220px', overflowY: 'auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '6px' }}>
                  {pendingSheets.map(s => (
                    <label key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 8px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY }}>
                      <input type="checkbox" checked={selectedSheetNames.has(s.name)} onChange={() => toggleSheetSelected(s.name)} />
                      <span style={{ fontSize: '13px', color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                      <span style={{ fontSize: '11px', color: '#475569', flexShrink: 0 }}>{s.rows.length} filas</span>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                  <button onClick={() => setSelectedSheetNames(new Set(pendingSheets.map(s => s.name)))} style={{ background: 'transparent', border: 'none', color: '#7dd3fc', cursor: 'pointer', fontFamily: FONT_BODY, textDecoration: 'underline' }}>Todas</button>
                  <button onClick={() => setSelectedSheetNames(new Set())} style={{ background: 'transparent', border: 'none', color: '#7dd3fc', cursor: 'pointer', fontFamily: FONT_BODY, textDecoration: 'underline' }}>Ninguna</button>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button onClick={cancelSheetSelection} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', fontSize: '13px', cursor: 'pointer', fontFamily: FONT_BODY }}>Cancelar</button>
                  <button onClick={confirmSheetSelection} disabled={selectedSheetNames.size === 0} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: selectedSheetNames.size === 0 ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#0ea5e9,#10b981)', color: selectedSheetNames.size === 0 ? '#475569' : '#fff', fontSize: '13px', fontWeight: 700, cursor: selectedSheetNames.size === 0 ? 'not-allowed' : 'pointer', fontFamily: FONT }}>
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

        {/* Esquema de relaciones 2D */}
        <div style={{ flex: '0 1 300px', minWidth: '260px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', fontFamily: FONT_BODY }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Esquema de relaciones</span>
            <span style={{ fontSize: '11px', color: tableRelations.length ? '#10b981' : '#64748b', background: tableRelations.length ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${tableRelations.length ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '999px', padding: '2px 10px', fontWeight: 600 }}>
              {tableRelations.length} {tableRelations.length === 1 ? 'relación' : 'relaciones'}
            </span>
          </div>

          {phase !== 'ready' ? (
            <div style={{ fontSize: '12px', color: '#475569', fontFamily: FONT_BODY }}>Subí tus hojas para ver el esquema.</div>
          ) : (
            <>
              <svg viewBox="0 0 280 280" style={{ width: '100%', height: 'auto', background: '#080f1a', borderRadius: '14px' }}>
                {tableRelations.map((r, i) => {
                  const p1 = schemaPositions.get(r.a); const p2 = schemaPositions.get(r.b)
                  if (!p1 || !p2) return null
                  const strength = Math.min(1, r.matches.length / 3)
                  const active = schemaHover?.type === 'relation' && schemaHover.rel === r
                  return (
                    <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      stroke={active ? 'rgba(125,211,252,0.95)' : 'rgba(14,165,233,0.5)'}
                      strokeWidth={(active ? 2 : 1) + strength * 1.5}
                      strokeDasharray="4 3"
                      onMouseEnter={() => setSchemaHover({ type: 'relation', rel: r })}
                      onMouseLeave={() => setSchemaHover(null)}
                      style={{ cursor: 'pointer' }}
                    />
                  )
                })}
                {schemaTables.map(t => {
                  const p = schemaPositions.get(t.table)!
                  return (
                    <g key={t.id} onMouseEnter={() => setSchemaHover({ type: 'table', table: t.table })} onMouseLeave={() => setSchemaHover(null)} style={{ cursor: 'pointer' }}>
                      <circle cx={p.x} cy={p.y} r={20} fill={t.color} />
                      <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" fill="rgba(0,0,0,0.8)">{t.table.slice(0, 3).toUpperCase()}</text>
                      <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize="9" fill="#94a3b8">{t.table.length > 14 ? t.table.slice(0, 12) + '…' : t.table}</text>
                    </g>
                  )
                })}
              </svg>

              <div style={{ marginTop: '12px', fontSize: '11px', color: '#94a3b8', fontFamily: FONT_BODY, lineHeight: 1.6, minHeight: '60px' }}>
                {!schemaHover && (tableRelations.length === 0
                  ? 'No se detectaron relaciones entre tablas.'
                  : 'Pasá el mouse sobre una tabla o línea para ver el detalle.')}
                {schemaHover?.type === 'table' && (() => {
                  const related = tableRelations.filter(r => r.a === schemaHover.table || r.b === schemaHover.table)
                  return (
                    <>
                      <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '2px' }}>{schemaHover.table}</div>
                      {related.length === 0
                        ? <div>Sin relaciones con otras tablas.</div>
                        : related.map((r, i) => (
                            <div key={i}>↔ {r.a === schemaHover.table ? r.b : r.a} ({r.matches.length} campo{r.matches.length !== 1 ? 's' : ''})</div>
                          ))}
                    </>
                  )
                })()}
                {schemaHover?.type === 'relation' && (
                  <>
                    <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '2px' }}>{schemaHover.rel.a} ↔ {schemaHover.rel.b}</div>
                    {schemaHover.rel.matches.map((m, i) => (
                      <div key={i}>{m.fieldA} ↔ {m.fieldB} <span style={{ color: '#475569' }}>({m.label})</span></div>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
        </div>

        {/* Stats */}
        {phase === 'ready' && stats.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length},1fr)`, gap: '10px', marginBottom: '20px' }}>
            {stats.map(s => (
              <div key={s.table} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontFamily: FONT, fontSize: '24px', fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px', fontFamily: FONT_BODY }}>Campos · {s.table}</div>
              </div>
            ))}
          </div>
        )}

        {/* CTA subir archivo real */}
        {phase === 'ready' && (
          <div style={{ background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px', fontFamily: FONT }}>Subí tu inventario real</div>
              <div style={{ fontSize: '13px', color: '#475569', fontFamily: FONT_BODY }}>Seleccioná uno o varios archivos a la vez — la IA arma el mapa de campos y tipos en segundos.</div>
            </div>
            <label style={{ padding: '11px 20px', borderRadius: '10px', background: 'linear-gradient(135deg,#0ea5e9,#10b981)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
              Subir archivo →
              <input type="file" accept=".xlsx,.csv,.json" multiple style={{ display: 'none' }} onChange={onFileInputChange} />
            </label>
          </div>
        )}
      </div>
    </PulseAppShell>
  )
}
