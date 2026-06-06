// Ruta destino: src/app/pulse/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const FONT = "'Syne', 'DM Sans', system-ui, sans-serif"
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
  { num: '01', icon: '📋', titulo: 'Entrenas a tu agente', desc: 'Le cuentas cómo respondes tú: objeciones, precios, modelos, follow-ups. En 5 minutos queda listo.' },
  { num: '02', icon: '📱', titulo: 'Conectas tu WhatsApp con QR', desc: 'Escaneas un código QR desde tu celular. Tu número de siempre — sin SIM nueva, sin número extra.' },
  { num: '03', icon: '⚡', titulo: 'El agente trabaja por ti', desc: 'Llega un lead → responde en 30 segundos. Día 1, 3 y 7 hace seguimiento. Tú solo cierras.' },
]

const TESTIMONIOS = [
  { nombre: 'Andrés M.', cargo: 'Asesor KIA · Cali', texto: 'Antes perdía leads porque estaba en prueba de manejo. Ahora el agente los atiende y cuando vuelvo, ya están calientes.' },
  { nombre: 'Carolina V.', cargo: 'Vendedora Hyundai · Bogotá', texto: 'Lo que más me gustó es que funciona con mi WhatsApp normal. Sin apps raras. Y el cliente ni sabe que es IA.' },
  { nombre: 'Jorge P.', cargo: 'Asesor Renault · Medellín', texto: 'En el primer mes recuperé 3 ventas que se me hubieran ido. El seguimiento automático es oro.' },
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
  const supabase = createClient()

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --blue:#0ea5e9; --green:#10b981; --grad:linear-gradient(135deg,#0ea5e9,#10b981); --bg:#080f1a; --border:rgba(255,255,255,0.07); }
        body { background: var(--bg); }
        .v { opacity:0; transform:translateY(20px); transition:opacity .7s ease,transform .7s ease; }
        .v.on { opacity:1; transform:none; }
        .v.d1{transition-delay:.1s}.v.d2{transition-delay:.2s}.v.d3{transition-delay:.3s}.v.d4{transition-delay:.4s}.v.d5{transition-delay:.5s}
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
        @media(max-width:768px) { .hero-grid{flex-direction:column!important} .grid3{grid-template-columns:1fr!important} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'var(--bg)', color:'#fff', fontFamily:FONT_BODY }}>

        {/* BG glow */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-20%', left:'50%', transform:'translateX(-50%)', width:'800px', height:'800px', background:'radial-gradient(circle,rgba(14,165,233,0.06) 0%,transparent 70%)', borderRadius:'50%' }} />
          <div style={{ position:'absolute', top:'40%', right:'-10%', width:'400px', height:'400px', background:'radial-gradient(circle,rgba(16,185,129,0.05) 0%,transparent 70%)', borderRadius:'50%' }} />
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
          <div style={{ textAlign:'center', marginBottom:'64px' }}>
            <div className={`v d1${visible?' on':''}`} style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.25)', borderRadius:'999px', padding:'6px 16px', fontSize:'13px', fontWeight:600, color:'#7dd3fc', marginBottom:'32px' }}>
              🚗 Para asesores de concesionario automotriz
            </div>
            <h1 className={`v d2${visible?' on':''}`} style={{ fontSize:'clamp(38px,6vw,70px)', fontWeight:700, lineHeight:'1.05', letterSpacing:'-0.5px', margin:'0 0 24px', fontFamily:FONT }}>
              Tu agente IA que vende<br />
              <span style={{ background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>mientras tú estás ocupado</span>
            </h1>
            <p className={`v d3${visible?' on':''}`} style={{ fontSize:'clamp(16px,2vw,20px)', color:'#94a3b8', maxWidth:'580px', margin:'0 auto 20px', lineHeight:'1.65' }}>
              Entrenás a tu agente con tu forma de vender. Él responde leads en WhatsApp en 30 segundos, hace seguimientos y agenda citas — con tu número de siempre.
            </p>
            <div className={`v d4${visible?' on':''}`} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', flexWrap:'wrap', marginBottom:'56px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(14,165,233,0.15))', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'999px', padding:'6px 14px 6px 10px', fontSize:'13px', fontWeight:600, color:'#6ee7b7' }}>
                <span style={{ fontSize:'18px' }}>📱</span> Conecta con QR · tu número · sin SIM nueva
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'999px', padding:'6px 14px', fontSize:'13px', color:'#64748b' }}>
                ⚡ Responde en &lt;30 segundos
              </div>
            </div>
          </div>

          {/* Hero grid */}
          <div className={`v d5${visible?' on':''} hero-grid`} style={{ display:'flex', alignItems:'flex-start', gap:'48px', justifyContent:'center' }}>

            {/* WhatsApp demo */}
            <div style={{ flexShrink:0, background:'#0b1929', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', overflow:'hidden', maxWidth:'320px', width:'100%' }}>
              <div style={{ background:'#128c7e', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>🤖</div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>Agente KIA · Ricardo</div>
                  <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)' }}>En línea</div>
                </div>
              </div>
              <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                {[
                  { out:false, text:'Hola! Vi el Sportage NX5. ¿Cuánto cuesta con crédito?', time:'3:42 p.m.' },
                  { out:true, text:'¡Hola Gerardo! 👋 El Sportage NX5 Desire desde $127M neto. Con 30M inicial a 60 meses, cuota aprox $2.1M/mes. ¿Te hago simulación exacta?', time:'3:42 p.m. ✓✓' },
                  { out:false, text:'Sí! Y quiero ver el carro', time:'3:43 p.m.' },
                  { out:true, text:'Perfecto 🙌 ¿Cuándo tienes 30min para el test drive? Disponibilidad mañana 10am o pasado 3pm.', time:'3:43 p.m. ✓✓' },
                ].map((m, i) => (
                  <div key={i} style={{ alignSelf:m.out?'flex-end':'flex-start', maxWidth:'85%' }}>
                    <div style={{ padding:'8px 12px', borderRadius: m.out?'12px 0 12px 12px':'0 12px 12px 12px', background:m.out?'#128c7e':'rgba(255,255,255,0.08)', color:'#e2e8f0', fontSize:'13px', lineHeight:'1.5', fontFamily:FONT_BODY }}>
                      {m.text}
                    </div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginTop:'2px', textAlign:m.out?'right':'left' }}>{m.time}</div>
                  </div>
                ))}
                <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 10px', background:'rgba(14,165,233,0.08)', borderRadius:'8px', border:'1px solid rgba(14,165,233,0.15)' }}>
                  <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#10b981', flexShrink:0 }} />
                  <span style={{ fontSize:'11px', color:'#7dd3fc' }}>Ricardo estaba en test drive — el agente atendió solo</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={submit} style={{ flex:'1', minWidth:'280px', maxWidth:'400px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', padding:'28px', backdropFilter:'blur(12px)' }}>
              <h3 style={{ fontSize:'20px', fontWeight:700, margin:'0 0 4px', fontFamily:FONT, letterSpacing:'-.3px' }}>Configura tu agente gratis</h3>
              <p style={{ fontSize:'13px', color:'#64748b', margin:'0 0 24px' }}>Listo en menos de 5 minutos. Sin tarjeta.</p>
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
                  <option value="">¿Con qué marca trabajas? (opcional)</option>
                  {['KIA','Hyundai','Renault','Chevrolet','Toyota','Mazda','Nissan','Otro'].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <button type="submit" disabled={estado==='enviando'} className="pm-btn" style={{ marginBottom:'12px' }}>
                {estado==='enviando'?'Configurando…':'Crear mi agente KIA →'}
              </button>
              {errorGeneral&&<p style={{ fontSize:'13px', color:'#f87171', marginBottom:'8px', textAlign:'center' }}>⚠ {errorGeneral}</p>}
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {['✓ Conecta con tu WhatsApp actual vía QR','✓ Sin número nuevo ni SIM extra','✓ 14 días gratis sin tarjeta'].map(t=>(
                  <div key={t} style={{ fontSize:'13px', color:'#475569', display:'flex', gap:'6px' }}>
                    <span style={{ color:'#10b981' }}>✓</span><span>{t.slice(2)}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:'13px', color:'#334155', margin:'16px 0 0', textAlign:'center' }}>
                ¿Ya tienes cuenta? <a href="/pulse/login" style={{ color:'#0ea5e9', textDecoration:'none', fontWeight:500 }}>Ingresar →</a>
              </p>
            </form>
          </div>
        </section>

        {/* Cómo funciona */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'80px 24px' }}>
          <div style={{ textAlign:'center', marginBottom:'56px' }}>
            <p style={{ fontSize:'12px', fontWeight:700, letterSpacing:'2px', color:'#0ea5e9', textTransform:'uppercase', marginBottom:'12px' }}>Cómo funciona</p>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:700, letterSpacing:'-0.3px', fontFamily:FONT }}>De cero a agente activo<br />en 5 minutos</h2>
          </div>
          <div className="grid3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px' }}>
            {PASOS.map((p,i)=>(
              <div key={p.num} className="card" style={{ padding:'28px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:'16px', right:'20px', fontSize:'48px', opacity:'.06', fontWeight:900, fontFamily:FONT, lineHeight:1 }}>{p.num}</div>
                <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'2px', color:'#0ea5e9', textTransform:'uppercase', marginBottom:'12px' }}>{p.num}</div>
                <div style={{ fontSize:'32px', marginBottom:'14px' }}>{p.icon}</div>
                <h3 style={{ fontSize:'17px', fontWeight:700, margin:'0 0 8px', fontFamily:FONT }}>{p.titulo}</h3>
                <p style={{ fontSize:'14px', color:'#64748b', lineHeight:'1.6', margin:0 }}>{p.desc}</p>
                {i===1&&<div style={{ marginTop:'16px', display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'8px', padding:'6px 12px', fontSize:'12px', color:'#6ee7b7', fontWeight:600 }}>📱 Tu número · Sin SIM nueva</div>}
              </div>
            ))}
          </div>
        </section>

        {/* QR Highlight */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'0 24px 80px' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(14,165,233,0.08))', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px', padding:'48px', display:'flex', alignItems:'center', gap:'48px', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:'260px' }}>
              <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'2px', color:'#10b981', textTransform:'uppercase', marginBottom:'12px' }}>El diferencial clave</div>
              <h2 style={{ fontSize:'clamp(24px,3vw,36px)', fontWeight:700, letterSpacing:'-0.2px', fontFamily:FONT, marginBottom:'16px', lineHeight:'1.15' }}>
                Tu WhatsApp de siempre.<br /><span style={{ color:'#10b981' }}>Sin número nuevo.</span>
              </h2>
              <p style={{ fontSize:'16px', color:'#94a3b8', lineHeight:'1.65', marginBottom:'24px' }}>
                Otros te piden una SIM nueva o un número de empresa. Nosotros no. Escaneas un QR desde tu celular y en 30 segundos tu agente ya está respondiendo desde tu número personal.
              </p>
              {['Mismo número que tus clientes ya tienen guardado','Sin apps adicionales en tu celular','Desconectas cuando quieras con un clic'].map(t=>(
                <div key={t} style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'10px' }}>
                  <span style={{ color:'#10b981', fontWeight:700, flexShrink:0 }}>✓</span>
                  <span style={{ fontSize:'15px', color:'#cbd5e1' }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ flexShrink:0, textAlign:'center' }}>
              <div style={{ width:'150px', height:'150px', background:'#fff', borderRadius:'16px', padding:'12px', margin:'0 auto 12px', boxShadow:'0 0 40px rgba(16,185,129,0.2)', display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
                {Array.from({length:49}).map((_,i)=>{
                  const d=[0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,48]
                  return <div key={i} style={{ borderRadius:'1px', background:(d.includes(i)||(i%3===0&&i>13&&i<35)||(i%7===3))?'#000':'transparent' }} />
                })}
              </div>
              <p style={{ fontSize:'13px', color:'#10b981', fontWeight:600 }}>Escanea · Conecta · Listo</p>
              <p style={{ fontSize:'12px', color:'#475569', marginTop:'4px' }}>30 segundos de configuración</p>
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'1100px', margin:'0 auto', padding:'0 24px 80px' }}>
          <div style={{ textAlign:'center', marginBottom:'48px' }}>
            <p style={{ fontSize:'12px', fontWeight:700, letterSpacing:'2px', color:'#0ea5e9', textTransform:'uppercase', marginBottom:'12px' }}>Resultados reales</p>
            <h2 style={{ fontSize:'clamp(26px,3vw,40px)', fontWeight:700, letterSpacing:'-0.2px', fontFamily:FONT }}>Lo que dicen los asesores</h2>
          </div>
          <div className="grid3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px' }}>
            {TESTIMONIOS.map(t=>(
              <div key={t.nombre} className="card" style={{ padding:'24px' }}>
                <div style={{ fontSize:'24px', color:'#0ea5e9', marginBottom:'12px', fontWeight:900, lineHeight:1 }}>"</div>
                <p style={{ fontSize:'15px', color:'#cbd5e1', lineHeight:'1.65', margin:'0 0 20px', fontStyle:'italic' }}>{t.texto}</p>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, flexShrink:0 }}>{t.nombre[0]}</div>
                  <div>
                    <div style={{ fontSize:'14px', fontWeight:700 }}>{t.nombre}</div>
                    <div style={{ fontSize:'12px', color:'#475569' }}>{t.cargo}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section style={{ position:'relative', zIndex:1, maxWidth:'700px', margin:'0 auto', padding:'0 24px 100px', textAlign:'center' }}>
          <div style={{ background:'linear-gradient(135deg,rgba(14,165,233,0.08),rgba(16,185,129,0.08))', border:'1px solid rgba(14,165,233,0.15)', borderRadius:'20px', padding:'48px 32px' }}>
            <h2 style={{ fontSize:'clamp(26px,3vw,40px)', fontWeight:700, letterSpacing:'-0.2px', fontFamily:FONT, marginBottom:'16px', lineHeight:'1.2' }}>
              ¿Cuántos leads perdiste<br />esta semana por no responder?
            </h2>
            <p style={{ fontSize:'16px', color:'#94a3b8', marginBottom:'32px', lineHeight:'1.6' }}>
              Con Pulse Motor nunca más. Tu agente responde en 30 segundos, hace seguimiento y agenda citas — mientras tú estás con otro cliente.
            </p>
            <a href="/pulse/signup" style={{ display:'inline-block', padding:'16px 36px', borderRadius:'12px', background:'var(--grad)', color:'#fff', fontSize:'16px', fontWeight:700, textDecoration:'none', fontFamily:FONT, boxShadow:'0 4px 20px rgba(14,165,233,0.3)', letterSpacing:'-.2px' }}>
              Crear mi agente gratis →
            </a>
            <p style={{ fontSize:'13px', color:'#334155', marginTop:'16px' }}>14 días gratis · Sin tarjeta · Tu WhatsApp actual</p>
          </div>
        </section>

        <footer style={{ position:'relative', zIndex:1, padding:'28px 24px', textAlign:'center', fontSize:'13px', color:'#334155', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          © 2026 Pulse Motor · Hecho en Cali, Colombia 🇨🇴
        </footer>
      </div>
    </>
  )
}
