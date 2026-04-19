'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  /*const handleGoogle = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://ventas10x.co/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    if (error) {
      setError('Error al conectar con Google')
      setGoogleLoading(false)
    } else if (data.url) {
      window.location.href = data.url
    }
  }*/

  const handleGoogle = async () => {
  setGoogleLoading(true)

  const supabase = createClient()

  const redirectTo =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/auth/callback'
      : 'https://ventas10x.co/auth/callback'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    console.error(error)
  }
}

  const s = {
    page: { minHeight:'100vh', background:'#f7f6f4', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, padding:'1rem', fontFamily:"'DM Sans',system-ui,sans-serif" },
    card: { background:'#fff', border:'.5px solid rgba(0,0,0,.08)', borderRadius:'16px', padding:'2rem', width:'100%', maxWidth:'420px' },
    logo: { display:'flex' as const, alignItems:'center' as const, gap:'10px', justifyContent:'center' as const, marginBottom:'2rem' },
    h2: { fontSize:'20px', fontWeight:700, textAlign:'center' as const, color:'#1a1a18', marginBottom:'.35rem' },
    sub: { fontSize:'13px', color:'#888780', textAlign:'center' as const, marginBottom:'1.75rem' },
    label: { display:'block', fontSize:'12px', fontWeight:600, color:'#4a4a47', marginBottom:'.4rem' },
    input: { width:'100%', padding:'10px 14px', borderRadius:'8px', border:'.5px solid rgba(0,0,0,.15)', fontSize:'14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const },
    field: { marginBottom:'1rem' },
    btnPrimary: { width:'100%', padding:'11px', borderRadius:'8px', background:'#185FA5', color:'#fff', fontSize:'14px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit' },
    btnGoogle: { width:'100%', padding:'10px 14px', borderRadius:'8px', background:'#fff', color:'#3c4043', fontSize:'14px', fontWeight:500, border:'.5px solid rgba(0,0,0,.2)', cursor:'pointer', fontFamily:'inherit', display:'flex' as const, alignItems:'center' as const, justifyContent:'center' as const, gap:'10px' },
    divider: { display:'flex' as const, alignItems:'center' as const, gap:'8px', margin:'1rem 0', color:'#888780', fontSize:'11px' },
    line: { flex:1, borderTop:'.5px solid rgba(0,0,0,.08)' },
    errBox: { background:'#FCEBEB', color:'#A32D2D', border:'.5px solid #F09595', borderRadius:'8px', padding:'.75rem 1rem', fontSize:'13px', marginBottom:'.875rem' },
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
            <rect width="52" height="52" rx="13" fill="#FF6B2B"/>
            <rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/>
            <rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/>
            <rect x="28" y="16" width="7" height="28" rx="2" fill="white"/>
            <circle cx="41" cy="11" r="5" fill="rgba(255,255,255,0.2)"/>
            <path d="M38.5 13.5L43.5 8.5M43.5 8.5H40M43.5 8.5V12" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontWeight:800, fontSize:'20px', letterSpacing:'-.02em', color:'#1a1a18' }}>
            Ventas<span style={{ color:'#FF6B2B' }}>10x</span>
          </span>
        </div>

        <h2 style={s.h2}>Bienvenido de vuelta</h2>
        <p style={s.sub}>Ingresa a tu cuenta para continuar</p>

        {error && <div style={s.errBox}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={s.field}>
            <label style={s.label}>Correo electrónico</label>
            <input type="email" placeholder="tu@correo.com" value={email}
              onChange={e => setEmail(e.target.value)} required style={s.input}/>
          </div>
          <div style={s.field}>
            <label style={s.label}>Contraseña</label>
            <input type="password" placeholder="Tu contraseña" value={password}
              onChange={e => setPassword(e.target.value)} required style={s.input}/>
          </div>
          <div style={{ textAlign:'right', marginBottom:'1rem' }}>
            <Link href="/auth/forgot" style={{ fontSize:'12px', color:'#185FA5', fontWeight:500 }}>¿Olvidaste tu contraseña?</Link>
          </div>
          <button type="submit" disabled={loading} style={{ ...s.btnPrimary, opacity: loading ? .5 : 1 }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div style={s.divider}>
          <div style={s.line}/>o<div style={s.line}/>
        </div>

        <button onClick={handleGoogle} disabled={googleLoading}
          style={{ ...s.btnGoogle, opacity: googleLoading ? .7 : 1 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <p style={{ textAlign:'center', fontSize:'13px', color:'#888780', marginTop:'1rem' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/auth/register" style={{ color:'#185FA5', fontWeight:500 }}>Regístrate gratis</Link>
        </p>
      </div>
    </div>
  )
}
