'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const ORANGE = '#FF6B2B'

const TESTIMONIOS = [
  { texto: 'El bot IA triplicó mis respuestas en WhatsApp. Ahora solo cierro, no presento.', nombre: 'Carlos M.', rol: 'Concesionario KIA · Bogotá' },
  { texto: 'En 48h tenía mi landing activa y el catálogo listo. Increíble.', nombre: 'Ana S.', rol: 'Inmobiliaria · Medellín' },
  { texto: 'El pipeline visual me cambió la vida. Sé exactamente en qué etapa está cada cliente.', nombre: 'Miguel R.', rol: 'Retail · Lima' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [testIdx] = useState(() => Math.floor(Math.random() * TESTIMONIOS.length))
  const testimonio = TESTIMONIOS[testIdx]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
    } else {
      // Entrando desde el dominio de Fenix, /dashboard no existe ahí (es
      // otro producto) -- el destino correcto es el panel de leads.
      const esFenix = window.location.hostname.includes('consultoresfenix.com')
      router.push(esFenix ? '/admin/fenix' : '/dashboard')
      router.refresh()
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    // Entrando desde el dominio de Fenix, Google debe devolver la sesión ahí
    // (son cookies de dominio raíz distinto) y el callback debe mandar al
    // panel de leads, no a /dashboard -- que es de otro producto.
    const esFenix = window.location.hostname.includes('consultoresfenix.com')
    const base = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/auth/callback'
      : esFenix
        ? 'https://app.consultoresfenix.com/auth/callback'
        : 'https://ventas10x.co/auth/callback'
    const redirectTo = esFenix ? `${base}?next=/admin/fenix` : base
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { access_type: 'offline', prompt: 'consent' } },
    })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Panel izquierdo */}
      <div className="auth-left" style={{ flex: 1.1, background: '#0b1120', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(255,107,43,.1)', pointerEvents: 'none' }} />

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', width: 'fit-content' }}>
          <svg width="34" height="34" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#fff', letterSpacing: '-.02em' }}>Ventas<span style={{ color: ORANGE }}>10x</span></span>
        </Link>

        <div>
          <h2 style={{ fontSize: 'clamp(26px, 3vw, 42px)', fontWeight: 800, color: '#f8fafc', lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '14px' }}>
            La plataforma que<br /><span style={{ color: ORANGE }}>multiplica tus ventas.</span>
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.7, maxWidth: '360px', marginBottom: '28px' }}>
            Landing personalizada, bot IA 24/7, catálogo digital y pipeline de ventas — todo en un lugar.
          </p>
          <div style={{ display: 'flex', gap: '28px' }}>
            {[{ n: '+200', l: 'Vendedores activos' }, { n: '48h', l: 'Setup completo' }, { n: '10x', l: 'Más cierres' }].map(s => (
              <div key={s.n}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: ORANGE }}>{s.n}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', marginTop: '2px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.05)', border: '0.5px solid rgba(255,255,255,.1)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ fontSize: '22px', color: ORANGE, fontWeight: 900, marginBottom: '8px' }}>"</div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)', lineHeight: 1.6, marginBottom: '14px' }}>{testimonio.texto}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{testimonio.nombre[0]}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{testimonio.nombre}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)' }}>{testimonio.rol}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho — dark form */}
      <div className="auth-right" style={{ width: '460px', flexShrink: 0, background: '#0f1c2e', borderLeft: '0.5px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px', letterSpacing: '-0.03em' }}>Bienvenido de vuelta</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', marginBottom: '28px' }}>Ingresa a tu cuenta para continuar</p>

          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoading} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,.07)', border: '0.5px solid rgba(255,255,255,.15)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#e2e8f0', marginBottom: '20px', opacity: googleLoading ? 0.6 : 1 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
            {googleLoading ? 'Conectando...' : 'Continuar con Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,.08)' }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.3)', fontWeight: 500 }}>o con email</span>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,.08)' }} />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '0.5px solid rgba(239,68,68,.3)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#fca5a5', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '7px' }}>Correo electrónico</label>
              <input type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.18)', background: '#1e293b', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#f1f5f9' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>Contraseña</label>
                <Link href="/auth/forgot" style={{ fontSize: '12px', color: ORANGE, fontWeight: 500, textDecoration: 'none' }}>¿Olvidaste tu contraseña?</Link>
              </div>
              <input type="password" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.18)', background: '#1e293b', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#f1f5f9' }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: '12px', background: loading ? 'rgba(255,255,255,.1)' : ORANGE, color: loading ? 'rgba(255,255,255,.4)' : '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 6px 20px rgba(255,107,43,.4)' }}>
              {loading ? 'Ingresando...' : 'Ingresar →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,.35)', marginTop: '24px' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" style={{ color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>Regístrate gratis</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-left { display: none !important; }
          .auth-right { width: 100% !important; }
        }
        input::placeholder { color: rgba(255,255,255,.25); }
        input:focus { border-color: rgba(255,107,43,.5) !important; }
      `}</style>
    </div>
  )
}
