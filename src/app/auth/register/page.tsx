'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true); setError('')
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: nombre } }
    })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      console.log('[register] signUp OK, user.id:', data.user?.id)
      // Esperar el envío del email ANTES de redirigir
      try {
        const res = await fetch('/api/welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, email, userId: data.user?.id }),
        })
        const json = await res.json()
        console.log('[welcome-email] status:', res.status, 'response:', json)
      } catch (err) {
        console.error('[welcome-email] error:', err)
      }
      // Si vino con invite, auto-aceptar y redirigir al dashboard
      if (inviteToken) {
        try {
          await fetch('/api/team/accept-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken }),
          })
          router.push('/dashboard?bienvenida=team')
          router.refresh()
          return
        } catch (e) {
          console.error('[register] auto-accept invite error:', e)
        }
      }
      router.push('/onboarding')
      router.refresh()
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` }
    })
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f7f6f4', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ background:'#fff', border:'.5px solid rgba(0,0,0,.08)', borderRadius:'16px', padding:'2rem', width:'100%', maxWidth:'420px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', justifyContent:'center', marginBottom:'2rem' }}>
          <svg width="36" height="36" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
          <span style={{ fontWeight:800, fontSize:'20px', letterSpacing:'-.02em' }}>Ventas<span style={{ color:'#FF6B2B' }}>10x</span></span>
        </div>
        <h2 style={{ fontSize:'20px', fontWeight:700, textAlign:'center', marginBottom:'.35rem' }}>Crea tu cuenta gratis</h2>
        <p style={{ fontSize:'13px', color:'#888780', textAlign:'center', marginBottom:'1.75rem' }}>14 días de prueba · Sin tarjeta de crédito</p>
        {error && <div style={{ background:'#FCEBEB', color:'#A32D2D', border:'.5px solid #F09595', borderRadius:'8px', padding:'.75rem 1rem', fontSize:'13px', marginBottom:'.875rem' }}>{error}</div>}
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#4a4a47', marginBottom:'.4rem' }}>Tu nombre</label>
            <input type="text" placeholder="Juan García" value={nombre} onChange={e => setNombre(e.target.value)} required
              style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'.5px solid rgba(0,0,0,.15)', fontSize:'14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}/>
          </div>
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#4a4a47', marginBottom:'.4rem' }}>Correo electrónico</label>
            <input type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'.5px solid rgba(0,0,0,.15)', fontSize:'14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}/>
          </div>
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ display:'block', fontSize:'12px', fontWeight:600, color:'#4a4a47', marginBottom:'.4rem' }}>Contraseña</label>
            <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'.5px solid rgba(0,0,0,.15)', fontSize:'14px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}/>
          </div>
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'11px', borderRadius:'8px', background:'#FF6B2B', color:'#fff', fontSize:'14px', fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit', opacity: loading ? .5 : 1 }}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
          </button>
        </form>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'1rem 0', color:'#888780', fontSize:'11px' }}>
          <div style={{ flex:1, borderTop:'.5px solid rgba(0,0,0,.08)' }}/>o<div style={{ flex:1, borderTop:'.5px solid rgba(0,0,0,.08)' }}/>
        </div>
        <button onClick={handleGoogle}
          style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', background:'#fff', color:'#3c4043', fontSize:'14px', fontWeight:500, border:'.5px solid rgba(0,0,0,.2)', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Registrarse con Google
        </button>
        <p style={{ textAlign:'center', fontSize:'13px', color:'#888780', marginTop:'1rem' }}>
          ¿Ya tienes cuenta? <Link href="/auth/login" style={{ color:'#185FA5', fontWeight:500 }}>Ingresar</Link>
        </p>
      </div>
    </div>
  )
}