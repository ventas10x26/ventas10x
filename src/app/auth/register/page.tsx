'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const ORANGE = '#FF6B2B'

const FEATURES = [
  { emoji: '🌐', titulo: 'Landing personalizada', desc: 'Tu página de ventas lista en minutos' },
  { emoji: '🤖', titulo: 'Bot IA 24/7', desc: 'Responde prospectos mientras duermes' },
  { emoji: '📦', titulo: 'Catálogo inteligente', desc: 'La IA describe tus productos por ti' },
  { emoji: '📊', titulo: 'Pipeline de ventas', desc: 'Gestiona cada lead hasta el cierre' },
]

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '14px' }}>Cargando...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
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
      try {
        await fetch('/api/welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, email, userId: data.user?.id }),
        })
      } catch {}
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
        } catch {}
      }
      router.push('/onboarding')
      router.refresh()
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` }
    })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Panel izquierdo */}
      <div className="auth-left" style={{ flex: 1.1, background: '#0b1120', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '-80px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,107,43,.08)', pointerEvents: 'none' }} />

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', width: 'fit-content' }}>
          <svg width="34" height="34" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#fff', letterSpacing: '-.02em' }}>Ventas<span style={{ color: ORANGE }}>10x</span></span>
        </Link>

        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,107,43,.15)', border: '0.5px solid rgba(255,107,43,.3)', borderRadius: '20px', padding: '5px 14px', marginBottom: '16px', fontSize: '12px', color: '#FF8C42', fontWeight: 600 }}>
            ⚡ 14 días gratis · Sin tarjeta
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 38px)', fontWeight: 800, color: '#f8fafc', lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '12px' }}>
            Todo lo que necesitas<br /><span style={{ color: ORANGE }}>para vender más.</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: '24px' }}>
            Configúrate en 48 horas. Sin diseño ni código.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FEATURES.map(f => (
              <div key={f.titulo} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,.07)', border: '0.5px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{f.emoji}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{f.titulo}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex' }}>
            {['C', 'A', 'M', 'R'].map((l, i) => (
              <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', background: ORANGE, border: '2px solid #0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', marginLeft: i > 0 ? '-8px' : 0 }}>{l}</div>
            ))}
          </div>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)' }}>
            <span style={{ color: '#f1f5f9', fontWeight: 600 }}>+200 vendedores</span> ya usan Ventas10x
          </span>
        </div>
      </div>

      {/* Panel derecho — dark form */}
      <div className="auth-right" style={{ width: '460px', flexShrink: 0, background: '#0f1c2e', borderLeft: '0.5px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px', letterSpacing: '-0.03em' }}>Crea tu cuenta gratis</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', marginBottom: '24px' }}>14 días de prueba · Sin tarjeta de crédito</p>

          <button onClick={handleGoogle} disabled={googleLoading} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,.07)', border: '0.5px solid rgba(255,255,255,.15)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#e2e8f0', marginBottom: '18px', opacity: googleLoading ? 0.6 : 1 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
            {googleLoading ? 'Conectando...' : 'Registrarse con Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,.08)' }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.3)', fontWeight: 500 }}>o con email</span>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,.08)' }} />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '0.5px solid rgba(239,68,68,.3)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#fca5a5', marginBottom: '16px' }}>{error}</div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { key: 'nombre', label: 'Tu nombre', placeholder: 'Juan García', type: 'text', val: nombre, set: setNombre },
              { key: 'email', label: 'Correo electrónico', placeholder: 'tu@correo.com', type: 'email', val: email, set: setEmail },
              { key: 'password', label: 'Contraseña', placeholder: 'Mínimo 6 caracteres', type: 'password', val: password, set: setPassword },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '7px' }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={f.val} onChange={e => f.set(e.target.value)} required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.18)', background: '#1e293b', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#f1f5f9' }} />
              </div>
            ))}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: '12px', background: loading ? 'rgba(255,255,255,.1)' : ORANGE, color: loading ? 'rgba(255,255,255,.4)' : '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: loading ? 'none' : '0 6px 20px rgba(255,107,43,.4)' }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,.35)', marginTop: '20px' }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" style={{ color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>Ingresar</Link>
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
