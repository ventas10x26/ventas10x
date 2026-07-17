'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useReveal } from '@/hooks/useReveal'
import { useCountUp } from '@/hooks/useCountUp'
import { useScrollProgress } from '@/hooks/useScrollProgress'

// Las variables --font-oswald / --font-mono / --font-inter las define next/font/google
// en src/app/pulse/layout.tsx (autohospedadas en build time). Titulares en Inter bold
// mixta (no uppercase) — ver skill pulsemotor-design, arquetipo "copiloto autónomo 360°".
const F_DISPLAY = "var(--font-inter), sans-serif"
const F_MONO    = "var(--font-mono), monospace"
const F_BODY    = "var(--font-inter), sans-serif"

// ─── Timeline de tool-calls (elemento de firma) — traza real de ejecución del agente ───
// El chip de color de cada función espeja el mismo color de su categoría en Ecosistema 360°,
// creando un hilo visual entre el hero y el grid (misma paleta de "Chips de categoría" de tokens.md).
const TOOL_CALLS = [
  { fn:'tasar_retoma',          ms:18, chip:'#FB7185' }, // Retomas
  { fn:'calcular_financiacion', ms:12, chip:'#A78BFA' }, // Financiación
  { fn:'cotizar_poliza',        ms:9,  chip:'#818CF8' }, // Pólizas
  { fn:'reservar_inventario',   ms:7,  chip:'#4C8DFF' }, // Vehículos nuevos
]

const LOGOS = ['AutoVía', 'MotorCorp', 'Grupo Andina', 'Pacífico Cars', 'Flota Pro', 'Virtue Motors']

const NAV_ITEMS = [
  { label:'Plataforma', id:'plataforma' },
  { label:'Ecosistema 360°', id:'ecosistema' },
  { label:'Segmentos', id:'segmentos' },
  { label:'Precios', id:'precios' },
]

const POR_QUE = [
  'Responde en segundos, no en horas',
  'Cotiza financiación y pólizas sin transferir la conversación',
  'Aprende el tono y los precios de tu concesionario',
  'Corre en tu WhatsApp Business de siempre, sin número nuevo',
  'Deja registro auditable de cada decisión que toma',
  'Se despliega en días, no en meses',
]

// ─── Cobertura 24/7 — mismo lenguaje visual del timeline/bitácora, aplicado a franjas horarias ───
const COBERTURA = [
  { rango:'00:00 – 06:00', evento:'Retoma tasada · Sedán 2020' },
  { rango:'06:00 – 12:00', evento:'Cita agendada · Test drive' },
  { rango:'12:00 – 18:00', evento:'Financiación pre-aprobada · 48m' },
  { rango:'18:00 – 24:00', evento:'Póliza cotizada · Todo riesgo' },
]

// Chips de color decorativos por categoría (estilo Platzi) — solo para íconos de grids
// catalogados, nunca para texto/CTA/fondo de sección. Ver "Chips de categoría" en tokens.md.
const CUMPLIMIENTO = [
  { icon:'🔒', label:'Cifrado end-to-end', chip:'#4C8DFF' },
  { icon:'✅', label:'WhatsApp Business API verificado', chip:'#2DD4BF' },
  { icon:'🌎', label:'Datos alojados en LatAm', chip:'#A78BFA' },
  { icon:'📋', label:'Cumplimiento Habeas Data (Ley 1581)', chip:'#FB7185' },
  { icon:'🧾', label:'Auditoría exportable', chip:'#818CF8' },
  { icon:'🔑', label:'Control de acceso por rol', chip:'#F2A93B' },
]

// ─── Ecosistema 360° — catálogo de puntos de fricción cubiertos, no pasos secuenciales ───
const ECOSISTEMA = [
  { num:'01', icon:'🚗', titulo:'Vehículos nuevos', desc:'Inventario en vivo y todas las versiones cotizadas en segundos.', chip:'#4C8DFF' },
  { num:'02', icon:'%',  titulo:'Financiación',     desc:'Simulaciones y pre-aprobaciones con aliados bancarios integrados.', chip:'#A78BFA' },
  { num:'03', icon:'＋', titulo:'Accesorios',        desc:'Upselling contextual según modelo, uso y perfil del comprador.', chip:'#2DD4BF' },
  { num:'04', icon:'⇄',  titulo:'Retomas',           desc:'Tasación asistida por IA con histórico de mercado y estado real.', chip:'#FB7185' },
  { num:'05', icon:'🛡', titulo:'Pólizas',           desc:'Todo riesgo y colisión cotizadas y emitidas dentro del mismo flujo.', chip:'#818CF8' },
]

const SEGMENTS = [
  {
    tag:'Enterprise', tagColor:'amber', titulo:'Concesionario', subtitulo:'Fuerza de ventas · Inventario multi-punto',
    desc:'Orquesta decenas de asesores, integra tu DMS y captura cada oportunidad — incluso las que llegan a las 2 AM.',
    bullets:['Subís tu DMS o Excel — la IA arma el diagrama de tablas automáticamente (DataBridge)', 'Panel director con atribución 360° por asesor', 'Ruteo inteligente de leads por sucursal o stock', 'Auditoría completa de conversaciones y compliance'],
    cta:'Explorar plan Enterprise', href:'/pulse/databridge', ctaClass:'pm-btn-outline', diagram:true,
  },
  {
    tag:'Pro', tagColor:'green', titulo:'Vendedor individual', subtitulo:'Asesor independiente · Alto volumen',
    desc:'Tu copiloto personal en WhatsApp. Cotiza, retoma y cierra sin depender del área de crédito.',
    bullets:['Copiloto integrado a tu WhatsApp Business', 'Cotización de póliza y financiación en segundos', 'Agenda automática de citas y test drives', 'Cobra desde $49 USD/mes — sin costos por lead'],
    cta:'Empezar gratis 14 días', href:'/pulse/signup', ctaClass:'pm-btn', diagram:false,
  },
]

// ─── Preview de DataBridge (/pulse/databridge): mini diagrama de tablas detectadas por IA,
// prueba visual real de "conectá tu DMS/Excel" para el segmento Concesionario ───
const DB_NODES = [
  { id:'leads',         label:'leads',         x:50, y:10, chip:'#4C8DFF' },
  { id:'clientes',      label:'clientes',      x:86, y:34, chip:'#2DD4BF' },
  { id:'inventario',    label:'inventario',    x:70, y:74, chip:'#A78BFA' },
  { id:'financiacion',  label:'financiación',  x:30, y:74, chip:'#FB7185' },
  { id:'polizas',       label:'pólizas',       x:14, y:34, chip:'#818CF8' },
]
const DB_LINKS: [string,string][] = [
  ['leads','clientes'], ['leads','polizas'], ['leads','inventario'],
  ['clientes','inventario'], ['inventario','financiacion'], ['financiacion','polizas'],
]

const PRICING_PLANS = {
  individual: [
    {
      nombre:'Starter', precio:'$49', periodo:'/mes', para:'Para asesores que están empezando',
      bullets:['Copiloto en tu WhatsApp Business', 'Cotización de financiación y pólizas', 'Hasta 100 leads/mes', 'Soporte por chat'],
      cta:'Empezar gratis 14 días', href:'/pulse/signup', destacado:false,
    },
    {
      nombre:'Pro', precio:'$99', periodo:'/mes', para:'Para alto volumen, sin límites',
      bullets:['Todo lo de Starter', 'Leads ilimitados', 'Agenda automática de test drives', 'Reportes de conversión semanales'],
      cta:'Empezar gratis 14 días', href:'/pulse/signup', destacado:true,
    },
  ],
  concesionario: [
    {
      nombre:'Team', precio:'$199', periodo:'/mes', para:'Hasta 5 asesores',
      bullets:['Panel director con atribución por asesor', 'Ruteo inteligente de leads', 'Integración WhatsApp Business', 'Auditoría de conversaciones'],
      cta:'Solicitar acceso', href:'/pulse/databridge', destacado:false,
    },
    {
      nombre:'Enterprise', precio:'A medida', periodo:'', para:'6 a 50+ asesores',
      bullets:['Todo lo de Team', 'Integración con tu DMS (Siigo, SAP)', 'HubSpot / Salesforce nativo', 'Onboarding dedicado y SLA'],
      cta:'Hablar con ventas', href:'/pulse/databridge', destacado:true,
    },
  ],
} as const

const STATS_V2 = [
  { val:'147', delta:'+12%', label:'Leads atendidos hoy' },
  { val:'38',  delta:'+11%', label:'Retomas tasadas' },
  { val:'24',  delta:'+14%', label:'Pólizas cotizadas' },
  { val:'89%', delta:'+5pt', label:'Cierre asistido' },
]

const AUDIT_LOG = [
  { time:'14:22:41', evento:'Nuevo lead · SUV Híbrida',            canal:'WhatsApp',           estado:'Bajo cierre',  ok:false },
  { time:'13:51:03', evento:'Retoma valorada · Sedán 2019',        canal:'Portal web',         estado:'Tasado',       ok:true  },
  { time:'14:09:12', evento:'Póliza todo riesgo cotizada',         canal:'Chat DMS',           estado:'Enviado',      ok:true  },
  { time:'14:19:55', evento:'Financiación pre-aprobada · 72m',     canal:'Aliado bancario',    estado:'Aprobado',     ok:true  },
  { time:'14:18:07', evento:'Cita agendada · Test drive',          canal:'Concesionario Norte',estado:'Confirmado',   ok:true  },
  { time:'14:17:16', evento:'Cross-sell · Kit accesorios tech',    canal:'Ecommerce #1843',    estado:'Cerrado',      ok:true  },
]

const INTEGRACIONES = [
  { name:'WhatsApp Business',    chip:'#4C8DFF' },
  { name:'Siigo · SAP DMS',      chip:'#818CF8' },
  { name:'Aliados financieros',  chip:'#A78BFA' },
  { name:'Aseguradoras LATAM',   chip:'#FB7185' },
  { name:'Portal de accesorios', chip:'#2DD4BF' },
  { name:'HubSpot · Salesforce', chip:'#4C8DFF' },
]

const TESTIMONIOS_V2 = [
  { seg:'Concesionario · 32 agentes', texto:'El agente configuró la financiación y la póliza de un cliente a las 2 AM. El lunes a las 8 AM solo tuvimos que imprimir el contrato.', nombre:'Ricardo Mendoza', cargo:'Gerente Comercial · Grupo Andina' },
  { seg:'Vendedor individual · Medellín', texto:'Cerré tres retomas en una semana yo solo. Antes eso me tomaba un mes coordinando con crédito y seguros.', nombre:'Laura Betancur', cargo:'Asesora Comercial · Independiente' },
]

function DataBridgeMiniDiagram() {
  return (
    <div style={{ position:'relative', height:'150px', padding:'14px' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} aria-hidden="true">
        {DB_LINKS.map(([a,b],i) => {
          const na = DB_NODES.find(n=>n.id===a)!, nb = DB_NODES.find(n=>n.id===b)!
          return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="var(--line)" strokeWidth="0.6" strokeDasharray="2,2" />
        })}
      </svg>
      {DB_NODES.map(n => (
        <div key={n.id} style={{ position:'absolute', left:`${n.x}%`, top:`${n.y}%`, transform:'translate(-50%,-50%)', display:'flex', alignItems:'center', gap:'5px', background:'var(--bg-2)', border:`1px solid ${n.chip}66`, borderRadius:'4px', padding:'4px 8px', fontFamily:F_MONO, fontSize:'10px', color:'var(--ink)', whiteSpace:'nowrap' }}>
          <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:n.chip, flexShrink:0 }} />{n.label}
        </div>
      ))}
    </div>
  )
}

function SchemaPreview() {
  return (
    <div className="panel" style={{ marginBottom:'22px' }}>
      <div className="panel-head"><span>DataBridge · Esquema detectado</span><span style={{ color:'var(--green)' }}>✓ 5 tablas</span></div>
      <DataBridgeMiniDiagram />
    </div>
  )
}

function StatCell({ val, delta, label, active, delayMs }: { val: string; delta: string; label: string; active: boolean; delayMs: number }) {
  const displayed = useCountUp(val, active)
  return (
    <div className={`reveal stat-cell${active?' in':''}`} style={{ transitionDelay:`${delayMs}ms` }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:'8px' }}>
        <span className="grad-amber" style={{ fontFamily:F_DISPLAY, fontSize:'32px', fontWeight:800 }}>{displayed}</span>
        <span style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--green)' }}>{delta}</span>
      </div>
      <div style={{ fontSize:'12px', color:'var(--ink-dim)', marginTop:'4px' }}>{label}</div>
    </div>
  )
}

export default function PulseMotorLanding() {
  const [usuarioLogueado, setUsuarioLogueado] = useState<string|null>(null)
  const [visible, setVisible]                 = useState(false)
  const [toolCallsVisible, setToolCallsVisible] = useState<number[]>([])
  const [activeSection, setActiveSection]     = useState('plataforma')
  const [pricingSegment, setPricingSegment]   = useState<'individual'|'concesionario'>('individual')
  const supabase = createClient()

  const heroScroll      = useScrollProgress<HTMLDivElement>()
  const heroPanel      = useReveal<HTMLDivElement>()
  const logosReveal     = useReveal<HTMLDivElement>()
  const porQueText      = useReveal<HTMLDivElement>()
  const coberturaPanel  = useReveal<HTMLDivElement>()
  const ecoHeader       = useReveal<HTMLDivElement>()
  const ecoGrid         = useReveal<HTMLDivElement>()
  const segHeader       = useReveal<HTMLDivElement>()
  const segGrid         = useReveal<HTMLDivElement>()
  const activityHeader  = useReveal<HTMLDivElement>()
  const statsReveal     = useReveal<HTMLDivElement>()
  const auditLog        = useReveal<HTMLDivElement>()
  const integHeader     = useReveal<HTMLDivElement>()
  const integGrid       = useReveal<HTMLDivElement>()
  const testiHeader     = useReveal<HTMLDivElement>()
  const testiGrid       = useReveal<HTMLDivElement>()
  const cumpleHeader    = useReveal<HTMLDivElement>()
  const cumpleGrid      = useReveal<HTMLDivElement>()
  const ctaFinal        = useReveal<HTMLDivElement>()
  const pricingGrid     = useReveal<HTMLDivElement>()

  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t) }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUsuarioLogueado(data.user.email ?? data.user.id)
    })
  }, [])

  // Scroll-spy: resalta en el nav la sección que está cruzando el centro del viewport.
  useEffect(() => {
    const els = NAV_ITEMS.map(item => document.getElementById(item.id)).filter((el): el is HTMLElement => !!el)
    if (!els.length) return
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id) }) },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Timeline de tool-calls: se revela fila por fila cuando el panel del hero entra en viewport.
  useEffect(() => {
    if (!heroPanel.inView) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setToolCallsVisible(TOOL_CALLS.map((_,i)=>i)); return }
    const timers = TOOL_CALLS.map((_, i) => setTimeout(() => setToolCallsVisible(prev => [...prev, i]), 600 + i * 350))
    return () => timers.forEach(clearTimeout)
  }, [heroPanel.inView])

  const v = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  })

  // Hero pineado (scroll-jacking): "grow" agranda el panel de tool-calls como si fuera
  // el video reproduciéndose; "tilt" lo inclina en 3D y cruza al esquema real de DataBridge.
  // El mockup inclinado muestra siempre trabajo real (DataBridge), nunca un dispositivo
  // genérico decorativo — ver regla dura 2 de la skill pulsemotor-design.
  const heroP = heroScroll.progress
  const grow = Math.min(1, Math.max(0, (heroP - 0.12) / 0.38))
  const tilt = Math.min(1, Math.max(0, (heroP - 0.55) / 0.4))
  const crossfade = Math.min(1, Math.max(0, (tilt - 0.25) / 0.75))

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg-0:#0B0D0C; --bg-1:#14120F; --bg-2:#1B1815; --bg-3:#241F1A; --bg-4:#2D2721; --line:#2A2620;
          --ink:#F3EFE7; --ink-dim:#9B958A;
          --amber:#F2A93B; --amber-2:#C9770B; --amber-dim:#8A6423; --green:#3ECF7E; --red:#E5484D;
          --grad-amber: linear-gradient(135deg, var(--amber), var(--amber-2));
          --green-2:#0F3D2B;
          --grad-green: linear-gradient(135deg, var(--green-2), var(--green));
          --ease-out-expo: cubic-bezier(.16,1,.3,1);
        }
        body { background: var(--bg-0); }
        ::selection { background:rgba(242,169,59,0.35); color:#fff; }

        /* ── Ritmo de fondo entre secciones: tonos oscuros graduados + un momento en vivo ──
           Los componentes ya leen todo su color de estas variables, así que alcanza con
           redefinirlas en el ancestro de cada sección — cascadean solas al resto del árbol. */
        .section-dim {
          background: var(--bg-2);
          --bg-1: var(--bg-3);
        }
        .section-dim-2 {
          background: var(--bg-3);
          --bg-1: var(--bg-4);
        }
        /* Momento "en vivo": eleva el verde de estado a degradé de sección — no es un hue nuevo,
           es la misma semántica de "activo/en vivo" ya usada en el punto pulsante, ahora a escala hero.
           Las celdas/paneles flotan como vidrio esmerilado oscuro encima del degradé (mismo patrón que
           usa el ámbar en el hero), así el contenido interno sigue leyendo con los tokens normales. */
        .section-live {
          background: var(--grad-green);
          --bg-1: rgba(6,20,14,0.55); --bg-2: rgba(6,20,14,0.75); --line: rgba(255,255,255,0.16);
          --ink: #FFFFFF; --ink-dim: rgba(255,255,255,0.72);
        }

        .grad-amber { background-image:var(--grad-amber); -webkit-background-clip:text; background-clip:text; color:transparent; -webkit-text-fill-color:transparent; }

        .guard-sweep { position:relative; }
        .guard-sweep::before {
          content:''; position:absolute; inset:-60%; z-index:-1; border-radius:50%; pointer-events:none;
          background: conic-gradient(from 0deg, transparent 0deg, rgba(242,169,59,0.18) 18deg, transparent 50deg);
          animation: guardSweep 9s linear infinite;
        }
        @keyframes guardSweep { to { transform: rotate(360deg); } }

        .pm-input { width:100%; padding:13px 16px; border-radius:6px; border:1.5px solid var(--line); background:rgba(255,255,255,0.02); color:var(--ink); font-size:15px; font-family:${F_BODY}; outline:none; transition:border-color .15s; }
        .pm-input:focus { border-color:var(--amber-dim); }
        .pm-input::placeholder { color:var(--ink-dim); }

        .pm-btn { width:100%; padding:14px; border-radius:6px; border:1px solid var(--amber); background:var(--amber); color:#1a1204; font-size:14px; font-weight:700; cursor:pointer; font-family:${F_DISPLAY}; transition:background-color .15s, transform .15s, box-shadow .15s; }
        .pm-btn:hover:not(:disabled) { background:#ffc266; border-color:#ffc266; transform:translateY(-1px); box-shadow:0 4px 16px rgba(242,169,59,0.35); }
        .pm-btn:disabled { opacity:.5; cursor:not-allowed; }
        .pm-btn-ghost { background:transparent; border:1px solid var(--line); color:var(--ink); transition:border-color .15s, background-color .15s, transform .15s; }
        .pm-btn-ghost:hover:not(:disabled) { border-color:var(--ink-dim); background:rgba(255,255,255,0.04); transform:translateY(-1px); }
        .pm-btn-outline { background:transparent; border:1.5px solid var(--amber-dim); color:var(--amber); transition:border-color .2s ease, background-color .2s ease, color .2s ease, transform .2s ease, box-shadow .2s ease; }
        .pm-btn-outline:hover:not(:disabled) { border-color:var(--amber); background:rgba(242,169,59,0.08); color:var(--ink); transform:translateY(-1px); box-shadow:0 4px 16px rgba(242,169,59,0.2); }

        .btn-arrow { display:inline-block; margin-left:6px; transition:transform .2s var(--ease-out-expo); }
        a:hover .btn-arrow, button:hover .btn-arrow { transform:translateX(4px); }

        .link-arrow { display:inline-flex; align-items:center; }

        .badge { display:inline-flex; align-items:center; gap:10px; border:1px solid var(--line); border-radius:3px; padding:6px 12px; font-family:${F_MONO}; font-size:12px; text-transform:uppercase; letter-spacing:1px; color:var(--ink-dim); }
        .live-dot { width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow:0 0 0 0 rgba(62,207,126,0.6); animation:livePulse 2s ease infinite; flex-shrink:0; }
        @keyframes livePulse { 0%{box-shadow:0 0 0 0 rgba(62,207,126,0.55)} 70%{box-shadow:0 0 0 6px rgba(62,207,126,0)} 100%{box-shadow:0 0 0 0 rgba(62,207,126,0)} }
        /* Sobre el degradé verde el punto verde se pierde — versión blanca para el badge "en vivo" de esa sección */
        .live-dot.on-gradient { background:#fff; animation-name:livePulseWhite; }
        @keyframes livePulseWhite { 0%{box-shadow:0 0 0 0 rgba(255,255,255,0.55)} 70%{box-shadow:0 0 0 6px rgba(255,255,255,0)} 100%{box-shadow:0 0 0 0 rgba(255,255,255,0)} }

        .kicker { display:inline-flex; align-items:center; gap:6px; font-family:${F_MONO}; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--amber); margin-bottom:14px; }

        .grid-shared { display:grid; gap:1px; background:var(--line); border:1px solid var(--line); border-radius:6px; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,0.3); }
        .grid-shared > * { background:var(--bg-1); padding:24px; transition:background-color .25s ease; backdrop-filter:blur(10px); }

        .reveal { opacity:0; transform:translateY(28px) scale(.98); transition:opacity .8s var(--ease-out-expo), transform .8s var(--ease-out-expo); }
        .reveal.in { opacity:1; transform:translateY(0) scale(1); }

        .panel { border:1px solid var(--line); border-radius:6px; overflow:hidden; box-shadow:0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3); background:var(--bg-1); backdrop-filter:blur(10px); }
        .panel-head { display:flex; align-items:center; justify-content:space-between; padding:12px 18px; border-bottom:1px solid var(--line); font-family:${F_MONO}; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--ink-dim); }
        .log-row { display:grid; grid-template-columns:90px 1fr 150px 120px; gap:16px; align-items:center; padding:13px 18px; border-bottom:1px solid var(--line); font-size:13px; opacity:0; transform:translateY(6px); transition:opacity .5s ease, transform .5s ease; }
        .log-row:last-child { border-bottom:none; }
        .log-row.in { opacity:1; transform:translateY(0); }
        .log-time, .log-canal { font-family:${F_MONO}; color:var(--ink-dim); font-size:12px; }
        .log-evento { color:var(--ink); }
        .log-estado { font-family:${F_MONO}; font-size:11px; text-transform:uppercase; letter-spacing:.5px; text-align:right; }
        .log-estado.ok { color:var(--green); }
        .log-estado.pend { color:var(--amber); }

        .tool-row { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-bottom:1px solid var(--line); font-family:${F_MONO}; font-size:13px; opacity:0; transform:translateX(-8px); transition:opacity .4s ease, transform .4s ease; }
        .tool-row:last-child { border-bottom:none; }
        .tool-row.in { opacity:1; transform:translateX(0); }
        .tool-row .fn { color:var(--ink); }
        .tool-row .ms { color:var(--ink-dim); display:flex; align-items:center; gap:8px; }

        /* Pista de progreso del trámite: el auto avanza a medida que se ejecutan los tool-calls */
        .tool-road { position:relative; height:16px; margin:2px 18px 10px; }
        .tool-road::before { content:''; position:absolute; top:50%; left:2px; right:2px; height:0; border-top:2px dashed var(--line); transform:translateY(-50%); }
        .tool-road-car { position:absolute; top:50%; font-size:15px; line-height:1; transform:translate(-50%,-50%); transition:left .5s var(--ease-out-expo); filter:drop-shadow(0 1px 2px rgba(0,0,0,.5)); }

        .seg-card { border:1px solid var(--line); border-radius:6px; padding:32px; background:var(--bg-1); transition:opacity .8s var(--ease-out-expo), transform .25s var(--ease-out-expo), box-shadow .25s ease, border-color .25s ease; }
        .seg-card:hover { transform:translateY(-8px); box-shadow:0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3); }
        .seg-card-amber { position:relative; overflow:hidden; background:linear-gradient(180deg, rgba(242,169,59,0.05) 0%, var(--bg-1) 220px); }
        .seg-card-amber::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--grad-amber); }
        .seg-card-amber::after { content:''; position:absolute; top:-70px; right:-70px; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle, rgba(242,169,59,0.14) 0%, transparent 70%); pointer-events:none; }
        .seg-card-amber:hover { border-color:var(--amber-dim); }
        .seg-card-green { position:relative; overflow:hidden; background:linear-gradient(180deg, rgba(62,207,126,0.05) 0%, var(--bg-1) 220px); }
        .seg-card-green::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--grad-green); }
        .seg-card-green::after { content:''; position:absolute; top:-70px; right:-70px; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle, rgba(62,207,126,0.14) 0%, transparent 70%); pointer-events:none; }
        .seg-card-green:hover { border-color:rgba(62,207,126,0.4); }
        .seg-tag { display:inline-flex; font-family:${F_MONO}; font-size:11px; text-transform:uppercase; letter-spacing:1px; padding:3px 10px; border-radius:3px; margin-bottom:16px; }
        .seg-tag.amber { color:var(--amber); border:1px solid var(--amber-dim); }
        .seg-tag.green { color:var(--green); border:1px solid rgba(62,207,126,0.4); }
        .seg-check { display:flex; gap:10px; align-items:baseline; padding:6px 0; font-size:13px; color:var(--ink-dim); }
        .seg-check .mark { color:var(--green); font-family:${F_MONO}; flex-shrink:0; }

        .quote-card { border:1px solid var(--line); border-radius:6px; padding:28px; background:var(--bg-1); transition:opacity .8s var(--ease-out-expo), transform .25s var(--ease-out-expo), box-shadow .25s ease, border-color .25s ease; }
        .quote-card:hover { transform:translateY(-4px); box-shadow:0 16px 32px rgba(0,0,0,0.35); border-color:var(--line); }

        .eco-cell { transition:opacity .8s var(--ease-out-expo), transform .25s var(--ease-out-expo), background-color .25s ease; }
        .eco-cell:hover { transform:translateY(-4px); background:var(--bg-2); }
        .eco-icon { display:inline-block; transition:transform .25s var(--ease-out-expo); }
        .eco-cell:hover .eco-icon { transform:scale(1.18); }

        .integ-item { transition:opacity .8s var(--ease-out-expo), transform .2s var(--ease-out-expo); }
        .integ-item:hover { transform:translateY(-3px); }
        .integ-icon { transition:border-color .2s ease, color .2s ease; }
        .integ-item:hover .integ-icon { border-color:var(--amber-dim); color:var(--amber); }

        .stat-cell { transition:opacity .8s var(--ease-out-expo), transform .2s var(--ease-out-expo); }
        .stat-cell:hover { transform:translateY(-2px); }

        .log-row-data { transition:background-color .2s ease, opacity .5s ease, transform .5s ease; }
        .log-row-data:hover { background:var(--bg-2); }

        .pm-nav-link { position:relative; padding-bottom:4px; color:var(--ink-dim); transition:color .2s ease; }
        .pm-nav-link::after { content:''; position:absolute; left:0; bottom:0; width:0; height:1px; background:var(--amber); transition:width .25s var(--ease-out-expo); }
        .pm-nav-link:hover { color:var(--ink); }
        .pm-nav-link:hover::after { width:100%; }
        .pm-nav-link.active { color:var(--amber); }
        .pm-nav-link.active::after { width:100%; }

        .logos-marquee { overflow:hidden; -webkit-mask-image:linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image:linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
        .logos-track { display:flex; align-items:center; gap:56px; width:max-content; animation:logosScroll 26s linear infinite; }
        .logos-track span { flex-shrink:0; transition:color .2s ease; }
        .logos-track span:hover { color:var(--ink); }
        @keyframes logosScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .scroll-cue { display:inline-flex; flex-direction:column; align-items:center; gap:6px; text-decoration:none; color:var(--ink-dim); font-family:${F_MONO}; font-size:11px; letter-spacing:.5px; text-transform:uppercase; animation:cueBounce 2.2s ease-in-out infinite; transition:color .2s ease; }
        .scroll-cue:hover { color:var(--amber); }
        @keyframes cueBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }

        .cta-spotlight { position:relative; }
        .cta-spotlight::before { content:''; position:absolute; inset:-60px -20px; z-index:-1; background:radial-gradient(ellipse 60% 70% at center, rgba(242,169,59,0.10), transparent 70%); pointer-events:none; }

        .pricing-toggle { display:inline-flex; border:1px solid var(--line); border-radius:8px; padding:4px; gap:4px; background:var(--bg-1); }
        .pricing-toggle button { border:none; background:transparent; color:var(--ink-dim); font-family:${F_BODY}; font-size:13px; font-weight:600; padding:9px 18px; border-radius:6px; cursor:pointer; transition:background-color .2s ease, color .2s ease; }
        .pricing-toggle button.active { background:var(--amber); color:#1a1204; }

        .price-card { border:1px solid var(--line); border-radius:6px; padding:32px; background:var(--bg-1); position:relative; text-align:left; transition:opacity .8s var(--ease-out-expo), transform .25s var(--ease-out-expo), box-shadow .25s ease, border-color .25s ease; }
        .price-card:hover { transform:translateY(-4px); box-shadow:0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3); }
        .price-card.destacado { border-color:var(--amber-dim); box-shadow:0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3); }
        .price-card .badge-rec { position:absolute; top:-11px; left:32px; background:var(--amber); color:#1a1204; font-family:${F_MONO}; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; padding:4px 10px; border-radius:3px; }
        .price-card .precio-row { display:flex; align-items:baseline; gap:6px; margin:12px 0 4px; }
        .price-card .precio-num { font-family:${F_DISPLAY}; font-size:36px; font-weight:800; color:var(--ink); }
        .price-card .precio-per { font-family:${F_MONO}; font-size:13px; color:var(--ink-dim); }

        @media(max-width:640px){
          .pricing-toggle{ width:100%; }
          .pricing-toggle button{ flex:1; }
        }

        .footer-col a { display:block; color:var(--ink-dim); text-decoration:none; font-size:13px; padding:5px 0; transition:color .15s ease; }
        .footer-col a:hover { color:var(--ink); }
        .footer-col h4 { font-family:${F_MONO}; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--ink-dim); margin-bottom:12px; }
        @media(max-width:700px){
          .footer-grid{ grid-template-columns:1fr 1fr!important; }
        }

        @media (prefers-reduced-motion: reduce) {
          .live-dot, .guard-sweep::before { animation:none; }
          .log-row, .reveal, .tool-row { transition:none; opacity:1; transform:none; }
          .pm-btn:hover:not(:disabled) { transform:none; }
          .logos-track { animation:none; }
          .scroll-cue { animation:none; }
          .btn-arrow, .eco-cell, .eco-icon, .integ-item, .integ-icon, .quote-card, .stat-cell, .log-row-data, .pm-nav-link::after, .price-card, .seg-card, .tool-road-car { transition:none; }
        }

        @media(max-width:700px){
          .pm-nav{display:none!important}
        }
        @media(max-width:900px){
          .hero-grid{flex-direction:column!important;align-items:center!important}
          .hero-grid>*{max-width:100%!important;width:100%!important}
          .eco-grid{grid-template-columns:1fr 1fr!important}
          .seg-grid{grid-template-columns:1fr!important}
          .stats-grid{grid-template-columns:1fr 1fr!important}
          .integ-grid{grid-template-columns:1fr 1fr!important}
          .testi-grid{grid-template-columns:1fr!important}
          .log-row{grid-template-columns:70px 1fr!important}
          .log-row .log-canal, .log-row .log-estado{display:none}
        }
      `}</style>

      <div style={{ minHeight:'100vh', background:'var(--bg-0)', color:'var(--ink)', fontFamily:F_BODY, lineHeight:1.5 }}>

        {/* HEADER */}
        <header style={{ position:'sticky', top:0, zIndex:100, padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:'1140px', margin:'0 auto', background:'rgba(11,13,12,0.85)', backdropFilter:'blur(10px)', borderBottom:'1px solid var(--line)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'10px', height:'10px', background:'var(--amber)', borderRadius:'2px' }} />
            <span style={{ fontSize:'16px', fontWeight:800, fontFamily:F_DISPLAY, color:'var(--ink)' }}>Pulse Motor</span>
          </div>
          <nav style={{ display:'flex', alignItems:'center', gap:'28px' }} className="pm-nav">
            {NAV_ITEMS.map(item => (
              <a key={item.id} href={`#${item.id}`} style={{ fontSize:'13px', textDecoration:'none' }} className={`pm-nav-link${activeSection===item.id?' active':''}`}>{item.label}</a>
            ))}
          </nav>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {usuarioLogueado ? (
              <a href="/pulse/agente" className="pm-btn" style={{ width:'auto', display:'inline-flex', textDecoration:'none', padding:'10px 18px', fontSize:'13px' }}>Mi agente<span className="btn-arrow">→</span></a>
            ) : (
              <>
                <a href="/pulse/login" className="pm-btn pm-btn-ghost" style={{ width:'auto', display:'inline-flex', textDecoration:'none', padding:'9px 16px', fontSize:'12px' }}>Login</a>
                <a href="/pulse/signup" className="pm-btn" style={{ width:'auto', display:'inline-flex', textDecoration:'none', padding:'9px 18px', fontSize:'12px' }}>Ser agente<span className="btn-arrow">→</span></a>
              </>
            )}
          </div>
        </header>

        {/* HERO — sección pineada: el panel de tool-calls se agranda "reproduciéndose"
            y después se inclina en 3D revelando el esquema real de DataBridge, al ritmo
            del scroll. Con prefers-reduced-motion queda como el hero estático de siempre. */}
        <div ref={heroScroll.ref} style={heroScroll.reduced ? undefined : { height:'300vh', position:'relative' }}>
        <section id="plataforma" style={heroScroll.reduced ? { maxWidth:'1140px', margin:'0 auto', padding:'64px 24px 40px' } : {
          position:'sticky', top:0, height:'100vh', overflow:'hidden',
          maxWidth:'1140px', margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center',
        }}>
          <div className="hero-grid" style={{ display:'flex', gap:'56px', alignItems:'center', width:'100%' }}>
            <div style={heroScroll.reduced ? { flex:'1', minWidth:'320px' } : {
              flex:'1', minWidth:'320px',
              opacity: 1 - Math.min(1, grow / 0.7),
              transform: `translateY(${-28 * grow}px)`,
              pointerEvents: grow > 0.6 ? 'none' : undefined,
            }}>
              <div style={{ ...v(100), marginBottom:'24px' }}>
                <span className="badge guard-sweep"><span className="live-dot" />Agente activo · 24/7/365</span>
              </div>
              <h1 style={{ ...v(250), fontFamily:F_DISPLAY, fontSize:'clamp(44px,6.2vw,80px)', fontWeight:800, lineHeight:1.02, letterSpacing:'-1.5px', margin:'0 0 20px', color:'var(--ink)' }}>
                El copiloto que <span className="grad-amber">nunca deja de cerrar.</span>
              </h1>
              <p style={{ ...v(400), fontSize:'clamp(16px,1.6vw,18px)', color:'var(--ink-dim)', maxWidth:'520px', margin:'0 0 28px', lineHeight:1.65 }}>
                Pulse Motor despliega agentes autónomos que gestionan cada lead del sector automotriz: vehículo nuevo, versiones, financiación, accesorios, retomas y pólizas — todo el contexto 360° en una sola conversación.
              </p>
              <div style={{ ...v(550), display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'20px' }}>
                <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', padding:'14px 28px', textDecoration:'none' }}>Desplegar agente<span className="btn-arrow">→</span></a>
                <a href="#ecosistema" className="pm-btn pm-btn-ghost" style={{ display:'inline-flex', width:'auto', padding:'14px 24px', textDecoration:'none' }}>Ver arquitectura</a>
              </div>
              <p style={{ ...v(700), fontSize:'12px', color:'var(--ink-dim)', fontFamily:F_MONO, marginBottom:'36px' }}>WhatsApp Business · DMS · CRM · Aliados financieros</p>
              <a href="#ecosistema" className="scroll-cue" style={{ opacity:(visible?1:0) * (heroScroll.reduced ? 1 : (1 - grow)), transition:'opacity 0.7s ease 850ms' }}>
                Descubrí el ecosistema
                <span aria-hidden="true">⌄</span>
              </a>
            </div>

            {/* Panel hero: conversación + timeline de tool-calls, que al hacer scroll se
                agranda, se inclina en 3D y cruza al esquema real detectado por DataBridge. */}
            <div
              ref={heroPanel.ref}
              className={`reveal${heroPanel.inView?' in':''}`}
              style={heroScroll.reduced ? { flex:'1', minWidth:'320px', maxWidth:'460px' } : {
                flex:'1', minWidth:'320px', maxWidth:'460px',
                transform: `perspective(1200px) translateX(${-26 * grow + 8 * tilt}%) scale(${1 + 0.55 * grow - 0.4 * tilt}) rotateY(${20 * tilt}deg) rotateX(${-9 * tilt}deg)`,
                willChange:'transform',
              }}
            >
              <div className="panel" style={{ position:'relative', minHeight: heroScroll.reduced ? undefined : '412px' }}>
                <div style={heroScroll.reduced ? undefined : { opacity:1 - crossfade, pointerEvents: crossfade > 0.5 ? 'none' : undefined, position: heroScroll.reduced ? undefined : 'absolute', inset: heroScroll.reduced ? undefined : 0 }}>
                  <div className="panel-head"><span>Precio lead · Ruteo</span><span style={{ color:'var(--green)' }}>Live</span></div>
                  <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--line)' }}>
                    <div style={{ fontSize:'13px', color:'var(--ink)', marginBottom:'12px' }}>
                      <span style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--ink-dim)', marginRight:'8px' }}>[09:42]</span>
                      "Me interesa la SUV híbrida, tengo un sedán 2021 para retoma y necesito financiación a 60 meses."
                    </div>
                    <div style={{ fontFamily:F_MONO, fontSize:'10px', color:'var(--amber)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'10px' }}>Pulse Agent · Respondiendo</div>
                    <div style={{ fontSize:'13px', color:'var(--ink-dim)', lineHeight:1.6 }}>
                      Perfecto. Tasé preliminarmente su 2021 en $42.500.000. Con nuestro aliado bancario logro 1.9% MV y cuota cerrada con póliza todo riesgo. ¿Le envío la proyección por WhatsApp?
                    </div>
                  </div>
                  <div className="panel-head" style={{ borderBottom:'1px solid var(--line)' }}><span>Timeline · Ejecutado</span></div>
                  <div>
                    {TOOL_CALLS.map((t,i) => (
                      <div key={t.fn} className={`tool-row${toolCallsVisible.includes(i)?' in':''}`}>
                        <span className="fn"><span style={{ display:'inline-block', width:'6px', height:'6px', borderRadius:'50%', background:t.chip, marginRight:'8px' }} />{t.fn}</span>
                        <span className="ms"><span style={{ color:'var(--green)' }}>✓</span>{t.ms}ms</span>
                      </div>
                    ))}
                  </div>
                  {/* El trámite avanza: el auto recorre la pista al ritmo de los tool-calls ejecutados */}
                  <div className="tool-road" aria-hidden="true">
                    <span className="tool-road-car" style={{ left:`${6 + (toolCallsVisible.length / TOOL_CALLS.length) * 88}%` }}>🚗</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px' }}>
                    <span style={{ fontFamily:F_MONO, fontSize:'10px', color:'var(--ink-dim)', textTransform:'uppercase', letterSpacing:'.5px' }}>Conversión estimada</span>
                    <span className="grad-amber" style={{ fontFamily:F_DISPLAY, fontSize:'22px', fontWeight:800 }}>87%</span>
                  </div>
                </div>

                {!heroScroll.reduced && (
                  <div style={{ opacity:crossfade, pointerEvents: crossfade > 0.5 ? undefined : 'none', position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                    <div className="panel-head"><span>DataBridge · Esquema detectado</span><span style={{ color:'var(--green)' }}>✓ 5 tablas</span></div>
                    <DataBridgeMiniDiagram />
                    <div style={{ padding:'14px 18px', fontSize:'12px', color:'var(--ink-dim)', fontFamily:F_MONO, borderTop:'1px solid var(--line)' }}>
                      Detectado desde tu Excel o DMS — sin escribir una sola línea de SQL.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        </div>

        {/* SEGMENTOS */}
        <section id="segmentos" style={{ maxWidth:'1140px', margin:'0 auto', padding:'72px 24px', borderTop:'1px solid var(--line)' }}>
          <div ref={segHeader.ref} className={`reveal${segHeader.inView?' in':''}`} style={{ marginBottom:'44px' }}>
            <p className="kicker">Dos segmentos, un agente</p>
            <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(30px,4vw,52px)', fontWeight:800, letterSpacing:'-.5px', lineHeight:1.1, color:'var(--ink)' }}>
              Diseñado para cómo realmente se vende.
            </h2>
          </div>
          <div ref={segGrid.ref} className="seg-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
            {SEGMENTS.map((s,i) => (
              <div key={s.titulo} className={`seg-card seg-card-${s.tagColor} reveal${segGrid.inView?' in':''}`} style={{ transitionDelay:`${i*140}ms` }}>
                <span className={`seg-tag ${s.tagColor}`}>{s.tag}</span>
                <h3 style={{ fontSize:'24px', fontWeight:800, fontFamily:F_DISPLAY, marginBottom:'4px', color:'var(--ink)' }}>{s.titulo}</h3>
                <p style={{ fontFamily:F_MONO, fontSize:'11px', textTransform:'uppercase', letterSpacing:'.5px', color:'var(--ink-dim)', marginBottom:'16px' }}>{s.subtitulo}</p>
                <p style={{ fontSize:'14px', color:'var(--ink-dim)', lineHeight:1.6, marginBottom:'18px' }}>{s.desc}</p>
                <div style={{ marginBottom:'22px' }}>
                  {s.bullets.map(b => <div key={b} className="seg-check"><span className="mark">✓</span><span>{b}</span></div>)}
                </div>
                {s.diagram && <SchemaPreview />}
                <a href={s.href} className={s.ctaClass} style={{ display:'inline-flex', width:'auto', textDecoration:'none', padding:'11px 20px', fontSize:'13px', borderRadius:'6px' }}>{s.cta}<span className="btn-arrow">→</span></a>
              </div>
            ))}
          </div>
        </section>

        {/* LOGOS */}
        <section style={{ padding:'32px 0 56px', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
          <div ref={logosReveal.ref} className={`reveal${logosReveal.inView?' in':''}`}>
            <p style={{ textAlign:'center', fontFamily:F_MONO, fontSize:'11px', letterSpacing:'1px', textTransform:'uppercase', color:'var(--ink-dim)', marginBottom:'24px' }}>Confían concesionarios en LatAm</p>
            <div className="logos-marquee">
              <div className="logos-track">
                {[...LOGOS, ...LOGOS].map((l,i) => <span key={l+i} style={{ fontFamily:F_DISPLAY, fontWeight:700, fontSize:'15px', color:'var(--ink-dim)' }}>{l}</span>)}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'20px', flexWrap:'wrap', marginTop:'32px' }}>
              <p style={{ fontSize:'15px', color:'var(--ink)' }}><strong style={{ fontWeight:800 }}>+180 concesionarios</strong> ya despliegan agentes de Pulse Motor en LatAm.</p>
              <a href="/pulse/databridge" className="pm-btn pm-btn-ghost" style={{ display:'inline-flex', width:'auto', textDecoration:'none', padding:'11px 22px', fontSize:'13px' }}>Agendar una demo<span className="btn-arrow">→</span></a>
            </div>
          </div>
        </section>

        {/* POR QUÉ PULSE MOTOR */}
        <section style={{ maxWidth:'1140px', margin:'0 auto', padding:'72px 24px', borderTop:'1px solid var(--line)' }}>
          <div className="hero-grid" style={{ display:'flex', gap:'56px', alignItems:'center' }}>
            <div ref={porQueText.ref} className={`reveal${porQueText.inView?' in':''}`} style={{ flex:'1', minWidth:'320px' }}>
              <p className="kicker">Por qué Pulse Motor</p>
              <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'14px', color:'var(--ink)' }}>
                La cobertura que tu WhatsApp <span className="grad-amber">nunca tuvo.</span>
              </h2>
              <p style={{ fontSize:'15px', color:'var(--ink-dim)', maxWidth:'480px', lineHeight:1.6, marginBottom:'22px' }}>No reemplaza a tu equipo — cubre las horas y los picos que tu equipo no puede.</p>
              <div>
                {POR_QUE.map(b => <div key={b} className="seg-check"><span className="mark">✓</span><span>{b}</span></div>)}
              </div>
            </div>

            <div ref={coberturaPanel.ref} className={`reveal${coberturaPanel.inView?' in':''}`} style={{ flex:'1', minWidth:'320px', maxWidth:'460px' }}>
              <div className="panel">
                <div className="panel-head"><span>Cobertura · 24/7/365</span><span style={{ color:'var(--green)' }}>Activo</span></div>
                {COBERTURA.map((c,i) => (
                  <div key={c.rango} className={`log-row log-row-data${coberturaPanel.inView?' in':''}`} style={{ gridTemplateColumns:'130px 1fr 100px', transitionDelay:`${i*90}ms` }}>
                    <span className="log-time">{c.rango}</span>
                    <span className="log-evento">{c.evento}</span>
                    <span style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--green)', textAlign:'right' }}>✓ Cubierto</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ECOSISTEMA 360° */}
        <section id="ecosistema" style={{ maxWidth:'1140px', margin:'0 auto', padding:'72px 24px' }}>
          <div ref={ecoHeader.ref} className={`reveal${ecoHeader.inView?' in':''}`} style={{ textAlign:'center', marginBottom:'44px' }}>
            <p className="kicker" style={{ justifyContent:'center', display:'flex' }}>Ecosistema 360°</p>
            <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(30px,4vw,52px)', fontWeight:800, letterSpacing:'-.5px', lineHeight:1.1, marginBottom:'14px', color:'var(--ink)' }}>
              No es solo el auto. Es todo lo que rodea la venta.
            </h2>
            <p style={{ fontSize:'16px', color:'var(--ink-dim)', maxWidth:'560px', margin:'0 auto', lineHeight:1.6 }}>
              Cada punto de fricción — versión, cuota, seguro, retoma — resuelto por el agente dentro de la misma conversación con el cliente.
            </p>
          </div>
          <div ref={ecoGrid.ref} className="grid-shared eco-grid" style={{ gridTemplateColumns:'repeat(5,1fr)' }}>
            {ECOSISTEMA.map((e,i) => (
              <div key={e.num} className={`reveal eco-cell${ecoGrid.inView?' in':''}`} style={{ transitionDelay:`${i*90}ms` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                  <span className="eco-icon" style={{ fontSize:'17px', width:'36px', height:'36px', borderRadius:'8px', display:'inline-flex', alignItems:'center', justifyContent:'center', background:`${e.chip}22`, border:`1px solid ${e.chip}55` }}>{e.icon}</span>
                  <span style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--ink-dim)' }}>{e.num}</span>
                </div>
                <h3 style={{ fontSize:'15px', fontWeight:700, fontFamily:F_DISPLAY, marginBottom:'6px', color:'var(--ink)' }}>{e.titulo}</h3>
                <p style={{ fontSize:'12px', color:'var(--ink-dim)', lineHeight:1.5 }}>{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ACTIVIDAD EN VIVO — el verde de estado elevado a degradé de sección, el único momento no-negro de la página */}
        <section className="section-live" style={{ borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
        <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'72px 24px' }}>
          <div ref={activityHeader.ref} className={`reveal${activityHeader.inView?' in':''}`} style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'36px', flexWrap:'wrap', gap:'16px' }}>
            <div>
              <p className="kicker">Actividad en vivo</p>
              <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'10px', color:'var(--ink)' }}>Cada evento del turno, registrado.</h2>
              <p style={{ fontSize:'15px', color:'var(--ink-dim)', maxWidth:'480px', lineHeight:1.6 }}>Timeline auditable de todo lo que el agente decide, cotiza y cierra — sin puntos ciegos.</p>
            </div>
            <span className="badge"><span className="live-dot on-gradient" />Live · +7 hoy</span>
          </div>

          <div ref={statsReveal.ref} className="grid-shared stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:'1px' }}>
            {STATS_V2.map((s,i) => <StatCell key={s.label} val={s.val} delta={s.delta} label={s.label} active={statsReveal.inView} delayMs={i*90} />)}
          </div>

          <div ref={auditLog.ref} className="panel" style={{ marginTop:'24px', boxShadow:'0 1px 2px rgba(0,0,0,0.3)' }}>
            <div className="log-row" style={{ padding:'12px 18px', fontFamily:F_MONO, fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', color:'var(--ink-dim)', opacity:1, transform:'none' }}>
              <span>Timestamp</span><span>Evento</span><span className="log-canal">Canal</span><span className="log-estado">Estado</span>
            </div>
            {AUDIT_LOG.map((row,i) => (
              <div key={i} className={`log-row log-row-data${auditLog.inView?' in':''}`} style={{ transitionDelay:`${i*70}ms` }}>
                <span className="log-time">{row.time}</span>
                <span className="log-evento">{row.evento}</span>
                <span className="log-canal">{row.canal}</span>
                <span className={`log-estado ${row.ok?'ok':'pend'}`}>{row.estado}</span>
              </div>
            ))}
          </div>
        </div>
        </section>

        {/* INTEGRACIONES NATIVAS */}
        <section className="section-dim" style={{ borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
        <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'72px 24px' }}>
          <div ref={integHeader.ref} className={`reveal${integHeader.inView?' in':''}`} style={{ marginBottom:'32px' }}>
            <p className="kicker">Integraciones nativas</p>
            <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'10px', color:'var(--ink)' }}>Vive dentro de tu stack, no encima.</h2>
            <p style={{ fontSize:'15px', color:'var(--ink-dim)', maxWidth:'520px', lineHeight:1.6, marginBottom:'18px' }}>El agente lee inventario, dispara cotizaciones y sincroniza el CRM sin exportaciones ni copiar-pegar.</p>
            <a href="/pulse/pricing" className="link-arrow" style={{ fontSize:'13px', color:'var(--amber)', textDecoration:'none', fontFamily:F_MONO }}>Ver todas las integraciones<span className="btn-arrow">→</span></a>
          </div>
          <div ref={integGrid.ref} className="grid-shared integ-grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
            {INTEGRACIONES.map((it,i) => (
              <div key={it.name} className={`reveal integ-item${integGrid.inView?' in':''}`} style={{ transitionDelay:`${i*80}ms`, display:'flex', alignItems:'center', gap:'12px' }}>
                <div className="integ-icon" style={{ width:'32px', height:'32px', borderRadius:'6px', border:`1px solid ${it.chip}55`, background:`${it.chip}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>🔗</div>
                <span style={{ fontSize:'13px', color:'var(--ink)' }}>{it.name}</span>
              </div>
            ))}
          </div>
        </div>
        </section>

        {/* TESTIMONIOS */}
        <section className="section-dim-2" style={{ borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
        <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'72px 24px' }}>
          <div ref={testiHeader.ref} className={`reveal${testiHeader.inView?' in':''}`} style={{ marginBottom:'44px' }}>
            <p className="kicker">Lo dicen quienes ya lo usan</p>
            <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, color:'var(--ink)' }}>
              El mismo agente, dos formas de cerrar.
            </h2>
          </div>
          <div ref={testiGrid.ref} className="testi-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
            {TESTIMONIOS_V2.map((t,i) => (
              <div key={t.nombre} className={`quote-card reveal${testiGrid.inView?' in':''}`} style={{ transitionDelay:`${i*150}ms` }}>
                <p className="kicker">{t.seg}</p>
                <p style={{ fontSize:'16px', color:'var(--ink)', lineHeight:1.6, margin:'12px 0 18px' }}>"{t.texto}"</p>
                <div style={{ fontSize:'13px' }}>
                  <div style={{ fontWeight:700, color:'var(--ink)' }}>{t.nombre}</div>
                  <div style={{ color:'var(--ink-dim)', fontSize:'12px' }}>{t.cargo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </section>

        {/* CUMPLIMIENTO Y SEGURIDAD */}
        <section style={{ maxWidth:'1140px', margin:'0 auto', padding:'72px 24px', borderTop:'1px solid var(--line)' }}>
          <div ref={cumpleHeader.ref} className={`reveal${cumpleHeader.inView?' in':''}`} style={{ marginBottom:'32px' }}>
            <p className="kicker">Cumplimiento y seguridad</p>
            <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'10px', color:'var(--ink)' }}>Tu operación, protegida de punta a punta.</h2>
            <p style={{ fontSize:'15px', color:'var(--ink-dim)', maxWidth:'520px', lineHeight:1.6 }}>El agente opera dentro de tu stack sin exponer datos de clientes fuera de tu control.</p>
          </div>
          <div ref={cumpleGrid.ref} className="grid-shared integ-grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
            {CUMPLIMIENTO.map((c,i) => (
              <div key={c.label} className={`reveal integ-item${cumpleGrid.inView?' in':''}`} style={{ transitionDelay:`${i*80}ms`, display:'flex', alignItems:'center', gap:'12px' }}>
                <div className="integ-icon" style={{ width:'32px', height:'32px', borderRadius:'6px', border:`1px solid ${c.chip}55`, background:`${c.chip}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>{c.icon}</div>
                <span style={{ fontSize:'13px', color:'var(--ink)' }}>{c.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* PRECIOS */}
        <section id="precios" className="cta-spotlight" style={{ maxWidth:'1000px', margin:'0 auto', padding:'80px 24px 100px', textAlign:'center', scrollMarginTop:'80px' }}>
          <div ref={ctaFinal.ref} className={`reveal${ctaFinal.inView?' in':''}`} style={{ marginBottom:'40px' }}>
            <p className="kicker" style={{ justifyContent:'center', display:'flex' }}>Precios</p>
            <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-.5px', lineHeight:1.15, marginBottom:'14px', color:'var(--ink)' }}>
              Elegí el plan para <span className="grad-amber">tu forma de vender.</span>
            </h2>
            <p style={{ fontSize:'16px', color:'var(--ink-dim)', maxWidth:'480px', margin:'0 auto 32px', lineHeight:1.6 }}>Sin costos por lead. Sin implementación oculta. Cobrás por resultado, no por promesas.</p>
            <div className="pricing-toggle" role="tablist" aria-label="Segmento de precios">
              <button type="button" role="tab" aria-selected={pricingSegment==='individual'} className={pricingSegment==='individual'?'active':''} onClick={() => setPricingSegment('individual')}>Vendedor individual</button>
              <button type="button" role="tab" aria-selected={pricingSegment==='concesionario'} className={pricingSegment==='concesionario'?'active':''} onClick={() => setPricingSegment('concesionario')}>Concesionario</button>
            </div>
          </div>

          <div ref={pricingGrid.ref} className="seg-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
            {PRICING_PLANS[pricingSegment].map((plan,i) => (
              <div key={plan.nombre} className={`price-card reveal${pricingGrid.inView?' in':''}${plan.destacado?' destacado':''}`} style={{ transitionDelay:`${i*140}ms` }}>
                {plan.destacado && <span className="badge-rec">Recomendado</span>}
                <h3 style={{ fontSize:'19px', fontWeight:800, fontFamily:F_DISPLAY, color:'var(--ink)' }}>{plan.nombre}</h3>
                <div className="precio-row">
                  <span className="precio-num">{plan.precio}</span>
                  {plan.periodo && <span className="precio-per">{plan.periodo}</span>}
                </div>
                <p style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--ink-dim)', marginBottom:'18px' }}>{plan.para}</p>
                <div style={{ marginBottom:'22px' }}>
                  {plan.bullets.map(b => <div key={b} className="seg-check"><span className="mark">✓</span><span>{b}</span></div>)}
                </div>
                <a href={plan.href} className={plan.destacado?'pm-btn':'pm-btn-outline'} style={{ display:'inline-flex', width:'auto', textDecoration:'none', padding:'11px 20px', fontSize:'13px', borderRadius:'6px' }}>{plan.cta}<span className="btn-arrow">→</span></a>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ borderTop:'1px solid var(--line)' }}>
          <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'64px 24px 32px' }}>
            <div className="footer-grid" style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:'32px', marginBottom:'48px' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                  <div style={{ width:'10px', height:'10px', background:'var(--amber)', borderRadius:'2px' }} />
                  <span style={{ fontSize:'15px', fontWeight:800, fontFamily:F_DISPLAY, color:'var(--ink)' }}>Pulse Motor</span>
                </div>
                <p style={{ fontSize:'13px', color:'var(--ink-dim)', lineHeight:1.6, maxWidth:'26ch' }}>Agentes autónomos que orquestan la venta automotriz 360° en LatAm.</p>
              </div>
              <div className="footer-col">
                <h4>Plataforma</h4>
                <a href="#ecosistema">Ecosistema 360°</a>
                <a href="#segmentos">Segmentos</a>
                <a href="#precios">Precios</a>
                <a href="/pulse/pricing">Integraciones</a>
              </div>
              <div className="footer-col">
                <h4>Producto</h4>
                <a href="/pulse/signup">Ser agente</a>
                <a href="/pulse/databridge">Concesionarios</a>
                <a href="/pulse/login">Iniciar sesión</a>
              </div>
              <div className="footer-col">
                <h4>Legal</h4>
                <a href="/terminos">Términos</a>
                <a href="/privacidad">Privacidad</a>
                <a href="/seguridad">Seguridad</a>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', paddingTop:'24px', borderTop:'1px solid var(--line)', fontSize:'12px', color:'var(--ink-dim)', fontFamily:F_MONO }}>
              <span>Pulse Motor · © 2026 · LatAm HQ</span>
              <a href="https://linkedin.com" style={{ color:'var(--ink-dim)', textDecoration:'none' }}>LinkedIn</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
