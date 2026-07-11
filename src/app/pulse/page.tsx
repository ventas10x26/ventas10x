'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useReveal } from '@/hooks/useReveal'
import { useCountUp } from '@/hooks/useCountUp'

// Las variables --font-oswald / --font-mono / --font-inter las define next/font/google
// en src/app/pulse/layout.tsx (autohospedadas en build time). Titulares en Inter bold
// mixta (no uppercase) — ver skill pulsemotor-design, arquetipo "copiloto autónomo 360°".
const F_DISPLAY = "var(--font-inter), sans-serif"
const F_MONO    = "var(--font-mono), monospace"
const F_BODY    = "var(--font-inter), sans-serif"

// ─── Timeline de tool-calls (elemento de firma) — traza real de ejecución del agente ───
const TOOL_CALLS = [
  { fn:'tasar_retoma',          ms:18 },
  { fn:'calcular_financiacion', ms:12 },
  { fn:'cotizar_poliza',        ms:9  },
  { fn:'reservar_inventario',   ms:7  },
]

const LOGOS = ['AutoVía', 'MotorCorp', 'Grupo Andina', 'Pacífico Cars', 'Flota Pro', 'Virtue Motors']

const NAV_ITEMS = [
  { label:'Plataforma', id:'plataforma' },
  { label:'Ecosistema 360°', id:'ecosistema' },
  { label:'Segmentos', id:'segmentos' },
  { label:'Precios', id:'precios' },
]

// ─── Ecosistema 360° — catálogo de puntos de fricción cubiertos, no pasos secuenciales ───
const ECOSISTEMA = [
  { num:'01', icon:'🚗', titulo:'Vehículos nuevos', desc:'Inventario en vivo y todas las versiones cotizadas en segundos.' },
  { num:'02', icon:'%',  titulo:'Financiación',     desc:'Simulaciones y pre-aprobaciones con aliados bancarios integrados.' },
  { num:'03', icon:'＋', titulo:'Accesorios',        desc:'Upselling contextual según modelo, uso y perfil del comprador.' },
  { num:'04', icon:'⇄',  titulo:'Retomas',           desc:'Tasación asistida por IA con histórico de mercado y estado real.' },
  { num:'05', icon:'🛡', titulo:'Pólizas',           desc:'Todo riesgo y colisión cotizadas y emitidas dentro del mismo flujo.' },
]

const SEGMENTS = [
  {
    tag:'Enterprise', tagColor:'amber', titulo:'Concesionario', subtitulo:'Fuerza de ventas · Inventario multi-punto',
    desc:'Orquesta decenas de asesores, integra tu DMS y captura cada oportunidad — incluso las que llegan a las 2 AM.',
    bullets:['Panel director con atribución 360° por asesor', 'Ruteo inteligente de leads por sucursal o stock', 'Integración con Siigo, SAP DMS, HubSpot, Salesforce', 'Auditoría completa de conversaciones y compliance'],
    cta:'Explorar plan Enterprise', href:'/pulse/databridge', ctaClass:'pm-btn-outline',
  },
  {
    tag:'Pro', tagColor:'green', titulo:'Vendedor individual', subtitulo:'Asesor independiente · Alto volumen',
    desc:'Tu copiloto personal en WhatsApp. Cotiza, retoma y cierra sin depender del área de crédito.',
    bullets:['Copiloto integrado a tu WhatsApp Business', 'Cotización de póliza y financiación en segundos', 'Agenda automática de citas y test drives', 'Cobra desde $49 USD/mes — sin costos por lead'],
    cta:'Empezar gratis 14 días', href:'/pulse/signup', ctaClass:'pm-btn',
  },
]

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

const INTEGRACIONES = ['WhatsApp Business', 'Siigo · SAP DMS', 'Aliados financieros', 'Aseguradoras LATAM', 'Portal de accesorios', 'HubSpot · Salesforce']

const TESTIMONIOS_V2 = [
  { seg:'Concesionario · 32 agentes', texto:'El agente configuró la financiación y la póliza de un cliente a las 2 AM. El lunes a las 8 AM solo tuvimos que imprimir el contrato.', nombre:'Ricardo Mendoza', cargo:'Gerente Comercial · Grupo Andina' },
  { seg:'Vendedor individual · Medellín', texto:'Cerré tres retomas en una semana yo solo. Antes eso me tomaba un mes coordinando con crédito y seguros.', nombre:'Laura Betancur', cargo:'Asesora Comercial · Independiente' },
]

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
  const supabase = createClient()

  const heroPanel      = useReveal<HTMLDivElement>()
  const logosReveal     = useReveal<HTMLDivElement>()
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
  const ctaFinal        = useReveal<HTMLDivElement>()

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

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg-0:#0B0D0C; --bg-1:#14120F; --bg-2:#1B1815; --line:#2A2620;
          --ink:#F3EFE7; --ink-dim:#9B958A;
          --amber:#F2A93B; --amber-2:#C9770B; --amber-dim:#8A6423; --green:#3ECF7E; --red:#E5484D;
          --grad-amber: linear-gradient(135deg, var(--amber), var(--amber-2));
          --ease-out-expo: cubic-bezier(.16,1,.3,1);
        }
        body { background: var(--bg-0); }
        ::selection { background:rgba(242,169,59,0.35); color:#fff; }

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

        .kicker { display:inline-flex; align-items:center; gap:6px; font-family:${F_MONO}; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--amber); margin-bottom:14px; }

        .grid-shared { display:grid; gap:1px; background:var(--line); border:1px solid var(--line); border-radius:6px; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,0.3); }
        .grid-shared > * { background:var(--bg-1); padding:24px; transition:background-color .25s ease; }

        .reveal { opacity:0; transform:translateY(28px) scale(.98); transition:opacity .8s var(--ease-out-expo), transform .8s var(--ease-out-expo); }
        .reveal.in { opacity:1; transform:translateY(0) scale(1); }

        .panel { border:1px solid var(--line); border-radius:6px; overflow:hidden; box-shadow:0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3); background:var(--bg-1); }
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

        .seg-card { border:1px solid var(--line); border-radius:6px; padding:32px; background:var(--bg-1); transition:box-shadow .25s ease, border-color .25s ease; }
        .seg-card:hover { box-shadow:0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3); border-color:var(--amber-dim); }
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

        @media (prefers-reduced-motion: reduce) {
          .live-dot, .guard-sweep::before { animation:none; }
          .log-row, .reveal, .tool-row { transition:none; opacity:1; transform:none; }
          .pm-btn:hover:not(:disabled) { transform:none; }
          .logos-track { animation:none; }
          .scroll-cue { animation:none; }
          .btn-arrow, .eco-cell, .eco-icon, .integ-item, .integ-icon, .quote-card, .stat-cell, .log-row-data, .pm-nav-link::after { transition:none; }
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

        {/* HERO */}
        <section id="plataforma" style={{ maxWidth:'1140px', margin:'0 auto', padding:'64px 24px 40px' }}>
          <div className="hero-grid" style={{ display:'flex', gap:'56px', alignItems:'center' }}>
            <div style={{ flex:'1', minWidth:'320px' }}>
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
              <a href="#ecosistema" className="scroll-cue" style={{ opacity:visible?1:0, transition:'opacity 0.7s ease 850ms' }}>
                Descubrí el ecosistema
                <span aria-hidden="true">⌄</span>
              </a>
            </div>

            {/* Panel hero: conversación real + timeline de tool-calls (elemento de firma) */}
            <div ref={heroPanel.ref} className={`reveal${heroPanel.inView?' in':''}`} style={{ flex:'1', minWidth:'320px', maxWidth:'460px' }}>
              <div className="panel">
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
                      <span className="fn">{t.fn}</span>
                      <span className="ms"><span style={{ color:'var(--green)' }}>✓</span>{t.ms}ms</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px' }}>
                  <span style={{ fontFamily:F_MONO, fontSize:'10px', color:'var(--ink-dim)', textTransform:'uppercase', letterSpacing:'.5px' }}>Conversión estimada</span>
                  <span className="grad-amber" style={{ fontFamily:F_DISPLAY, fontSize:'22px', fontWeight:800 }}>87%</span>
                </div>
              </div>
            </div>
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
                  <span className="eco-icon" style={{ fontSize:'20px' }}>{e.icon}</span>
                  <span style={{ fontFamily:F_MONO, fontSize:'11px', color:'var(--ink-dim)' }}>{e.num}</span>
                </div>
                <h3 style={{ fontSize:'15px', fontWeight:700, fontFamily:F_DISPLAY, marginBottom:'6px', color:'var(--ink)' }}>{e.titulo}</h3>
                <p style={{ fontSize:'12px', color:'var(--ink-dim)', lineHeight:1.5 }}>{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

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
              <div key={s.titulo} className={`seg-card reveal${segGrid.inView?' in':''}`} style={{ transitionDelay:`${i*140}ms` }}>
                <span className={`seg-tag ${s.tagColor}`}>{s.tag}</span>
                <h3 style={{ fontSize:'24px', fontWeight:800, fontFamily:F_DISPLAY, marginBottom:'4px', color:'var(--ink)' }}>{s.titulo}</h3>
                <p style={{ fontFamily:F_MONO, fontSize:'11px', textTransform:'uppercase', letterSpacing:'.5px', color:'var(--ink-dim)', marginBottom:'16px' }}>{s.subtitulo}</p>
                <p style={{ fontSize:'14px', color:'var(--ink-dim)', lineHeight:1.6, marginBottom:'18px' }}>{s.desc}</p>
                <div style={{ marginBottom:'22px' }}>
                  {s.bullets.map(b => <div key={b} className="seg-check"><span className="mark">✓</span><span>{b}</span></div>)}
                </div>
                <a href={s.href} className={s.ctaClass} style={{ display:'inline-flex', width:'auto', textDecoration:'none', padding:'11px 20px', fontSize:'13px', borderRadius:'6px' }}>{s.cta}<span className="btn-arrow">→</span></a>
              </div>
            ))}
          </div>
        </section>

        {/* ACTIVIDAD EN VIVO */}
        <section style={{ background:'var(--bg-1)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
        <div style={{ maxWidth:'1140px', margin:'0 auto', padding:'72px 24px' }}>
          <div ref={activityHeader.ref} className={`reveal${activityHeader.inView?' in':''}`} style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'36px', flexWrap:'wrap', gap:'16px' }}>
            <div>
              <p className="kicker">Actividad en vivo</p>
              <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'10px', color:'var(--ink)' }}>Cada evento del turno, registrado.</h2>
              <p style={{ fontSize:'15px', color:'var(--ink-dim)', maxWidth:'480px', lineHeight:1.6 }}>Timeline auditable de todo lo que el agente decide, cotiza y cierra — sin puntos ciegos.</p>
            </div>
            <span className="badge"><span className="live-dot" />Live · +7 hoy</span>
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
        <section style={{ maxWidth:'1140px', margin:'0 auto', padding:'72px 24px', borderTop:'1px solid var(--line)' }}>
          <div ref={integHeader.ref} className={`reveal${integHeader.inView?' in':''}`} style={{ marginBottom:'32px' }}>
            <p className="kicker">Integraciones nativas</p>
            <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,3.6vw,44px)', fontWeight:800, letterSpacing:'-.4px', lineHeight:1.15, marginBottom:'10px', color:'var(--ink)' }}>Vive dentro de tu stack, no encima.</h2>
            <p style={{ fontSize:'15px', color:'var(--ink-dim)', maxWidth:'520px', lineHeight:1.6, marginBottom:'18px' }}>El agente lee inventario, dispara cotizaciones y sincroniza el CRM sin exportaciones ni copiar-pegar.</p>
            <a href="/pulse/pricing" className="link-arrow" style={{ fontSize:'13px', color:'var(--amber)', textDecoration:'none', fontFamily:F_MONO }}>Ver todas las integraciones<span className="btn-arrow">→</span></a>
          </div>
          <div ref={integGrid.ref} className="grid-shared integ-grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
            {INTEGRACIONES.map((name,i) => (
              <div key={name} className={`reveal integ-item${integGrid.inView?' in':''}`} style={{ transitionDelay:`${i*80}ms`, display:'flex', alignItems:'center', gap:'12px' }}>
                <div className="integ-icon" style={{ width:'32px', height:'32px', borderRadius:'6px', border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>🔗</div>
                <span style={{ fontSize:'13px', color:'var(--ink)' }}>{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIOS */}
        <section style={{ background:'var(--bg-1)', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)' }}>
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

        {/* CTA FINAL */}
        <section id="precios" className="cta-spotlight" style={{ maxWidth:'720px', margin:'0 auto', padding:'40px 24px 100px', textAlign:'center', scrollMarginTop:'80px' }}>
          <div ref={ctaFinal.ref} className={`reveal${ctaFinal.inView?' in':''}`}>
            <p className="kicker" style={{ justifyContent:'center', display:'flex' }}>Accediendo en 3 min</p>
            <h2 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(28px,4vw,48px)', fontWeight:800, letterSpacing:'-.5px', lineHeight:1.15, marginBottom:'14px', color:'var(--ink)' }}>
              Escala tu facturación con <span className="grad-amber">agentes autónomos.</span>
            </h2>
            <p style={{ fontSize:'16px', color:'var(--ink-dim)', maxWidth:'480px', margin:'0 auto 28px', lineHeight:1.6 }}>Sin costos por lead. Sin implementación oculta. Cobramos por resultado, no por promesas.</p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'20px', flexWrap:'wrap' }}>
              <span className="grad-amber" style={{ fontFamily:F_DISPLAY, fontSize:'22px', fontWeight:800 }}>Desde $199 USD/mes</span>
              <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', padding:'14px 30px', textDecoration:'none' }}>Solicitar acceso<span className="btn-arrow">→</span></a>
            </div>
          </div>
        </section>

        <footer style={{ maxWidth:'1140px', margin:'0 auto', padding:'24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', fontSize:'12px', color:'var(--ink-dim)', borderTop:'1px solid var(--line)', fontFamily:F_MONO }}>
          <span>Pulse Motor · © 2026 · LatAm HQ</span>
          <div style={{ display:'flex', gap:'20px' }}>
            <a href="/terminos" style={{ color:'var(--ink-dim)', textDecoration:'none' }}>Términos</a>
            <a href="/privacidad" style={{ color:'var(--ink-dim)', textDecoration:'none' }}>Privacidad</a>
            <a href="/seguridad" style={{ color:'var(--ink-dim)', textDecoration:'none' }}>Seguridad</a>
            <a href="https://linkedin.com" style={{ color:'var(--ink-dim)', textDecoration:'none' }}>LinkedIn</a>
          </div>
        </footer>
      </div>
    </>
  )
}
