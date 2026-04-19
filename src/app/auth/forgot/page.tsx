'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://ventas10x.co/auth/callback'
    })
    setSent(true)
    setLoading(false)
  }

  const st = {
    page: { minHeight:'100vh' as const, background:'#f7f6f4', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, padding:'1rem', fontFamily:"system-ui,sans-serif" },
    card: { background:'#fff', border:'.5px solid rgba(0,0,0,.08)', borderRadius:'16px', padding:'2rem', width:'100%', maxWidth:'420px' },
    logo: { display:'flex' as const, alignItems:'center' as const, gap:'10px', justifyContent:'center' as const, marginBottom:'2rem' },
    h2: { fontSize:'20px', fontWeight:700 as const, textAlign:'center' as const, marginBottom:'.35rem' },
    sub: { fontSize:'13px', color:'#888780', textAlign:'center' as const, marginBottom:'1.75rem' },
    label: { display:'block' as const, fontSize:'12px', fontWeight:600 as const, color:'#4a4a47', marginBottom:'.4rem' },
    input: { width:'100%', padding:'10px 14px', borderRadius:'8px', border:'.5px solid rgba(0,0,0,.15)', fontSize:'14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const },
    btn: { width:'100%', padding:'11px', borderRadius:'8px', background:'#185FA5', color:'#fff', fontSize:'14px', fontWeight:600 as const, border:'none', cursor:'pointer' as const, fontFamily:'inherit' },
  }

  return (
    <div style={st.page}>
      <div style={st.card}>
        <div style={st.logo}>
          <svg width="36" height="36" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
          <span style={{ fontWeight:800, fontSize:'20px' }}>Ventas<span style={{ color:'#FF6B2B' }}>10x</span></span>
        </div>
        {sent ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'48px', marginBottom:'1rem' }}>📧</div>
            <h2 style={st.h2}>Revisa tu correo</h2>
            <p style={{ fontSize:'13px', color:'#888780', marginBottom:'1.5rem' }}>Te enviamos un enlace para restablecer tu contraseña.</p>
            <Link href="/auth/login" style={{ color:'#185FA5', fontSize:'13px', fontWeight:500 }}>← Volver al login</Link>
          </div>
        ) : (
          <>
            <h2 style={st.h2}>Recuperar contraseña</h2>
            <p style={st.sub}>Te enviaremos un enlace a tu correo</p>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:'1rem' }}>
                <label style={st.label}>Correo electrónico</label>
                <input type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} required style={st.input}/>
              </div>
              <button type="submit" disabled={loading} style={{ ...st.btn, opacity: loading ? .5 : 1 }}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>
            <p style={{ textAlign:'center', fontSize:'13px', color:'#888780', marginTop:'1rem' }}>
              <Link href="/auth/login" style={{ color:'#185FA5', fontWeight:500 }}>← Volver al login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
