'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FONT      = "var(--font-inter), sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const BOLD_LINK = 'https://checkout.bold.co/payment/LNK_PGTSIHASWV'

export default function PulsePricingPage() {
  const [usuarioEmail, setUsuarioEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsuarioEmail(data.user?.email ?? null)
    })
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080f1a; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        .fade-up { animation: fadeUp .6s ease forwards; }
        .check-item { display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
        .check-item:last-child { border-bottom:none; }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(16,185,129,0.2)} 50%{box-shadow:0 0 40px rgba(16,185,129,0.4)} }
        .btn-pagar { transition: all .2s !important; }
        .btn-pagar:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 32px rgba(16,185,129,0.5) !important; }
        @media(max-width:700px){ .pricing-grid{grid-template-columns:1fr!important} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#080f1a', color:'#fff', fontFamily:FONT_BODY, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
          <div style={{ position:'absolute', top:'-10%', left:'50%', transform:'translateX(-50%)', width:'600px', height:'600px', background:'radial-gradient(circle,rgba(14,165,233,0.07) 0%,transparent 70%)', borderRadius:'50%' }} />
          <div style={{ position:'absolute', bottom:'10%', right:'-5%', width:'300px', height:'300px', background:'radial-gradient(circle,rgba(16,185,129,0.06) 0%,transparent 70%)', borderRadius:'50%' }} />
        </div>

        <header style={{ position:'relative', zIndex:10, padding:'20px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', maxWidth:'1100px', margin:'0 auto', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <a href="/pulse" style={{ display:'flex', alignItems:'center', gap:'10px', textDecoration:'none' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'linear-gradient(135deg,#0ea5e9,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>⚡</div>
            <span style={{ fontSize:'18px', fontWeight:700, fontFamily:FONT, color:'#fff', letterSpacing:'-.3px' }}>Pulse Motor</span>
          </a>
          {usuarioEmail && <span style={{ fontSize:'13px', color:'#475569' }}>{usuarioEmail}</span>}
        </header>

        <main style={{ position:'relative', zIndex:1, maxWidth:'960px', margin:'0 auto', padding:'60px 24px 80px' }}>

          <div style={{ textAlign:'center', marginBottom:'48px' }} className="fade-up">
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'999px', padding:'5px 16px', fontSize:'12px', fontWeight:600, color:'#6ee7b7', marginBottom:'20px' }}>
              🎉 14 días gratis ya terminaron — seguí vendiendo
            </div>
            <h1 style={{ fontFamily:FONT, fontSize:'clamp(28px,4vw,48px)', fontWeight:700, lineHeight:1.1, letterSpacing:'-.5px', marginBottom:'14px' }}>
              Activá tu agente por{' '}
              <span style={{ background:'linear-gradient(135deg,#0ea5e9,#10b981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>$99.000/mes</span>
            </h1>
            <p style={{ fontFamily:FONT_BODY, fontSize:'16px', color:'#64748b', maxWidth:'460px', margin:'0 auto', lineHeight:1.6 }}>
              Sin contratos. Cancelás cuando querás. Seguís usando tu WhatsApp de siempre.
            </p>
          </div>

          <div className="pricing-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px', alignItems:'start' }}>

            {/* Columna izquierda: features */}
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'32px', animation:'glowPulse 3s ease-in-out infinite' }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'6px' }}>
                <span style={{ fontFamily:FONT_BODY, fontSize:'42px', fontWeight:800, color:'#fff', lineHeight:1 }}>$99.000</span>
                <span style={{ fontFamily:FONT_BODY, fontSize:'14px', color:'#475569', fontWeight:500 }}>/mes</span>
              </div>
              <p style={{ fontFamily:FONT_BODY, fontSize:'13px', color:'#334155', marginBottom:'28px' }}>COP · IVA incluido · Pago mensual</p>
              <div style={{ marginBottom:'28px' }}>
                {[
                  { icon:'⚡', text:'Respuestas automáticas en menos de 30 segundos' },
                  { icon:'🔁', text:'Follow-up día 1, 3 y 7 sin intervención tuya' },
                  { icon:'📱', text:'Tu WhatsApp actual, sin SIM nueva' },
                  { icon:'📅', text:'Agendamiento de test drives automático' },
                  { icon:'🎯', text:'Agente entrenado con tu estilo de venta' },
                  { icon:'📊', text:'Panel con pipeline de leads y estadísticas' },
                  { icon:'🧠', text:'El agente aprende y mejora con el tiempo' },
                  { icon:'💬', text:'Soporte directo por WhatsApp con el equipo' },
                ].map(item => (
                  <div key={item.icon} className="check-item">
                    <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>{item.icon}</div>
                    <span style={{ fontFamily:FONT_BODY, fontSize:'14px', color:'#94a3b8', lineHeight:'1.5' }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:'12px', padding:'16px' }}>
                <p style={{ fontFamily:FONT_BODY, fontSize:'13px', color:'#6ee7b7', fontWeight:600, marginBottom:'6px' }}>🔒 Sin riesgo</p>
                <p style={{ fontFamily:FONT_BODY, fontSize:'12px', color:'#475569', lineHeight:1.6 }}>Si en los primeros 7 días no ves resultados, te devolvemos el dinero. Sin preguntas.</p>
              </div>
            </div>

            {/* Columna derecha: checkout */}
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

              {/* Resumen */}
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px', padding:'20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', paddingBottom:'12px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontFamily:FONT_BODY, fontSize:'14px', color:'#94a3b8' }}>Pulse Motor — Plan Mensual</span>
                  <span style={{ fontFamily:FONT_BODY, fontSize:'14px', fontWeight:600 }}>$99.000</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', paddingBottom:'12px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontFamily:FONT_BODY, fontSize:'13px', color:'#475569' }}>IVA (19%)</span>
                  <span style={{ fontFamily:FONT_BODY, fontSize:'13px', color:'#475569' }}>incluido</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontFamily:FONT, fontSize:'15px', fontWeight:700 }}>Total hoy</span>
                  <span style={{ fontFamily:FONT_BODY, fontSize:'20px', fontWeight:800, color:'#10b981' }}>$99.000 COP</span>
                </div>
              </div>

              {/* Botón de pago — link directo Bold */}
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <p style={{ fontFamily:FONT_BODY, fontSize:'12px', color:'#475569', textAlign:'center' }}>
                  Pagá con tarjeta, PSE o Nequi
                </p>
                <a
                  href={BOLD_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pagar"
                  style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                    padding:'16px 24px', borderRadius:'12px',
                    background:'linear-gradient(135deg,#10b981,#059669)',
                    color:'#fff', fontSize:'16px', fontWeight:700,
                    textDecoration:'none', fontFamily:FONT,
                    boxShadow:'0 4px 20px rgba(16,185,129,0.4)',
                    letterSpacing:'-.2px',
                  }}
                >
                  {/* Logo Bold inline */}
                  <svg height="20" viewBox="0 0 52 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h8.4c4.6 0 7.2 2.1 7.2 5.5 0 2-.9 3.4-2.4 4.2 2 .7 3.2 2.3 3.2 4.5C16.4 17.8 13.6 20 9 20H0V0zm8 8.3c1.8 0 2.8-.8 2.8-2.3S9.8 3.7 8 3.7H4.4v4.6H8zm.4 8c2 0 3.1-.9 3.1-2.5s-1.1-2.5-3.1-2.5H4.4v5H8.4z" fill="white"/>
                    <path d="M19 0h4.4v20H19V0z" fill="white"/>
                    <path d="M26.2 10C26.2 4.5 30 0 36 0s9.8 4.5 9.8 10-3.8 10-9.8 10-9.8-4.5-9.8-10zm15.1 0c0-3.4-2.1-5.9-5.3-5.9S30.7 6.6 30.7 10s2.1 5.9 5.3 5.9 5.3-2.5 5.3-5.9z" fill="white"/>
                    <path d="M48 0h4.4v16.3H62V20H48V0z" fill="white"/>
                  </svg>
                  Pagar con Bold →
                </a>

                {/* Métodos de pago */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', flexWrap:'wrap' }}>
                  {['VISA', 'Mastercard', 'PSE', 'Nequi'].map(m => (
                    <div key={m} style={{ padding:'4px 10px', borderRadius:'6px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', fontFamily:FONT_BODY, fontSize:'11px', color:'#475569', fontWeight:600 }}>{m}</div>
                  ))}
                </div>
              </div>

              {/* Garantías */}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {[
                  { icon:'🔐', text:'Pago 100% seguro procesado por Bold' },
                  { icon:'📅', text:'Cancelás en cualquier momento desde tu panel' },
                  { icon:'↩️', text:'Garantía de devolución los primeros 7 días' },
                ].map(item => (
                  <div key={item.icon} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontSize:'14px' }}>{item.icon}</span>
                    <span style={{ fontFamily:FONT_BODY, fontSize:'12px', color:'#475569' }}>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* FAQ */}
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'12px', padding:'16px' }}>
                <p style={{ fontFamily:FONT_BODY, fontSize:'12px', fontWeight:700, color:'#94a3b8', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'1px' }}>Preguntas frecuentes</p>
                {[
                  { q:'¿Puedo cancelar cuando quiero?', a:'Sí. Desde tu panel, en cualquier momento, sin penalidades.' },
                  { q:'¿Necesito instalar algo?',       a:'No. Solo escanear un QR con tu WhatsApp actual.' },
                  { q:'¿El cliente sabe que es IA?',    a:'No necesariamente. El agente habla como vos, con tu estilo.' },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom:i<2?'10px':0 }}>
                    <p style={{ fontFamily:FONT_BODY, fontSize:'12px', fontWeight:600, color:'#e2e8f0', marginBottom:'2px' }}>{item.q}</p>
                    <p style={{ fontFamily:FONT_BODY, fontSize:'12px', color:'#475569', lineHeight:1.5 }}>{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social proof */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'32px', marginTop:'48px', flexWrap:'wrap' }}>
            {[
              { val:'< 30 seg', label:'Tiempo de respuesta' },
              { val:'+500',     label:'Leads atendidos' },
              { val:'89%',      label:'Tasa de respuesta' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:FONT, fontSize:'24px', fontWeight:800, background:'linear-gradient(135deg,#0ea5e9,#10b981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{s.val}</div>
                <div style={{ fontFamily:FONT_BODY, fontSize:'12px', color:'#475569', marginTop:'2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  )
}
