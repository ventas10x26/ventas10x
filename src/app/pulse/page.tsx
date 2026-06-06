// Ruta destino: src/app/pulse/page.tsx
'use client'

import { useState, useEffect } from 'react'
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
  { num: '01', icon: '📋', titulo: 'Entrenás a tu agente', desc: 'Le enseñás cómo vendés tú: objeciones, precios, modelos, follow-ups. En 5 minutos queda listo.' },
  { num: '02', icon: '📱', titulo: 'Conectás con QR', desc: 'Escaneas un código QR desde tu celular. Tu número de siempre — sin SIM nueva, sin número extra.' },
  { num: '03', icon: '⚡', titulo: 'El agente trabaja por ti', desc: 'Llega un lead → responde en 30 segundos. Día 1, 3 y 7 hace seguimiento. Tú solo cerrás.' },
]

const TESTIMONIOS = [
  { nombre: 'Andrés M.', cargo: 'Asesor KIA · Cali', texto: 'Antes perdía leads porque estaba en prueba de manejo. Ahora el agente los atiende y cuando vuelvo, ya están calientes.' },
  { nombre: 'Carolina V.', cargo: 'Vendedora Hyundai · Bogotá', texto: 'Lo que más me gustó es que funciona con mi WhatsApp normal. Sin apps raras. Y el cliente ni sabe que es IA.' },
  { nombre: 'Jorge P.', cargo: 'Asesor Renault · Medellín', texto: 'En el primer mes recuperé 3 ventas que se me hubieran ido. El seguimiento automático es oro.' },
]

const WA_MENSAJES = [
  { out: false, text: 'Hola! Vi el Sportage NX5 en OLX. ¿Cuánto sale con crédito?', time: '3:42 p.m.', delay: 1800 },
  { out: true,  text: '¡Hola Gerardo! 👋 El Sportage NX5 Desire está desde $127M neto. Con 30M inicial a 60 meses, cuota aprox $2.1M/mes. ¿Te hago simulación exacta?', time: '3:42 p.m. ✓✓', delay: 2400 },
  { out: false, text: 'Sí! Y quiero verlo en persona', time: '3:43 p.m.', delay: 3200 },
  { out: true,  text: 'Perfecto 🙌 ¿Cuándo tenés 30min para el test drive? Mañana 10am o pasado 3pm.', time: '3:43 p.m. ✓✓', delay: 3900 },
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

        @media(max-width:768px) { .hero-grid{flex-direction:column!important} .grid3{grid-template-columns:1fr!important} }
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
                { text:'📱 Tu WhatsApp · QR · Sin SIM nueva', green: true },
                { text:'⚡ Responde en <30 seg', green: false },
                { text:'🔁 Seguimiento día 1, 3 y 7', green: false },
              ].map(p => (
                <div key={p.text} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 12px', borderRadius:'999px', fontSize:'12px', fontWeight:500, background: p.green ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${p.green ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, color: p.green ? '#6ee7b7' : '#475569' }} dangerouslySetInnerHTML={{ __html: p.text }} />
              ))}
            </div>
          </div>

          {/* Hero grid: demo WA + form */}
          <div className="hero-grid" style={{ display:'flex', alignItems:'flex-start', gap:'40px', justifyContent:'center' }}>

            {/* WhatsApp demo animado */}
            <div style={{ ...v(1400), flexShrink:0, background:'#0d1829', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', overflow:'hidden', maxWidth:'310px', width:'100%' }}>
              <div style={{ background:'#075e54', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🤖</div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>Agente KIA</div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.6)' }}>● en línea</div>
                </div>
              </div>
              <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:'8px', minHeight:'240px' }}>
                {WA_MENSAJES.map((m, i) => (
                  <div key={i} className={`pm-msg${visibleMsgs.includes(i) ? ' on' : ''}`} style={{ alignSelf: m.out ? 'flex-end' : 'flex-start', maxWidth:'88%' }}>
                    <div style={{ padding:'8px 11px', borderRadius: m.out ? '10px 0 10px 10px' : '0 10px 10px 10px', background: m.out ? '#128c7e' : 'rgba(255,255,255,0.07)', color: m.out ? '#fff' : '#cbd5e1', fontSize:'13px', lineHeight:'1.5', fontFamily:FONT_BODY }}>
                      {m.text}
                    </div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', textAlign: m.out ? 'right' : 'left', marginTop:'2px' }}>{m.time}</div>
                  </div>
                ))}
                {showTyping && (
                  <div style={{ alignSelf:'flex-start' }}>
                    <div style={{ padding:'10px 14px', background:'rgba(255,255,255,0.07)', borderRadius:'0 10px 10px 10px', display:'inline-flex' }}>
                      <div className="pm-typing">
                        <div className="pm-dot" /><div className="pm-dot" /><div className="pm-dot" />
                      </div>
                    </div>
                  </div>
                )}
                {showNote && (
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 10px', background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.15)', borderRadius:'8px', fontSize:'11px', color:'#7dd3fc', opacity: showNote ? 1 : 0, transition:'opacity .4s ease' }}>
                    <div className="pm-note-dot" />
                    El asesor estaba en test drive — el agente atendió solo
                  </div>
                )}
              </div>
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
