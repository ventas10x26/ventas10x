'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PulseContactModal from '@/components/pulse/PulseContactModal'
import { SegmentSelector } from '@/components/pulse/SegmentSelector'

const F_DISPLAY = "'Oswald', sans-serif"
const F_MONO    = "'IBM Plex Mono', monospace"
const F_BODY    = "'Inter', sans-serif"

const WA_SVG = <svg viewBox="0 0 24 24" fill="#25d366" style={{width:'14px',height:'14px',flexShrink:0}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.565 4.14 1.548 5.873L.057 23.57a.75.75 0 0 0 .92.921l5.697-1.491A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.192-1.457l-.372-.22-3.853 1.009 1.01-3.762-.241-.386A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>

// ─── Evidencia en vivo (hero) — mismos mensajes reales, ahora como bitácora, no como mockup de celular ───
const WA_CHAT: { out:boolean; text:string; time:string; delay:number }[] = [
  { out:false, text:'Hola! Vi el Sportage NX5 😍',                           time:'15:42:03', delay:1200 },
  { out:true,  text:'¡Hola! Desde $127M neto. ¿Te agendo el test drive? 🙌', time:'15:42:31', delay:2600 },
  { out:true,  text:'✅ Cita agendada: mañana 10am',                          time:'15:43:02', delay:4200 },
  { out:false, text:'Perfecto! ¿Qué color tienen disponible?',                time:'15:44:10', delay:5800 },
  { out:true,  text:'Tenemos Blanco Nieve y Gris Grafito en stock 🚗',       time:'15:44:38', delay:7200 },
]
const LOOP_DURATION = 9500

// ─── Bitácora de capacidades — mismas 6 capacidades reales, ahora como eventos de log ───
const BITACORA = [
  { time:'23:41:07', evento:'Lead entrante',      detalle:'Sportage NX5 · responde antes de que leas la notificación', status:'Respondido 30s',  ok:true  },
  { time:'23:41:35', evento:'Seguimiento día 3',   detalle:'Cliente sin respuesta — el agente vuelve a escribir solo',   status:'Enviado',         ok:false },
  { time:'23:42:10', evento:'Conexión',            detalle:'Turno conectado por QR — tu WhatsApp, sin SIM nueva',       status:'Activo',          ok:true  },
  { time:'23:44:02', evento:'Entrenamiento',       detalle:'Ajustó una respuesta de precio con tu estilo de venta',     status:'Aplicado',        ok:true  },
  { time:'23:47:19', evento:'Cita',                detalle:'Test drive agendado — propone horario y confirma solo',     status:'Confirmado',      ok:true  },
  { time:'06:00:00', evento:'Relevo',               detalle:'Aprendió tu estilo: cada turno responde más preciso',       status:'Cerrado',         ok:true  },
]

const STATS = [
  { val:'47',  label:'Leads atendidos' },
  { val:'89%', label:'Tasa de respuesta' },
  { val:'8',   label:'Citas agendadas' },
]

// ─── Reportes de cierre de turno — mismos testimonios reales, con sello de cierre ───
const REPORTES = [
  { nombre:'Andrés M.',   cargo:'Asesor KIA',        sede:'23:58 · Kia Cali',           texto:'Antes perdía leads porque estaba en prueba de manejo. Ahora el agente cubre y cuando vuelvo, ya están calientes.' },
  { nombre:'Carolina V.', cargo:'Vendedora Hyundai', sede:'22:10 · Hyundai Bogotá',      texto:'Funciona con mi WhatsApp normal. Sin apps raras. El cliente ni sabe que fue el agente.' },
  { nombre:'Jorge P.',    cargo:'Asesor Renault',    sede:'20:45 · Renault Medellín',    texto:'En el primer turno del mes recuperé 3 ventas que se me hubieran ido. El relevo automático es oro.' },
]

const COSTO_NO_TENERLO = [
  { label:'Perder 1 lead/semana',   valor:'~$2.000.000/mes', desc:'en comisiones que se van a otro asesor' },
  { label:'Responder tarde (+1h)',  valor:'70% menos cierres', desc:'los leads fríos rara vez vuelven' },
  { label:'Sin relevo automático',  valor:'5x más trabajo',   desc:'para el mismo resultado' },
]

export default function PulseMotorLanding() {
  const [email, setEmail]                     = useState('')
  const [nombre, setNombre]                   = useState('')
  const [marca, setMarca]                     = useState('')
  const [estado, setEstado]                   = useState<'idle'|'enviando'>('idle')
  const [errorEmail, setErrorEmail]           = useState('')
  const [errorNombre, setErrorNombre]         = useState('')
  const [errorGeneral, setErrorGeneral]       = useState('')
  const [touchedEmail, setTouchedEmail]       = useState(false)
  const [touchedNombre, setTouchedNombre]     = useState(false)
  const [usuarioLogueado, setUsuarioLogueado] = useState<string|null>(null)
  const [visible, setVisible]                 = useState(false)
  const [visibleMsgs, setVisibleMsgs]         = useState<number[]>([])
  const [reloj, setReloj]                     = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [visibleMsgs])

  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t) }, [])

  useEffect(() => {
    const tick = () => setReloj(new Date().toLocaleTimeString('es-CO', { hour12:false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUsuarioLogueado(data.user.email ?? data.user.id)
    })
  }, [])

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = []
    const runLoop = () => {
      setVisibleMsgs([])
      WA_CHAT.forEach((msg, i) => {
        timers.push(setTimeout(() => setVisibleMsgs(prev => [...prev, i]), msg.delay))
      })
      timers.push(setTimeout(runLoop, LOOP_DURATION))
    }
    runLoop()
    return () => timers.forEach(clearTimeout)
  }, [])

  const validateNombre = (v: string) => !v.trim() ? 'Ingresá tu nombre' : ''
  const validateEmail  = (v: string) => !v.trim() ? 'Ingresá tu email' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email no válido' : ''

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouchedNombre(true); setTouchedEmail(true)
    const en = validateNombre(nombre); const ee = validateEmail(email)
    setErrorNombre(en); setErrorEmail(ee)
    if (en || ee) return
    setEstado('enviando')
    try {
      const res  = await fetch('/api/pulse/waitlist', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ nombre:nombre.trim(), email:email.trim().toLowerCase(), marca }) })
      const data = await res.json() as { error?: string }
      if (res.ok) { window.location.href = '/pulse/signup?email='+encodeURIComponent(email.trim().toLowerCase())+'&nombre='+encodeURIComponent(nombre.trim()) }
      else { setErrorGeneral(data.error || 'Error inesperado. Intenta de nuevo.'); setEstado('idle') }
    } catch { setErrorGeneral('Error de conexión. Verifica tu internet e intenta de nuevo.'); setEstado('idle') }
  }

  const v = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  })

  const [modalContacto, setModalContacto] = useState(false)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg-0:#0B0D0C; --bg-1:#14120F; --bg-2:#1B1815; --line:#2A2620;
          --ink:#F3EFE7; --ink-dim:#9B958A;
          --amber:#F2A93B; --amber-dim:#8A6423; --green:#3ECF7E; --red:#E5484D;
        }
        body { background: var(--bg-0); }
        ::selection { background:rgba(242,169,59,0.35); color:#fff; }

        .pm-input { width:100%; padding:13px 16px; border-radius:6px; border:1.5px solid var(--line); background:rgba(255,255,255,0.02); color:var(--ink); font-size:15px; font-family:${F_BODY}; outline:none; transition:border-color .15s; }
        .pm-input:focus { border-color:var(--amber-dim); }
        .pm-input.err { border-color:var(--red); }
        .pm-input::placeholder { color:var(--ink-dim); }
        select option { background:var(--bg-1); color:var(--ink); }

        .pm-btn { width:100%; padding:14px; border-radius:6px; border:1px solid var(--amber); background:var(--amber); color:#1a1204; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; cursor:pointer; font-family:${F_DISPLAY}; transition:background-color .15s; }
        .pm-btn:hover:not(:disabled) { background:#ffc266; border-color:#ffc266; }
        .pm-btn:disabled { opacity:.5; cursor:not-allowed; }
        .pm-btn-ghost { background:transparent; border:1px solid var(--line); color:var(--ink); }
        .pm-btn-ghost:hover:not(:disabled) { border-color:var(--ink-dim); background:transparent; }

        /* ── Badge de turno activo ── */
        .turno-badge { display:inline-flex; align-items:center; gap:10px; border:1px solid var(--line); border-radius:3px; padding:6px 12px; font-family:${F_MONO}; font-size:12px; text-transform:uppercase; letter-spacing:1px; color:var(--ink-dim); }
        .live-dot { width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow:0 0 0 0 rgba(62,207,126,0.6); animation:livePulse 2s ease infinite; }
        @keyframes livePulse { 0%{box-shadow:0 0 0 0 rgba(62,207,126,0.55)} 70%{box-shadow:0 0 0 6px rgba(62,207,126,0)} 100%{box-shadow:0 0 0 0 rgba(62,207,126,0)} }

        /* ── Grid compartido: borde de 1px entre celdas, sin cards flotantes con sombra ── */
        .grid-shared { display:grid; gap:1px; background:var(--line); border:1px solid var(--line); border-radius:6px; overflow:hidden; }
        .grid-shared > * { background:var(--bg-1); padding:28px; }
        .grid-3 { grid-template-columns:repeat(3,1fr); }

        .stamp { display:inline-flex; align-items:center; gap:6px; font-family:${F_MONO}; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--green); border:1px solid var(--amber-dim); border-radius:3px; padding:3px 8px; }

        /* ── Bitácora en vivo ── */
        .bitacora { border:1px solid var(--line); border-radius:6px; overflow:hidden; }
        .bitacora-head { display:flex; align-items:center; justify-content:space-between; padding:12px 18px; border-bottom:1px solid var(--line); font-family:${F_MONO}; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--ink-dim); }
        .log-row { display:grid; grid-template-columns:90px 150px 1fr 130px; gap:16px; align-items:center; padding:14px 18px; border-bottom:1px solid var(--line); font-size:13px; opacity:0; transform:translateY(6px); animation:logIn .5s ease forwards; }
        .log-row:last-child { border-bottom:none; }
        .log-row:nth-child(1){animation-delay:0s} .log-row:nth-child(2){animation-delay:.1s} .log-row:nth-child(3){animation-delay:.2s}
        .log-row:nth-child(4){animation-delay:.3s} .log-row:nth-child(5){animation-delay:.4s} .log-row:nth-child(6){animation-delay:.5s}
        @keyframes logIn { to { opacity:1; transform:translateY(0); } }
        .log-time { font-family:${F_MONO}; color:var(--ink-dim); }
        .log-event { font-family:${F_MONO}; font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--ink-dim); }
        .log-detail { color:var(--ink); }
        .log-status { font-family:${F_MONO}; font-size:11px; text-transform:uppercase; letter-spacing:.5px; text-align:right; }
        .log-status.ok { color:var(--green); }
        .log-status.pend { color:var(--amber); }

        /* ── Evidencia del hero (chat real, sin skeuomorfismo de WhatsApp) ── */
        .evidence-row { display:flex; align-items:baseline; gap:12px; padding:9px 14px; font-size:13px; opacity:0; transform:translateY(6px); animation:logIn .4s ease forwards; border-bottom:1px solid var(--line); }
        .evidence-row:last-child { border-bottom:none; }

        /* ── Reportes de cierre de turno ── */
        .reporte .quote { font-size:15px; color:var(--ink); margin:14px 0 18px; line-height:1.6; }
        .firma { display:flex; justify-content:space-between; gap:12px; font-family:${F_MONO}; font-size:11px; color:var(--ink-dim); text-transform:uppercase; letter-spacing:.5px; }

        /* ── Balance de turno ── */
        .balance-row { display:flex; justify-content:space-between; align-items:baseline; padding:16px 20px; border-bottom:1px solid var(--line); font-family:${F_MONO}; font-size:14px; }
        .balance-row:last-child { border-bottom:none; }
        .balance-row .label { color:var(--ink-dim); text-transform:uppercase; font-size:12px; letter-spacing:.5px; }
        .balance-row .sub { color:var(--ink-dim); font-size:11px; margin-top:2px; text-transform:none; letter-spacing:0; font-family:${F_BODY}; }
        .balance-row.total { background:var(--bg-2); }
        .balance-row.total .val { color:var(--amber); font-size:20px; }
        .price-card { border:1px solid var(--amber-dim); border-radius:6px; padding:32px; }
        .checklist-row { display:flex; gap:10px; align-items:baseline; padding:7px 0; font-size:13px; color:var(--ink-dim); }
        .checklist-row .mark { color:var(--green); font-family:${F_MONO}; flex-shrink:0; }

        @media (prefers-reduced-motion: reduce) {
          .live-dot { animation:none; }
          .log-row, .evidence-row { animation:none; opacity:1; transform:none; }
        }

        @media(max-width:900px){
          .hero-grid{flex-direction:column!important;align-items:center!important}
          .hero-grid>*{max-width:100%!important;width:100%!important}
          .grid-3{grid-template-columns:1fr!important}
          .balance-grid{grid-template-columns:1fr!important}
          .segment-grid{grid-template-columns:1fr!important}
          .log-row{grid-template-columns:70px 1fr!important}
          .log-row .log-detail{grid-column:span 2}
        }
      `}</style>

      <PulseContactModal open={modalContacto} onClose={() => setModalContacto(false)} />

      <div style={{ minHeight:'100vh', background:'var(--bg-0)', color:'var(--ink)', fontFamily:F_BODY, lineHeight:1.5 }}>

        {/* HEADER */}
        <header style={{ position:'sticky', top:0, zIndex:100, padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:'1100px', margin:'0 auto', background:'rgba(11,13,12,0.85)', backdropFilter:'blur(10px)', borderBottom:'1px solid var(--line)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'10px', height:'10px', background:'var(--amber)' }} />
            <span style={{ fontSize:'16px', fontWeight:600, fontFamily:F_DISPLAY, textTransform:'uppercase', letterSpacing:'1px', color:'var(--ink)' }}>Pulse Motor</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {usuarioLogueado ? (
              <a href="/pulse/agente" className="pm-btn" style={{ width:'auto', display:'inline-flex', textDecoration:'none', padding:'10px 18px', fontSize:'13px' }}>Mi agente →</a>
            ) : (
              <>
                <button onClick={() => setModalContacto(true)} className="pm-btn pm-btn-ghost" style={{ width:'auto', padding:'9px 16px', fontSize:'12px', cursor:'pointer' }}>
                  Lo hacemos por vos
                </button>
                <a href="#precios" style={{ fontSize:'13px', fontFamily:F_MONO, textTransform:'uppercase', letterSpacing:'.5px', color:'var(--ink-dim)', padding:'8px 12px', textDecoration:'none' }}>Precios</a>
                <a href="/pulse/login"  className="pm-btn pm-btn-ghost" style={{ width:'auto', display:'inline-flex', textDecoration:'none', padding:'9px 16px', fontSize:'12px' }}>Ingresar</a>
                <a href="/pulse/signup" className="pm-btn" style={{ width:'auto', display:'inline-flex', textDecoration:'none', padding:'9px 18px', fontSize:'12px' }}>Cubrir mi turno →</a>
              </>
            )}
          </div>
        </header>

        {/* HERO */}
        <section style={{ maxWidth:'1100px', margin:'0 auto', padding:'56px 24px 72px' }}>
          <div style={{ textAlign:'center', marginBottom:'40px' }}>
            <div style={{ ...v(100), display:'flex', justifyContent:'center', marginBottom:'28px' }}>
              <div className="turno-badge"><span className="live-dot" />Turno activo · {reloj || '00:00:00'} · Concesionario</div>
            </div>

            <SegmentSelector />

            <h1 style={{ ...v(300), fontFamily:F_DISPLAY, textTransform:'uppercase', fontSize:'clamp(32px,5.2vw,54px)', fontWeight:700, lineHeight:1.08, letterSpacing:'.5px', margin:'0 0 20px', color:'var(--ink)' }}>
              El turno sigue.<br/>
              <span style={{ color:'var(--amber)' }}>Aunque vos no estés.</span>
            </h1>
            <p style={{ ...v(500), fontSize:'clamp(15px,2vw,18px)', color:'var(--ink-dim)', maxWidth:'520px', margin:'0 auto 20px', lineHeight:1.65 }}>
              Le entregás el protocolo de tu turno. Él cubre la guardia: responde leads en 30 segundos, hace el relevo día 1, 3 y 7, y agenda citas — desde tu número de siempre.
            </p>
            <div style={{ ...v(700), display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', flexWrap:'wrap' }}>
              {['Tu WhatsApp · sin SIM nueva', 'Responde en <30 seg', 'Relevo día 1, 3 y 7'].map(t => (
                <span key={t} className="stamp" style={{ color:'var(--ink-dim)', borderColor:'var(--line)' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Video demo */}
          <div style={{ display:'flex', alignItems:'center', gap:'56px', justifyContent:'center', flexWrap:'wrap', marginTop:'64px', paddingTop:'64px', borderTop:'1px solid var(--line)' }}>
            <div style={{ flex:'1', minWidth:'280px', maxWidth:'420px' }}>
              <p className="stamp" style={{ marginBottom:'20px' }}>Mirá cómo cubre un turno</p>
              <h2 style={{ fontFamily:F_DISPLAY, textTransform:'uppercase', fontSize:'clamp(22px,3vw,34px)', fontWeight:700, lineHeight:1.15, letterSpacing:'.3px', margin:'0 0 16px', color:'var(--ink)' }}>
                Ningún lead se queda<br/>sin cobertura
              </h2>
              <p style={{ fontSize:'15px', color:'var(--ink-dim)', lineHeight:1.7, margin:'0 0 28px' }}>En 60 segundos entendés por qué los asesores que usan Pulse Motor venden más — sin trabajar más horas.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'32px' }}>
                {[
                  'Responde al lead en 30 segundos desde tu número',
                  'Relevo automático día 1, 3 y 7 sin que hagas nada',
                  'Entrena al agente con tu propio protocolo de venta',
                ].map(text => (
                  <div key={text} style={{ display:'flex', gap:'12px', alignItems:'baseline' }}>
                    <span style={{ color:'var(--green)', fontFamily:F_MONO, flexShrink:0 }}>✓</span>
                    <span style={{ fontSize:'14px', color:'var(--ink-dim)', lineHeight:1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
              <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', padding:'13px 26px', textDecoration:'none' }}>Cubrir mi turno →</a>
              <p style={{ fontSize:'12px', color:'var(--ink-dim)', marginTop:'10px', fontFamily:F_MONO }}>14 días gratis · Sin tarjeta · Tu WhatsApp actual</p>
            </div>
            <div style={{ flex:'1.2', minWidth:'300px', maxWidth:'600px' }}>
              <div style={{ position:'relative', overflow:'hidden', aspectRatio:'1920/1080', borderRadius:'6px', border:'1px solid var(--line)' }}>
                <iframe src="https://share.synthesia.io/embeds/videos/8ca3103d-efcb-406a-b40e-d21b61845a48?autoplay=1" loading="lazy" title="Pulse Motor" allowFullScreen allow="encrypted-media; fullscreen; microphone; screen-wake-lock; autoplay;" style={{ position:'absolute', width:'100%', height:'100%', top:0, left:0, border:'none' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'16px', flexWrap:'wrap' }}>
                {['4.9/5 asesores', '+500 leads atendidos', '30 seg respuesta'].map(t => (
                  <span key={t} className="stamp" style={{ color:'var(--ink-dim)', borderColor:'var(--line)' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Formulario + evidencia en vivo */}
          <div className="hero-grid" style={{ display:'flex', alignItems:'flex-start', gap:'40px', justifyContent:'center', marginTop:'64px', paddingTop:'64px', borderTop:'1px solid var(--line)' }}>
            <form onSubmit={submit} style={{ ...v(900), flex:'1', minWidth:'280px', maxWidth:'380px', border:'1px solid var(--line)', borderRadius:'6px', padding:'28px', background:'var(--bg-1)' }}>
              <h3 style={{ fontSize:'18px', fontWeight:600, margin:'0 0 4px', fontFamily:F_DISPLAY, textTransform:'uppercase', letterSpacing:'.3px', color:'var(--ink)' }}>Configurá tu turno gratis</h3>
              <p style={{ fontSize:'13px', color:'var(--ink-dim)', margin:'0 0 22px' }}>Listo en 5 minutos. Sin tarjeta.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'16px' }}>
                <div>
                  <input type="text" placeholder="Tu nombre" value={nombre} onChange={e=>setNombre(e.target.value)} onBlur={()=>setTouchedNombre(true)} disabled={estado==='enviando'} className={`pm-input${touchedNombre&&errorNombre?' err':''}`} />
                  {touchedNombre&&errorNombre&&<span style={{ fontSize:'12px', color:'var(--red)', marginTop:'4px', display:'block' }}>⚠ {errorNombre}</span>}
                </div>
                <div>
                  <input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} onBlur={()=>setTouchedEmail(true)} disabled={estado==='enviando'} className={`pm-input${touchedEmail&&errorEmail?' err':''}`} />
                  {touchedEmail&&errorEmail&&<span style={{ fontSize:'12px', color:'var(--red)', marginTop:'4px', display:'block' }}>⚠ {errorEmail}</span>}
                </div>
                <select value={marca} onChange={e=>setMarca(e.target.value)} disabled={estado==='enviando'} className="pm-input" style={{ cursor:'pointer', color:marca?'var(--ink)':'var(--ink-dim)' }}>
                  <option value="">¿Con qué marca trabajás? (opcional)</option>
                  {['KIA','Hyundai','Renault','Chevrolet','Toyota','Mazda','Nissan','Otro'].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <button type="submit" disabled={estado==='enviando'} className="pm-btn" style={{ marginBottom:'14px' }}>{estado==='enviando'?'Configurando…':'Cubrir mi turno →'}</button>
              {errorGeneral&&<p style={{ fontSize:'13px', color:'var(--red)', marginBottom:'8px', textAlign:'center' }}>⚠ {errorGeneral}</p>}
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {['Conecta con tu WhatsApp actual vía QR','Sin número nuevo ni SIM extra','14 días gratis sin tarjeta'].map(t=>(
                  <div key={t} style={{ fontSize:'13px', color:'var(--ink-dim)', display:'flex', gap:'6px', alignItems:'flex-start' }}>
                    <span style={{ color:'var(--green)', flexShrink:0, fontFamily:F_MONO }}>✓</span><span>{t}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:'13px', color:'var(--ink-dim)', margin:'16px 0 0', textAlign:'center' }}>
                ¿Ya tenés cuenta? <a href="/pulse/login" style={{ color:'var(--ink)', textDecoration:'underline' }}>Ingresar →</a>
              </p>
            </form>

            <div style={{ ...v(1100), flex:'1', minWidth:'280px', maxWidth:'380px' }}>
              <div className="turno-badge" style={{ marginBottom:'14px' }}><span className="live-dot" />Evidencia · vía WhatsApp</div>
              <div className="bitacora">
                <div className="bitacora-head"><span>Conversación real</span><span>Hoy</span></div>
                <div ref={chatRef} style={{ maxHeight:'240px', overflowY:'auto' }}>
                  {WA_CHAT.map((msg,i) => visibleMsgs.includes(i) && (
                    <div key={i} className="evidence-row">
                      <span style={{ fontFamily:F_MONO, fontSize:11, color:'var(--ink-dim)', flexShrink:0 }}>{msg.time}</span>
                      <span style={{ fontFamily:F_MONO, fontSize:10, textTransform:'uppercase', color: msg.out ? 'var(--amber)' : 'var(--ink-dim)', flexShrink:0, width:'46px' }}>{msg.out ? 'Agente' : 'Lead'}</span>
                      <span style={{ flex:1, color:'var(--ink)' }}>{msg.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--ink-dim)', marginTop:'12px', fontFamily:F_MONO }}>
                {WA_SVG} Responde solo mientras vos cerrás otras ventas
              </div>
            </div>
          </div>
        </section>

        {/* RELEVO DE TURNO */}
        <section style={{ maxWidth:'1100px', margin:'0 auto', padding:'72px 24px', borderTop:'1px solid var(--line)' }}>
          <div style={{ textAlign:'center', marginBottom:'48px' }}>
            <p className="stamp" style={{ marginBottom:'14px' }}>Relevo de turno</p>
            <h2 style={{ fontFamily:F_DISPLAY, textTransform:'uppercase', fontSize:'clamp(26px,3.8vw,42px)', fontWeight:700, letterSpacing:'.3px', lineHeight:1.15, marginBottom:'14px', color:'var(--ink)' }}>
              Le entregás la guardia<br/>en 5 minutos
            </h2>
            <p style={{ fontSize:'16px', color:'var(--ink-dim)', maxWidth:'520px', margin:'0 auto 24px', lineHeight:1.6 }}>
              No es un onboarding de software. Es el mismo protocolo de relevo que ya conocés: le pasás el contexto, confirma cobertura, empieza el turno.
            </p>
            <button onClick={() => setModalContacto(true)} className="pm-btn" style={{ width:'auto', display:'inline-flex', padding:'13px 26px', cursor:'pointer' }}>
              Quiero que lo hagan por mí →
            </button>
            <p style={{ fontSize:'12px', color:'var(--ink-dim)', marginTop:'10px', fontFamily:F_MONO }}>Te contactamos en menos de 24 hs · Sin compromiso</p>
          </div>

          <div className="grid-shared grid-3">
            <div>
              <span className="stamp" style={{ marginBottom:'16px' }}>✓ Paso 1</span>
              <h3 style={{ fontSize:'18px', fontWeight:600, fontFamily:F_DISPLAY, textTransform:'uppercase', letterSpacing:'.2px', margin:'16px 0 10px', color:'var(--ink)' }}>Entregás el protocolo</h3>
              <p style={{ fontSize:'14px', color:'var(--ink-dim)', lineHeight:1.6, marginBottom:'16px' }}>Respondés 2 preguntas: cómo hablás con tus clientes y cuál es tu mayor reto. 5 minutos máximo.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {['¿Cómo hablás con un cliente interesado?', '¿Cuál es tu mayor obstáculo para cerrar?'].map(q => (
                  <div key={q} style={{ fontSize:'12px', color:'var(--ink-dim)', border:'1px solid var(--line)', borderRadius:'4px', padding:'8px 10px' }}>{q}</div>
                ))}
              </div>
            </div>
            <div>
              <span className="stamp" style={{ marginBottom:'16px' }}>✓ Paso 2</span>
              <h3 style={{ fontSize:'18px', fontWeight:600, fontFamily:F_DISPLAY, textTransform:'uppercase', letterSpacing:'.2px', margin:'16px 0 10px', color:'var(--ink)' }}>Conectás la guardia</h3>
              <p style={{ fontSize:'14px', color:'var(--ink-dim)', lineHeight:1.6, marginBottom:'16px' }}>Escaneás un QR desde tu WhatsApp — igual que vincular WhatsApp Web. Tu número de siempre, sin SIM nueva.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {['Abrís WhatsApp → Dispositivos vinculados', 'Apuntás al QR en la pantalla', '30 segundos y quedó activo'].map(s => (
                  <div key={s} style={{ display:'flex', gap:'8px', alignItems:'baseline', fontSize:'12px', color:'var(--ink-dim)' }}>
                    <span style={{ color:'var(--green)', fontFamily:F_MONO }}>›</span>{s}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="stamp" style={{ marginBottom:'16px' }}>✓ Paso 3</span>
              <h3 style={{ fontSize:'18px', fontWeight:600, fontFamily:F_DISPLAY, textTransform:'uppercase', letterSpacing:'.2px', margin:'16px 0 10px', color:'var(--ink)' }}>Empieza el turno</h3>
              <p style={{ fontSize:'14px', color:'var(--ink-dim)', lineHeight:1.6, marginBottom:'16px' }}>Llega un lead → responde en 30 segundos. No respondió → hace relevo el día 1, 3 y 7. Quiere test drive → lo agenda. Vos solo aparecés a cerrar.</p>
              <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', padding:'11px 20px', fontSize:'12px', textDecoration:'none' }}>Empezar ahora →</a>
            </div>
          </div>
        </section>

        {/* BITÁCORA DE CAPACIDADES */}
        <section style={{ maxWidth:'1100px', margin:'0 auto', padding:'72px 24px', borderTop:'1px solid var(--line)' }}>
          <div style={{ textAlign:'center', marginBottom:'48px' }}>
            <p className="stamp" style={{ marginBottom:'14px' }}>Bitácora de capacidades</p>
            <h2 style={{ fontFamily:F_DISPLAY, textTransform:'uppercase', fontSize:'clamp(26px,3.8vw,42px)', fontWeight:700, letterSpacing:'.3px', lineHeight:1.15, marginBottom:'14px', color:'var(--ink)' }}>
              Todo lo que pasa en el turno,<br/>registrado
            </h2>
            <p style={{ fontSize:'16px', color:'var(--ink-dim)', maxWidth:'520px', margin:'0 auto', lineHeight:1.6 }}>Nada se pierde entre relevos. Cada evento del turno queda asentado con hora, qué pasó, y estado.</p>
          </div>

          <div className="grid-shared" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:'1px' }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:F_DISPLAY, fontSize:'32px', fontWeight:700, color:'var(--amber)' }}>{s.val}</div>
                <div style={{ fontSize:'12px', color:'var(--ink-dim)', marginTop:'4px', fontFamily:F_MONO, textTransform:'uppercase', letterSpacing:'.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bitacora" style={{ marginTop:'24px' }}>
            <div className="bitacora-head"><span>Turno de Ricardo · Asesor KIA</span><span>Hoy</span></div>
            {BITACORA.map((row,i) => (
              <div key={i} className="log-row">
                <span className="log-time">{row.time}</span>
                <span className="log-event">{row.evento}</span>
                <span className="log-detail">{row.detalle}</span>
                <span className={`log-status ${row.ok?'ok':'pend'}`}>{row.status}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign:'center', marginTop:'40px' }}>
            <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', padding:'13px 26px', textDecoration:'none' }}>Activar mi bitácora →</a>
            <p style={{ fontSize:'12px', color:'var(--ink-dim)', marginTop:'10px', fontFamily:F_MONO }}>14 días gratis · Sin tarjeta</p>
          </div>
        </section>

        {/* REPORTES DE CIERRE DE TURNO */}
        <section style={{ maxWidth:'1100px', margin:'0 auto', padding:'72px 24px', borderTop:'1px solid var(--line)' }}>
          <div style={{ textAlign:'center', marginBottom:'40px' }}>
            <p className="stamp" style={{ marginBottom:'14px' }}>Reportes de cierre de turno</p>
            <h2 style={{ fontFamily:F_DISPLAY, textTransform:'uppercase', fontSize:'clamp(24px,3.2vw,36px)', fontWeight:700, letterSpacing:'.3px', color:'var(--ink)' }}>Lo que dicen al recibir la guardia de vuelta</h2>
          </div>
          <div className="grid-shared grid-3">
            {REPORTES.map(r => (
              <div key={r.nombre} className="reporte">
                <span className="stamp">Cerrado ✓ · {r.sede}</span>
                <p className="quote">"{r.texto}"</p>
                <div className="firma"><span>{r.nombre}</span><span>{r.cargo}</span></div>
              </div>
            ))}
          </div>
        </section>

        {/* BALANCE DE TURNO */}
        <section id="precios" style={{ maxWidth:'1100px', margin:'0 auto', padding:'72px 24px 96px', borderTop:'1px solid var(--line)', scrollMarginTop:'80px' }}>
          <div style={{ textAlign:'center', marginBottom:'48px' }}>
            <p className="stamp" style={{ marginBottom:'14px' }}>Balance de turno</p>
            <h2 style={{ fontFamily:F_DISPLAY, textTransform:'uppercase', fontSize:'clamp(26px,3.8vw,42px)', fontWeight:700, letterSpacing:'.3px', lineHeight:1.15, marginBottom:'14px', color:'var(--ink)' }}>
              Una venta recuperada<br/>cubre el mes entero
            </h2>
            <p style={{ fontSize:'16px', color:'var(--ink-dim)', maxWidth:'480px', margin:'0 auto', lineHeight:1.6 }}>Pulse Motor no es un gasto. Es la guardia que trabaja mientras vos dormís.</p>
          </div>

          <div className="balance-grid" style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:'24px', alignItems:'start' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
              <div style={{ border:'1px solid var(--line)', borderRadius:'6px', overflow:'hidden' }}>
                <div className="balance-row">
                  <div><div className="label">Comisión por venta recuperada</div><div className="sub">Un Picanto o Sportage vendido</div></div>
                  <span className="val" style={{ color:'var(--green)', fontSize:'16px' }}>+ $500.000</span>
                </div>
                <div className="balance-row">
                  <div><div className="label">Costo Pulse Motor / mes</div><div className="sub">Todo incluido, sin sorpresas</div></div>
                  <span className="val" style={{ color:'var(--ink-dim)', fontSize:'16px' }}>− $99.000</span>
                </div>
                <div className="balance-row total">
                  <div><div className="label">Balance neto del mes</div><div className="sub">Con solo 1 lead recuperado</div></div>
                  <span className="val">+ $401.000</span>
                </div>
              </div>

              <div style={{ border:'1px solid var(--line)', borderRadius:'6px', padding:'24px', marginTop:'16px' }}>
                <p className="stamp" style={{ marginBottom:'16px' }}>¿Qué cuesta NO tener Pulse Motor?</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                  {COSTO_NO_TENERLO.map(item => (
                    <div key={item.label} style={{ display:'flex', justifyContent:'space-between', gap:'12px', fontSize:'12px' }}>
                      <span style={{ color:'var(--ink-dim)' }}>{item.label}</span>
                      <span style={{ fontFamily:F_MONO, color:'var(--red)', textAlign:'right' }}>{item.valor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ border:'1px solid var(--line)', borderRadius:'6px', padding:'20px', marginTop:'16px' }}>
                <p className="quote" style={{ marginTop:0 }}>"En el primer turno del mes recuperé 3 ventas que se me hubieran ido. Pulse Motor se pagó solo 15 veces."</p>
                <div className="firma"><span>Jorge P.</span><span>Asesor Renault · Medellín</span></div>
              </div>
            </div>

            <div style={{ position:'sticky', top:'90px' }}>
              <div className="price-card">
                <span className="stamp" style={{ marginBottom:'20px' }}>Plan único · Todo incluido</span>
                <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginTop:'16px', marginBottom:'4px' }}>
                  <span style={{ fontFamily:F_DISPLAY, fontSize:'44px', fontWeight:700, color:'var(--ink)' }}>$99k</span>
                  <span style={{ fontFamily:F_MONO, fontSize:'13px', color:'var(--ink-dim)' }}>/mes · COP</span>
                </div>
                <p style={{ fontSize:'13px', color:'var(--ink-dim)', marginBottom:'20px' }}>Cancelás cuando querás · Sin permanencia</p>
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {[
                    'Cobertura de turno 24/7 por WhatsApp',
                    'Relevo automático día 1, 3 y 7',
                    'Bitácora de capacidades y estadísticas',
                    'Tu WhatsApp actual — sin SIM nueva',
                    'Agendamiento de test drives solo',
                    'Reportes de cierre de turno',
                    'Soporte directo por WhatsApp',
                    '14 días de prueba gratis',
                  ].map(f => (
                    <div key={f} className="checklist-row"><span className="mark">✓</span><span>{f}</span></div>
                  ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'24px' }}>
                  <button onClick={() => setModalContacto(true)} className="pm-btn">Lo hacemos por vos — gratis primero</button>
                  <a href="/pulse/signup" className="pm-btn pm-btn-ghost" style={{ textDecoration:'none', textAlign:'center', display:'block' }}>Empezar solo — 14 días gratis →</a>
                </div>
                <p style={{ fontSize:'11px', color:'var(--ink-dim)', textAlign:'center', marginTop:'12px' }}>Sin tarjeta para la prueba · Cancelás en 1 clic</p>
              </div>
              <div style={{ marginTop:'14px', display:'flex', alignItems:'center', gap:'12px', padding:'14px 18px', border:'1px solid var(--line)', borderRadius:'6px' }}>
                <span className="stamp">🔒 Garantía 7 días</span>
                <span style={{ fontSize:'12px', color:'var(--ink-dim)', lineHeight:1.5 }}>Si no ves resultados en la primera semana, te devolvemos el dinero.</span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ maxWidth:'680px', margin:'0 auto', padding:'0 24px 96px', textAlign:'left' }}>
          <div style={{ border:'1px solid var(--line)', borderRadius:'6px', padding:'40px 32px' }}>
            <p className="stamp" style={{ marginBottom:'16px' }}>¿Cuántos leads se quedaron sin cobertura anoche?</p>
            <h2 style={{ fontFamily:F_DISPLAY, textTransform:'uppercase', fontSize:'clamp(22px,3vw,34px)', fontWeight:700, letterSpacing:'.3px', lineHeight:1.2, marginBottom:'20px', color:'var(--ink)', maxWidth:'20ch' }}>Con Pulse Motor, ninguno más.</h2>
            <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', padding:'14px 30px', textDecoration:'none' }}>Cubrir mi turno →</a>
            <p style={{ fontSize:'12px', color:'var(--ink-dim)', marginTop:'14px', fontFamily:F_MONO }}>14 días gratis · Sin tarjeta · Tu WhatsApp actual</p>
          </div>
        </section>

        <footer style={{ padding:'24px', textAlign:'center', fontSize:'12px', color:'var(--ink-dim)', borderTop:'1px solid var(--line)', fontFamily:F_MONO }}>
          © 2026 Pulse Motor · Hecho en Cali, Colombia
        </footer>
      </div>
    </>
  )
}
