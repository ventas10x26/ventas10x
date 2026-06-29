'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PulseContactModal from '@/components/pulse/PulseContactModal'
import { SegmentSelector } from '@/components/pulse/SegmentSelector'

const FONT      = "'Syne', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

const PASOS = [
  { num:'01', icon:'💬', titulo:'Nos contás cómo vendés', desc:'Respondés 2 preguntas sobre tu estilo de venta. 5 minutos máximo.' },
  { num:'02', icon:'📱', titulo:'Escaneás un QR', desc:'Igual que vincular WhatsApp Web. Tu número de siempre, sin SIM nueva.' },
  { num:'03', icon:'⚡', titulo:'El agente trabaja por vos', desc:'Llega un lead → responde en 30 segundos. Día 1, 3 y 7 hace seguimiento. Vos solo cerrás.' },
]

const TESTIMONIOS = [
  { nombre:'Andrés M.', cargo:'Asesor KIA · Cali', texto:'Antes perdía leads porque estaba en prueba de manejo. Ahora el agente los atiende y cuando vuelvo, ya están calientes.' },
  { nombre:'Carolina V.', cargo:'Vendedora Hyundai · Bogotá', texto:'Lo que más me gustó es que funciona con mi WhatsApp normal. Sin apps raras. Y el cliente ni sabe que es IA.' },
  { nombre:'Jorge P.', cargo:'Asesor Renault · Medellín', texto:'En el primer mes recuperé 3 ventas que se me hubieran ido. El seguimiento automático es oro.' },
]

const WA_CHAT: { out:boolean; text:string; time:string; delay:number }[] = [
  { out:false, text:'Hola! Vi el Sportage NX5 😍',                           time:'3:42 p.m.',      delay:1200 },
  { out:true,  text:'¡Hola! Desde $127M neto. ¿Te agendo el test drive? 🙌', time:'3:42 p.m. ✓✓',  delay:2600 },
  { out:true,  text:'✅ Cita agendada: mañana 10am',                          time:'3:43 p.m. ✓✓',  delay:4200 },
  { out:false, text:'Perfecto! ¿Qué color tienen disponible?',                time:'3:44 p.m.',      delay:5800 },
  { out:true,  text:'Tenemos Blanco Nieve y Gris Grafito en stock 🚗',       time:'3:44 p.m. ✓✓',  delay:7200 },
]
const LOOP_DURATION = 9500

const CUBE_FACES = [
  { face:'front',  tx:'translateZ(130px)',                 color:'rgba(14,165,233,0.1)',  border:'rgba(14,165,233,0.45)', textColor:'#7dd3fc', icon:'⚡', label:'Responde en 30 seg',     sub:'Antes que nadie' },
  { face:'back',   tx:'rotateY(180deg) translateZ(130px)', color:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.45)', textColor:'#6ee7b7', icon:'🔁', label:'Seguimiento automático', sub:'Día 1, 3 y 7' },
  { face:'right',  tx:'rotateY(90deg) translateZ(130px)',  color:'rgba(37,211,102,0.08)', border:'rgba(37,211,102,0.35)', textColor:'#6ee7b7', icon:'WA', label:'Tu WhatsApp · QR',       sub:'Sin SIM nueva' },
  { face:'left',   tx:'rotateY(-90deg) translateZ(130px)', color:'rgba(14,165,233,0.1)',  border:'rgba(14,165,233,0.35)', textColor:'#7dd3fc', icon:'🎯', label:'Entrenado por vos',      sub:'Tu voz, tu estilo' },
  { face:'top',    tx:'rotateX(90deg) translateZ(130px)',  color:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.35)', textColor:'#6ee7b7', icon:'📅', label:'Agenda citas solo',      sub:'Test drives automáticos' },
  { face:'bottom', tx:'rotateX(-90deg) translateZ(130px)', color:'rgba(14,165,233,0.08)', border:'rgba(14,165,233,0.25)', textColor:'#7dd3fc', icon:'🧠', label:'Aprende tu estilo',      sub:'Más preciso con el tiempo' },
]

const WA_SVG_SM = <svg viewBox="0 0 24 24" fill="#25d366" style={{width:'20px',height:'20px'}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.565 4.14 1.548 5.873L.057 23.57a.75.75 0 0 0 .92.921l5.697-1.491A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.192-1.457l-.372-.22-3.853 1.009 1.01-3.762-.241-.386A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
const WA_SVG_LG = <svg viewBox="0 0 24 24" fill="#25d366" style={{width:'40px',height:'40px',flexShrink:0}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.565 4.14 1.548 5.873L.057 23.57a.75.75 0 0 0 .92.921l5.697-1.491A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.192-1.457l-.372-.22-3.853 1.009 1.01-3.762-.241-.386A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
const WA_SVG_WH = <svg viewBox="0 0 24 24" fill="#fff" style={{width:'16px',height:'16px'}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.565 4.14 1.548 5.873L.057 23.57a.75.75 0 0 0 .92.921l5.697-1.491A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.192-1.457l-.372-.22-3.853 1.009 1.01-3.762-.241-.386A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>

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
  const [showTyping, setShowTyping]           = useState(false)
  const [modalContacto, setModalContacto]     = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [visibleMsgs, showTyping])

  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t) }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUsuarioLogueado(data.user.email ?? data.user.id)
    })
  }, [])

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = []
    const runLoop = () => {
      setVisibleMsgs([]); setShowTyping(false)
      WA_CHAT.forEach((msg, i) => {
        timers.push(setTimeout(() => {
          if (i > 0 && msg.out) setShowTyping(true)
          timers.push(setTimeout(() => { setShowTyping(false); setVisibleMsgs(prev => [...prev, i]) }, msg.out ? 700 : 0))
        }, msg.delay))
      })
      timers.push(setTimeout(runLoop, LOOP_DURATION))
    }
    runLoop()
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const scene = document.getElementById('pm-cube-scene')
    const cube  = document.getElementById('pm-cube')
    if (!scene || !cube) return
    let rx = -20, ry = 30, trx = rx, try_ = ry, raf: number
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const animate = () => { rx = lerp(rx,trx,0.06); ry = lerp(ry,try_,0.06); cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; raf = requestAnimationFrame(animate) }
    const onMove = (e: MouseEvent) => { const r = scene.getBoundingClientRect(); trx = -((e.clientY-r.top-r.height/2)/r.height)*60; try_ = ((e.clientX-r.left-r.width/2)/r.width)*60 }
    const autoSpin = setInterval(() => { try_ += 0.4 }, 16)
    scene.addEventListener('mousemove', onMove)
    scene.addEventListener('mouseleave', () => { trx = -20; try_ = ry })
    raf = requestAnimationFrame(animate)
    return () => { scene.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); clearInterval(autoSpin) }
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

  return (
    <>
      <style>{`

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --blue:#0ea5e9; --green:#10b981; --grad:linear-gradient(135deg,#0ea5e9,#10b981); --bg:#080f1a; --border:rgba(255,255,255,0.07); }
        body { background: var(--bg); }

        .pm-input { width:100%; padding:13px 16px; border-radius:10px; border:1.5px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#fff; font-size:15px; font-family:${FONT_BODY}; outline:none; transition:border-color .2s,box-shadow .2s; }
        .pm-input:focus { border-color:var(--blue); box-shadow:0 0 0 3px rgba(14,165,233,0.12); }
        .pm-input.err { border-color:#f87171; }
        .pm-input::placeholder { color:#475569; }
        select option { background:#1e293b; }

        .pm-btn { width:100%; padding:15px; border-radius:10px; border:none; background:var(--grad); color:#fff; font-size:16px; font-weight:700; cursor:pointer; font-family:${FONT}; letter-spacing:-.2px; box-shadow:0 4px 20px rgba(14,165,233,0.25); transition:all .2s; }
        .pm-btn:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); box-shadow:0 8px 28px rgba(14,165,233,0.35); }
        .pm-btn:disabled { opacity:.5; cursor:not-allowed; }

        .card { background:rgba(255,255,255,0.025); border:1px solid var(--border); border-radius:16px; transition:border-color .2s,transform .2s; }
        .card:hover { border-color:rgba(14,165,233,0.2); transform:translateY(-2px); }

        .pm-headline-line { overflow:hidden; display:block; }
        .pm-headline-inner { display:block; transform:translateY(100%); opacity:0; transition:transform 0.65s cubic-bezier(0.16,1,0.3,1), opacity 0.65s ease; }
        .pm-headline-inner.on { transform:translateY(0); opacity:1; }

        .wa-bubble { opacity:0; transform:translateY(10px) scale(0.97); transition:opacity 0.3s ease, transform 0.3s ease; }
        .wa-bubble.on { opacity:1; transform:translateY(0) scale(1); }
        .wa-typing { display:flex; gap:4px; align-items:center; height:16px; }
        .wa-dot { width:7px; height:7px; border-radius:50%; background:#25d366; animation:waBounce 1.1s ease infinite; }
        .wa-dot:nth-child(2){animation-delay:.18s} .wa-dot:nth-child(3){animation-delay:.36s}
        @keyframes waBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        .wa-scroll::-webkit-scrollbar{width:3px} .wa-scroll::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:2px}

        @keyframes blinkSignal { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes floatPhone  { 0%,100%{transform:translateY(0px) rotate(0.5deg)} 50%{transform:translateY(-8px) rotate(-0.5deg)} }
        @keyframes glowPulse   { 0%,100%{box-shadow:0 0 30px rgba(37,211,102,0.15),0 30px 60px rgba(0,0,0,0.5)} 50%{box-shadow:0 0 50px rgba(37,211,102,0.25),0 30px 60px rgba(0,0,0,0.5)} }
        @keyframes floatParticle { 0%,100%{transform:translateY(0) translateX(0);opacity:.6} 33%{transform:translateY(-20px) translateX(10px);opacity:1} 66%{transform:translateY(10px) translateX(-8px);opacity:.4} }

        @keyframes navGlow {
          0%,100% { box-shadow: 0 0 8px rgba(16,185,129,0.4), 0 0 20px rgba(16,185,129,0.2); }
          50%      { box-shadow: 0 0 16px rgba(16,185,129,0.7), 0 0 36px rgba(16,185,129,0.35); }
        }
        .btn-nav-hacemos { animation: navGlow 2.5s ease-in-out infinite; transition: transform .2s, opacity .2s !important; }
        .btn-nav-hacemos:hover { transform: translateY(-1px); opacity: .9; }

        .hacemos-section {
          position: relative;
          background: radial-gradient(ellipse 100% 80% at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 65%),
                      linear-gradient(180deg, rgba(16,185,129,0.05) 0%, rgba(14,165,233,0.03) 50%, transparent 100%);
          border-top: 1px solid rgba(16,185,129,0.2);
          border-bottom: 1px solid rgba(16,185,129,0.1);
          overflow: hidden;
        }
        .hacemos-section::before {
          content:''; position:absolute; inset:0;
          background: repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(16,185,129,0.03) 59px, rgba(16,185,129,0.03) 60px),
                      repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(16,185,129,0.03) 59px, rgba(16,185,129,0.03) 60px);
          pointer-events:none;
        }
        .hacemos-orb-1 { position:absolute; top:-80px; left:10%; width:400px; height:400px; background:radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%); border-radius:50%; pointer-events:none; }
        .hacemos-orb-2 { position:absolute; bottom:-60px; right:5%; width:300px; height:300px; background:radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%); border-radius:50%; pointer-events:none; }

        .cube-face { position:absolute; width:260px; height:260px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:24px; font-size:13px; font-weight:600; font-family:${FONT_BODY}; text-align:center; line-height:1.35; backdrop-filter:blur(4px); }
        .cube-section-bg { background:radial-gradient(ellipse 80% 60% at 50% 50%, rgba(14,165,233,0.06) 0%, transparent 70%); position:relative; overflow:hidden; }
        .cube-section-bg::before { content:''; position:absolute; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.015) 59px,rgba(255,255,255,0.015) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.015) 59px,rgba(255,255,255,0.015) 60px); pointer-events:none; }

        .btn-hacemos { transition:all .2s !important; }
        .btn-hacemos:hover { transform:translateY(-2px) !important; box-shadow:0 8px 28px rgba(16,185,129,0.4) !important; }

        .pricing-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; align-items:start; }
        .roi-line { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; }
        .check-feat { display:flex; align-items:center; gap:10px; padding:7px 0; }
        @keyframes pricingGlow { 0%,100%{box-shadow:0 0 30px rgba(14,165,233,0.1),0 24px 60px rgba(0,0,0,0.3)} 50%{box-shadow:0 0 50px rgba(14,165,233,0.18),0 24px 60px rgba(0,0,0,0.3)} }
        .pricing-card { animation: pricingGlow 4s ease-in-out infinite; }

        @media(max-width:900px){
          .hero-grid{flex-direction:column!important;align-items:center!important}
          .hero-grid>*{max-width:100%!important;width:100%!important}
          .skills-grid{grid-template-columns:1fr!important}
          .grid3{grid-template-columns:1fr!important}
          .cube-layout{flex-direction:column!important;align-items:center!important}
          .pricing-grid{grid-template-columns:1fr!important}
          .segment-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      <PulseContactModal open={modalContacto} onClose={() => setModalContacto(false)} />

      <div style={{ minHeight:'100vh', background:'var(--bg)', color:'#fff', fontFamily:FONT_BODY }}>

        {/* BG glow */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-20%', left:'50%', transform:'translateX(-50%)', width:'700px', height:'700px', background:'radial-gradient(circle,rgba(14,165,233,0.07) 0%,transparent 70%)', borderRadius:'50%' }} />
          <div style={{ position:'absolute', top:'40%', right:'-10%', width:'350px', height:'350px', background:'radial-gradient(circle,rgba(16,185,129,0.05) 0%,transparent 70%)', borderRadius:'50%' }} />
        </div>

        {/* HEADER */}
        <header style={{ position:'sticky', top:0, zIndex:100, padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:'1100px', margin:'0 auto', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', boxShadow:'0 0 16px rgba(14,165,233,0.3)' }}>⚡</div>
            <span style={{ fontSize:'18px', fontWeight:700, fontFamily:FONT, letterSpacing:'-.3px' }}>Pulse Motor</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {usuarioLogueado ? (
              <a href="/pulse/agente" style={{ fontSize:'14px', fontWeight:600, color:'#fff', padding:'8px 18px', borderRadius:'8px', background:'var(--grad)', textDecoration:'none' }}>Mi agente →</a>
            ) : (
              <>
                <button onClick={() => setModalContacto(true)} className="btn-nav-hacemos" style={{ fontSize:'13px', fontWeight:700, color:'#fff', padding:'8px 16px', borderRadius:'8px', background:'linear-gradient(135deg,#10b981,#059669)', border:'1px solid rgba(16,185,129,0.4)', cursor:'pointer', fontFamily:FONT_BODY, display:'flex', alignItems:'center', gap:'6px', letterSpacing:'-.1px' }}>
                  🤝 Lo hacemos por vos
                </button>
                <a href="#precios" style={{ fontSize:'14px', fontWeight:500, color:'#94a3b8', padding:'8px 16px', borderRadius:'8px', textDecoration:'none', transition:'color .15s' }} onMouseEnter={e=>(e.currentTarget.style.color='#e2e8f0')} onMouseLeave={e=>(e.currentTarget.style.color='#94a3b8')}>Precios</a>
                <a href="/pulse/login"  style={{ fontSize:'14px', fontWeight:500, color:'#94a3b8', padding:'8px 16px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', textDecoration:'none' }}>Ingresar</a>
                <a href="/pulse/signup" style={{ fontSize:'14px', fontWeight:600, color:'#fff', padding:'8px 18px', borderRadius:'8px', background:'var(--grad)', textDecoration:'none', boxShadow:'0 4px 14px rgba(14,165,233,0.25)' }}>Registrarse →</a>
              </>
            )}
          </div>
        </header>

        {/* HERO */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'72px 24px 80px' }}>
          <div style={{ textAlign:'center', marginBottom:'56px' }}>

            {/* Badge */}
            <div style={{ ...v(100), display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.25)', borderRadius:'999px', padding:'5px 14px', fontSize:'12px', fontWeight:600, color:'#7dd3fc', marginBottom:'24px' }}>
              🚗 Para asesores y concesionarios automotrices
            </div>

            {/* ── SELECTOR DE SEGMENTO ── */}
            <SegmentSelector />

            {/* Headline */}
            <h1 id="pm-hero-headline" style={{ fontFamily:FONT, fontSize:'clamp(34px,5.5vw,60px)', fontWeight:700, lineHeight:'1.08', letterSpacing:'-.5px', margin:'0 0 20px', scrollMarginTop:'100px' }}>
              <span className="pm-headline-line"><span className={`pm-headline-inner${visible?' on':''}`} style={{ transitionDelay:'0.3s' }}>Tu agente entrenado,</span></span>
              <span className="pm-headline-line"><span className={`pm-headline-inner${visible?' on':''}`} style={{ transitionDelay:'0.5s', background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>respondiendo en tu WhatsApp</span></span>
              <span className="pm-headline-line"><span className={`pm-headline-inner${visible?' on':''}`} style={{ transitionDelay:'0.7s' }}>mientras vos vendés.</span></span>
            </h1>
            <p style={{ ...v(900), fontSize:'clamp(15px,2vw,18px)', color:'#64748b', maxWidth:'500px', margin:'0 auto 20px', lineHeight:'1.65' }}>
              Le enseñás cómo vendés vos. Él responde leads en 30 segundos, hace seguimiento y agenda citas — desde tu número de siempre.
            </p>
            <div style={{ ...v(1100), display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', flexWrap:'wrap' }}>
              {[
                { text:'WA Tu WhatsApp · QR · Sin SIM nueva', green:true },
                { text:'⚡ Responde en &lt;30 seg', green:false },
                { text:'🔁 Seguimiento día 1, 3 y 7', green:false },
              ].map(p => (
                <div key={p.text} dangerouslySetInnerHTML={{ __html:p.text }} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'999px', fontSize:'12px', fontWeight:500, background:p.green?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.04)', border:`1px solid ${p.green?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)'}`, color:p.green?'#6ee7b7':'#475569' }} />
              ))}
            </div>
          </div>

          {/* Video Synthesia */}
          <div style={{ display:'flex', alignItems:'center', gap:'64px', justifyContent:'center', flexWrap:'wrap', marginTop:'80px', paddingTop:'80px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ flex:'1', minWidth:'280px', maxWidth:'420px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:'999px', padding:'5px 14px', fontSize:'12px', fontWeight:600, color:'#7dd3fc', marginBottom:'24px' }}>🎬 Mirá cómo funciona</div>
              <h2 style={{ fontFamily:FONT, fontSize:'clamp(26px,3.5vw,40px)', fontWeight:700, lineHeight:1.12, letterSpacing:'-.4px', margin:'0 0 18px' }}>
                Mirá por qué ningún<br/><span style={{ background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>lead se queda sin respuesta.</span>
              </h2>
              <p style={{ fontSize:'15px', color:'#64748b', lineHeight:'1.7', margin:'0 0 32px' }}>En 60 segundos entendés por qué los asesores que usan Pulse Motor venden más — sin trabajar más horas.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginBottom:'36px' }}>
                {[
                  { icon:'⚡', bg:'rgba(14,165,233,0.1)', border:'rgba(14,165,233,0.2)', text:'Responde al lead en 30 segundos desde tu número' },
                  { icon:'🔁', bg:'rgba(16,185,129,0.1)', border:'rgba(16,185,129,0.2)', text:'Follow-up automático día 1, 3 y 7 sin que hagas nada' },
                  { icon:'🎯', bg:'rgba(14,165,233,0.1)', border:'rgba(14,165,233,0.2)', text:'Entrena al agente con tu propio estilo de venta' },
                ].map(item => (
                  <div key={item.icon} style={{ display:'flex', gap:'14px', alignItems:'center' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', flexShrink:0, background:item.bg, border:`1px solid ${item.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{item.icon}</div>
                    <span style={{ fontSize:'14px', color:'#94a3b8', lineHeight:'1.5' }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <a href="/pulse/signup" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'13px 26px', borderRadius:'12px', background:'var(--grad)', color:'#fff', fontSize:'15px', fontWeight:700, textDecoration:'none', fontFamily:FONT, boxShadow:'0 4px 20px rgba(14,165,233,0.25)', letterSpacing:'-.2px' }}>Crear mi agente gratis →</a>
              <p style={{ fontSize:'12px', color:'#334155', marginTop:'10px' }}>14 días gratis · Sin tarjeta · Tu WhatsApp actual</p>
            </div>
            <div style={{ flex:'1.2', minWidth:'300px', maxWidth:'600px' }}>
              <div style={{ position:'relative', overflow:'hidden', aspectRatio:'1920/1080', borderRadius:'20px', boxShadow:'0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <iframe src="https://share.synthesia.io/embeds/videos/8ca3103d-efcb-406a-b40e-d21b61845a48?autoplay=1" loading="lazy" title="Pulse Motor" allowFullScreen allow="encrypted-media; fullscreen; microphone; screen-wake-lock; autoplay;" style={{ position:'absolute', width:'100%', height:'100%', top:0, left:0, border:'none', borderRadius:'20px' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginTop:'18px', flexWrap:'wrap' }}>
                {[
                  { icon:'⭐', text:'4.9/5 asesores',       color:'#fbbf24', bg:'rgba(251,191,36,0.12)',  border:'rgba(251,191,36,0.25)' },
                  { icon:'🚗', text:'+500 leads atendidos', color:'#6ee7b7', bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)' },
                  { icon:'⚡', text:'30 seg respuesta',     color:'#7dd3fc', bg:'rgba(14,165,233,0.12)', border:'rgba(14,165,233,0.25)' },
                ].map(b => (
                  <div key={b.text} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'6px 14px', borderRadius:'999px', fontSize:'12px', fontWeight:600, color:b.color, background:b.bg, border:`1px solid ${b.border}` }}>
                    <span>{b.icon}</span><span>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hero grid — form + phone */}
          <div className="hero-grid" style={{ display:'flex', alignItems:'center', gap:'48px', justifyContent:'center', marginTop:'80px', paddingTop:'80px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <form onSubmit={submit} style={{ ...v(1200), flex:'1', minWidth:'280px', maxWidth:'380px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'28px', backdropFilter:'blur(12px)' }}>
              <h3 style={{ fontSize:'20px', fontWeight:700, margin:'0 0 4px', fontFamily:FONT, letterSpacing:'-.3px' }}>Configurá tu agente gratis</h3>
              <p style={{ fontSize:'13px', color:'#64748b', margin:'0 0 24px' }}>Listo en 5 minutos. Sin tarjeta.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'16px' }}>
                <div>
                  <input type="text" placeholder="Tu nombre" value={nombre} onChange={e=>setNombre(e.target.value)} onBlur={()=>setTouchedNombre(true)} disabled={estado==='enviando'} className={`pm-input${touchedNombre&&errorNombre?' err':''}`} />
                  {touchedNombre&&errorNombre&&<span style={{ fontSize:'12px', color:'#f87171', marginTop:'4px', display:'block' }}>⚠ {errorNombre}</span>}
                </div>
                <div>
                  <input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} onBlur={()=>setTouchedEmail(true)} disabled={estado==='enviando'} className={`pm-input${touchedEmail&&errorEmail?' err':''}`} />
                  {touchedEmail&&errorEmail&&<span style={{ fontSize:'12px', color:'#f87171', marginTop:'4px', display:'block' }}>⚠ {errorEmail}</span>}
                </div>
                <select value={marca} onChange={e=>setMarca(e.target.value)} disabled={estado==='enviando'} className="pm-input" style={{ cursor:'pointer', color:marca?'#fff':'#475569' }}>
                  <option value="">¿Con qué marca trabajás? (opcional)</option>
                  {['KIA','Hyundai','Renault','Chevrolet','Toyota','Mazda','Nissan','Otro'].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <button type="submit" disabled={estado==='enviando'} className="pm-btn" style={{ marginBottom:'14px' }}>{estado==='enviando'?'Configurando…':'Crear mi agente →'}</button>
              {errorGeneral&&<p style={{ fontSize:'13px', color:'#f87171', marginBottom:'8px', textAlign:'center' }}>⚠ {errorGeneral}</p>}
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {['Conecta con tu WhatsApp actual vía QR','Sin número nuevo ni SIM extra','14 días gratis sin tarjeta'].map(t=>(
                  <div key={t} style={{ fontSize:'13px', color:'#334155', display:'flex', gap:'6px', alignItems:'flex-start' }}>
                    <span style={{ color:'#10b981', flexShrink:0 }}>✓</span><span>{t}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:'13px', color:'#334155', margin:'16px 0 0', textAlign:'center' }}>
                ¿Ya tenés cuenta? <a href="/pulse/login" style={{ color:'#0ea5e9', textDecoration:'none', fontWeight:500 }}>Ingresar →</a>
              </p>
            </form>

            <div style={{ ...v(1400), flex:'1', minWidth:'280px', maxWidth:'340px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.25)', borderRadius:'999px', padding:'5px 14px', fontSize:'12px', fontWeight:600, color:'#6ee7b7' }}>
                <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#25d366', display:'inline-block', animation:'pulse 2s ease infinite' }} />
                Agente respondiendo en vivo
              </div>
              <div style={{ width:'270px', background:'#1a1a2e', borderRadius:'40px', padding:'12px', border:'2px solid rgba(255,255,255,0.12)', boxShadow:'0 0 30px rgba(37,211,102,0.15),0 30px 60px rgba(0,0,0,0.5)', animation:'floatPhone 4s ease-in-out infinite, glowPulse 3s ease-in-out infinite' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:'8px' }}><div style={{ width:'80px', height:'6px', background:'rgba(255,255,255,0.08)', borderRadius:'3px' }} /></div>
                <div style={{ background:'#fff', borderRadius:'28px', overflow:'hidden' }}>
                  <div style={{ background:'#075e54', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'14px', fontWeight:700, color:'#fff' }}>A</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'#fff', lineHeight:1.2 }}>Agente Pulse Motor</div>
                      <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', gap:'4px', marginTop:'2px' }}>
                        <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#25d366', display:'inline-block', animation:'blinkSignal 2s ease infinite' }} />en línea
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'14px', color:'rgba(255,255,255,0.7)', fontSize:'16px' }}><span>📹</span><span>📞</span></div>
                  </div>
                  <div style={{ background:'#e5ddd5', minHeight:'300px', padding:'12px 10px', display:'flex', flexDirection:'column', gap:'6px' }}>
                    <div style={{ textAlign:'center', marginBottom:'6px' }}><span style={{ background:'rgba(0,0,0,0.15)', color:'#fff', fontSize:'10px', padding:'3px 10px', borderRadius:'8px' }}>HOY</span></div>
                    <div ref={chatRef} className="wa-scroll" style={{ display:'flex', flexDirection:'column', gap:'5px', overflowY:'auto', maxHeight:'260px' }}>
                      {WA_CHAT.map((msg,i) => (
                        <div key={i} className={`wa-bubble${visibleMsgs.includes(i)?' on':''}`} style={{ alignSelf:msg.out?'flex-end':'flex-start', maxWidth:'82%' }}>
                          <div style={{ background:msg.out?'#dcf8c6':'#fff', borderRadius:msg.out?'12px 12px 2px 12px':'12px 12px 12px 2px', padding:'7px 10px 4px', boxShadow:'0 1px 2px rgba(0,0,0,0.13)' }}>
                            <p style={{ fontSize:'12px', color:'#111', margin:0, lineHeight:'1.45', fontFamily:FONT_BODY }}>{msg.text}</p>
                            <div style={{ fontSize:'9px', color:'#8c9199', textAlign:'right', marginTop:'3px' }}>{msg.time}</div>
                          </div>
                        </div>
                      ))}
                      {showTyping&&<div style={{ alignSelf:'flex-start' }}><div style={{ background:'#fff', borderRadius:'12px 12px 12px 2px', padding:'10px 14px', boxShadow:'0 1px 2px rgba(0,0,0,0.13)' }}><div className="wa-typing"><div className="wa-dot"/><div className="wa-dot"/><div className="wa-dot"/></div></div></div>}
                    </div>
                  </div>
                  <div style={{ background:'#f0f0f0', padding:'8px 10px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ flex:1, background:'#fff', borderRadius:'20px', padding:'8px 14px', fontSize:'11px', color:'#8c9199' }}>Mensaje</div>
                    <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#075e54', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>🎤</div>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'center', marginTop:'10px' }}><div style={{ width:'90px', height:'4px', background:'rgba(255,255,255,0.2)', borderRadius:'2px' }} /></div>
              </div>
              <div style={{ fontSize:'12px', color:'#334155', textAlign:'center' }}>Responde solo mientras vos cerrás otras ventas</div>
            </div>
          </div>
        </section>

        {/* LO HACEMOS JUNTOS */}
        <section className="hacemos-section" style={{ position:'relative', zIndex:1, padding:'80px 24px 90px' }}>
          <div className="hacemos-orb-1" /><div className="hacemos-orb-2" />
          <div style={{ maxWidth:'1100px', margin:'0 auto', position:'relative', zIndex:1 }}>
            <div style={{ textAlign:'center', marginBottom:'56px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.4)', borderRadius:'999px', padding:'6px 18px', marginBottom:'16px' }}>
                <span style={{ fontSize:'14px' }}>🤝</span>
                <span style={{ fontSize:'12px', fontWeight:700, color:'#34d399', letterSpacing:'1px', textTransform:'uppercase' }}>Lo hacemos juntos</span>
              </div>
              <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:700, letterSpacing:'-.5px', fontFamily:FONT, marginBottom:'14px', lineHeight:'1.1' }}>
                Vos ponés tu celular.<br/>
                <span style={{ background:'linear-gradient(135deg,#10b981,#0ea5e9)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Nosotros hacemos el resto.</span>
              </h2>
              <p style={{ fontSize:'16px', color:'#64748b', maxWidth:'500px', margin:'0 auto 28px', lineHeight:'1.6' }}>
                No necesitás saber de tecnología. No necesitás una SIM nueva. No necesitás instalar nada. Solo seguís 3 pasos simples.
              </p>
              <button onClick={() => setModalContacto(true)} className="btn-hacemos" style={{ display:'inline-flex', alignItems:'center', gap:'10px', background:'linear-gradient(135deg,#10b981,#059669)', border:'1px solid rgba(16,185,129,0.5)', borderRadius:'14px', padding:'14px 28px', fontFamily:FONT, fontSize:'16px', fontWeight:700, color:'#fff', cursor:'pointer', boxShadow:'0 4px 24px rgba(16,185,129,0.35)', letterSpacing:'-.2px' }}>
                🤝 Quiero que lo hagan por mí →
              </button>
              <p style={{ fontSize:'12px', color:'#334155', marginTop:'10px' }}>Te contactamos en menos de 24 hs · Sin compromiso · Sin tarjeta</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
              {/* PASO 1 */}
              <div style={{ display:'flex', gap:'40px', alignItems:'stretch', flexWrap:'wrap' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'56px', flexShrink:0 }}>
                  <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#0ea5e9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:800, color:'#fff', fontFamily:FONT, flexShrink:0, boxShadow:'0 0 24px rgba(16,185,129,0.5)' }}>1</div>
                  <div style={{ width:'2px', flex:1, background:'linear-gradient(to bottom,rgba(16,185,129,0.5),rgba(14,165,233,0.1))', marginTop:'8px', minHeight:'60px' }} />
                </div>
                <div style={{ flex:1, minWidth:'260px', paddingBottom:'48px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'24px', flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:'220px' }}>
                      <p style={{ fontSize:'11px', fontWeight:700, color:'#10b981', letterSpacing:'2px', textTransform:'uppercase', margin:'0 0 8px', paddingTop:'14px' }}>Vos hacés</p>
                      <h3 style={{ fontSize:'22px', fontWeight:700, fontFamily:FONT, margin:'0 0 10px', letterSpacing:'-.3px' }}>Nos contás cómo vendés vos</h3>
                      <p style={{ fontSize:'15px', color:'#64748b', lineHeight:'1.65', margin:'0 0 16px' }}>Respondés 2 preguntas: cómo hablás con tus clientes y cuál es tu mayor reto. Eso es todo lo que nos das. 5 minutos máximo.</p>
                      <button onClick={() => setModalContacto(true)} className="btn-hacemos" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,#10b981,#059669)', border:'none', borderRadius:'12px', padding:'12px 22px', fontFamily:FONT, fontSize:'14px', fontWeight:700, color:'#fff', cursor:'pointer', boxShadow:'0 4px 20px rgba(16,185,129,0.3)', letterSpacing:'-.1px' }}>
                        🤝 Empezamos — escribinos ahora
                      </button>
                      <p style={{ fontSize:'12px', color:'#334155', marginTop:'8px' }}>Te contactamos en menos de 24 hs · Sin compromiso</p>
                    </div>
                    <div style={{ background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:'16px', padding:'20px', minWidth:'220px', maxWidth:'280px', flexShrink:0 }}>
                      <div style={{ fontSize:'11px', color:'#334155', fontWeight:600, marginBottom:'14px', letterSpacing:'1px', textTransform:'uppercase' }}>Pulse Motor te pregunta</div>
                      {[{q:'¿Cómo hablás normalmente con un cliente interesado?',tag:'Tu estilo'},{q:'¿Cuál es tu mayor obstáculo para cerrar una venta?',tag:'Tu reto'}].map((item,i) => (
                        <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', padding:'12px', marginBottom:'8px' }}>
                          <div style={{ display:'inline-block', fontSize:'10px', fontWeight:700, color:'#6ee7b7', background:'rgba(16,185,129,0.12)', padding:'2px 8px', borderRadius:'999px', marginBottom:'6px' }}>{item.tag}</div>
                          <p style={{ fontSize:'12px', color:'#94a3b8', lineHeight:'1.5', margin:0 }}>{item.q}</p>
                        </div>
                      ))}
                      <div style={{ marginTop:'12px', padding:'10px 12px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'8px', fontSize:'12px', color:'#6ee7b7', fontWeight:600 }}>✓ Con eso creamos tu agente personalizado</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* PASO 2 */}
              <div style={{ display:'flex', gap:'40px', alignItems:'stretch', flexWrap:'wrap' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'56px', flexShrink:0 }}>
                  <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:800, color:'#fff', fontFamily:FONT, flexShrink:0, boxShadow:'0 0 24px rgba(14,165,233,0.4)' }}>2</div>
                  <div style={{ width:'2px', flex:1, background:'linear-gradient(to bottom,rgba(14,165,233,0.4),rgba(16,185,129,0.1))', marginTop:'8px', minHeight:'60px' }} />
                </div>
                <div style={{ flex:1, minWidth:'260px', paddingBottom:'48px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'24px', flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:'220px' }}>
                      <p style={{ fontSize:'11px', fontWeight:700, color:'#0ea5e9', letterSpacing:'2px', textTransform:'uppercase', margin:'0 0 8px', paddingTop:'14px' }}>Solo abrís la cámara</p>
                      <h3 style={{ fontSize:'22px', fontWeight:700, fontFamily:FONT, margin:'0 0 10px', letterSpacing:'-.3px' }}>Escaneás un QR con tu celular</h3>
                      <p style={{ fontSize:'15px', color:'#64748b', lineHeight:'1.65', margin:'0 0 16px' }}>Es exactamente igual a cuando vinculás WhatsApp Web. Abrís WhatsApp → Dispositivos vinculados → apuntás al QR. En 30 segundos quedó.</p>
                      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                        {['📱 Tu número de siempre','🚫 Sin SIM nueva'].map(t => (
                          <div key={t} style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'10px', padding:'8px 14px', fontSize:'13px', color:'#6ee7b7', fontWeight:600 }}>{t}</div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background:'rgba(14,165,233,0.04)', border:'1px solid rgba(14,165,233,0.12)', borderRadius:'16px', padding:'20px', minWidth:'220px', maxWidth:'280px', flexShrink:0 }}>
                      <div style={{ fontSize:'11px', color:'#334155', fontWeight:600, marginBottom:'14px', letterSpacing:'1px', textTransform:'uppercase' }}>Así de simple</div>
                      {[{icon:'📱',paso:'Abrís WhatsApp en tu celular'},{icon:'⋮',paso:'Tocás los 3 puntos → Dispositivos vinculados'},{icon:'📷',paso:'Apuntás al QR en la pantalla'},{icon:'✅',paso:'¡Listo! Tu agente está activo',ok:true}].map((s,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:i<3?'1px solid rgba(255,255,255,0.04)':'none' }}>
                          <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', flexShrink:0 }}>{s.icon}</div>
                          <span style={{ fontSize:'12px', color:s.ok?'#6ee7b7':'#94a3b8', fontWeight:s.ok?600:400 }}>{s.paso}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* PASO 3 */}
              <div style={{ display:'flex', gap:'40px', alignItems:'stretch', flexWrap:'wrap' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'56px', flexShrink:0 }}>
                  <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#0ea5e9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:800, color:'#fff', fontFamily:FONT, flexShrink:0, boxShadow:'0 0 24px rgba(16,185,129,0.4)' }}>3</div>
                </div>
                <div style={{ flex:1, minWidth:'260px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'24px', flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:'220px' }}>
                      <p style={{ fontSize:'11px', fontWeight:700, color:'#10b981', letterSpacing:'2px', textTransform:'uppercase', margin:'0 0 8px', paddingTop:'14px' }}>De acá en adelante</p>
                      <h3 style={{ fontSize:'22px', fontWeight:700, fontFamily:FONT, margin:'0 0 10px', letterSpacing:'-.3px' }}>El agente trabaja. Vos cerrás.</h3>
                      <p style={{ fontSize:'15px', color:'#64748b', lineHeight:'1.65', margin:'0 0 20px' }}>Llega un lead → el agente responde en 30 segundos. No respondió → el agente hace seguimiento el día 1, 3 y 7. Quiere test drive → lo agenda. Vos solo aparecés a cerrar.</p>
                      <a href="/pulse/signup" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'13px 24px', borderRadius:'12px', background:'var(--grad)', color:'#fff', fontSize:'15px', fontWeight:700, textDecoration:'none', fontFamily:FONT, boxShadow:'0 4px 20px rgba(14,165,233,0.3)', letterSpacing:'-.2px' }}>Empezar ahora — es gratis →</a>
                      <p style={{ fontSize:'12px', color:'#334155', marginTop:'8px' }}>14 días gratis · Sin tarjeta · Tu WhatsApp actual</p>
                    </div>
                    <div style={{ background:'rgba(16,185,129,0.04)', border:'1px solid rgba(16,185,129,0.12)', borderRadius:'16px', padding:'16px', minWidth:'220px', maxWidth:'280px', flexShrink:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px', paddingBottom:'10px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#25d366', display:'flex', alignItems:'center', justifyContent:'center' }}>{WA_SVG_WH}</div>
                        <div><div style={{ fontSize:'12px', fontWeight:700, color:'#fff' }}>Tu agente IA</div><div style={{ fontSize:'10px', color:'#10b981' }}>● En línea · responde solo</div></div>
                      </div>
                      {[{out:false,text:'Hola, me interesa el Sportage',sub:'Lead nuevo · 3:42pm'},{out:true,text:'¡Hola! Desde $127M. ¿Te agendo test drive? 🚗',sub:'Agente · 3:42pm ✓✓'},{out:false,text:'Sí, este sábado',sub:'Lead · 3:43pm'},{out:true,text:'✅ Listo, sábado 10am agendado',sub:'Agente · 3:43pm ✓✓'}].map((m,i) => (
                        <div key={i} style={{ display:'flex', justifyContent:m.out?'flex-end':'flex-start', marginBottom:'8px' }}>
                          <div style={{ maxWidth:'80%' }}>
                            <div style={{ padding:'7px 10px', borderRadius:m.out?'12px 12px 2px 12px':'12px 12px 12px 2px', background:m.out?'#005c4b':'rgba(255,255,255,0.07)', fontSize:'11px', color:'#fff', lineHeight:'1.4' }}>{m.text}</div>
                            <div style={{ fontSize:'9px', color:'#334155', marginTop:'2px', textAlign:m.out?'right':'left' }}>{m.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HABILIDADES + DASHBOARD */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'80px 24px' }}>
          <div className="skills-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'64px', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'#0ea5e9', textTransform:'uppercase', marginBottom:'16px' }}>Tu agente IA</p>
              <h2 style={{ fontSize:'clamp(26px,3vw,40px)', fontWeight:700, fontFamily:FONT, letterSpacing:'-.4px', lineHeight:'1.1', marginBottom:'40px' }}>
                Un agente que{' '}<span style={{ background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>vende como vos</span>
              </h2>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {[
                  {icon:'⚡',label:'Responde en 30 segundos',desc:'El lead llega y el agente responde antes de que vos puedas leer la notificación.',color:'#0ea5e9'},
                  {icon:'🔁',label:'Seguimiento automático',desc:'Día 1, 3 y 7 sin que hagas nada. Ningún lead se queda olvidado.',color:'#10b981'},
                  {icon:'📱',label:'Tu WhatsApp · Sin SIM nueva',desc:'Conectás con QR desde tu celular. Tu número de siempre.',color:'#0ea5e9'},
                  {icon:'🎯',label:'Entrenado con tu forma de vender',desc:'Le enseñás tus respuestas, objeciones y precios. Habla como vos.',color:'#10b981'},
                  {icon:'📅',label:'Agenda citas automáticamente',desc:'Propone horarios, confirma test drives y registra la cita.',color:'#0ea5e9'},
                  {icon:'🧠',label:'Aprende tu estilo',desc:'Cuanto más lo usás, más preciso se vuelve con tus clientes.',color:'#10b981'},
                ].map((h,i) => (
                  <div key={h.label} style={{ display:'flex', gap:'16px', alignItems:'flex-start', padding:'16px 0', borderBottom:i<5?'1px solid rgba(255,255,255,0.05)':'none' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', flexShrink:0, background:h.color==='#0ea5e9'?'rgba(14,165,233,0.1)':'rgba(16,185,129,0.1)', border:'1px solid '+(h.color==='#0ea5e9'?'rgba(14,165,233,0.2)':'rgba(16,185,129,0.2)'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{h.icon}</div>
                    <div><p style={{ fontSize:'14px', fontWeight:700, color:'#e2e8f0', margin:'0 0 3px' }}>{h.label}</p><p style={{ fontSize:'13px', color:'#475569', margin:0, lineHeight:'1.55' }}>{h.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width:'100%', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'#075e54', padding:'14px 18px', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:'15px', flexShrink:0 }}>R</div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:600, color:'#fff' }}>Ricardo · Asesor KIA</div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', gap:'5px' }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#25d366', display:'inline-block', animation:'blinkSignal 2s ease infinite' }} />Agente activo · respondió hace 12 seg
                  </div>
                </div>
                <div style={{ marginLeft:'auto', background:'rgba(255,255,255,0.1)', borderRadius:'8px', padding:'5px 10px', fontSize:'11px', color:'#6ee7b7', fontWeight:600 }}>⚡ 30 seg</div>
              </div>
              <div style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'14px 18px', display:'grid', gridTemplateColumns:'repeat(3,1fr)' }}>
                {[{val:'47',label:'Leads atendidos',color:'#0ea5e9'},{val:'89%',label:'Tasa respuesta',color:'#10b981'},{val:'8',label:'Citas agendadas',color:'#0ea5e9'}].map((s,i) => (
                  <div key={s.label} style={{ textAlign:'center', padding:'0 12px', borderRight:i<2?'1px solid rgba(255,255,255,0.05)':'none' }}>
                    <div style={{ fontSize:'22px', fontWeight:700, fontFamily:FONT, color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:'10px', color:'#475569', marginTop:'2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'1.5px', color:'#475569', textTransform:'uppercase', marginBottom:'4px' }}>Últimas conversaciones</div>
                {[{name:'María C.',msg:'¡Perfecto! Mañana a las 10am ✅',time:'hace 2 min',status:'cita'},{name:'Carlos R.',msg:'Desde $127M neto. ¿Te muestro opciones?',time:'hace 18 min',status:'activo'},{name:'Ana G.',msg:'Seguimiento D3: ¿pudiste ver el catálogo?',time:'hace 3h',status:'seguimiento'},{name:'Luis M.',msg:'Tu cita es mañana sábado 11am 📅',time:'ayer',status:'cita'}].map(conv => (
                  <div key={conv.name} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px', borderRadius:'10px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(14,165,233,0.15)', border:'1px solid rgba(14,165,233,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:'#7dd3fc', flexShrink:0 }}>{conv.name[0]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'2px' }}><span style={{ fontSize:'13px', fontWeight:600, color:'#e2e8f0' }}>{conv.name}</span><span style={{ fontSize:'10px', color:'#334155' }}>{conv.time}</span></div>
                      <div style={{ fontSize:'11px', color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.msg}</div>
                    </div>
                    <div style={{ flexShrink:0, fontSize:'9px', fontWeight:700, padding:'3px 7px', borderRadius:'6px', background:conv.status==='cita'?'rgba(16,185,129,0.1)':conv.status==='activo'?'rgba(14,165,233,0.1)':'rgba(255,255,255,0.05)', color:conv.status==='cita'?'#6ee7b7':conv.status==='activo'?'#7dd3fc':'#475569', border:conv.status==='cita'?'1px solid rgba(16,185,129,0.2)':conv.status==='activo'?'1px solid rgba(14,165,233,0.2)':'1px solid rgba(255,255,255,0.05)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{conv.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CUBO 3D */}
        <section className="cube-section-bg" style={{ position:'relative', zIndex:1, padding:'100px 24px 110px' }}>
          {[{top:'12%',left:'8%',size:4,delay:'0s',dur:'6s',color:'#0ea5e9'},{top:'25%',right:'6%',size:3,delay:'2s',dur:'8s',color:'#10b981'},{top:'70%',left:'5%',size:5,delay:'1s',dur:'7s',color:'#0ea5e9'},{top:'80%',right:'10%',size:3,delay:'3s',dur:'9s',color:'#10b981'},{top:'45%',left:'15%',size:2,delay:'1.5s',dur:'5s',color:'#10b981'},{top:'55%',right:'18%',size:4,delay:'0.5s',dur:'7.5s',color:'#0ea5e9'}].map((p,i)=>(
            <div key={i} style={{ position:'absolute', top:p.top, left:(p as any).left, right:(p as any).right, width:`${p.size}px`, height:`${p.size}px`, borderRadius:'50%', background:p.color, opacity:0.5, animation:`floatParticle ${p.dur} ease-in-out ${p.delay} infinite`, pointerEvents:'none' }} />
          ))}
          <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:'70px' }}>
              <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'#0ea5e9', textTransform:'uppercase', marginBottom:'14px' }}>Todo en un solo agente</p>
              <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:700, fontFamily:FONT, letterSpacing:'-.5px', lineHeight:'1.08', marginBottom:'16px' }}>6 superpoderes.{' '}<span style={{ background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Un solo agente.</span></h2>
              <p style={{ fontSize:'16px', color:'#475569', maxWidth:'460px', margin:'0 auto', lineHeight:'1.6' }}>Cada cara del cubo es una capacidad que trabaja sola, en paralelo, 24/7. Pasá el mouse para explorarlo.</p>
            </div>
            <div className="cube-layout" style={{ display:'flex', alignItems:'center', gap:'80px', justifyContent:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px', flex:'1', maxWidth:'210px', flexShrink:0 }}>
                {CUBE_FACES.slice(0,3).map(f => (
                  <div key={f.face} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${f.border.replace('0.45','0.15')}`, borderRadius:'14px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:f.color, border:`1px solid ${f.border.replace('0.45','0.3')}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'18px' }}>{f.icon==='WA'?WA_SVG_SM:f.icon}</div>
                    <div><div style={{ fontSize:'12px', fontWeight:700, color:'#e2e8f0', lineHeight:1.3 }}>{f.label}</div><div style={{ fontSize:'11px', color:'#475569', marginTop:'2px' }}>{f.sub}</div></div>
                  </div>
                ))}
              </div>
              <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:'20px' }}>
                <div style={{ position:'relative', width:'520px', height:'520px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'320px', height:'320px', background:'radial-gradient(circle,rgba(14,165,233,0.12) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
                  <div id="pm-cube-scene" style={{ width:'260px', height:'260px', perspective:'900px', cursor:'crosshair', position:'relative', zIndex:1 }}>
                    <div id="pm-cube" style={{ width:'260px', height:'260px', position:'relative', transformStyle:'preserve-3d' as const }}>
                      {CUBE_FACES.map(f => (
                        <div key={f.face} className="cube-face" style={{ transform:f.tx, background:f.color, border:`1.5px solid ${f.border}`, color:f.textColor }}>
                          {f.icon==='WA'?WA_SVG_LG:<span style={{ fontSize:'40px', lineHeight:1 }}>{f.icon}</span>}
                          <div><div style={{ fontSize:'14px', fontWeight:700, fontFamily:FONT }}>{f.label}</div><div style={{ fontSize:'11px', opacity:0.65, marginTop:'4px' }}>{f.sub}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#334155' }}><span style={{ fontSize:'16px' }}>↔</span> Pasá el mouse para girarlo</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px', flex:'1', maxWidth:'210px', flexShrink:0 }}>
                {CUBE_FACES.slice(3,6).map(f => (
                  <div key={f.face} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:f.color, border:`1px solid ${f.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'18px' }}>{f.icon}</div>
                    <div><div style={{ fontSize:'12px', fontWeight:700, color:'#e2e8f0', lineHeight:1.3 }}>{f.label}</div><div style={{ fontSize:'11px', color:'#475569', marginTop:'2px' }}>{f.sub}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign:'center', marginTop:'56px' }}>
              <a href="/pulse/signup" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 28px', borderRadius:'12px', background:'var(--grad)', color:'#fff', fontSize:'15px', fontWeight:700, textDecoration:'none', fontFamily:FONT, boxShadow:'0 4px 24px rgba(14,165,233,0.3)', letterSpacing:'-.2px' }}>Activar los 6 superpoderes →</a>
              <p style={{ fontSize:'13px', color:'#334155', marginTop:'12px' }}>14 días gratis · Sin tarjeta</p>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'80px 24px' }}>
          <div style={{ textAlign:'center', marginBottom:'52px' }}>
            <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'#0ea5e9', textTransform:'uppercase', marginBottom:'10px' }}>Cómo funciona</p>
            <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:700, letterSpacing:'-.4px', fontFamily:FONT }}>De cero a agente activo<br/>en 5 minutos</h2>
          </div>
          <div className="grid3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
            {PASOS.map((p,i) => (
              <div key={p.num} className="card" style={{ padding:'26px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:'14px', right:'18px', fontSize:'44px', opacity:.05, fontWeight:900, fontFamily:FONT, lineHeight:1 }}>{p.num}</div>
                <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'#0ea5e9', textTransform:'uppercase', marginBottom:'10px' }}>{p.num}</div>
                <div style={{ fontSize:'28px', marginBottom:'12px' }}>{p.icon}</div>
                <h3 style={{ fontSize:'16px', fontWeight:700, margin:'0 0 8px', fontFamily:FONT }}>{p.titulo}</h3>
                <p style={{ fontSize:'14px', color:'#64748b', lineHeight:'1.6', mar