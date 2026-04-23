'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const asesores = [
  { nombre: 'Carlos Mendoza', emoji: '👨‍💼' },
  { nombre: 'Sofía Restrepo', emoji: '👩‍💼' },
  { nombre: 'Andrés Torres', emoji: '🧑‍💼' },
  { nombre: 'Tu nombre', emoji: '⭐' },
]

const conversation = [
  { who: 'cliente', msg: 'Hola, ¿tienen el Kia EV6 2027 disponible?' },
  { who: 'bot', msg: '¡Hola! Sí, el Kia EV6 2027 está disponible 🎉 Para ayudarte mejor — ¿el vehículo es para uso personal, familiar o empresarial?' },
  { who: 'cliente', msg: 'Personal, para mí.' },
  { who: 'bot', msg: 'Perfecto. ¿Tienes pensado comprarlo de contado o te interesa explorar opciones de financiación?' },
  { who: 'cliente', msg: 'Me interesa con financiación.' },
  { who: 'bot', msg: '¡Perfecto! Trabajamos con las principales entidades financieras del país. ¿Tienes algún vehículo actual que quisieras dar en retoma como parte de pago?' },
  { who: 'cliente', msg: 'Sí, tengo un Mazda 3 2020.' },
  { who: 'bot', msg: '¡Muy bien! El Mazda 3 2020 tiene buen valor comercial. ¿Cuántos kilómetros tiene aproximadamente y está al día en mantenimientos?' },
  { who: 'cliente', msg: 'Unos 45,000 km, sí está al día.' },
  { who: 'bot', msg: 'Excelente estado 👌 ¿Para cuándo estás pensando hacer el cambio — este mes, en 1-3 meses, o solo estás cotizando?' },
  { who: 'cliente', msg: 'Este mes si me convence el precio.' },
  { who: 'bot', msg: '¡Perfecto, estás listo para avanzar! Un asesor especializado te contactará en menos de 10 minutos con la valoración de tu retoma y las opciones de financiación del EV6 2027. ¿A qué número te llamamos? 📲' },
]

export default function BotIASection() {
  const [visible, setVisible] = useState<number[]>([])
  const [activeAsesor, setActiveAsesor] = useState(0)
  const [loopCount, setLoopCount] = useState(0)

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = []
    const run = () => {
      setVisible([])
      conversation.forEach((_, i) => {
        timers.push(setTimeout(() => setVisible(v => [...v, i]), 800 + i * 2400))
      })
    }
    run()
    const totalDuration = 800 + conversation.length * 2400 + 5000
    const loop = setInterval(() => {
      timers.forEach(clearTimeout)
      timers = []
      setLoopCount(c => c + 1)
      run()
    }, totalDuration)
    return () => { timers.forEach(clearTimeout); clearInterval(loop) }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveAsesor(a => (a + 1) % asesores.length), 3500)
    return () => clearInterval(t)
  }, [])

  const asesor = asesores[activeAsesor]
  const esTuNombre = asesor.nombre === 'Tu nombre'
  const displayMessages = conversation.filter((_, i) => visible.includes(i)).slice(-5)
  const displayIndexes = displayMessages.map(m => conversation.indexOf(m))

  return (
    <div id="bot-ia" style={{
      background: 'linear-gradient(135deg, #122238 0%, #0f1c2e 60%, #1a0d06 100%)',
      borderTop: '1px solid rgba(255,255,255,.06)',
      borderBottom: '1px solid rgba(255,255,255,.06)',
    }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'6rem 2rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem', alignItems:'center' }}>

        {/* TEXTO */}
        <div>
          <div style={{ fontSize:'12px', fontWeight:700, letterSpacing:'.12em', color:'#FF6B2B', marginBottom:'1rem', textTransform:'uppercase', fontFamily:'var(--font-jakarta,system-ui)' }}>Bot IA</div>
          <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:800, letterSpacing:'-.03em', marginBottom:'1.5rem', lineHeight:1.1, fontFamily:'var(--font-jakarta,system-ui)', color:'#fff' }}>
            Tu vendedor más productivo trabaja 24/7
          </h2>
          <p style={{ fontSize:'16px', color:'rgba(255,255,255,.55)', lineHeight:1.8, marginBottom:'2rem', fontFamily:'var(--font-jakarta,system-ui)', fontWeight:400 }}>
            El bot IA perfila cada lead automáticamente — detecta intención, califica financiación, gestiona retomas y entrega al asesor un prospecto listo para cerrar.
          </p>

          {/* Variables */}
          <div style={{ marginBottom:'2rem', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'16px', padding:'1.25rem' }}>
            <div style={{ fontSize:'11px', fontWeight:700, letterSpacing:'.1em', color:'rgba(255,255,255,.35)', marginBottom:'1rem', textTransform:'uppercase', fontFamily:'var(--font-jakarta,system-ui)' }}>Variables que captura el bot</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
              {[
                { icon:'👤', label:'¿Para quién es?' },
                { icon:'💳', label:'Financiación' },
                { icon:'🔄', label:'Retoma de vehículo' },
                { icon:'📅', label:'Tiempo de decisión' },
                { icon:'📍', label:'Ciudad / zona' },
                { icon:'💰', label:'Presupuesto disponible' },
                { icon:'⚡', label:'Uso (personal/empresa)' },
                { icon:'🎯', label:'Intención de compra' },
              ].map(v => (
                <div key={v.label} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'14px' }}>{v.icon}</span>
                  <span style={{ fontSize:'13px', color:'rgba(255,255,255,.6)', fontFamily:'var(--font-jakarta,system-ui)', fontWeight:500 }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chips asesores */}
          <div style={{ marginBottom:'2.5rem' }}>
            <div style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,.3)', marginBottom:'.75rem', letterSpacing:'.08em', textTransform:'uppercase', fontFamily:'var(--font-jakarta,system-ui)' }}>Usado por asesores como</div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {asesores.map((a, i) => (
                <div key={a.nombre} onClick={() => setActiveAsesor(i)} style={{
                  display:'flex', alignItems:'center', gap:'6px',
                  padding:'7px 16px', borderRadius:'20px', cursor:'pointer',
                  fontSize:'13px', fontWeight:600, fontFamily:'var(--font-jakarta,system-ui)',
                  transition:'all 0.3s ease',
                  background: activeAsesor === i ? (a.nombre === 'Tu nombre' ? 'rgba(255,107,43,.2)' : 'rgba(255,255,255,.1)') : 'rgba(255,255,255,.04)',
                  border: activeAsesor === i ? (a.nombre === 'Tu nombre' ? '1px solid rgba(255,107,43,.45)' : '1px solid rgba(255,255,255,.18)') : '1px solid rgba(255,255,255,.07)',
                  color: activeAsesor === i ? (a.nombre === 'Tu nombre' ? '#FF8C42' : '#fff') : 'rgba(255,255,255,.4)',
                  transform: activeAsesor === i ? 'scale(1.04)' : 'scale(1)',
                }}>
                  <span>{a.emoji}</span><span>{a.nombre}</span>
                </div>
              ))}
            </div>
          </div>

          <Link href="/auth/register" style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            background:'#FF6B2B', color:'#fff', padding:'14px 28px',
            borderRadius:'12px', fontSize:'15px', fontWeight:700,
            fontFamily:'var(--font-jakarta,system-ui)', textDecoration:'none', letterSpacing:'-.01em',
          }}>
            🤖 Crear tu bot gratis →
          </Link>
        </div>

        {/* CHAT — fondo blanco */}
        <div style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'24px', padding:'0', boxShadow:'0 20px 60px rgba(0,0,0,.35)', minHeight:'420px', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', background:'#f9fafb', borderBottom:'1px solid #f0f0f0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'50%', background: esTuNombre ? 'linear-gradient(135deg,#FF6B2B,#ff9a5c)' : 'linear-gradient(135deg,#1e3a5f,#2d5986)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', transition:'background 0.4s ease', flexShrink:0 }}>
                {asesor.emoji}
              </div>
              <div>
                <div style={{ fontSize:'13px', fontWeight:700, color: esTuNombre ? '#FF6B2B' : '#111', fontFamily:'var(--font-jakarta,system-ui)', transition:'color 0.4s ease', letterSpacing:'-.01em' }}>
                  Bot IA · {asesor.nombre}
                </div>
                <div style={{ fontSize:'11px', color:'#16a34a', display:'flex', alignItems:'center', gap:'4px', fontFamily:'var(--font-jakarta,system-ui)', fontWeight:500 }}>
                  <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#16a34a', display:'inline-block' }} />
                  Perfilando lead...
                </div>
              </div>
            </div>
            <div style={{ fontSize:'11px', color:'#9ca3af', background:'#f3f4f6', padding:'4px 10px', borderRadius:'10px', fontFamily:'var(--font-jakarta,system-ui)', fontWeight:600 }}>
              {Math.min(visible.length, conversation.length)}/{conversation.length} pasos
            </div>
          </div>

          {/* Mensajes */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', padding:'1.25rem', flex:1, overflowY:'hidden' }}>
            {displayIndexes.map((origIdx) => {
              const m = conversation[origIdx]
              const isBot = m.who === 'bot'
              return (
                <div key={`${loopCount}-${origIdx}`} style={{ display:'flex', justifyContent: isBot ? 'flex-start' : 'flex-end', animation:'slideIn 0.5s ease' }}>
                  <div style={{ maxWidth:'84%', background: isBot ? '#FF6B2B' : '#f3f4f6', borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px', padding:'10px 14px', boxShadow: isBot ? '0 2px 8px rgba(255,107,43,.25)' : '0 1px 3px rgba(0,0,0,.06)' }}>
                    {isBot && (
                      <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'.07em', marginBottom:'4px', color:'rgba(255,255,255,.7)', fontFamily:'var(--font-jakarta,system-ui)', textTransform:'uppercase' }}>
                        {asesor.nombre}
                      </div>
                    )}
                    <div style={{ fontSize:'13px', color: isBot ? '#fff' : '#1f2937', lineHeight:1.6, fontFamily:'var(--font-jakarta,system-ui)', fontWeight: isBot ? 500 : 400 }}>
                      {m.msg}
                    </div>
                  </div>
                </div>
              )
            })}

            {visible.length > 0 && visible.length < conversation.length && (
              <div style={{ display:'flex', justifyContent:'flex-start' }}>
                <div style={{ background:'#f3f4f6', borderRadius:'4px 16px 16px 16px', padding:'12px 16px', display:'flex', gap:'5px', alignItems:'center', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
                  {[0,1,2].map(d => (
                    <span key={d} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#9ca3af', display:'inline-block', animation:`bounce 1.2s ease ${d * 0.25}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-6px); } }
      `}</style>
    </div>
  )
}
