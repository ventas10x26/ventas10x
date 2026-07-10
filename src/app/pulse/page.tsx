'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PulseContactModal from '@/components/pulse/PulseContactModal'
import { SegmentSelector } from '@/components/pulse/SegmentSelector'

const FONT      = "'Syne', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const GRAD = 'linear-gradient(90deg, #38bdf8, #34d399, #a855f7)'
const gradText: React.CSSProperties = { backgroundImage: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }

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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --blue:#38bdf8; --green:#34d399; --purple:#a855f7;
          --grad:linear-gradient(90deg,#38bdf8,#34d399,#a855f7);
          --bg:#05070d; --bg-2:#080c16; --surface:rgba(255,255,255,0.045); --surface-2:rgba(255,255,255,0.07);
          --border:rgba(255,255,255,0.09); --border-strong:rgba(255,255,255,0.16);
          --text:#f3f5fa; --text-dim:#9aa3ba; --text-faint:#5c637a;
        }
        body { background: var(--bg); }
        ::selection { background:rgba(56,189,248,0.35); color:#fff; }

        .pm-input { width:100%; padding:13px 16px; border-radius:10px; border:1.5px solid var(--border); background:rgba(255,255,255,0.03); color:var(--text); font-size:15px; font-family:${FONT_BODY}; outline:none; transition:border-color .2s,box-shadow .2s,background .2s; }
        .pm-input:focus { border-color:rgba(56,189,248,0.55); background:rgba(56,189,248,0.05); box-shadow:0 0 0 4px rgba(56,189,248,0.12); }
        .pm-input.err { border-color:#fb7185; }
        .pm-input::placeholder { color:var(--text-faint); }
        select option { background:#10141f; color:var(--text); }

        .pm-btn { width:100%; padding:15px; border-radius:10px; border:1px solid transparent; background:var(--grad); background-size:200% auto; color:#04060b; font-size:16px; font-weight:700; cursor:pointer; font-family:${FONT}; letter-spacing:-.2px; box-shadow:0 12px 30px rgba(56,189,248,0.18), 0 6px 18px rgba(168,85,247,0.14); transition:all .3s cubic-bezier(.22,.68,0,1.2); }
        .pm-btn:hover:not(:disabled) { background-position:100% center; transform:translateY(-2px); box-shadow:0 16px 40px rgba(56,189,248,0.28), 0 8px 22px rgba(52,211,153,0.2); }
        .pm-btn:disabled { opacity:.5; cursor:not-allowed; }

        .card { background:var(--surface); border:1px solid var(--border); border-radius:16px; transition:all .3s ease; }
        .card:hover { border-color:rgba(56,189,248,0.35); transform:translateY(-4px); box-shadow:0 20px 44px rgba(0,0,0,0.45), 0 0 0 1px rgba(56,189,248,0.08); }

        .pm-hero-glow { position:absolute; top:0; left:0; right:0; height:640px; overflow:hidden; z-index:0; pointer-events:none; }
        .pm-hero-glow::before {
          content:''; position:absolute; left:50%; top:-380px; width:1200px; height:820px; transform:translateX(-50%);
          background:
            radial-gradient(circle at 14% 22%, rgba(56,189,248,0.28), transparent 52%),
            radial-gradient(circle at 86% 30%, rgba(52,211,153,0.22), transparent 50%),
            radial-gradient(circle at 50% 78%, rgba(168,85,247,0.20), transparent 55%);
          filter: blur(110px);
          animation: glowDrift 16s ease-in-out infinite alternate;
        }
        .pm-hero-glow::after {
          content:''; position:absolute; inset:0;
          background:
            repeating-linear-gradient(0deg, transparent, transparent 63px, rgba(255,255,255,0.025) 63px, rgba(255,255,255,0.025) 64px),
            repeating-linear-gradient(90deg, transparent, transparent 63px, rgba(255,255,255,0.025) 63px, rgba(255,255,255,0.025) 64px),
            linear-gradient(to bottom, rgba(5,7,13,0) 0%, rgba(5,7,13,0.7) 46%, var(--bg) 82%);
          mask-image: linear-gradient(to bottom, black, black 60%, transparent 100%);
        }
        @keyframes glowDrift {
          0%   { transform:translateX(-50%) translateY(0) scale(1); }
          100% { transform:translateX(-50%) translateY(24px) scale(1.06); }
        }

        .pm-headline-line { overflow:hidden; display:block; }
        .pm-headline-inner { display:block; transform:translateY(100%); opacity:0; transition:transform 0.65s cubic-bezier(0.16,1,0.3,1), opacity 0.65s ease; }
        .pm-headline-inner.on { transform:translateY(0); opacity:1; }

        .wa-bubble { opacity:0; transform:translateY(10px) scale(0.97); transition:opacity 0.3s ease, transform 0.3s ease; }
        .wa-bubble.on { opacity:1; transform:translateY(0) scale(1); }
        .wa-typing { display:flex; gap:4px; align-items:center; height:16px; }
        .wa-dot { width:7px; height:7px; border-radius:50%; background:#25d366; animation:waBounce 1.1s ease infinite; }
        .wa-dot:nth-child(2){animation-delay:.18s} .wa-dot:nth-child(3){animation-delay:.36s}
        @keyframes waBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        .wa-scroll::-webkit-scrollbar{width:3px} .wa-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:2px}

        @keyframes blinkSignal { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes floatPhone  { 0%,100%{transform:translateY(0px) rotate(0.4deg)} 50%{transform:translateY(-10px) rotate(-0.4deg)} }

        @keyframes navGlow {
          0%,100% { box-shadow: 0 0 8px rgba(52,211,153,0.35), 0 0 20px rgba(52,211,153,0.16); }
          50%      { box-shadow: 0 0 16px rgba(52,211,153,0.6), 0 0 32px rgba(52,211,153,0.3); }
        }
        .btn-nav-hacemos { animation: navGlow 2.6s ease-in-out infinite; transition: transform .2s, opacity .2s, border-color .2s !important; }
        .btn-nav-hacemos:hover { opacity:.9; transform:translateY(-1px); border-color:rgba(52,211,153,0.5) !important; }

        .hacemos-section {
          position: relative;
          background:
            radial-gradient(ellipse 100% 80% at 50% 0%, rgba(52,211,153,0.09) 0%, transparent 65%),
            linear-gradient(180deg, rgba(52,211,153,0.045) 0%, rgba(56,189,248,0.03) 50%, transparent 100%);
          border-top: 1px solid rgba(52,211,153,0.16);
          border-bottom: 1px solid rgba(52,211,153,0.1);
          overflow: hidden;
        }
        .hacemos-section::before {
          content:''; position:absolute; inset:0;
          background: repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(255,255,255,0.02) 59px, rgba(255,255,255,0.02) 60px),
                      repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(255,255,255,0.02) 59px, rgba(255,255,255,0.02) 60px);
          pointer-events:none;
        }
        .hacemos-orb-1 { position:absolute; top:-80px; left:10%; width:420px; height:420px; background:radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 70%); border-radius:50%; pointer-events:none; }
        .hacemos-orb-2 { position:absolute; bottom:-60px; right:5%; width:320px; height:320px; background:radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%); border-radius:50%; pointer-events:none; }

        .cube-face { position:absolute; width:260px; height:260px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:24px; font-size:13px; font-weight:600; font-family:${FONT_BODY}; text-align:center; line-height:1.35; backdrop-filter:blur(6px); }
        .cube-section-bg {
          position:relative; overflow:hidden;
          background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(56,189,248,0.07) 0%, transparent 70%);
        }
        .cube-section-bg::before {
          content:''; position:absolute; inset:0;
          background:repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.02) 59px,rgba(255,255,255,0.02) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.02) 59px,rgba(255,255,255,0.02) 60px);
          pointer-events:none;
        }

        .btn-hacemos { transition:all .2s !important; }
        .btn-hacemos:hover { transform:translateY(-2px) !important; box-shadow:0 10px 30px rgba(52,211,153,0.35) !important; }

        /* ── Pricing section ── */
        .pricing-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; align-items:start; }
        .roi-line { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; }
        .check-feat { display:flex; align-items:center; gap:10px; padding:7px 0; }
        @keyframes pricingGlow { 0%,100%{box-shadow:0 0 30px rgba(56,189,248,0.12),0 24px 60px rgba(0,0,0,0.45)} 50%{box-shadow:0 0 50px rgba(168,85,247,0.18),0 24px 60px rgba(0,0,0,0.45)} }
        .pricing-card { animation: pricingGlow 4.5s ease-in-out infinite; }

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

      <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:FONT_BODY, position:'relative' }}>

        <div className="pm-hero-glow" />

        {/* HEADER */}
        <header style={{ position:'sticky', top:0, zIndex:100, padding:'16px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:'1100px', margin:'0 auto', backdropFilter:'blur(14px)', background:'rgba(5,7,13,0.55)', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', boxShadow:'0 0 18px rgba(56,189,248,0.35)' }}>⚡</div>
            <span style={{ fontSize:'18px', fontWeight:700, fontFamily:FONT, letterSpacing:'-.3px', color:'var(--text)' }}>Pulse Motor</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {usuarioLogueado ? (
              <a href="/pulse/agente" style={{ fontSize:'14px', fontWeight:600, color:'#04060b', padding:'8px 18px', borderRadius:'8px', background:'var(--grad)', textDecoration:'none' }}>Mi agente →</a>
            ) : (
              <>
                <button onClick={() => setModalContacto(true)} className="btn-nav-hacemos" style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', padding:'8px 16px', borderRadius:'8px', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.4)', cursor:'pointer', fontFamily:FONT_BODY, letterSpacing:'-.1px' }}>
                  Lo hacemos por vos
                </button>
                <a href="#precios" style={{ fontSize:'14px', fontWeight:500, color:'var(--text-dim)', padding:'8px 16px', borderRadius:'8px', textDecoration:'none', transition:'color .15s' }} onMouseEnter={e=>(e.currentTarget.style.color='var(--text)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-dim)')}>Precios</a>
                <a href="/pulse/login"  style={{ fontSize:'14px', fontWeight:500, color:'var(--text-dim)', padding:'8px 16px', borderRadius:'8px', border:'1px solid var(--border)', textDecoration:'none' }}>Ingresar</a>
                <a href="/pulse/signup" style={{ fontSize:'14px', fontWeight:600, color:'#04060b', padding:'8px 18px', borderRadius:'8px', background:'var(--grad)', textDecoration:'none' }}>Registrarse →</a>
              </>
            )}
          </div>
        </header>

        {/* HERO */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'72px 24px 80px' }}>
          <div style={{ textAlign:'center', marginBottom:'56px' }}>
            <div style={{ ...v(100), display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-strong)', borderRadius:'999px', padding:'5px 14px', fontSize:'12px', fontWeight:500, color:'var(--text-dim)', marginBottom:'28px' }}>
              Para asesores y concesionarios automotrices
            </div>

            <SegmentSelector />

            <h1 id="pm-hero-headline" style={{ fontFamily:FONT, fontSize:'clamp(34px,5.5vw,60px)', fontWeight:700, lineHeight:'1.08', letterSpacing:'-.5px', margin:'0 0 20px', color:'var(--text)' }}>
              <span className="pm-headline-line"><span className={`pm-headline-inner${visible?' on':''}`} style={{ transitionDelay:'0.3s' }}>Tu agente entrenado,</span></span>
              <span className="pm-headline-line"><span className={`pm-headline-inner${visible?' on':''}`} style={{ transitionDelay:'0.5s', ...gradText }}>respondiendo en tu WhatsApp</span></span>
              <span className="pm-headline-line"><span className={`pm-headline-inner${visible?' on':''}`} style={{ transitionDelay:'0.7s' }}>mientras vos vendés.</span></span>
            </h1>
            <p style={{ ...v(900), fontSize:'clamp(15px,2vw,18px)', color:'var(--text-dim)', maxWidth:'500px', margin:'0 auto 20px', lineHeight:'1.65' }}>
              Le enseñás cómo vendés vos. Él responde leads en 30 segundos, hace seguimiento y agenda citas — desde tu número de siempre.
            </p>
            <div style={{ ...v(1100), display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', flexWrap:'wrap' }}>
              {[
                { text:'Tu WhatsApp · QR · Sin SIM nueva', green:true },
                { text:'Responde en &lt;30 seg', green:false },
                { text:'Seguimiento día 1, 3 y 7', green:false },
              ].map(p => (
                <div key={p.text} dangerouslySetInnerHTML={{ __html:p.text }} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'999px', fontSize:'12px', fontWeight:500, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', color:'var(--text-dim)' }} />
              ))}
            </div>
          </div>

          {/* Video Synthesia */}
          <div style={{ display:'flex', alignItems:'center', gap:'64px', justifyContent:'center', flexWrap:'wrap', marginTop:'80px', paddingTop:'80px', borderTop:'1px solid var(--border)' }}>
            <div style={{ flex:'1', minWidth:'280px', maxWidth:'420px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-strong)', borderRadius:'999px', padding:'5px 14px', fontSize:'12px', fontWeight:500, color:'var(--text-dim)', marginBottom:'24px' }}>Mirá cómo funciona</div>
              <h2 style={{ fontFamily:FONT, fontSize:'clamp(26px,3.5vw,40px)', fontWeight:700, lineHeight:1.12, letterSpacing:'-.4px', margin:'0 0 18px', color:'var(--text)' }}>
                Mirá por qué ningún<br/><span style={gradText}>lead se queda sin respuesta.</span>
              </h2>
              <p style={{ fontSize:'15px', color:'var(--text-dim)', lineHeight:'1.7', margin:'0 0 32px' }}>En 60 segundos entendés por qué los asesores que usan Pulse Motor venden más — sin trabajar más horas.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginBottom:'36px' }}>
                {[
                  { icon:'⚡', bg:'rgba(56,189,248,0.08)', border:'rgba(56,189,248,0.3)', text:'Responde al lead en 30 segundos desde tu número' },
                  { icon:'🔁', bg:'rgba(52,211,153,0.08)', border:'rgba(52,211,153,0.3)', text:'Follow-up automático día 1, 3 y 7 sin que hagas nada' },
                  { icon:'🎯', bg:'rgba(168,85,247,0.08)', border:'rgba(168,85,247,0.3)', text:'Entrena al agente con tu propio estilo de venta' },
                ].map(item => (
                  <div key={item.icon} style={{ display:'flex', gap:'14px', alignItems:'center' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', flexShrink:0, background:item.bg, border:`1px solid ${item.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{item.icon}</div>
                    <span style={{ fontSize:'14px', color:'var(--text-dim)', lineHeight:'1.5' }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', alignItems:'center', gap:'8px', padding:'13px 26px', textDecoration:'none', fontFamily:FONT, letterSpacing:'-.2px' }}>Crear mi agente gratis →</a>
              <p style={{ fontSize:'12px', color:'var(--text-faint)', marginTop:'10px' }}>14 días gratis · Sin tarjeta · Tu WhatsApp actual</p>
            </div>
            <div style={{ flex:'1.2', minWidth:'300px', maxWidth:'600px' }}>
              <div style={{ position:'relative', overflow:'hidden', aspectRatio:'1920/1080', borderRadius:'20px', boxShadow:'0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px var(--border)', border:'1px solid var(--border)' }}>
                <iframe src="https://share.synthesia.io/embeds/videos/8ca3103d-efcb-406a-b40e-d21b61845a48?autoplay=1" loading="lazy" title="Pulse Motor" allowFullScreen allow="encrypted-media; fullscreen; microphone; screen-wake-lock; autoplay;" style={{ position:'absolute', width:'100%', height:'100%', top:0, left:0, border:'none', borderRadius:'20px' }} />
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginTop:'18px', flexWrap:'wrap' }}>
                {[
                  { icon:'⭐', text:'4.9/5 asesores',       color:'var(--text-dim)', bg:'rgba(255,255,255,0.03)', border:'var(--border)' },
                  { icon:'🚗', text:'+500 leads atendidos', color:'var(--text-dim)', bg:'rgba(255,255,255,0.03)', border:'var(--border)' },
                  { icon:'⚡', text:'30 seg respuesta',     color:'var(--text-dim)', bg:'rgba(255,255,255,0.03)', border:'var(--border)' },
                ].map(b => (
                  <div key={b.text} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'6px 14px', borderRadius:'999px', fontSize:'12px', fontWeight:600, color:b.color, background:b.bg, border:`1px solid ${b.border}` }}>
                    <span>{b.icon}</span><span>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hero grid */}
          <div className="hero-grid" style={{ display:'flex', alignItems:'center', gap:'48px', justifyContent:'center', marginTop:'80px', paddingTop:'80px', borderTop:'1px solid var(--border)' }}>
            <form onSubmit={submit} style={{ ...v(1200), flex:'1', minWidth:'280px', maxWidth:'380px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'20px', padding:'28px', backdropFilter:'blur(12px)' }}>
              <h3 style={{ fontSize:'20px', fontWeight:700, margin:'0 0 4px', fontFamily:FONT, letterSpacing:'-.3px', color:'var(--text)' }}>Configurá tu agente gratis</h3>
              <p style={{ fontSize:'13px', color:'var(--text-dim)', margin:'0 0 24px' }}>Listo en 5 minutos. Sin tarjeta.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'16px' }}>
                <div>
                  <input type="text" placeholder="Tu nombre" value={nombre} onChange={e=>setNombre(e.target.value)} onBlur={()=>setTouchedNombre(true)} disabled={estado==='enviando'} className={`pm-input${touchedNombre&&errorNombre?' err':''}`} />
                  {touchedNombre&&errorNombre&&<span style={{ fontSize:'12px', color:'#fb7185', marginTop:'4px', display:'block' }}>⚠ {errorNombre}</span>}
                </div>
                <div>
                  <input type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)} onBlur={()=>setTouchedEmail(true)} disabled={estado==='enviando'} className={`pm-input${touchedEmail&&errorEmail?' err':''}`} />
                  {touchedEmail&&errorEmail&&<span style={{ fontSize:'12px', color:'#fb7185', marginTop:'4px', display:'block' }}>⚠ {errorEmail}</span>}
                </div>
                <select value={marca} onChange={e=>setMarca(e.target.value)} disabled={estado==='enviando'} className="pm-input" style={{ cursor:'pointer', color:marca?'var(--text)':'var(--text-faint)' }}>
                  <option value="">¿Con qué marca trabajás? (opcional)</option>
                  {['KIA','Hyundai','Renault','Chevrolet','Toyota','Mazda','Nissan','Otro'].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <button type="submit" disabled={estado==='enviando'} className="pm-btn" style={{ marginBottom:'14px' }}>{estado==='enviando'?'Configurando…':'Crear mi agente →'}</button>
              {errorGeneral&&<p style={{ fontSize:'13px', color:'#fb7185', marginBottom:'8px', textAlign:'center' }}>⚠ {errorGeneral}</p>}
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {['Conecta con tu WhatsApp actual vía QR','Sin número nuevo ni SIM extra','14 días gratis sin tarjeta'].map(t=>(
                  <div key={t} style={{ fontSize:'13px', color:'var(--text-dim)', display:'flex', gap:'6px', alignItems:'flex-start' }}>
                    <span style={{ color:'#34d399', flexShrink:0 }}>✓</span><span>{t}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:'13px', color:'var(--text-faint)', margin:'16px 0 0', textAlign:'center' }}>
                ¿Ya tenés cuenta? <a href="/pulse/login" style={{ color:'var(--text)', textDecoration:'underline', fontWeight:500 }}>Ingresar →</a>
              </p>
            </form>

            <div style={{ ...v(1400), flex:'1', minWidth:'280px', maxWidth:'340px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-strong)', borderRadius:'999px', padding:'5px 14px', fontSize:'12px', fontWeight:500, color:'var(--text-dim)' }}>
                <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#25d366', display:'inline-block', animation:'pulse 2s ease infinite' }} />
                Agente respondiendo en vivo
              </div>
              <div style={{ width:'270px', background:'#1a1a2e', borderRadius:'40px', padding:'12px', border:'2px solid rgba(255,255,255,0.12)', boxShadow:'0 30px 70px rgba(0,0,0,0.6), 0 0 40px rgba(52,211,153,0.12)', animation:'floatPhone 5s ease-in-out infinite' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:'8px' }}><div style={{ width:'80px', height:'6px', background:'rgba(255,255,255,0.08)', borderRadius:'3px' }} /></div>
                <div style={{ background:'#fff', borderRadius:'28px', overflow:'hidden' }}>
                  <div style={{ background:'#075e54', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'14px', fontWeight:700, color:'#fff' }}>A</div>
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
              <div style={{ fontSize:'12px', color:'var(--text-faint)', textAlign:'center' }}>Responde solo mientras vos cerrás otras ventas</div>
            </div>
          </div>
        </section>

        {/* LO HACEMOS JUNTOS */}
        <section className="hacemos-section" style={{ position:'relative', zIndex:1, padding:'80px 24px 90px' }}>
          <div className="hacemos-orb-1" /><div className="hacemos-orb-2" />
          <div style={{ maxWidth:'1100px', margin:'0 auto', position:'relative', zIndex:1 }}>
            <div style={{ textAlign:'center', marginBottom:'56px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:'999px', padding:'6px 18px', marginBottom:'16px' }}>
                <span style={{ fontSize:'12px', fontWeight:600, color:'#6ee7b7', letterSpacing:'1px', textTransform:'uppercase' }}>Lo hacemos juntos</span>
              </div>
              <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:700, letterSpacing:'-.5px', fontFamily:FONT, marginBottom:'14px', lineHeight:'1.1', color:'var(--text)' }}>
                Vos ponés tu celular.<br/>
                <span style={{ color:'var(--text-dim)' }}>Nosotros hacemos el resto.</span>
              </h2>
              <p style={{ fontSize:'16px', color:'var(--text-dim)', maxWidth:'500px', margin:'0 auto 28px', lineHeight:'1.6' }}>
                No necesitás saber de tecnología. No necesitás una SIM nueva. No necesitás instalar nada. Solo seguís 3 pasos simples.
              </p>
              <button onClick={() => setModalContacto(true)} className="btn-hacemos pm-btn" style={{ display:'inline-flex', width:'auto', alignItems:'center', gap:'10px', padding:'14px 28px', fontFamily:FONT, fontSize:'16px', cursor:'pointer', letterSpacing:'-.2px' }}>
                Quiero que lo hagan por mí →
              </button>
              <p style={{ fontSize:'12px', color:'var(--text-faint)', marginTop:'10px' }}>Te contactamos en menos de 24 hs · Sin compromiso · Sin tarjeta</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
              {/* PASO 1 */}
              <div style={{ display:'flex', gap:'40px', alignItems:'stretch', flexWrap:'wrap' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'56px', flexShrink:0 }}>
                  <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:800, color:'#6ee7b7', fontFamily:FONT, flexShrink:0 }}>1</div>
                  <div style={{ width:'1px', flex:1, background:'var(--border-strong)', marginTop:'8px', minHeight:'60px' }} />
                </div>
                <div style={{ flex:1, minWidth:'260px', paddingBottom:'48px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'24px', flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:'220px' }}>
                      <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text-dim)', letterSpacing:'2px', textTransform:'uppercase', margin:'0 0 8px', paddingTop:'14px' }}>Vos hacés</p>
                      <h3 style={{ fontSize:'22px', fontWeight:700, fontFamily:FONT, margin:'0 0 10px', letterSpacing:'-.3px', color:'var(--text)' }}>Nos contás cómo vendés vos</h3>
                      <p style={{ fontSize:'15px', color:'var(--text-dim)', lineHeight:'1.65', margin:'0 0 16px' }}>Respondés 2 preguntas: cómo hablás con tus clientes y cuál es tu mayor reto. Eso es todo lo que nos das. 5 minutos máximo.</p>
                      <button onClick={() => setModalContacto(true)} className="btn-hacemos pm-btn" style={{ display:'inline-flex', width:'auto', alignItems:'center', gap:'8px', padding:'12px 22px', fontFamily:FONT, fontSize:'14px', cursor:'pointer', letterSpacing:'-.1px' }}>
                        Empezamos — escribinos ahora
                      </button>
                      <p style={{ fontSize:'12px', color:'var(--text-faint)', marginTop:'8px' }}>Te contactamos en menos de 24 hs · Sin compromiso</p>
                    </div>
                    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'16px', padding:'20px', minWidth:'220px', maxWidth:'280px', flexShrink:0 }}>
                      <div style={{ fontSize:'11px', color:'var(--text-dim)', fontWeight:600, marginBottom:'14px', letterSpacing:'1px', textTransform:'uppercase' }}>Pulse Motor te pregunta</div>
                      {[{q:'¿Cómo hablás normalmente con un cliente interesado?',tag:'Tu estilo'},{q:'¿Cuál es tu mayor obstáculo para cerrar una venta?',tag:'Tu reto'}].map((item,i) => (
                        <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:'10px', padding:'12px', marginBottom:'8px' }}>
                          <div style={{ display:'inline-block', fontSize:'10px', fontWeight:700, color:'#6ee7b7', background:'rgba(52,211,153,0.1)', padding:'2px 8px', borderRadius:'999px', marginBottom:'6px' }}>{item.tag}</div>
                          <p style={{ fontSize:'12px', color:'var(--text-dim)', lineHeight:'1.5', margin:0 }}>{item.q}</p>
                        </div>
                      ))}
                      <div style={{ marginTop:'12px', padding:'10px 12px', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:'8px', fontSize:'12px', color:'#6ee7b7', fontWeight:600 }}>✓ Con eso creamos tu agente personalizado</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* PASO 2 */}
              <div style={{ display:'flex', gap:'40px', alignItems:'stretch', flexWrap:'wrap' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'56px', flexShrink:0 }}>
                  <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:800, color:'#6ee7b7', fontFamily:FONT, flexShrink:0 }}>2</div>
                  <div style={{ width:'1px', flex:1, background:'var(--border-strong)', marginTop:'8px', minHeight:'60px' }} />
                </div>
                <div style={{ flex:1, minWidth:'260px', paddingBottom:'48px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'24px', flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:'220px' }}>
                      <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text-dim)', letterSpacing:'2px', textTransform:'uppercase', margin:'0 0 8px', paddingTop:'14px' }}>Solo abrís la cámara</p>
                      <h3 style={{ fontSize:'22px', fontWeight:700, fontFamily:FONT, margin:'0 0 10px', letterSpacing:'-.3px', color:'var(--text)' }}>Escaneás un QR con tu celular</h3>
                      <p style={{ fontSize:'15px', color:'var(--text-dim)', lineHeight:'1.65', margin:'0 0 16px' }}>Es exactamente igual a cuando vinculás WhatsApp Web. Abrís WhatsApp → Dispositivos vinculados → apuntás al QR. En 30 segundos quedó.</p>
                      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                        {['Tu número de siempre','Sin SIM nueva'].map(t => (
                          <div key={t} style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.3)', borderRadius:'10px', padding:'8px 14px', fontSize:'13px', color:'#7dd3fc', fontWeight:600 }}>{t}</div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'16px', padding:'20px', minWidth:'220px', maxWidth:'280px', flexShrink:0 }}>
                      <div style={{ fontSize:'11px', color:'var(--text-dim)', fontWeight:600, marginBottom:'14px', letterSpacing:'1px', textTransform:'uppercase' }}>Así de simple</div>
                      {[{icon:'📱',paso:'Abrís WhatsApp en tu celular'},{icon:'⋮',paso:'Tocás los 3 puntos → Dispositivos vinculados'},{icon:'📷',paso:'Apuntás al QR en la pantalla'},{icon:'✅',paso:'¡Listo! Tu agente está activo',ok:true}].map((s,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0', borderBottom:i<3?'1px solid var(--border)':'none' }}>
                          <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-strong)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', flexShrink:0 }}>{s.icon}</div>
                          <span style={{ fontSize:'12px', color:s.ok?'#6ee7b7':'var(--text-dim)', fontWeight:s.ok?600:400 }}>{s.paso}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* PASO 3 */}
              <div style={{ display:'flex', gap:'40px', alignItems:'stretch', flexWrap:'wrap' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'56px', flexShrink:0 }}>
                  <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:800, color:'#6ee7b7', fontFamily:FONT, flexShrink:0 }}>3</div>
                </div>
                <div style={{ flex:1, minWidth:'260px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'24px', flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:'220px' }}>
                      <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text-dim)', letterSpacing:'2px', textTransform:'uppercase', margin:'0 0 8px', paddingTop:'14px' }}>De acá en adelante</p>
                      <h3 style={{ fontSize:'22px', fontWeight:700, fontFamily:FONT, margin:'0 0 10px', letterSpacing:'-.3px', color:'var(--text)' }}>El agente trabaja. Vos cerrás.</h3>
                      <p style={{ fontSize:'15px', color:'var(--text-dim)', lineHeight:'1.65', margin:'0 0 20px' }}>Llega un lead → el agente responde en 30 segundos. No respondió → el agente hace seguimiento el día 1, 3 y 7. Quiere test drive → lo agenda. Vos solo aparecés a cerrar.</p>
                      <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', alignItems:'center', gap:'8px', padding:'13px 24px', textDecoration:'none', fontFamily:FONT, letterSpacing:'-.2px' }}>Empezar ahora — es gratis →</a>
                      <p style={{ fontSize:'12px', color:'var(--text-faint)', marginTop:'8px' }}>14 días gratis · Sin tarjeta · Tu WhatsApp actual</p>
                    </div>
                    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'16px', padding:'16px', minWidth:'220px', maxWidth:'280px', flexShrink:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px', paddingBottom:'10px', borderBottom:'1px solid var(--border)' }}>
                        <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'#25d366', display:'flex', alignItems:'center', justifyContent:'center' }}>{WA_SVG_WH}</div>
                        <div><div style={{ fontSize:'12px', fontWeight:700, color:'var(--text)' }}>Tu agente IA</div><div style={{ fontSize:'10px', color:'var(--text-dim)' }}>● En línea · responde solo</div></div>
                      </div>
                      {[{out:false,text:'Hola, me interesa el Sportage',sub:'Lead nuevo · 3:42pm'},{out:true,text:'¡Hola! Desde $127M. ¿Te agendo test drive? 🚗',sub:'Agente · 3:42pm ✓✓'},{out:false,text:'Sí, este sábado',sub:'Lead · 3:43pm'},{out:true,text:'✅ Listo, sábado 10am agendado',sub:'Agente · 3:43pm ✓✓'}].map((m,i) => (
                        <div key={i} style={{ display:'flex', justifyContent:m.out?'flex-end':'flex-start', marginBottom:'8px' }}>
                          <div style={{ maxWidth:'80%' }}>
                            <div style={{ padding:'7px 10px', borderRadius:m.out?'12px 12px 2px 12px':'12px 12px 12px 2px', background:m.out?'#005c4b':'rgba(255,255,255,0.07)', fontSize:'11px', color:m.out?'#fff':'var(--text)', lineHeight:'1.4' }}>{m.text}</div>
                            <div style={{ fontSize:'9px', color:'var(--text-faint)', marginTop:'2px', textAlign:m.out?'right':'left' }}>{m.sub}</div>
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
              <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'16px' }}>Tu agente IA</p>
              <h2 style={{ fontSize:'clamp(26px,3vw,40px)', fontWeight:700, fontFamily:FONT, letterSpacing:'-.4px', lineHeight:'1.1', marginBottom:'40px', color:'var(--text)' }}>
                Un agente que{' '}<span style={{ color:'var(--text-dim)' }}>vende como vos</span>
              </h2>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {[
                  {icon:'⚡',label:'Responde en 30 segundos',desc:'El lead llega y el agente responde antes de que vos puedas leer la notificación.'},
                  {icon:'🔁',label:'Seguimiento automático',desc:'Día 1, 3 y 7 sin que hagas nada. Ningún lead se queda olvidado.'},
                  {icon:'📱',label:'Tu WhatsApp · Sin SIM nueva',desc:'Conectás con QR desde tu celular. Tu número de siempre.'},
                  {icon:'🎯',label:'Entrenado con tu forma de vender',desc:'Le enseñás tus respuestas, objeciones y precios. Habla como vos.'},
                  {icon:'📅',label:'Agenda citas automáticamente',desc:'Propone horarios, confirma test drives y registra la cita.'},
                  {icon:'🧠',label:'Aprende tu estilo',desc:'Cuanto más lo usás, más preciso se vuelve con tus clientes.'},
                ].map((h,i) => (
                  <div key={h.label} style={{ display:'flex', gap:'16px', alignItems:'flex-start', padding:'16px 0', borderBottom:i<5?'1px solid var(--border)':'none' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', flexShrink:0, background:'rgba(56,189,248,0.07)', border:'1px solid rgba(56,189,248,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{h.icon}</div>
                    <div><p style={{ fontSize:'14px', fontWeight:700, color:'var(--text)', margin:'0 0 3px' }}>{h.label}</p><p style={{ fontSize:'13px', color:'var(--text-dim)', margin:0, lineHeight:'1.55' }}>{h.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width:'100%', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'20px', overflow:'hidden' }}>
              <div style={{ background:'#075e54', padding:'14px 18px', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:'15px', flexShrink:0 }}>R</div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:600, color:'#fff' }}>Ricardo · Asesor KIA</div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', gap:'5px' }}>
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#25d366', display:'inline-block', animation:'blinkSignal 2s ease infinite' }} />Agente activo · respondió hace 12 seg
                  </div>
                </div>
                <div style={{ marginLeft:'auto', background:'rgba(255,255,255,0.15)', borderRadius:'8px', padding:'5px 10px', fontSize:'11px', color:'#fff', fontWeight:600 }}>⚡ 30 seg</div>
              </div>
              <div style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid var(--border)', padding:'14px 18px', display:'grid', gridTemplateColumns:'repeat(3,1fr)' }}>
                {[{val:'47',label:'Leads atendidos'},{val:'89%',label:'Tasa respuesta'},{val:'8',label:'Citas agendadas'}].map((s,i) => (
                  <div key={s.label} style={{ textAlign:'center', padding:'0 12px', borderRight:i<2?'1px solid var(--border)':'none' }}>
                    <div style={{ fontSize:'22px', fontWeight:700, fontFamily:FONT, ...gradText }}>{s.val}</div>
                    <div style={{ fontSize:'10px', color:'var(--text-dim)', marginTop:'2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'1.5px', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'4px' }}>Últimas conversaciones</div>
                {[{name:'María C.',msg:'¡Perfecto! Mañana a las 10am ✅',time:'hace 2 min',status:'cita'},{name:'Carlos R.',msg:'Desde $127M neto. ¿Te muestro opciones?',time:'hace 18 min',status:'activo'},{name:'Ana G.',msg:'Seguimiento D3: ¿pudiste ver el catálogo?',time:'hace 3h',status:'seguimiento'},{name:'Luis M.',msg:'Tu cita es mañana sábado 11am 📅',time:'ayer',status:'cita'}].map(conv => (
                  <div key={conv.name} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px', borderRadius:'10px', background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)' }}>
                    <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid var(--border-strong)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:'var(--text)', flexShrink:0 }}>{conv.name[0]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'2px' }}><span style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>{conv.name}</span><span style={{ fontSize:'10px', color:'var(--text-faint)' }}>{conv.time}</span></div>
                      <div style={{ fontSize:'11px', color:'var(--text-dim)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.msg}</div>
                    </div>
                    <div style={{ flexShrink:0, fontSize:'9px', fontWeight:700, padding:'3px 7px', borderRadius:'6px', background:'rgba(255,255,255,0.05)', color:'var(--text-dim)', border:'1px solid var(--border-strong)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{conv.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CUBO 3D */}
        <section className="cube-section-bg" style={{ position:'relative', zIndex:1, padding:'100px 24px 110px' }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:'70px' }}>
              <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'14px' }}>Todo en un solo agente</p>
              <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:700, fontFamily:FONT, letterSpacing:'-.5px', lineHeight:'1.08', marginBottom:'16px', color:'var(--text)' }}>6 superpoderes.{' '}<span style={gradText}>Un solo agente.</span></h2>
              <p style={{ fontSize:'16px', color:'var(--text-dim)', maxWidth:'460px', margin:'0 auto', lineHeight:'1.6' }}>Cada cara del cubo es una capacidad que trabaja sola, en paralelo, 24/7. Pasá el mouse para explorarlo.</p>
            </div>
            <div className="cube-layout" style={{ display:'flex', alignItems:'center', gap:'80px', justifyContent:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px', flex:'1', maxWidth:'210px', flexShrink:0 }}>
                {CUBE_FACES.slice(0,3).map(f => (
                  <div key={f.face} style={{ background:'var(--surface)', border:`1px solid ${f.border}`, borderRadius:'14px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:f.color, border:`1px solid ${f.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'18px' }}>{f.icon==='WA'?WA_SVG_SM:f.icon}</div>
                    <div><div style={{ fontSize:'12px', fontWeight:700, color:'var(--text)', lineHeight:1.3 }}>{f.label}</div><div style={{ fontSize:'11px', color:f.textColor, marginTop:'2px' }}>{f.sub}</div></div>
                  </div>
                ))}
              </div>
              <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:'20px' }}>
                <div style={{ position:'relative', width:'520px', height:'520px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ position:'absolute', width:'340px', height:'340px', borderRadius:'50%', background:'radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 70%)', filter:'blur(10px)', pointerEvents:'none' }} />
                  <div id="pm-cube-scene" style={{ width:'260px', height:'260px', perspective:'900px', cursor:'crosshair', position:'relative', zIndex:1 }}>
                    <div id="pm-cube" style={{ width:'260px', height:'260px', position:'relative', transformStyle:'preserve-3d' as const }}>
                      {CUBE_FACES.map(f => (
                        <div key={f.face} className="cube-face" style={{ transform:f.tx, background:`linear-gradient(160deg, ${f.color}, rgba(8,12,22,0.9))`, border:`1px solid ${f.border}`, color:'var(--text)', boxShadow:`0 4px 30px ${f.border}` }}>
                          {f.icon==='WA'?WA_SVG_LG:<span style={{ fontSize:'40px', lineHeight:1 }}>{f.icon}</span>}
                          <div><div style={{ fontSize:'14px', fontWeight:700, fontFamily:FONT, color:f.textColor }}>{f.label}</div><div style={{ fontSize:'11px', opacity:0.75, marginTop:'4px' }}>{f.sub}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'var(--text-faint)' }}><span style={{ fontSize:'16px' }}>↔</span> Pasá el mouse para girarlo</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px', flex:'1', maxWidth:'210px', flexShrink:0 }}>
                {CUBE_FACES.slice(3,6).map(f => (
                  <div key={f.face} style={{ background:'var(--surface)', border:`1px solid ${f.border}`, borderRadius:'14px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:f.color, border:`1px solid ${f.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'18px' }}>{f.icon}</div>
                    <div><div style={{ fontSize:'12px', fontWeight:700, color:'var(--text)', lineHeight:1.3 }}>{f.label}</div><div style={{ fontSize:'11px', color:f.textColor, marginTop:'2px' }}>{f.sub}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign:'center', marginTop:'56px' }}>
              <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', alignItems:'center', gap:'8px', padding:'14px 28px', textDecoration:'none', fontFamily:FONT, letterSpacing:'-.2px' }}>Activar los 6 superpoderes →</a>
              <p style={{ fontSize:'13px', color:'var(--text-faint)', marginTop:'12px' }}>14 días gratis · Sin tarjeta</p>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'80px 24px' }}>
          <div style={{ textAlign:'center', marginBottom:'52px' }}>
            <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'10px' }}>Cómo funciona</p>
            <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:700, letterSpacing:'-.4px', fontFamily:FONT, color:'var(--text)' }}>De cero a agente activo<br/>en 5 minutos</h2>
          </div>
          <div className="grid3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
            {PASOS.map((p,i) => (
              <div key={p.num} className="card" style={{ padding:'26px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:'14px', right:'18px', fontSize:'44px', opacity:.08, fontWeight:900, fontFamily:FONT, lineHeight:1, ...gradText }}>{p.num}</div>
                <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'10px' }}>{p.num}</div>
                <div style={{ fontSize:'28px', marginBottom:'12px' }}>{p.icon}</div>
                <h3 style={{ fontSize:'16px', fontWeight:700, margin:'0 0 8px', fontFamily:FONT, color:'var(--text)' }}>{p.titulo}</h3>
                <p style={{ fontSize:'14px', color:'var(--text-dim)', lineHeight:'1.6', margin:0 }}>{p.desc}</p>
                {i===1&&<div style={{ marginTop:'14px', display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.3)', borderRadius:'8px', padding:'5px 10px', fontSize:'11px', color:'#7dd3fc', fontWeight:600 }}>Tu número · Sin SIM nueva</div>}
              </div>
            ))}
          </div>
        </section>

        {/* QR diferencial */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'0 24px 80px' }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'20px', padding:'48px', display:'flex', alignItems:'center', gap:'48px', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:'260px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'10px' }}>El diferencial clave</div>
              <h2 style={{ fontSize:'clamp(22px,3vw,34px)', fontWeight:700, letterSpacing:'-.4px', fontFamily:FONT, marginBottom:'14px', lineHeight:'1.2', color:'var(--text)' }}>Tu WhatsApp de siempre.<br/><span style={gradText}>Sin número nuevo.</span></h2>
              <p style={{ fontSize:'15px', color:'var(--text-dim)', lineHeight:'1.65', marginBottom:'20px' }}>Otros te piden una SIM nueva o un número de empresa. Nosotros no. Escaneas un QR desde tu celular y en 30 segundos tu agente ya está respondiendo desde tu número personal.</p>
              {['Mismo número que tus clientes ya tienen guardado','Sin apps adicionales en tu celular','Desconectás cuando querás con un clic'].map(t=>(
                <div key={t} style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'8px' }}>
                  <span style={{ color:'#34d399', fontWeight:700, flexShrink:0 }}>✓</span>
                  <span style={{ fontSize:'14px', color:'var(--text-dim)' }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ flexShrink:0, textAlign:'center' }}>
              <div style={{ width:'140px', height:'140px', background:'#fff', borderRadius:'14px', padding:'10px', margin:'0 auto 10px', display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', boxShadow:'0 0 30px rgba(56,189,248,0.2)' }}>
                {Array.from({length:49}).map((_,i)=>{ const d=[0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,48]; return <div key={i} style={{ borderRadius:'1px', background:(d.includes(i)||(i%3===0&&i>13&&i<35)||(i%7===3))?'#000':'transparent' }} /> })}
              </div>
              <p style={{ fontSize:'13px', color:'var(--text)', fontWeight:600 }}>Escanea · Conecta · Listo</p>
              <p style={{ fontSize:'12px', color:'var(--text-dim)', marginTop:'3px' }}>30 segundos</p>
            </div>
          </div>
        </section>

        {/* TESTIMONIOS */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'0 24px 80px' }}>
          <div style={{ textAlign:'center', marginBottom:'44px' }}>
            <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'10px' }}>Resultados reales</p>
            <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:700, letterSpacing:'-.4px', fontFamily:FONT, color:'var(--text)' }}>Lo que dicen los asesores</h2>
          </div>
          <div className="grid3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'18px' }}>
            {TESTIMONIOS.map(t => (
              <div key={t.nombre} className="card" style={{ padding:'22px' }}>
                <div style={{ fontSize:'22px', marginBottom:'10px', fontWeight:900, lineHeight:1, ...gradText }}>"</div>
                <p style={{ fontSize:'14px', color:'var(--text-dim)', lineHeight:'1.65', margin:'0 0 18px', fontStyle:'italic' }}>{t.texto}</p>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,0.07)', border:'1px solid var(--border-strong)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'var(--text)', flexShrink:0 }}>{t.nombre[0]}</div>
                  <div><div style={{ fontSize:'13px', fontWeight:700, color:'var(--text)' }}>{t.nombre}</div><div style={{ fontSize:'12px', color:'var(--text-dim)' }}>{t.cargo}</div></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            PRECIOS — después de testimonios, antes del CTA final
            Lógica: ROI primero, precio después
        ═══════════════════════════════════════════════════════ */}
        <section id="precios" style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'0 24px 100px', scrollMarginTop:'80px' }}>

          <div style={{ textAlign:'center', marginBottom:'52px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-strong)', borderRadius:'999px', padding:'5px 16px', fontSize:'12px', fontWeight:500, color:'var(--text-dim)', marginBottom:'16px' }}>
              Precio
            </div>
            <h2 style={{ fontFamily:FONT, fontSize:'clamp(26px,3.5vw,44px)', fontWeight:700, letterSpacing:'-.5px', lineHeight:1.1, marginBottom:'14px', color:'var(--text)' }}>
              Una venta extra al mes<br/>
              <span style={{ color:'var(--text-dim)' }}>
                cubre el año entero.
              </span>
            </h2>
            <p style={{ fontSize:'16px', color:'var(--text-dim)', maxWidth:'440px', margin:'0 auto', lineHeight:1.6 }}>
              Pulse Motor no es un gasto. Es el vendedor que trabaja mientras vos dormís.
            </p>
          </div>

          <div className="pricing-grid">

            {/* Columna izquierda: ROI */}
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'20px', padding:'28px' }}>
                <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text-dim)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'20px' }}>El math es simple</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                  <div className="roi-line" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:'12px 12px 0 0', borderBottom:'none' }}>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>Comisión promedio por venta</div>
                      <div style={{ fontSize:'11px', color:'var(--text-dim)', marginTop:'2px' }}>Un Picanto o Sportage vendido</div>
                    </div>
                    <div style={{ fontFamily:FONT_BODY, fontSize:'18px', fontWeight:800, color:'#6ee7b7', flexShrink:0, marginLeft:'16px' }}>+$500.000</div>
                  </div>
                  <div className="roi-line" style={{ background:'rgba(255,255,255,0.015)', border:'1px solid var(--border)', borderRadius:'0', marginBottom:'2px' }}>
                    <div>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>Costo Pulse Motor / mes</div>
                      <div style={{ fontSize:'11px', color:'var(--text-dim)', marginTop:'2px' }}>Todo incluido, sin sorpresas</div>
                    </div>
                    <div style={{ fontFamily:FONT_BODY, fontSize:'18px', fontWeight:800, color:'#fb7185', flexShrink:0, marginLeft:'16px' }}>−$99.000</div>
                  </div>
                  <div className="roi-line" style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:'0 0 12px 12px' }}>
                    <div>
                      <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text)' }}>Tu ganancia neta ese mes</div>
                      <div style={{ fontSize:'11px', color:'var(--text-dim)', marginTop:'2px' }}>Con solo 1 lead recuperado</div>
                    </div>
                    <div style={{ fontFamily:FONT_BODY, fontSize:'24px', fontWeight:800, color:'#6ee7b7', flexShrink:0, marginLeft:'16px' }}>+$401.000</div>
                  </div>
                </div>
                <p style={{ fontSize:'12px', color:'var(--text-faint)', marginTop:'16px', lineHeight:1.6 }}>
                  ¿Cuántos leads perdés por semana por no responder a tiempo? Con Pulse Motor, ninguno.
                </p>
              </div>

              {/* Testimonial de refuerzo */}
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'16px', padding:'20px' }}>
                <div style={{ fontSize:'20px', marginBottom:'8px', fontWeight:900, lineHeight:1, ...gradText }}>"</div>
                <p style={{ fontSize:'14px', color:'var(--text-dim)', lineHeight:1.65, margin:'0 0 14px', fontStyle:'italic' }}>
                  En el primer mes recuperé 3 ventas que se me hubieran ido. Pulse Motor se pagó solo 15 veces.
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'1px solid var(--border-strong)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'var(--text)' }}>J</div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'var(--text)' }}>Jorge P.</div>
                    <div style={{ fontSize:'12px', color:'var(--text-dim)' }}>Asesor Renault · Medellín</div>
                  </div>
                </div>
              </div>

              {/* Qué cuesta NO tenerlo */}
              <div style={{ padding:'24px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'16px' }}>
                <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text-faint)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'16px' }}>¿Qué cuesta NO tener Pulse Motor?</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {[
                    { icon:'😰', label:'Perder 1 lead/semana', valor:'~$2.000.000/mes', desc:'en comisiones que se van a otro asesor' },
                    { icon:'🕐', label:'Responder tarde (+1h)', valor:'70% menos cierres', desc:'los leads fríos rara vez vuelven' },
                    { icon:'🔁', label:'Sin seguimiento auto', valor:'5x más trabajo', desc:'para el mismo resultado' },
                  ].map(item => (
                    <div key={item.label} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ fontSize:'20px', flexShrink:0 }}>{item.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'12px', color:'var(--text-dim)' }}>{item.label}</div>
                        <div style={{ fontFamily:FONT, fontSize:'13px', fontWeight:700, color:'#fb7185' }}>{item.valor}</div>
                      </div>
                      <div style={{ fontSize:'11px', color:'var(--text-faint)', maxWidth:'100px', textAlign:'right', lineHeight:1.4 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna derecha: card de precio */}
            <div style={{ position:'sticky', top:'90px' }}>
              <div className="pricing-card" style={{ background:'var(--surface)', border:'1px solid rgba(56,189,248,0.25)', borderRadius:'24px', padding:'32px', position:'relative', overflow:'hidden' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-strong)', borderRadius:'999px', padding:'4px 12px', fontSize:'11px', fontWeight:700, color:'var(--text-dim)', marginBottom:'20px', letterSpacing:'.5px', textTransform:'uppercase' }}>
                  Plan único · Todo incluido
                </div>

                <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'4px' }}>
                  <span style={{ fontFamily:FONT_BODY, fontSize:'52px', fontWeight:800, color:'var(--text)', lineHeight:1 }}>$99k</span>
                  <div>
                    <div style={{ fontSize:'14px', color:'var(--text-dim)', fontWeight:500 }}>/mes</div>
                    <div style={{ fontSize:'11px', color:'var(--text-faint)' }}>COP</div>
                  </div>
                </div>
                <p style={{ fontSize:'13px', color:'var(--text-dim)', marginBottom:'24px' }}>Cancelás cuando querás · Sin permanencia</p>

                <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'28px' }}>
                  {[
                    'Agente entrenado con tu estilo de venta',
                    'Respuestas automáticas en menos de 30 seg',
                    'Follow-up día 1, 3 y 7 automático',
                    'Tu WhatsApp actual — sin SIM nueva',
                    'Agendamiento de test drives solo',
                    'Panel de leads y estadísticas',
                    'Soporte directo por WhatsApp',
                    '14 días de prueba gratis',
                  ].map(f => (
                    <div key={f} className="check-feat">
                      <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.4)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'10px', color:'#6ee7b7', fontWeight:700 }}>✓</div>
                      <span style={{ fontSize:'13px', color:'var(--text-dim)' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  <button
                    onClick={() => setModalContacto(true)}
                    className="pm-btn"
                    style={{ fontSize:'15px', letterSpacing:'-.2px' }}
                  >
                    Lo hacemos por vos — gratis primero
                  </button>
                  <a href="/pulse/signup" style={{ display:'block', width:'100%', padding:'13px', borderRadius:'10px', background:'transparent', border:'1px solid var(--border-strong)', color:'var(--text)', fontSize:'14px', fontWeight:600, textDecoration:'none', textAlign:'center', fontFamily:FONT, transition:'border-color .2s', boxSizing:'border-box' }}>
                    Empezar solo — 14 días gratis →
                  </a>
                </div>
                <p style={{ fontSize:'11px', color:'var(--text-faint)', textAlign:'center', marginTop:'12px' }}>Sin tarjeta para la prueba · Cancelás en 1 clic</p>
              </div>

              <div style={{ marginTop:'14px', display:'flex', alignItems:'center', gap:'12px', padding:'14px 18px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px' }}>
                <span style={{ fontSize:'20px', flexShrink:0 }}>🔒</span>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)' }}>Garantía 7 días</div>
                  <div style={{ fontSize:'12px', color:'var(--text-dim)', lineHeight:1.5 }}>Si no ves resultados en la primera semana, te devolvemos el dinero. Sin preguntas.</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ═══ FIN PRECIOS ═══ */}

        {/* CTA FINAL */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'680px', margin:'0 auto', padding:'0 24px 100px', textAlign:'center' }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'20px', padding:'48px 32px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:'-60%', left:'50%', width:'420px', height:'420px', transform:'translateX(-50%)', background:'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />
            <h2 style={{ position:'relative', fontSize:'clamp(24px,3vw,38px)', fontWeight:700, letterSpacing:'-.4px', fontFamily:FONT, marginBottom:'14px', lineHeight:'1.2', color:'var(--text)' }}>¿Cuántos leads perdiste<br/>esta semana por no responder?</h2>
            <p style={{ position:'relative', fontSize:'15px', color:'var(--text-dim)', marginBottom:'28px', lineHeight:'1.65' }}>Con Pulse Motor nunca más. Tu agente responde en 30 segundos, hace seguimiento y agenda citas — mientras vos estás con otro cliente.</p>
            <a href="/pulse/signup" className="pm-btn" style={{ position:'relative', display:'inline-flex', width:'auto', padding:'15px 32px', fontSize:'16px', textDecoration:'none', fontFamily:FONT, letterSpacing:'-.2px' }}>Crear mi agente gratis →</a>
            <p style={{ position:'relative', fontSize:'13px', color:'var(--text-faint)', marginTop:'14px' }}>14 días gratis · Sin tarjeta · Tu WhatsApp actual</p>
          </div>
        </section>

        <footer style={{ position:'relative', zIndex:1, padding:'24px', textAlign:'center', fontSize:'13px', color:'var(--text-faint)', borderTop:'1px solid var(--border)' }}>
          © 2026 Pulse Motor · Hecho en Cali, Colombia 🇨🇴
        </footer>
      </div>
    </>
  )
}
