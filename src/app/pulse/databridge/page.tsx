'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'
import { createClient } from '@/lib/supabase/client'

const FONT      = "'Syne', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

const COLORS: Record<string, string> = {
  veh: '#4f8ef7',
  ase: '#34c97e',
  ret: '#f7924f',
  fin: '#c97fd4',
  pol: '#f7d24f',
}

const LABELS: Record<string, string> = {
  veh: 'Vehículo',
  ase: 'Asesor',
  ret: 'Retoma',
  fin: 'Financiación',
  pol: 'Póliza',
}

interface Node3D {
  id: string; t: string; l: string
  x: number; y: number; z: number; r: number
  px?: number; py?: number; depth?: number
}

interface Edge3D { a: string; b: string; w: number }

function genDemoData(): { n: Node3D[]; e: Edge3D[] } {
  const n: Node3D[] = []
  const e: Edge3D[] = []
  const veh = ['KIA Sportage','KIA Picanto','KIA Rio','KIA Stonic','KIA Sorento','KIA Carnival','KIA EV6','KIA Seltos']
  const ase = ['Carlos R.','María V.','Andrés M.','Karime M.','Luis G.']
  const ret = ['Toyota Corolla','Chevrolet Spark','Renault Logan','Hyundai Tucson']
  const fin = ['Bancolombia','Davivienda','Banco de Bogotá','AV Villas']
  const pol = ['SURA','Bolívar','Mapfre','Allianz']
  const rand = (a: number, b: number) => Math.random() * (b - a) + a
  const pi2 = Math.PI * 2

  veh.forEach((l, i) => { const a = pi2 * i / veh.length; n.push({ id: 'v' + i, t: 'veh', l, x: Math.cos(a) * 140, y: rand(-40, 40), z: Math.sin(a) * 140, r: 14 }) })
  ase.forEach((l, i) => { n.push({ id: 'a' + i, t: 'ase', l, x: rand(-80, 80), y: rand(60, 120), z: rand(-80, 80), r: 18 }) })
  ret.forEach((l, i) => { const a = pi2 * i / ret.length + 0.4; n.push({ id: 'r' + i, t: 'ret', l, x: Math.cos(a) * 90, y: rand(-100, -50), z: Math.sin(a) * 90, r: 12 }) })
  fin.forEach((l, i) => { n.push({ id: 'f' + i, t: 'fin', l, x: rand(-160, -80), y: rand(-30, 30), z: rand(-60, 60), r: 12 }) })
  pol.forEach((l, i) => { n.push({ id: 'p' + i, t: 'pol', l, x: rand(80, 160), y: rand(-30, 30), z: rand(-60, 60), r: 11 }) })

  veh.forEach((_, i) => {
    const ai = Math.floor(Math.random() * ase.length)
    e.push({ a: 'v' + i, b: 'a' + ai, w: 0.9 })
    if (Math.random() > 0.5) e.push({ a: 'v' + i, b: 'f' + Math.floor(Math.random() * fin.length), w: 0.5 })
    if (Math.random() > 0.5) e.push({ a: 'v' + i, b: 'p' + Math.floor(Math.random() * pol.length), w: 0.5 })
    if (Math.random() > 0.6) e.push({ a: 'v' + i, b: 'r' + Math.floor(Math.random() * ret.length), w: 0.4 })
  })
  return { n, e }
}

export default function DataBridgePage() {
  const [user, setUser]               = useState<{ nombre: string; email: string } | null>(null)
  const [phase, setPhase]             = useState<'upload' | 'processing' | 'ready'>('upload')
  const [progPct, setProgPct]         = useState(0)
  const [progLabel, setProgLabel]     = useState('Detectando relaciones...')
  const [view, setView]               = useState<'3d' | 'top'>('3d')
  const [nodes, setNodes]             = useState<Node3D[]>([])
  const [edges, setEdges]             = useState<Edge3D[]>([])
  const [tooltip, setTooltip]         = useState<{ x: number; y: number; node: Node3D } | null>(null)
  const [stats, setStats]             = useState({ veh: 0, ase: 0, ret: 0, fin: 0, pol: 0 })

  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const camRef      = useRef({ rx: -25, ry: 30 })
  const dragRef     = useRef({ on: false, x: 0, y: 0 })
  const animRef     = useRef<number>(0)
  const nodesRef    = useRef<Node3D[]>([])
  const edgesRef    = useRef<Edge3D[]>([])
  const viewRef     = useRef<'3d' | 'top'>('3d')

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ email: data.user.email ?? '', nombre: (data.user.user_metadata?.full_name as string) || data.user.email?.split('@')[0] || '' })
    })
  }, [])

  const project = useCallback((x: number, y: number, z: number, W: number, H: number) => {
    if (viewRef.current === 'top') return { px: x + W / 2, py: -z + H / 2, depth: 1 }
    const rx = camRef.current.rx * Math.PI / 180
    const ry = camRef.current.ry * Math.PI / 180
    const y1 = y * Math.cos(rx) - z * Math.sin(rx)
    const z1 = y * Math.sin(rx) + z * Math.cos(rx)
    const x2 = x * Math.cos(ry) + z1 * Math.sin(ry)
    const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry)
    const fov = 500; const d = fov / (fov + z2 + 300)
    return { px: x2 * d + W / 2, py: y1 * d + H / 2, depth: z2 }
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

    const proj = ns.map(n => ({ ...n, ...project(n.x, n.y, n.z, W, H) }))
    proj.sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0))

    es.forEach(e => {
      const a = proj.find(n => n.id === e.a)
      const b = proj.find(n => n.id === e.b)
      if (!a || !b) return
      ctx.beginPath(); ctx.moveTo(a.px!, a.py!); ctx.lineTo(b.px!, b.py!)
      ctx.strokeStyle = 'rgba(128,128,128,0.15)'; ctx.lineWidth = e.w; ctx.stroke()
    })

    proj.forEach(n => {
      const c = COLORS[n.t]
      const scale = viewRef.current === '3d' ? (800 / (800 + (n.depth ?? 0) + 300)) : 1
      const r = n.r * scale
      ctx.beginPath(); ctx.arc(n.px!, n.py!, r + 3, 0, Math.PI * 2)
      ctx.fillStyle = c + '22'; ctx.fill()
      ctx.beginPath(); ctx.arc(n.px!, n.py!, r, 0, Math.PI * 2)
      ctx.fillStyle = c; ctx.fill()
      if (r > 10) {
        ctx.font = `500 11px system-ui`; ctx.fillStyle = 'rgba(0,0,0,0.75)'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(n.l.split(' ').map((w: string) => w[0]).join('').slice(0, 2), n.px!, n.py!)
      }
      if (r > 9) {
        ctx.font = `10px system-ui`; ctx.fillStyle = '#888'
        ctx.textBaseline = 'top'
        const label = n.l.length > 14 ? n.l.slice(0, 12) + '…' : n.l
        ctx.fillText(label, n.px!, n.py! + r + 3)
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.parentElement!.getBoundingClientRect()
      canvas.width  = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)
      draw()
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [draw])

  const startDemo = () => {
    setPhase('processing')
    const steps = ['Leyendo archivo...','Detectando columnas...','Mapeando relaciones...','Identificando llaves...','Construyendo grafo 3D...','Listo']
    let i = 0
    const iv = setInterval(() => {
      i++
      setProgPct(Math.round(i / steps.length * 100))
      setProgLabel(steps[Math.min(i, steps.length - 1)])
      if (i >= steps.length) {
        clearInterval(iv)
        setTimeout(() => {
          const d = genDemoData()
          setNodes(d.n); setEdges(d.e)
          setStats({
            veh: d.n.filter(n => n.t === 'veh').length,
            ase: d.n.filter(n => n.t === 'ase').length,
            ret: d.n.filter(n => n.t === 'ret').length,
            fin: d.n.filter(n => n.t === 'fin').length,
            pol: d.n.filter(n => n.t === 'pol').length,
          })
          setPhase('ready')
        }, 400)
      }
    }, 320)
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
    const hit = nodesRef.current.find(n => {
      const p = project(n.x, n.y, n.z, W, H)
      const s = view === '3d' ? (800 / (800 + (p.depth ?? 0) + 300)) : 1
      const dx = mx - p.px!; const dy = my - p.py!
      return dx * dx + dy * dy < (n.r * s + 6) ** 2
    })
    setTooltip(hit ? { x: Math.min(mx + 12, W - 170), y: Math.max(my - 60, 0), node: hit } : null)
  }

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
            <span style={{ background: 'linear-gradient(135deg,#0ea5e9,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>de tu inventario en 3D</span>
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, margin: 0, fontFamily: FONT_BODY }}>
            Subí tu Excel o CSV. La IA detecta columnas, relaciones y llaves automáticamente — y las visualiza en tiempo real.
          </p>
        </div>

        {/* Visualizador */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: FONT_BODY }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>Mapa de relaciones</span>
              <span style={{ fontSize: '11px', color: phase === 'ready' ? '#10b981' : '#64748b', background: phase === 'ready' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${phase === 'ready' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '999px', padding: '2px 10px', fontWeight: 600 }}>
                {phase === 'upload' ? 'Esperando datos' : phase === 'processing' ? 'Procesando...' : `${nodes.length} nodos · ${edges.length} relaciones`}
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
              </div>
            )}
          </div>

          {/* Canvas area */}
          <div
            style={{ position: 'relative', width: '100%', height: '400px', background: '#080f1a', borderRadius: '14px', overflow: 'hidden', cursor: phase === 'ready' ? 'grab' : 'default' }}
            onMouseMove={onMouseMove}
            onMouseDown={e => { if (phase !== 'ready') return; const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); dragRef.current = { on: true, x: e.clientX - rect.left, y: e.clientY - rect.top } }}
            onMouseUp={() => { dragRef.current.on = false }}
            onMouseLeave={() => { dragRef.current.on = false; setTooltip(null) }}
          >
            {/* Fondo de partículas */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(14,165,233,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(16,185,129,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

            {/* Upload state */}
            {phase === 'upload' && (
              <div
                onClick={startDemo}
                style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', zIndex: 5 }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>⬆</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', fontFamily: FONT }}>Subí tu inventario</div>
                <div style={{ fontSize: '13px', color: '#475569', fontFamily: FONT_BODY }}>Excel · CSV · JSON — o hacé click para ver demo</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {['Excel', 'CSV', 'JSON'].map(f => (
                    <span key={f} style={{ fontSize: '11px', color: '#334155', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '3px 10px', fontFamily: FONT_BODY }}>{f}</span>
                  ))}
                </div>
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
              <div style={{ position: 'absolute', left: tooltip.x, top: tooltip.y, background: 'rgba(13,27,46,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', pointerEvents: 'none', fontFamily: FONT_BODY, lineHeight: 1.6, zIndex: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: '2px' }}>{tooltip.node.l}</div>
                <div style={{ color: COLORS[tooltip.node.t] }}>{LABELS[tooltip.node.t]}</div>
                <div style={{ color: '#475569', marginTop: '2px' }}>{edges.filter(e => e.a === tooltip.node.id || e.b === tooltip.node.id).length} conexiones</div>
              </div>
            )}

            {/* Hint */}
            {phase === 'ready' && (
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '11px', color: '#334155', fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: '4px' }}>
                🖱 arrastrá para rotar
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '14px' }}>
            {Object.entries(COLORS).map(([k, c]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontFamily: FONT_BODY }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, flexShrink: 0 }} />
                {LABELS[k]}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        {phase === 'ready' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '20px' }}>
            {([['veh','Vehículos'],['ase','Asesores'],['ret','Retomas'],['fin','Financiaciones'],['pol','Pólizas']] as const).map(([k, label]) => (
              <div key={k} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontFamily: FONT, fontSize: '24px', fontWeight: 800, color: COLORS[k] }}>{stats[k]}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px', fontFamily: FONT_BODY }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* CTA subir archivo real */}
        {phase === 'ready' && (
          <div style={{ background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px', fontFamily: FONT }}>Subí tu inventario real</div>
              <div style={{ fontSize: '13px', color: '#475569', fontFamily: FONT_BODY }}>La IA mapea tus datos reales — vehículos, asesores, retomas, financiación y pólizas — en segundos.</div>
            </div>
            <label style={{ padding: '11px 20px', borderRadius: '10px', background: 'linear-gradient(135deg,#0ea5e9,#10b981)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
              Subir archivo →
              <input type="file" accept=".xlsx,.csv,.json" style={{ display: 'none' }} onChange={() => { setPhase('upload'); setTimeout(startDemo, 300) }} />
            </label>
          </div>
        )}
      </div>
    </PulseAppShell>
  )
}
