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
  { num: '01', icon: '📋', titulo: 'Entrenás a tu agente', desc: 'Le enseñás cómo vendés vos: objeciones, precios, modelos, follow-ups. En 5 minutos queda listo.' },
  { num: '02', icon: '📱', titulo: 'Conectás con QR', desc: 'Escaneas un código QR desde tu celular. Tu número de siempre — sin SIM nueva, sin número extra.' },
  { num: '03', icon: '⚡', titulo: 'El agente trabaja por ti', desc: 'Llega un lead → responde en 30 segundos. Día 1, 3 y 7 hace seguimiento. Tú solo cerrás.' },
]

const TESTIMONIOS = [
  { nombre: 'Andrés M.', cargo: 'Asesor KIA · Cali', texto: 'Antes perdía leads porque estaba en prueba de manejo. Ahora el agente los atiende y cuando vuelvo, ya están calientes.' },
  { nombre: 'Carolina V.', cargo: 'Vendedora Hyundai · Bogotá', texto: 'Lo que más me gustó es que funciona con mi WhatsApp normal. Sin apps raras. Y el cliente ni sabe que es IA.' },
  { nombre: 'Jorge P.', cargo: 'Asesor Renault · Medellín', texto: 'En el primer mes recuperé 3 ventas que se me hubieran ido. El seguimiento automático es oro.' },
]

// Mensajes del chat WA — el loop reinicia infinitamente
const WA_CHAT: { out: boolean; text: string; time: string; delay: number }[] = [
  { out: false, text: 'Hola! Vi el Sportage NX5 😍', time: '3:42 p.m.', delay: 1200 },
  { out: true,  text: '¡Hola! Desde $127M neto. ¿Te agendo el test drive? 🙌', time: '3:42 p.m. ✓✓', delay: 2600 },
  { out: true,  text: '✅ Cita agendada: mañana 10am', time: '3:43 p.m. ✓✓', delay: 4200 },
  { out: false, text: 'Perfecto! ¿Qué color tienen disponible?', time: '3:44 p.m.', delay: 5800 },
  { out: true,  text: 'Tenemos Blanco Nieve y Gris Grafito en stock 🚗', time: '3:44 p.m. ✓✓', delay: 7200 },
]
const LOOP_DURATION = 9500 // ms para reiniciar el loop

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
  const chatRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Auto-scroll del chat al aparecer mensajes
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [visibleMsgs])

  // Loop infinito del chat
  useEffect(() => {
    let timeouts: ReturnType<typeof setTimeout>[] = []

    function startLoop() {
      setVisibleMsgs([])
      setShowTyping(false)

      WA_CHAT.forEach((m, i) => {
        // Mostrar "escribiendo…" 800ms antes de cada burbuja del agente
        if (m.out) {
          const t1 = setTimeout(() => setShowTyping(true), m.delay - 800)
          const t2 = setTimeout(() => setShowTyping(false), m.delay - 50)
          timeouts.push(t1, t2)
        }
        const t3 = setTimeout(() => {
          setVisibleMsgs(prev => [...prev, i])
        }, m.delay)
        timeouts.push(t3)
      })

      // Reiniciar loop
      const tLoop = setTimeout(() => {
        timeouts.forEach(clearTimeout)
        timeouts = []
        startLoop()
      }, LOOP_DURATION)
      timeouts.push(tLoop)
    }

    startLoop()
    return () => timeouts.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUsuarioLogueado(data.user.email)
    })
    setTimeout(() => setVisible(true), 100)
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

        /* Chat bubble entrada */
        .wa-bubble {
          opacity: 0;
          transform: translateY(10px) scale(0.97);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .wa-bubble.on { opacity: 1; transform: translateY(0) scale(1); }

        /* Typing dots */
        .wa-typing { display:flex; gap:4px; align-items:center; height:16px; }
        .wa-dot { width:7px; height:7px; border-radius:50%; background:#25d366; animation:waBounce 1.1s ease infinite; }
        .wa-dot:nth-child(2){animation-delay:.18s} .wa-dot:nth-child(3){animation-delay:.36s}
        @keyframes waBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }

        /* Scrollbar del chat */
        .wa-scroll::-webkit-scrollbar { width:3px; }
        .wa-scroll::-webkit-scrollbar-track { background:transparent; }
        .wa-scroll::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.15); border-radius:2px; }

        /* Status bar blink */
        @keyframes blinkSignal { 0%,100%{opacity:1} 50%{opacity:.4} }

        .pm-note-dot { width:6px; height:6px; border-radius:50%; background:#10b981; flex-shrink:0; animation:pulse 2s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        @media(max-width:900px) {
          .hero-grid{flex-direction:column!important; align-items:center!important;}
          .hero-grid > *{max-width:100%!important; width:100%!important;}
          .grid3{grid-template-columns:1fr!important}
          .cube-grid{grid-template-columns:1fr!important}
        }
        @keyframes drawPath { to { strokeDashoffset: 0; } }
        @keyframes scanLine {
          0%,100% { transform: translateY(-60px); opacity:0; }
          20% { opacity:.5; } 80% { opacity:.5; }
          50% { transform: translateY(60px); opacity:.5; }
        }
        @keyframes floatPhone {
          0%, 100% { transform: translateY(0px) rotate(0.5deg); }
          50% { transform: translateY(-8px) rotate(-0.5deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(37,211,102,0.15), 0 30px 60px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 50px rgba(37,211,102,0.25), 0 30px 60px rgba(0,0,0,0.5); }
        }
      `}</style>

      <div style={{ minHeight:'100vh', background:'var(--bg)', color:'#fff', fontFamily:FONT_BODY }}>

        {/* BG glow */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-20%', left:'50%', transform:'translateX(-50%)', width:'700px', height:'700px', background:'radial-gradient(circle,rgba(14,165,233,0.07) 0%,transparent 70%)', borderRadius:'50%'}} />
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
            <div style={{ ...v(100), display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.25)', borderRadius:'999px', padding:'5px 14px', fontSize:'12px',fontWeight:600, color:'#7dd3fc', marginBottom:'28px' }}>
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
                { text:'WA Tu WhatsApp · QR · Sin SIM nueva', green: true },
                { text:'⚡ Responde en &lt;30 seg', green: false },
                { text:'🔁 Seguimiento día 1, 3 y 7', green: false },
              ].map(p => (
                <div key={p.text} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'999px', fontSize:'12px', fontWeight:500, background: p.green ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${p.green ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, color: p.green ? '#6ee7b7' : '#475569' }} dangerouslySetInnerHTML={{ __html: p.text }} />
              ))}
            </div>
          </div>

          {/* Hero grid: Form IZQUIERDA + Mockup celular DERECHA */}
          <div className="hero-grid" style={{ display:'flex', alignItems:'center', gap:'48px', justifyContent:'center' }}>

            {/* ── IZQUIERDA: Form ── */}
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

            {/* ── DERECHA: Mockup celular con chat WA ── */}
            <div style={{ ...v(1400), flex:'1', minWidth:'280px', maxWidth:'340px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>

              {/* Badge agente activo */}
              <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.25)', borderRadius:'999px', padding:'5px 14px', fontSize:'12px', fontWeight:600, color:'#6ee7b7' }}>
                <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#25d366', display:'inline-block', animation:'pulse 2s ease infinite' }} />
                Agente respondiendo en vivo
              </div>

              {/* Celular mockup */}
              <div style={{
                width:'270px',
                background:'#1a1a2e',
                borderRadius:'40px',
                padding:'12px',
                border:'2px solid rgba(255,255,255,0.12)',
                boxShadow:'0 0 30px rgba(37,211,102,0.15), 0 30px 60px rgba(0,0,0,0.5)',
                animation:'floatPhone 4s ease-in-out infinite, glowPulse 3s ease-in-out infinite',
                position:'relative',
              }}>
                {/* Notch */}
                <div style={{ display:'flex', justifyContent:'center', marginBottom:'8px' }}>
                  <div style={{ width:'80px', height:'6px', background:'rgba(255,255,255,0.08)', borderRadius:'3px' }} />
                </div>

                {/* Pantalla interior */}
                <div style={{ background:'#fff', borderRadius:'28px', overflow:'hidden' }}>

                  {/* Header WA */}
                  <div style={{ background:'#075e54', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                    {/* Avatar */}
                    <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'14px', fontWeight:700, color:'#fff' }}>
                      A
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'#fff', lineHeight:1.2 }}>Agente Pulse Motor</div>
                      <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', gap:'4px', marginTop:'2px' }}>
                        <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#25d366', display:'inline-block', animation:'blinkSignal 2s ease infinite' }} />
                        en línea
                      </div>
                    </div>
                    {/* Iconos header */}
                    <div style={{ display:'flex', gap:'14px', color:'rgba(255,255,255,0.7)', fontSize:'16px' }}>
                      <span>📹</span>
                      <span>📞</span>
                    </div>
                  </div>

                  {/* Fondo wallpaper chat */}
                  <div style={{
                    background:'#e5ddd5',
                    backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d0c8c0' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    minHeight:'320px',
                    padding:'12px 10px',
                    display:'flex',
                    flexDirection:'column',
                    gap:'6px',
                    position:'relative',
                  }}>

                    {/* Fecha */}
                    <div style={{ textAlign:'center', marginBottom:'6px' }}>
                      <span style={{ background:'rgba(0,0,0,0.15)', color:'#fff', fontSize:'10px', padding:'3px 10px', borderRadius:'8px', fontFamily:FONT_BODY }}>
                        HOY
                      </span>
                    </div>

                    {/* Mensajes animados */}
                    <div
                      ref={chatRef}
                      className="wa-scroll"
                      style={{ display:'flex', flexDirection:'column', gap:'5px', overflowY:'auto', maxHeight:'280px' }}
                    >
                      {WA_CHAT.map((msg, i) => (
                        <div
                          key={i}
                          className={`wa-bubble${visibleMsgs.includes(i) ? ' on' : ''}`}
                          style={{
                            alignSelf: msg.out ? 'flex-end' : 'flex-start',
                            maxWidth:'82%',
                          }}
                        >
                          <div style={{
                            background: msg.out ? '#dcf8c6' : '#fff',
                            borderRadius: msg.out ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                            padding:'7px 10px 4px',
                            boxShadow:'0 1px 2px rgba(0,0,0,0.13)',
                            position:'relative',
                          }}>
                            <p style={{ fontSize:'12px', color:'#111', margin:0, lineHeight:'1.45', fontFamily:FONT_BODY }}>
                              {msg.text}
                            </p>
                            <div style={{ fontSize:'9px', color:'#8c9199', textAlign:'right', marginTop:'3px', fontFamily:FONT_BODY }}>
                              {msg.time}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {showTyping && (
                        <div style={{ alignSelf:'flex-start', maxWidth:'70px' }}>
                          <div style={{ background:'#fff', borderRadius:'12px 12px 12px 2px', padding:'10px 14px', boxShadow:'0 1px 2px rgba(0,0,0,0.13)' }}>
                            <div className="wa-typing">
                              <div className="wa-dot" />
                              <div className="wa-dot" />
                              <div className="wa-dot" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input bar WA */}
                  <div style={{ background:'#f0f0f0', padding:'8px 10px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ flex:1, background:'#fff', borderRadius:'20px', padding:'8px 14px', fontSize:'11px', color:'#8c9199', fontFamily:FONT_BODY }}>
                      Mensaje
                    </div>
                    <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'#075e54', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                      🎤
                    </div>
                  </div>
                </div>

                {/* Home indicator */}
                <div style={{ display:'flex', justifyContent:'center', marginTop:'10px' }}>
                  <div style={{ width:'90px', height:'4px', background:'rgba(255,255,255,0.2)', borderRadius:'2px' }} />
                </div>
              </div>

              {/* Etiqueta debajo */}
              <div style={{ fontSize:'12px', color:'#334155', textAlign:'center' }}>
                Responde solo mientras vos cerrás otras ventas
              </div>
            </div>

          </div>
        </section>

        {/* Sección 2 columnas: habilidades + cubo */}
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
                      background: h.color === '#0ea5e9' ? 'rgba(14,165,233,0.1)' : 'rgba(16,185,129,0.1)',
                      border: '1px solid ' + (h.color === '#0ea5e9' ? 'rgba(14,165,233,0.2)' : 'rgba(16,185,129,0.2)'),
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'18px',
                    }}>
                      {h.icon}
                    </div>
                    <div>
                      <p style={{ fontSize:'14px', fontWeight:700, color:'#e2e8f0', margin:'0 0 3px' }}>{h.label}</p>
                      <p style={{ fontSize:'13px', color:'#475569', margin:0, lineHeight:'1.55' }}>{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna derecha — segunda simulación chat más detallada */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>

              <div style={{ width:'100%', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>

                {/* Header simulado */}
                <div style={{ background:'#075e54', padding:'14px 18px', display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:'15px', flexShrink:0 }}>R</div>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:600, color:'#fff' }}>Ricardo · Asesor KIA</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', gap:'5px' }}>
                      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#25d366', display:'inline-block', animation:'blinkSignal 2s ease infinite' }} />
                      Agente activo · respondió hace 12 seg
                    </div>
                  </div>
                  <div style={{ marginLeft:'auto', background:'rgba(255,255,255,0.1)', borderRadius:'8px', padding:'5px 10px', fontSize:'11px', color:'#6ee7b7', fontWeight:600 }}>
                    ⚡ 30 seg
                  </div>
                </div>

                {/* Estadísticas del agente */}
                <div style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'14px 18px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0' }}>
                  {[
                    { val:'47', label:'Leads atendidos', color:'#0ea5e9' },
                    { val:'89%', label:'Tasa respuesta', color:'#10b981' },
                    { val:'8', label:'Citas agendadas', color:'#0ea5e9' },
                  ].map((s, i) => (
                    <div key={s.label} style={{ textAlign:'center', padding:'0 12px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ fontSize:'22px', fontWeight:700, fontFamily:FONT, color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:'10px', color:'#475569', marginTop:'2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Últimas conversaciones */}
                <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'1.5px', color:'#475569', textTransform:'uppercase', marginBottom:'4px' }}>Últimas conversaciones</div>
                  {[
                    { name:'María C.', msg:'¡Perfecto! Mañana a las 10am ✅', time:'hace 2 min', unread:0, status:'cita' },
                    { name:'Carlos R.', msg:'Desde $127M neto. ¿Te muestro opciones?', time:'hace 18 min', unread:1, status:'activo' },
                    { name:'Ana G.', msg:'Seguimiento D3: ¿pudiste ver el catálogo?', time:'hace 3h', unread:0, status:'seguimiento' },
                    { name:'Luis M.', msg:'Tu cita es mañana sábado 11am 📅', time:'ayer', unread:0, status:'cita' },
                  ].map(conv => (
                    <div key={conv.name} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px', borderRadius:'10px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', cursor:'default', transition:'background .15s' }}>
                      <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(14,165,233,0.15)', border:'1px solid rgba(14,165,233,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:'#7dd3fc', flexShrink:0 }}>
                        {conv.name[0]}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2px' }}>
                          <span style={{ fontSize:'13px', fontWeight:600, color:'#e2e8f0' }}>{conv.name}</span>
                          <span style={{ fontSize:'10px', color:'#334155' }}>{conv.time}</span>
                        </div>
                        <div style={{ fontSize:'11px', color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.msg}</div>
                      </div>
                      <div style={{
                        flexShrink:0,
                        fontSize:'9px', fontWeight:700, padding:'3px 7px', borderRadius:'6px',
                        background: conv.status === 'cita' ? 'rgba(16,185,129,0.1)' : conv.status === 'activo' ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.05)',
                        color: conv.status === 'cita' ? '#6ee7b7' : conv.status === 'activo' ? '#7dd3fc' : '#475569',
                        border: conv.status === 'cita' ? '1px solid rgba(16,185,129,0.2)' : conv.status === 'activo' ? '1px solid rgba(14,165,233,0.2)' : '1px solid rgba(255,255,255,0.05)',
                        textTransform:'uppercase', letterSpacing:'0.5px',
                      }}>
                        {conv.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
