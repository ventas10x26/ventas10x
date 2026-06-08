'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const FONT      = "'Syne', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"

function PagoExitosoContent() {
  const params  = useSearchParams()
  const orderId = params.get('order_id') ?? params.get('bold_order_id') ?? ''

  return (
    <>
      {orderId && (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'12px 16px', marginBottom:'28px', fontSize:'12px', color:'#475569' }}>
          Referencia: <span style={{ color:'#94a3b8', fontWeight:600 }}>{orderId}</span>
        </div>
      )}
    </>
  )
}

export default function PagoExitoso() {
  useEffect(() => {}, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#080f1a; }
        @keyframes successPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .pop  { animation: successPop .5s cubic-bezier(.22,.68,0,1.2) forwards; }
        .fade { opacity:0; animation: fadeUp .5s ease forwards; }
      `}</style>
      <div style={{ minHeight:'100vh', background:'#080f1a', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FONT_BODY, padding:'24px' }}>
        <div style={{ maxWidth:'440px', width:'100%', textAlign:'center' }}>

          <div className="pop" style={{ width:'80px', height:'80px', borderRadius:'50%', background:'rgba(16,185,129,0.15)', border:'2px solid #10b981', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px', margin:'0 auto 28px' }}>
            ✓
          </div>

          <h1 className="fade" style={{ fontFamily:FONT, fontSize:'32px', fontWeight:800, color:'#f8fafc', marginBottom:'12px', animationDelay:'.15s' }}>
            ¡Pago confirmado!
          </h1>
          <p className="fade" style={{ fontSize:'16px', color:'#64748b', lineHeight:1.6, marginBottom:'32px', animationDelay:'.25s' }}>
            Tu agente Pulse Motor está activo. En menos de 5 minutos te llega la confirmación por email.
          </p>

          <Suspense fallback={null}>
            <PagoExitosoContent />
          </Suspense>

          <div className="fade" style={{ display:'flex', flexDirection:'column', gap:'12px', animationDelay:'.35s' }}>
            <a href="/pulse/agente" style={{ display:'block', padding:'14px', borderRadius:'12px', background:'linear-gradient(135deg,#0ea5e9,#10b981)', color:'#fff', fontSize:'15px', fontWeight:700, textDecoration:'none', fontFamily:FONT, boxShadow:'0 4px 20px rgba(14,165,233,0.3)' }}>
              Ir a mi panel →
            </a>
            <a href="/pulse" style={{ display:'block', padding:'12px', borderRadius:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#94a3b8', fontSize:'14px', textDecoration:'none' }}>
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
