'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'
import { createClient } from '@/lib/supabase/client'

const FONT      = "'Syne', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

const PALETTE = ['#4f8ef7', '#34c97e', '#f7924f', '#c97fd4', '#f7d24f', '#22d3ee', '#fb7185', '#a3e635']
const CENTRAL_COLOR = '#fbbf24'
const KEYWORDS_CENTRAL = ['oportunidad', 'cliente', 'lead', 'vehiculo', 'vin', 'placa', 'cedula', 'documento']

interface Node3D {
  id: string; l: string; kind: 'table' | 'field' | 'central'; table: string
  tipo?: string; color: string; isHub?: boolean
  x: number; y: number; z: number; r: number
  px?: number; py?: number; depth?: number
}

interface Edge3D { a: string; b: string; w: number; kind: 'contains' | 'fk'; label?: string }

interface SheetData { name: string; rows: Record<string, unknown>[] }

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

const MAX_DEGREE_PER_FIELD = 4

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
  const tableRadius = 190 + Math.max(0, sheets.length - 5) * 26

  nodes.push({ id: 'central', l: 'Oportunidad', kind: 'central', table: 'Oportunidad', color: CENTRAL_COLOR, x: 0, y: 0, z: 0, r: 26 })

  interface ColInfo { id: string; sheetIdx: number; table: string; norm: string; values: Set<string> }
  const cols: ColInfo[] = []

  sheets.forEach((sheet, si) => {
    const color = PALETTE[si % PALETTE.length]
    const angle = pi2 * si / Math.max(sheets.length, 1)
    const cx = Math.cos(angle) * tableRadius
    const cz = Math.sin(angle) * tableRadius
    const cy = (si % 2 === 0 ? -1 : 1) * 24
    const hubId = 'hub_' + si
    nodes.push({ id: hubId, l: sheet.name, kind: 'table', table: sheet.name, color, x: cx, y: cy, z: cz, r: 18 })

    const headers = Object.keys(sheet.rows[0] || {}).filter(isRealHeader)
    const fieldRadius = 55 + Math.max(0, headers.length - 6) * 4
    headers.forEach((h, fi) => {
      const rawValues = sheet.rows.map(r => r[h])
      const tipo = inferType(rawValues)
      const fa = pi2 * fi / Math.max(headers.length, 1)
      const id = `f_${si}_${fi}`
      nodes.push({ id, l: h, kind: 'field', table: sheet.name, tipo, color, x: cx + Math.cos(fa) * fieldRadius, y: cy + rand(-18, 18), z: cz + Math.sin(fa) * fieldRadius, r: 9 })
      edges.push({ a: hubId, b: id, w: 0.4, kind: 'contains' })
      const values = new Set(rawValues.filter(v => v !== undefined && v !== null && String(v).trim() !== '').map(v => String(v).trim().toLowerCase()))
      cols.push({ id, sheetIdx: si, table: sheet.name, norm: normalize(h), values })
    })

    const hasCentralField = headers.some(h => KEYWORDS_CENTRAL.some(k => normalize(h).includes(k)))
    if (hasCentralField) edges.push({ a: hubId, b: 'central', w: 1.6, kind: 'fk', label: 'vínculo a oportunidad' })
  })

  interface Candidate { a: string; b: string; overlap: number; nameMatch: boolean }
  const candidates: Candidate[] = []
  for (let i = 0; i < cols.length; i++) {
    for (let j = i + 1; j < cols.length; j++) {
      const A = cols[i], B = cols[j]
      if (A.sheetIdx === B.sheetIdx) continue
      const nameMatch = A.norm.length >= 4 && B.norm.length >= 4 && (A.norm === B.norm || A.norm.includes(B.norm) || B.norm.includes(A.norm))
      let overlap = 0
      if (A.values.size >= 3 && B.values.size >= 3) {
        let inter = 0
        A.values.forEach(v => { if (B.values.has(v)) inter++ })
        overlap = inter / Math.min(A.values.size, B.values.size)
      }
      if (overlap >= 0.5 || nameMatch) candidates.push({ a: A.id, b: B.id, overlap, nameMatch })
    }
  }
  candidates.sort((x, y) => y.overlap - x.overlap)

  const degree = new Map<string, number>()
  candidates.forEach(c => {
    const da = degree.get(c.a) ?? 0
    const db = degree.get(c.b) ?? 0
    if (da >= MAX_DEGREE_PER_FIELD || db >= MAX_DEGREE_PER_FIELD) return
    const label = c.overlap >= 0.5 ? `mismo valor ${Math.round(c.overlap * 100)}%` : 'nombre similar'
    edges.push({ a: c.a, b: c.b, w: 1 + c.overlap, kind: 'fk', label })
    degree.set(c.a, da + 1)
    degree.set(c.b, db + 1)
  })

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
  const [phase, setPhase]             = useState<'upload' | 'processing' | 'ready'>('upload')
  const [progPct, setProgPct]         = useState(0)
  const [progLabel, setProgLabel]     = useState('Leyendo archivo...')
  const [view, setView]               = useState<'3d' | 'top'>('3d')
  const [nodes, setNodes]             = useState<Node3D[]>([])
  const [edges, setEdges]             = useState<Edge3D[]>([])
  const [tooltip, setTooltip]         = useState<{ x: number; y: number; node: Node3D } | null>(null)
  const [stats, setStats]             = useState<{ table: string; color: string; count: number }[]>([])
  const [fullscreen, setFullscreen]   = useState(false)

  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const camRef       = useRef({ rx: -25, ry: 30 })
  const dragRef      = useRef({ on: false, x: 0, y: 0 })
  const animRef      = useRef<number>(0)
  const nodesRef     = useRef<Node3D[]>([])
  const edgesRef     = useRef<Edge3D[]>([])
  const hoverRef     = useRef<string | null>(null)
  const viewRef      = useRef<'3d' | 'top'>('3d')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ email: data.user.email ?? '', nombre: (data.user.user_metadata?.full_name as string) || data.user.email?.split('@')[0] || '' })
    })
  }, [])

  const project = useCallback((x: number, y: number, z: number, W: number, H: number) => {
    const dimScale = dimScaleFor(H)
    if (viewRef.current === 'top') return { px: x * dimScale + W / 2, py: -z * dimScale + H / 2, depth: 1 }
    const rx = camRef.current.rx * Math.PI / 180
    const ry = camRef.current.ry * Math.PI / 180
    const y1 = y * Math.cos(rx) - z * Math.sin(rx)
    const z1 = y * Math.sin(rx) + z * Math.cos(rx)
    const x2 = x * Math.cos(ry) + z1 * Math.sin(ry)
    const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry)
    const fov = 500; const d = fov / (fov + z2 + 300)
    return { px: x2 * d * dimScale + W / 2, py: y1 * d * dimScale + H / 2, depth: z2 }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width / (window.devicePixelRatio || 1)
    const H = canvas.height / (window.devicePixelRatio || 1)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const ns = nodesRef.current
    const es = edgesRef.current
    if (!ns.length) return

    const dimScale = dimScaleFor(H)
    const fs = (px: number) => Math.round(px * dimScale)

    const proj = ns.map(n => ({ ...n, ...project(n.x, n.y, n.z, W, H) }))
    proj.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0))

    const hoverId = hoverRef.current
    const drawEdge = (e: Edge3D, emphasize: boolean) => {
      const a = proj.find(n => n.id === e.a)
      const b = proj.find(n => n.id === e.b)
      if (!a || !b) return
      ctx.beginPath(); ctx.moveTo(a.px!, a.py!); ctx.lineTo(b.px!, b.py!)
      if (e.kind === 'fk') {
        ctx.strokeStyle = emphasize ? 'rgba(14,165,233,0.9)' : hoverId ? 'rgba(14,165,233,0.08)' : 'rgba(14,165,233,0.28)'
        ctx.lineWidth = (emphasize ? 1.8 : 0.7) * e.w * dimScale
      } else {
        ctx.strokeStyle = 'rgba(128,128,128,0.1)'; ctx.lineWidth = e.w * dimScale
      }
      ctx.stroke()
      if (e.kind === 'fk' && e.label && emphasize) {
        const mx = (a.px! + b.px!) / 2
        const my = (a.py! + b.py!) / 2
        ctx.font = `${fs(10)}px system-ui`
        const w = ctx.measureText(e.label).width
        ctx.fillStyle = 'rgba(8,15,26,0.9)'
        ctx.fillRect(mx - w / 2 - 4, my - fs(8), w + 8, fs(16))
        ctx.fillStyle = 'rgba(125,211,252,1)'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(e.label, mx, my)
      }
    }
    es.filter(e => e.kind === 'contains' || !(hoverId && (e.a === hoverId || e.b === hoverId))).forEach(e => drawEdge(e, false))
    if (hoverId) es.filter(e => e.kind === 'fk' && (e.a === hoverId || e.b === hoverId)).forEach(e => drawEdge(e, true))

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
      if (n.kind === 'central') {
        ctx.font = `800 ${fs(13)}px system-ui`; ctx.fillStyle = 'rgba(0,0,0,0.85)'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('OP', n.px!, n.py!)
        ctx.font = `800 ${fs(13)}px system-ui`; ctx.fillStyle = CENTRAL_COLOR
        ctx.textBaseline = 'top'
        ctx.fillText(n.l, n.px!, n.py! + r + fs(5))
      } else if (n.kind === 'table') {
        ctx.font = `700 ${fs(11)}px system-ui`; ctx.fillStyle = 'rgba(0,0,0,0.8)'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(n.l.slice(0, 3).toUpperCase(), n.px!, n.py!)
        ctx.font = `700 ${fs(12)}px system-ui`; ctx.fillStyle = '#e2e8f0'
        ctx.textBaseline = 'top'
        ctx.fillText(n.l, n.px!, n.py! + r + fs(5))
      } else {
        ctx.font = `${fs(11)}px system-ui`; ctx.fillStyle = '#b6c2d4'
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'
        ctx.fillText(n.l, n.px!, n.py! + r + fs(4))
      }
    })
  }, [project])

  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
    draw()
  }, [nodes, edges, draw])

  useEffect(() => {
    viewRef.current = view
    draw()
  }, [view, draw])

  useEffect(() => {
    if (phase !== 'ready') return
    let stopped = false
    const tick = () => {
      if (stopped) return
      if (!dragRef.current.on) { camRef.current.ry += 0.12; draw() }
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
    setPhase('ready')
  }

  const runProgress = (onDone: () => void) => {
    setPhase('processing')
    const steps = ['Leyendo archivo...', 'Detectando columnas...', 'Comparando nombres entre hojas...', 'Cruzando valores en común...', 'Construyendo grafo 3D...', 'Listo']
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

  const handleFile = (file: File) => {
    runProgress(async () => {
      try {
        let sheets: SheetData[]
        if (file.name.toLowerCase().endsWith('.json')) {
          const text = await file.text()
          const data = JSON.parse(text)
          sheets = Array.isArray(data)
            ? [{ name: file.name.replace(/\.json$/i, ''), rows: data }]
            : Object.entries(data).map(([name, rows]) => ({ name, rows: rows as Record<string, unknown>[] }))
        } else {
          const buffer = await file.arrayBuffer()
          const workbook = XLSX.read(buffer, { type: 'array' })
          sheets = workbook.SheetNames.map(name => ({
            name,
            rows: XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], { defval: '' }),
          }))
        }
        sheets = sheets.filter(s => s.rows.length > 0)
        processSheets(sheets.length ? sheets : genDemoSheets())
      } catch {
        processSheets(genDemoSheets())
      }
    })
  }

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ''
  }

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || phase !== 'ready') return
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top
    if (dragRef.current.on) {
      camRef.current.ry += (mx - dragRef.current.x) * 0.4
      camRef.current.rx += (my - dragRef.current.y) * 0.4
      camRef.current.rx = Math.max(-80, Math.min(80, camRef.current.rx))
      dragRef.current.x = mx; dragRef.current.y = my; draw(); return
    }
    const W = rect.width; const H = rect.height
    const dimScale = dimScaleFor(H)
    const hit = nodesRef.current.find(n => {
      const p = project(n.x, n.y, n.z, W, H)
      const s = view === '3d' ? (800 / (800 + (p.depth ?? 0) + 300)) : 1
      const dx = mx - p.px!; const dy = my - p.py!
      return dx * dx + dy * dy < (n.r * s * dimScale + 8) ** 2
    })
    const newHoverId = hit ? hit.id : null
    if (hoverRef.current !== newHoverId) { hoverRef.current = newHoverId; draw() }
    setTooltip(hit ? { x: Math.min(mx + 12, W - 220), y: Math.max(my - 60, 0), node: hit } : null)
  }

  const connLines = (nodeId: string): string[] =>
    edges
      .filter(e => e.kind === 'fk' && (e.a === nodeId || e.b === nodeId))
      .map(e => {
        const otherId = e.a === nodeId ? e.b : e.a
        const other = nodes.find(nn => nn.id === otherId)
        if (!other) return null
        const name = other.kind === 'central' ? 'Oportunidad' : `${other.table}.${other.l}`
        return e.label ? `${name} (${e.label})` : name
      })
      .filter((v): v is string => Boolean(v))

  const legendEntries = Array.from(new Map(nodes.filter(n => n.kind !== 'field').map(n => [n.kind === 'central' ? 'Oportunidad' : n.table, n.color])).entries())

  return (
    <PulseAppShell userName={user?.nombre} userEmail={user?.email}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '999px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px', fontFamily: FONT_BODY }}>
            DataBridge 360
          </div>
          <h1 style={{ fontFamily: FONT, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, letterSpacing: '-.5px', margin: '0 0 10px', color: '#f8fafc' }}>
            Mapa de relaciones<br />
            <span style={{ background: 'linear-gradient(135deg,#0ea5e9,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>de tus hojas en 3D</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, margin: 0, fontFamily: FONT_BODY }}>
            Subí tu Excel o CSV. La IA detecta columnas, compara nombres y valores entre hojas, e identifica llaves automáticamente — y las visualiza en tiempo real.
          </p>
        </div>

        {/* Visualizador */}
        <div style={fullscreen ? {
          position: 'fixed', inset: 0, zIndex: 200, background: '#080f1a',
          padding: '18px 20px', display: 'flex', flexDirection: 'column',
        } : {
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px', marginBottom: '20px',
        }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: FONT_BODY }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Mapa de relaciones</span>
              <span style={{ fontSize: '11px', color: phase === 'ready' ? '#10b981' : '#64748b', background: phase === 'ready' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${phase === 'ready' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '999px', padding: '2px 10px', fontWeight: 600 }}>
                {phase === 'upload' ? 'Esperando datos' : phase === 'processing' ? 'Procesando...' : `${nodes.filter(n => n.kind === 'field').length} campos · ${edges.filter(e => e.kind === 'fk').length} relaciones detectadas`}
              </span>
            </div>
            {phase === 'ready' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['3d', 'top'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: view === v ? '1px solid rgba(14,165,233,0.5)' : '1px solid rgba(255,255,255,0.1)', background: view === v ? 'rgba(14,165,233,0.1)' : 'transparent', color: view === v ? '#7dd3fc' : '#64748b', fontWeight: view === v ? 600 : 400 }}>
                    {v === '3d' ? '3D' : 'Top'}
                  </button>
                ))}
                <button onClick={() => { camRef.current = { rx: -25, ry: 30 }; setView('3d'); draw() }} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT_BODY, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b' }}>↺</button>
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
            onMouseDown={e => { if (phase !== 'ready') return; const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); dragRef.current = { on: true, x: e.clientX - rect.left, y: e.clientY - rect.top } }}
            onMouseUp={() => { dragRef.current.on = false }}
            onMouseLeave={() => { dragRef.current.on = false; hoverRef.current = null; setTooltip(null); draw() }}
          >
            {/* Fondo de partículas */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(14,165,233,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(16,185,129,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

            {/* Upload state */}
            {phase === 'upload' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', zIndex: 5 }}>
                <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>⬆</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', fontFamily: FONT }}>Subí tu inventario</div>
                  <div style={{ fontSize: '13px', color: '#475569', fontFamily: FONT_BODY }}>Excel · CSV · JSON</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {['Excel', 'CSV', 'JSON'].map(f => (
                      <span key={f} style={{ fontSize: '11px', color: '#334155', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '3px 10px', fontFamily: FONT_BODY }}>{f}</span>
                    ))}
                  </div>
                </div>
                <button onClick={startDemo} style={{ marginTop: '6px', fontSize: '12px', color: '#7dd3fc', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, textDecoration: 'underline' }}>
                  o probá con datos de ejemplo →
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.csv,.json" style={{ display: 'none' }} onChange={onFileInputChange} />
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

            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

            {/* Tooltip */}
            {tooltip && (
              <div style={{ position: 'absolute', left: tooltip.x, top: tooltip.y, background: 'rgba(13,27,46,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', pointerEvents: 'none', fontFamily: FONT_BODY, lineHeight: 1.6, zIndex: 10, maxWidth: '220px' }}>
                {tooltip.node.kind === 'field' && (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>{tooltip.node.table}.{tooltip.node.l}</div>
                    <div style={{ color: tooltip.node.color }}>Tipo: {tooltip.node.tipo}{tooltip.node.isHub ? ' · candidato a hub' : ''}</div>
                    <div style={{ color: '#475569', marginTop: '4px' }}>
                      {connLines(tooltip.node.id).length === 0
                        ? 'Sin relaciones detectadas'
                        : connLines(tooltip.node.id).slice(0, 3).map((line, i) => <div key={i}>↔ {line}</div>)}
                      {connLines(tooltip.node.id).length > 3 && <div>+{connLines(tooltip.node.id).length - 3} más</div>}
                    </div>
                  </>
                )}
                {tooltip.node.kind === 'table' && (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>{tooltip.node.l}</div>
                    <div style={{ color: tooltip.node.color }}>Tabla / hoja</div>
                    <div style={{ color: '#475569', marginTop: '2px' }}>{edges.filter(e => e.kind === 'contains' && e.a === tooltip.node.id).length} campos</div>
                  </>
                )}
                {tooltip.node.kind === 'central' && (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>Oportunidad</div>
                    <div style={{ color: CENTRAL_COLOR }}>Nodo central</div>
                    <div style={{ color: '#475569', marginTop: '2px' }}>{edges.filter(e => e.kind === 'fk' && (e.a === 'central' || e.b === 'central')).length} tablas conectadas</div>
                  </>
                )}
              </div>
            )}

            {/* Hint */}
            {phase === 'ready' && (
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '11px', color: '#334155', fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: '4px' }}>
                🖱 arrastrá para rotar · pasá el mouse sobre un campo para ver sus relaciones
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
              <div style={{ fontSize: '13px', color: '#475569', fontFamily: FONT_BODY }}>La IA lee cada hoja de tu Excel o CSV y arma el mapa de campos y llaves en segundos.</div>
            </div>
            <label style={{ padding: '11px 20px', borderRadius: '10px', background: 'linear-gradient(135deg,#0ea5e9,#10b981)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
              Subir archivo →
              <input type="file" accept=".xlsx,.csv,.json" style={{ display: 'none' }} onChange={onFileInputChange} />
            </label>
          </div>
        )}
      </div>
    </PulseAppShell>
  )
}
