// Ruta destino: src/app/pulse/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const FONT = "'Syne', system-ui, sans-serif"
const FONT_BODY = "'DM Sans', system-ui, sans-serif"

function validarEmail(e: string) {
  if (!e.trim()) return 'El email es requerido'
  if (!e.includes('@') || !e.includes('.')) return 'Email inválido'
  return ''
}
function validarNombre(n: string) {
  if (!n.trim()) return 'El nombre es requerido'
  if (n.trim().length < 2) return 'Mínimo 2 caracteres'
  return ''
}

const PASOS = [
  { num: '01', icon: '📋', titulo: 'Entrená a tu agente', desc: 'Le enseñás cómo vendés tú: objeciones, precios, modelos, follow-ups. En 5 minutos queda listo.' },
  { num: '02', icon: '📱', titulo: 'Conectás con QR', desc: 'Escaneas un código QR desde tu celular. Tu número de siempre — sin SIM nueva, sin número extra.' },
  { num: '03', icon: '⚡', titulo: 'El agente trabaja por ti', desc: 'Llega un lead → responde en 30 segundos. Día 1, 3 y 7 hace seguimiento. Tú solo cerrás.' },
]

const TESTIMONIOS = [
  { nombre: 'Andrés M.', cargo: 'Asesor KIA · Cali', texto: 'Antes perdía leads porque estaba en prueba de manejo. Ahora el agente los atiende y cuando vuelvo, ya están calientes.' },
  { nombre: 'Carolina V.', cargo: 'Vendedora Hyundai · Bogotá', texto: 'Lo que más me gustó es que funciona con mi WhatsApp normal. Sin apps raras. Y el cliente ni sabe que es IA.' },
  { nombre: 'Jorge P.', cargo: 'Asesor Renault · Medellín', texto: 'En el primer mes recuperé 3 ventas que se me hubieran ido. El seguimiento automático es oro.' },
]

const WA_MENSAJES = [
  { out: false, text: 'Hola! Vi el Sportage NX5 😍', time: '3:42 p.m.', delay: 1500 },
  { out: true,  text: '¡Hola! Desde $127M neto. ¿Te agendo el test drive? 🙌', time: '3:42 p.m. ✓✓', delay: 2300 },
  { out: true,  text: '✅ Cita agendada: mañana 10am', time: '3:43 p.m. ✓✓', delay: 3500 },
]

export default function PulseMotorLanding() {
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando'>('idle')
  const [errorEmail, setErrorEmail] = useState('')
  const [errorNombre, setErrorNombre] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')
  const [touchedEmail, setTouchedEmail] = useState(false)
  const [touchedNombre, setTouchedNombre] = useState(false)
  const [usuarioLogueado, setUsuarioLogueado] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [visibleMsgs, setVisibleMsgs] = useState<number[]>([])
  const [showTyping, setShowTyping] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const cubeRotX = useRef(-15)
  const cubeRotY = useRef(0)
  const cubeSpeedX = useRef(0)
  const cubeSpeedY = useRef(0.5)
  const cubeHover = useRef(false)
  const cubeMouseNX = useRef(0)
  const cubeMouseNY = useRef(0)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUsuarioLogueado(data.user.email)
    })
    setTimeout(() => setVisible(true), 100)

    // Animar mensajes WhatsApp secuencialmente
    WA_MENSAJES.forEach((m, i) => {
      if (i === 1) {
        // Mostrar typing antes del primer mensaje del agente
        setTimeout(() => setShowTyping(true), m.delay - 600)
        setTimeout(() => setShowTyping(false), m.delay - 100)
      }
      setTimeout(() => setVisibleMsgs(prev => [...prev, i]), m.delay)
    })
    setTimeout(() => setShowNote(true), 4400)

    // Cubo 3D
    let raf: number
    function cubeTick() {
      const tSY = cubeHover.current ? cubeMouseNX.current * 3.5 : 0.5
      const tSX = cubeHover.current ? -cubeMouseNY.current * 1.5 : 0
      cubeSpeedY.current += (tSY - cubeSpeedY.current) * 0.06
      cubeSpeedX.current += (tSX - cubeSpeedX.current) * 0.06
      cubeRotY.current += cubeSpeedY.current
      cubeRotX.current += cubeSpeedX.current
      cubeRotX.current = Math.max(-45, Math.min(45, cubeRotX.current))
      const el = document.getElementById('pm-cube')
      if (el) el.style.transform = 'rotateX(' + cubeRotX.current + 'deg) rotateY(' + cubeRotY.current + 'deg)'
      raf = requestAnimationFrame(cubeTick)
    }
    raf = requestAnimationFrame(cubeTick)

    const sc = document.getElementById('pm-cube-scene')
    if (sc) {
      sc.addEventListener('mousemove', (e: Event) => {
        const me = e as MouseEvent
        const r = (sc as HTMLElement).getBoundingClientRect()
        cubeMouseNX.current = (me.clientX - r.left - r.width/2) / (r.width/2)
        cubeMouseNY.current = (me.clientY - r.top - r.height/2) / (r.height/2)
      })
      sc.addEventListener('mouseenter', () => { cubeHover.current = true })
      sc.addEventListener('mouseleave', () => { cubeHover.current = false; cubeMouseNX.current = 0; cubeMouseNY.current = 0 })
    }

    return () => { cancelAnimationFrame(raf) }
  }, [])

  useEffect(() => { if (touchedEmail) setErrorEmail(validarEmail(email)) }, [email, touchedEmail])
  useEffect(() => { if (touchedNombre) setErrorNombre(validarNombre(nombre)) }, [nombre, touchedNombre])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouchedEmail(true); setTouchedNombre(true)
    const eE = validarEmail(email); const eN = validarNombre(nombre)
    setErrorEmail(eE); setErrorNombre(eN)
    if (eE || eN) return
    setEstado('enviando'); setErrorGeneral('')
    try {
      const res = await fetch('/api/pulse/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), nombre: nombre.trim(), marca: marca.trim() || null }),
      })
      const data = await res.json()
      if (data.ok || res.status === 409) {
        sessionStorage.setItem('pulse_onboarding_email', email.trim().toLowerCase())
        sessionStorage.setItem('pulse_onboarding_nombre', nombre.trim())
        window.location.href = '/onboarding-demo'
        return
      }
      setErrorGeneral(data.error || 'Error inesperado. Intenta de nuevo.')
      setEstado('idle')
    } catch {
      setErrorGeneral('Error de conexión. Verifica tu internet e intenta de nuevo.')
      setEstado('idle')
    }
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

        .pm-headline-line { overflow: hidden; display: block; }
        .pm-headline-inner {
          display: block;
          transform: translateY(100%);
          opacity: 0;
          transition: transform 0.65s cubic-bezier(0.16,1,0.3,1), opacity 0.65s ease;
        }
        .pm-headline-inner.on { transform: translateY(0); opacity: 1; }

        .pm-msg {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .pm-msg.on { opacity: 1; transform: translateY(0); }

        .pm-typing { display:flex; gap:4px; align-items:center; padding:2px 0; }
        .pm-dot { width:6px; height:6px; border-radius:50%; background:#10b981; animation:bounce 1.2s ease infinite; }
        .pm-dot:nth-child(2){animation-delay:.15s} .pm-dot:nth-child(3){animation-delay:.3s}
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

        .pm-note-dot { width:6px; height:6px; border-radius:50%; background:#10b981; flex-shrink:0; animation:pulse 2s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        @media(max-width:768px) { .hero-grid{flex-direction:column!important} .grid3{grid-template-columns:1fr!important} .cube-grid{grid-template-columns:1fr!important} }
        @keyframes drawPath {
          to { strokeDashoffset: 0; }
        }
        @keyframes scanLine {
          0%,100% { transform: translateY(-60px); opacity:0; }
          20% { opacity:.5; }
          80% { opacity:.5; }
          50% { transform: translateY(60px); opacity:.5; }
        }
        @keyframes floatCar {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }
      `}</style>

      <div style={{ minHeight:'100vh', background:'var(--bg)', color:'#fff', fontFamily:FONT_BODY }}>

        {/* BG glow */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-20%', left:'50%', transform:'translateX(-50%)', width:'700px', height:'700px', background:'radial-gradient(circle,rgba(14,165,233,0.07) 0%,transparent 70%)', borderRadius:'50%' }} />
          <div style={{ position:'absolute', top:'40%', right:'-10%', width:'350px', height:'350px', background:'radial-gradient(circle,rgba(16,185,129,0.05) 0%,transparent 70%)', borderRadius:'50%' }} />
        </div>

        {/* Header */}
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
                <a href="/pulse/login" style={{ fontSize:'14px', fontWeight:500, color:'#94a3b8', padding:'8px 16px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', textDecoration:'none' }}>Ingresar</a>
                <a href="/pulse/signup" style={{ fontSize:'14px', fontWeight:600, color:'#fff', padding:'8px 18px', borderRadius:'8px', background:'var(--grad)', textDecoration:'none', boxShadow:'0 4px 14px rgba(14,165,233,0.25)' }}>Registrarse →</a>
              </>
            )}
          </div>
        </header>

        {/* Hero */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'72px 24px 80px' }}>

          {/* Headline centrada */}
          <div style={{ textAlign:'center', marginBottom:'56px' }}>
            <div style={{ ...v(100), display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.25)', borderRadius:'999px', padding:'5px 14px', fontSize:'12px', fontWeight:600, color:'#7dd3fc', marginBottom:'28px' }}>
              🚗 Para asesores de concesionario automotriz
            </div>

            <h1 style={{ fontFamily:FONT, fontSize:'clamp(34px,5.5vw,60px)', fontWeight:700, lineHeight:'1.08', letterSpacing:'-.5px', margin:'0 0 20px' }}>
              <span className="pm-headline-line">
                <span className={`pm-headline-inner${visible?' on':''}`} style={{ transitionDelay:'0.3s' }}>
                  Tu agente entrenado,
                </span>
              </span>
              <span className="pm-headline-line">
                <span className={`pm-headline-inner${visible?' on':''}`} style={{ transitionDelay:'0.5s', background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  respondiendo en tu WhatsApp
                </span>
              </span>
              <span className="pm-headline-line">
                <span className={`pm-headline-inner${visible?' on':''}`} style={{ transitionDelay:'0.7s' }}>
                  mientras vos vendés.
                </span>
              </span>
            </h1>

            <p style={{ ...v(900), fontSize:'clamp(15px,2vw,18px)', color:'#64748b', maxWidth:'500px', margin:'0 auto 20px', lineHeight:'1.65' }}>
              Le enseñás cómo vendés vos. Él responde leads en 30 segundos, hace seguimiento y agenda citas — desde tu número de siempre.
            </p>

            <div style={{ ...v(1100), display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', flexWrap:'wrap' }}>
              {[
                { text:'WA Tu WhatsApp · QR · Sin SIM nueva', green: true, wa: true },
                { text:'⚡ Responde en <30 seg', green: false },
                { text:'🔁 Seguimiento día 1, 3 y 7', green: false },
              ].map(p => (
                <div key={p.text} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'999px', fontSize:'12px', fontWeight:500, background: p.green ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${p.green ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, color: p.green ? '#6ee7b7' : '#475569' }} dangerouslySetInnerHTML={{ __html: p.text }} />
              ))}
            </div>
          </div>

          {/* Hero grid: auto SVG + form */}
          <div className="hero-grid" style={{ display:'flex', alignItems:'flex-start', gap:'48px', justifyContent:'center' }}>

            {/* Auto SVG tech + burbujas WA */}
            <div style={{ ...v(1400), flex:'1', minWidth:'300px', maxWidth:'480px', position:'relative' }}>

              {/* Glow suelo */}
              <div style={{ position:'absolute', bottom:'0', left:'50%', transform:'translateX(-50%)', width:'80%', height:'30px', background:'radial-gradient(ellipse,rgba(14,165,233,0.15) 0%,transparent 70%)', borderRadius:'50%', filter:'blur(8px)', zIndex:0 }} />

              {/* Línea piso */}
              <div style={{ position:'absolute', bottom:'8%', left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(14,165,233,0.2),rgba(16,185,129,0.2),transparent)', zIndex:0 }} />

              {/* Auto SVG */}
              <div style={{ position:'relative', zIndex:1, width:'100%', paddingBottom:'52%' }}>
                <div style={{ position:'absolute', inset:0 }}>
              {/* KIA EV3 wireframe tech — animado con líneas que se dibujan */}
              <svg
                style={{ width:'100%', height:'100%', animation:'carFloat 4s ease-in-out infinite', filter:'drop-shadow(0 20px 40px rgba(14,165,233,0.18))', overflow:'visible' }}
                viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="bG" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(14,165,233,0.08)"/>
                    <stop offset="100%" stopColor="rgba(16,185,129,0.04)"/>
                  </linearGradient>
                  <clipPath id="sC"><rect x="20" y="20" width="360" height="200"/></clipPath>
                </defs>
                {/* Sombra suelo */}
                <ellipse cx="200" cy="222" rx="155" ry="8" fill="rgba(14,165,233,0.06)"/>
                {/* Cuerpo principal */}
                <path d="M55 170 L55 130 Q58 108 75 95 L115 72 Q138 48 168 42 L248 40 Q278 40 300 56 L338 82 Q358 95 362 115 L365 140 L365 170 Z"
                  fill="url(#bG)" stroke="rgba(14,165,233,0.5)" strokeWidth="1.5"
                  style={{strokeDasharray:1000,strokeDashoffset:1000,animation:'drawPath 2.5s ease .6s forwards'}}/>
                {/* Techo */}
                <path d="M118 72 Q140 46 172 38 L250 36 Q280 36 302 52 L338 78"
                  fill="none" stroke="rgba(14,165,233,0.7)" strokeWidth="1.5"
                  style={{strokeDasharray:600,strokeDashoffset:600,animation:'drawPath 2s ease 1s forwards'}}/>
                {/* Parabrisas */}
                <path d="M122 70 Q144 44 175 36 L248 35 Q272 35 292 50 L325 72 Z"
                  fill="rgba(14,165,233,0.06)" stroke="rgba(14,165,233,0.5)" strokeWidth="1"
                  style={{strokeDasharray:500,strokeDashoffset:500,animation:'drawPath 1.8s ease 1.4s forwards'}}/>
                {/* Cintura */}
                <path d="M75 130 Q200 118 345 126" fill="none" stroke="rgba(14,165,233,0.35)" strokeWidth="1.2"
                  style={{strokeDasharray:300,strokeDashoffset:300,animation:'drawPath 1.5s ease 1.8s forwards'}}/>
                {/* Puerta delantera */}
                <path d="M118 70 L118 165 L210 165 L210 70" fill="none" stroke="rgba(14,165,233,0.2)" strokeWidth="1"
                  style={{strokeDasharray:400,strokeDashoffset:400,animation:'drawPath 1.5s ease 2s forwards'}}/>
                {/* Puerta trasera */}
                <path d="M210 65 L210 165 L322 165 L322 75" fill="none" stroke="rgba(14,165,233,0.2)" strokeWidth="1"
                  style={{strokeDasharray:400,strokeDashoffset:400,animation:'drawPath 1.5s ease 2.2s forwards'}}/>
                {/* Pilar B */}
                <line x1="210" y1="36" x2="210" y2="70" stroke="rgba(14,165,233,0.3)" strokeWidth="2"/>
                {/* Manijas */}
                <rect x="152" y="126" width="28" height="5" rx="2.5" fill="rgba(14,165,233,0.3)" stroke="rgba(14,165,233,0.6)" strokeWidth="0.8"/>
                <rect x="248" y="126" width="28" height="5" rx="2.5" fill="rgba(14,165,233,0.3)" stroke="rgba(14,165,233,0.6)" strokeWidth="0.8"/>
                {/* Frente EV3 */}
                <path d="M58 130 L58 165 L115 165 L115 95 Q90 100 75 115 Z" fill="rgba(8,15,26,0.6)" stroke="rgba(14,165,233,0.3)" strokeWidth="1.2"/>
                {/* Parrilla rectangular */}
                <rect x="62" y="135" width="48" height="22" rx="3" fill="rgba(14,165,233,0.05)" stroke="rgba(14,165,233,0.4)" strokeWidth="1.2"/>
                <line x1="63" y1="141" x2="109" y2="141" stroke="rgba(14,165,233,0.25)" strokeWidth=".8"/>
                <line x1="63" y1="147" x2="109" y2="147" stroke="rgba(14,165,233,0.25)" strokeWidth=".8"/>
                <line x1="63" y1="153" x2="109" y2="153" stroke="rgba(14,165,233,0.25)" strokeWidth=".8"/>
                <text x="86" y="148" textAnchor="middle" fontSize="7" fill="rgba(14,165,233,0.8)" fontWeight="800" fontFamily="Syne,sans-serif">KIA</text>
                {/* Faro LED DRL angular */}
                <path d="M58 108 L58 125 L112 120 L112 105 Z" fill="rgba(14,165,233,0.07)" stroke="rgba(14,165,233,0.45)" strokeWidth="1.2"/>
                <line x1="62" y1="110" x2="108" y2="107" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" opacity=".9"/>
                <line x1="62" y1="115" x2="108" y2="112" stroke="rgba(14,165,233,0.35)" strokeWidth="1" strokeLinecap="round"/>
                {/* Faro trasero */}
                <path d="M345 90 L362 100 L365 130 L348 128 Z" fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.5)" strokeWidth="1.2"/>
                <line x1="350" y1="93" x2="362" y2="126" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity=".7"/>
                {/* Spoiler */}
                <path d="M340 42 L365 54 L365 48 L342 36 Z" fill="rgba(8,15,26,0.8)" stroke="rgba(14,165,233,0.25)" strokeWidth="1"/>
                {/* Bumpers + falda */}
                <path d="M322 165 L365 165 L365 175 Q360 180 348 180 L318 180 Z" fill="rgba(8,15,26,0.7)" stroke="rgba(14,165,233,0.2)" strokeWidth="1"/>
                <path d="M58 165 L115 165 L115 178 Q108 183 88 183 L58 180 Z" fill="rgba(8,15,26,0.7)" stroke="rgba(14,165,233,0.2)" strokeWidth="1"/>
                <path d="M112 165 L322 165 L325 176 L108 176 Z" fill="rgba(8,15,26,0.6)" stroke="rgba(14,165,233,0.15)" strokeWidth="1"/>
                {/* Rueda delantera */}
                <circle cx="112" cy="195" r="26" fill="#0a0f1a" stroke="rgba(14,165,233,0.5)" strokeWidth="1.8"/>
                <circle cx="112" cy="195" r="18" fill="#0d1520" stroke="rgba(14,165,233,0.35)" strokeWidth="1.2"/>
                <circle cx="112" cy="195" r="5" fill="rgba(14,165,233,0.25)" stroke="rgba(14,165,233,0.7)" strokeWidth="1.2"/>
                <line x1="112" y1="177" x2="112" y2="190" stroke="rgba(14,165,233,0.55)" strokeWidth="1.5"/>
                <line x1="112" y1="200" x2="112" y2="213" stroke="rgba(14,165,233,0.55)" strokeWidth="1.5"/>
                <line x1="94" y1="195" x2="107" y2="195" stroke="rgba(14,165,233,0.55)" strokeWidth="1.5"/>
                <line x1="117" y1="195" x2="130" y2="195" stroke="rgba(14,165,233,0.55)" strokeWidth="1.5"/>
                <line x1="99" y1="182" x2="109" y2="190" stroke="rgba(14,165,233,0.4)" strokeWidth="1.2"/>
                <line x1="115" y1="200" x2="125" y2="208" stroke="rgba(14,165,233,0.4)" strokeWidth="1.2"/>
                <line x1="125" y1="182" x2="117" y2="190" stroke="rgba(14,165,233,0.4)" strokeWidth="1.2"/>
                <line x1="99" y1="208" x2="107" y2="200" stroke="rgba(14,165,233,0.4)" strokeWidth="1.2"/>
                {/* Rueda trasera */}
                <circle cx="328" cy="195" r="26" fill="#0a0f1a" stroke="rgba(14,165,233,0.5)" strokeWidth="1.8"/>
                <circle cx="328" cy="195" r="18" fill="#0d1520" stroke="rgba(14,165,233,0.35)" strokeWidth="1.2"/>
                <circle cx="328" cy="195" r="5" fill="rgba(14,165,233,0.25)" stroke="rgba(14,165,233,0.7)" strokeWidth="1.2"/>
                <line x1="328" y1="177" x2="328" y2="190" stroke="rgba(14,165,233,0.55)" strokeWidth="1.5"/>
                <line x1="328" y1="200" x2="328" y2="213" stroke="rgba(14,165,233,0.55)" strokeWidth="1.5"/>
                <line x1="310" y1="195" x2="323" y2="195" stroke="rgba(14,165,233,0.55)" strokeWidth="1.5"/>
                <line x1="333" y1="195" x2="346" y2="195" stroke="rgba(14,165,233,0.55)" strokeWidth="1.5"/>
                <line x1="315" y1="182" x2="325" y2="190" stroke="rgba(14,165,233,0.4)" strokeWidth="1.2"/>
                <line x1="331" y1="200" x2="341" y2="208" stroke="rgba(14,165,233,0.4)" strokeWidth="1.2"/>
                <line x1="341" y1="182" x2="333" y2="190" stroke="rgba(14,165,233,0.4)" strokeWidth="1.2"/>
                <line x1="315" y1="208" x2="323" y2="200" stroke="rgba(14,165,233,0.4)" strokeWidth="1.2"/>
                {/* Scan line */}
                <g clipPath="url(#sC)">
                  <line x1="20" y1="110" x2="380" y2="110" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5" strokeDasharray="8 4"
                    style={{animation:'scanLine 3s ease-in-out infinite'}}/>
                </g>
                {/* Nodos tech */}
                <circle cx="58" cy="108" r="3" fill="#0ea5e9" opacity=".8"/>
                <circle cx="112" cy="70" r="3" fill="#0ea5e9" opacity=".6"/>
                <circle cx="325" cy="72" r="3" fill="#10b981" opacity=".6"/>
                <circle cx="362" cy="130" r="3" fill="#0ea5e9" opacity=".8"/>
                <line x1="58" y1="108" x2="35" y2="90" stroke="rgba(14,165,233,0.2)" strokeWidth=".8" strokeDasharray="3 3"/>
                <line x1="362" y1="130" x2="385" y2="112" stroke="rgba(14,165,233,0.2)" strokeWidth=".8" strokeDasharray="3 3"/>
                {/* Reflejo */}
                <path d="M150 44 Q210 36 270 40" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
                </div>
              </div>

              {/* Burbuja 1 */}
              <div className={`pm-msg${visibleMsgs.includes(0) ? ' on' : ''}`} style={{ position:'absolute', top:'5%', right:'-8px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px 10px 0 10px', padding:'8px 12px', fontSize:'12px', color:'#cbd5e1', maxWidth:'160px', zIndex:3 }}>
                Hola! Vi el Sportage NX5 😍
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', marginTop:'2px', textAlign:'right' }}>3:42 p.m.</div>
              </div>

              {/* Burbuja 2 — agente responde */}
              <div className={`pm-msg${visibleMsgs.includes(1) ? ' on' : ''}`} style={{ position:'absolute', top:'30%', right:'-12px', background:'#128c7e', borderRadius:'10px 10px 0 10px', padding:'8px 12px', fontSize:'12px', color:'#fff', maxWidth:'190px', zIndex:3, boxShadow:'0 4px 16px rgba(18,140,126,0.25)' }}>
                ¡Hola! Desde $127M neto. ¿Te agendo el test drive? 🙌
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.5)', marginTop:'2px', textAlign:'right' }}>3:42 p.m. ✓✓</div>
              </div>

              {/* Burbuja 3 — cita */}
              <div className={`pm-msg${visibleMsgs.includes(2) ? ' on' : ''}`} style={{ position:'absolute', bottom:'18%', right:'-8px', background:'#075e54', borderRadius:'10px 10px 0 10px', padding:'8px 12px', fontSize:'12px', color:'#fff', zIndex:3, whiteSpace:'nowrap' }}>
                ✅ Cita agendada: mañana 10am
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.5)', marginTop:'2px', textAlign:'right' }}>3:43 p.m. ✓✓</div>
              </div>

              {/* Badge agente activo */}
              <div style={{ position:'absolute', top:'10%', left:'42%', width:'10px', height:'10px', borderRadius:'50%', background:'#10b981', border:'2px solid #080f1a', animation:'pm-note-dot 2s infinite', zIndex:4 }} />

              {/* QR tag */}
              {showNote && (
                <div style={{ position:'absolute', bottom:'10%', left:'-12px', background:'rgba(8,15,26,0.9)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'10px', padding:'5px 10px', display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'#6ee7b7', fontWeight:600, zIndex:3, whiteSpace:'nowrap', opacity: showNote ? 1 : 0, transition:'opacity .4s ease' }}>
                  <svg viewBox="0 0 24 24" fill="#25d366" style={{width:'12px',height:'12px'}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.565 4.14 1.548 5.873L.057 23.57a.75.75 0 0 0 .92.921l5.697-1.491A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.192-1.457l-.372-.22-3.853 1.009 1.01-3.762-.241-.386A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  Tu número · QR · Sin SIM nueva
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={submit} style={{ ...v(1500), flex:'1', minWidth:'280px', maxWidth:'380px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'28px', backdropFilter:'blur(12px)' }}>
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

              <button type="submit" disabled={estado==='enviando'} className="pm-btn" style={{ marginBottom:'14px' }}>
                {estado==='enviando'?'Configurando…':'Crear mi agente →'}
              </button>

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
          </div>
        </section>


        {/* Cubo 3D interactivo — 2 columnas */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'0 24px 100px' }}>

          <div className="cube-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'64px', alignItems:'center' }}>

            {/* Columna izquierda — habilidades */}
            <div>
              <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'#0ea5e9', textTransform:'uppercase', marginBottom:'16px' }}>
                Tu agente IA
              </p>
              <h2 style={{ fontSize:'clamp(26px,3vw,40px)', fontWeight:700, fontFamily:FONT, letterSpacing:'-.4px', lineHeight:'1.1', marginBottom:'40px', color:'#fff' }}>
                Un agente que{' '}
                <span style={{ background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  vende como vos
                </span>
              </h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                {[
                  { icon:'⚡', label:'Responde en 30 segundos', desc:'El lead llega y el agente responde antes de que vos puedas leer la notificación.', color:'#0ea5e9' },
                  { icon:'🔁', label:'Seguimiento automático', desc:'Día 1, 3 y 7 sin que hagas nada. Ningún lead se queda olvidado.', color:'#10b981' },
                  { icon:'📱', label:'Tu WhatsApp · Sin SIM nueva', desc:'Conectás con QR desde tu celular. Tu número de siempre.', color:'#0ea5e9' },
                  { icon:'🎯', label:'Entrenado con tu forma de vender', desc:'Le enseñás tus respuestas, objeciones y precios. Habla como vos.', color:'#10b981' },
                  { icon:'📅', label:'Agenda citas automáticamente', desc:'Propone horarios, confirma test drives y registra la cita.', color:'#0ea5e9' },
                  { icon:'🧠', label:'Aprende tu estilo', desc:'Cuanto más lo usás, más preciso se vuelve con tus clientes.', color:'#10b981' },
                ].map((h, i) => (
                  <div key={h.label} style={{
                    display:'flex', gap:'16px', alignItems:'flex-start',
                    padding:'16px 0',
                    borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <div style={{
                      width:'36px', height:'36px', borderRadius:'10px', flexShrink:0,
                      background: h.icon === 'WA' ? 'rgba(37,211,102,0.1)' : h.color === '#0ea5e9' ? 'rgba(14,165,233,0.1)' : 'rgba(16,185,129,0.1)',
                      border: '1px solid ' + (h.icon === 'WA' ? 'rgba(37,211,102,0.25)' : h.color === '#0ea5e9' ? 'rgba(14,165,233,0.2)' : 'rgba(16,185,129,0.2)'),
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'18px',
                    }}>
                      {h.icon === 'WA' ? (
                        <svg viewBox="0 0 24 24" fill="#25d366" style={{width:'20px',height:'20px'}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.565 4.14 1.548 5.873L.057 23.57a.75.75 0 0 0 .92.921l5.697-1.491A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.192-1.457l-.372-.22-3.853 1.009 1.01-3.762-.241-.386A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                      ) : h.icon}
                    </div>
                    <div>
                      <p style={{ fontSize:'14px', fontWeight:700, color:'#e2e8f0', margin:'0 0 3px' }}>{h.label}</p>
                      <p style={{ fontSize:'13px', color:'#475569', margin:0, lineHeight:'1.55' }}>{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna derecha — cubo 3D */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'20px' }}>
              <div
                id="pm-cube-scene"
                style={{ width:'260px', height:'260px', perspective:'900px', cursor:'crosshair' }}
              >
                <div id="pm-cube" style={{ width:'260px', height:'260px', position:'relative', transformStyle:'preserve-3d' as 'preserve-3d' }}>
                  {[
                    { face:'front',  tx:'translateZ(130px)',                color:'rgba(14,165,233,0.08)', border:'rgba(14,165,233,0.4)',  textColor:'#7dd3fc', icon:'⚡', label:'Responde en 30 seg' },
                    { face:'back',   tx:'rotateY(180deg) translateZ(130px)',color:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.4)',  textColor:'#6ee7b7', icon:'🔁', label:'Seguimiento automático' },
                    { face:'right',  tx:'rotateY(90deg) translateZ(130px)', color:'rgba(37,211,102,0.06)', border:'rgba(37,211,102,0.3)',  textColor:'#6ee7b7', icon:'WA', label:'Tu WhatsApp · QR' },
                    { face:'left',   tx:'rotateY(-90deg) translateZ(130px)',color:'rgba(8,15,26,0.9)',    border:'rgba(14,165,233,0.25)', textColor:'#7dd3fc', icon:'🎯', label:'Entrenado por vos' },
                    { face:'top',    tx:'rotateX(90deg) translateZ(130px)', color:'rgba(8,15,26,0.9)',    border:'rgba(16,185,129,0.3)',  textColor:'#6ee7b7', icon:'📅', label:'Agenda citas' },
                    { face:'bottom', tx:'rotateX(-90deg) translateZ(130px)',color:'rgba(8,15,26,0.9)',    border:'rgba(14,165,233,0.2)',  textColor:'#7dd3fc', icon:'🧠', label:'Aprende tu estilo' },
                  ].map(f => (
                    <div key={f.face} style={{
                      position:'absolute', width:'260px', height:'260px',
                      transform: f.tx,
                      background: f.color,
                      border: '1.5px solid ' + f.border,
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      gap:'12px', padding:'24px',
                      fontSize:'14px', fontWeight:600, fontFamily:FONT_BODY,
                      color: f.textColor, textAlign:'center', lineHeight:'1.4',
                      backdropFilter:'blur(4px)',
                    }}>
                      {f.icon === 'WA' ? (
                        <svg viewBox="0 0 24 24" fill="#25d366" style={{width:'36px',height:'36px'}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.565 4.14 1.548 5.873L.057 23.57a.75.75 0 0 0 .92.921l5.697-1.491A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.192-1.457l-.372-.22-3.853 1.009 1.01-3.762-.241-.386A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                      ) : (
                        <span style={{ fontSize:'36px' }}>{f.icon}</span>
                      )}
                      {f.label}
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ fontSize:'12px', color:'#334155', textAlign:'center' }}>
                ↔ Pasá el mouse para guiarlo
              </p>
            </div>

          </div>
        </section>

        {/* Cómo funciona */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'80px 24px' }}>
          <div style={{ textAlign:'center', marginBottom:'52px' }}>
            <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'#0ea5e9', textTransform:'uppercase', marginBottom:'10px' }}>Cómo funciona</p>
            <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:700, letterSpacing:'-.4px', fontFamily:FONT }}>De cero a agente activo<br />en 5 minutos</h2>
          </div>
          <div className="grid3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
            {PASOS.map((p,i)=>(
              <div key={p.num} className="card" style={{ padding:'26px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:'14px', right:'18px', fontSize:'44px', opacity:'.05', fontWeight:900, fontFamily:FONT, lineHeight:1 }}>{p.num}</div>
                <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'#0ea5e9', textTransform:'uppercase', marginBottom:'10px' }}>{p.num}</div>
                <div style={{ fontSize:'28px', marginBottom:'12px' }}>{p.icon}</div>
                <h3 style={{ fontSize:'16px', fontWeight:700, margin:'0 0 8px', fontFamily:FONT }}>{p.titulo}</h3>
                <p style={{ fontSize:'14px', color:'#64748b', lineHeight:'1.6', margin:0 }}>{p.desc}</p>
                {i===1&&<div style={{ marginTop:'14px', display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'8px', padding:'5px 10px', fontSize:'11px', color:'#6ee7b7', fontWeight:600 }}>📱 Tu número · Sin SIM nueva</div>}
              </div>
            ))}
          </div>
        </section>

        {/* QR diferencial */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'0 24px 80px' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.07),rgba(14,165,233,0.07))', border:'1px solid rgba(16,185,129,0.18)', borderRadius:'20px', padding:'48px', display:'flex', alignItems:'center', gap:'48px', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:'260px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'#10b981', textTransform:'uppercase', marginBottom:'10px' }}>El diferencial clave</div>
              <h2 style={{ fontSize:'clamp(22px,3vw,34px)', fontWeight:700, letterSpacing:'-.4px', fontFamily:FONT, marginBottom:'14px', lineHeight:'1.2' }}>
                Tu WhatsApp de siempre.<br /><span style={{ color:'#10b981' }}>Sin número nuevo.</span>
              </h2>
              <p style={{ fontSize:'15px', color:'#94a3b8', lineHeight:'1.65', marginBottom:'20px' }}>
                Otros te piden una SIM nueva o un número de empresa. Nosotros no. Escaneas un QR desde tu celular y en 30 segundos tu agente ya está respondiendo desde tu número personal.
              </p>
              {['Mismo número que tus clientes ya tienen guardado','Sin apps adicionales en tu celular','Desconectás cuando querás con un clic'].map(t=>(
                <div key={t} style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'8px' }}>
                  <span style={{ color:'#10b981', fontWeight:700, flexShrink:0 }}>✓</span>
                  <span style={{ fontSize:'14px', color:'#cbd5e1' }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ flexShrink:0, textAlign:'center' }}>
              <div style={{ width:'140px', height:'140px', background:'#fff', borderRadius:'14px', padding:'10px', margin:'0 auto 10px', boxShadow:'0 0 40px rgba(16,185,129,0.15)', display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
                {Array.from({length:49}).map((_,i)=>{
                  const d=[0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,48]
                  return <div key={i} style={{ borderRadius:'1px', background:(d.includes(i)||(i%3===0&&i>13&&i<35)||(i%7===3))?'#000':'transparent' }} />
                })}
              </div>
              <p style={{ fontSize:'13px', color:'#10b981', fontWeight:600 }}>Escanea · Conecta · Listo</p>
              <p style={{ fontSize:'12px', color:'#475569', marginTop:'3px' }}>30 segundos</p>
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'0 24px 80px' }}>
          <div style={{ textAlign:'center', marginBottom:'44px' }}>
            <p style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'#0ea5e9', textTransform:'uppercase', marginBottom:'10px' }}>Resultados reales</p>
            <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:700, letterSpacing:'-.4px', fontFamily:FONT }}>Lo que dicen los asesores</h2>
          </div>
          <div className="grid3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'18px' }}>
            {TESTIMONIOS.map(t=>(
              <div key={t.nombre} className="card" style={{ padding:'22px' }}>
                <div style={{ fontSize:'22px', color:'#0ea5e9', marginBottom:'10px', fontWeight:900, lineHeight:1 }}>"</div>
                <p style={{ fontSize:'14px', color:'#cbd5e1', lineHeight:'1.65', margin:'0 0 18px', fontStyle:'italic' }}>{t.texto}</p>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, flexShrink:0 }}>{t.nombre[0]}</div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:700 }}>{t.nombre}</div>
                    <div style={{ fontSize:'12px', color:'#475569' }}>{t.cargo}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'680px', margin:'0 auto', padding:'0 24px 100px', textAlign:'center' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(14,165,233,0.07),rgba(16,185,129,0.07))', border:'1px solid rgba(14,165,233,0.14)', borderRadius:'20px', padding:'48px 32px' }}>
            <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:700, letterSpacing:'-.4px', fontFamily:FONT, marginBottom:'14px', lineHeight:'1.2' }}>
              ¿Cuántos leads perdiste<br />esta semana por no responder?
            </h2>
            <p style={{ fontSize:'15px', color:'#94a3b8', marginBottom:'28px', lineHeight:'1.65' }}>
              Con Pulse Motor nunca más. Tu agente responde en 30 segundos, hace seguimiento y agenda citas — mientras vos estás con otro cliente.
            </p>
            <a href="/pulse/signup" style={{ display:'inline-block', padding:'15px 32px', borderRadius:'12px', background:'var(--grad)', color:'#fff', fontSize:'16px', fontWeight:700, textDecoration:'none', fontFamily:FONT, boxShadow:'0 4px 20px rgba(14,165,233,0.3)', letterSpacing:'-.2px' }}>
              Crear mi agente gratis →
            </a>
            <p style={{ fontSize:'13px', color:'#334155', marginTop:'14px' }}>14 días gratis · Sin tarjeta · Tu WhatsApp actual</p>
          </div>
        </section>

        <footer style={{ position:'relative', zIndex:1, padding:'24px', textAlign:'center', fontSize:'13px', color:'#334155', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          © 2026 Pulse Motor · Hecho en Cali, Colombia 🇨🇴
        </footer>
      </div>
    </>
  )
}
