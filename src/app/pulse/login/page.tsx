// Ruta destino: src/app/pulse/login/page.tsx
//
// Página de login propia de Pulse Motor.
// Usa el mismo Supabase Auth que Ventas10x pero en dominio pulsemotor.co.
// FIX: agrega botón "Continuar con Google" con redirectTo a pulsemotor.co

'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PulseLoginPage() {
  return (
    <Suspense fallback={null}>
      <PulseLoginForm />
    </Suspense>
  )
}

function PulseLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  // Si viene de /pulse/databridge, lo devolvemos ahí (no al dashboard genérico) para
  // que vea los resultados que ya había desbloqueado al crear/loguear su cuenta.
  const destinoPostLogin = searchParams.get('from') === 'databridge' ? '/pulse/databridge' : '/pulse/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'google' | 'error'>('idle')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setEstado('enviando')
    setError('')

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos.')
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Tu email no está confirmado. Revisá tu bandeja de entrada.')
        } else {
          setError(authError.message)
        }
        setEstado('error')
        return
      }

      router.push(destinoPostLogin)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
      setEstado('error')
    }
  }

  const loginConGoogle = async () => {
    setEstado('google')
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `https://pulsemotor.co/pulse/auth/callback?next=${encodeURIComponent(destinoPostLogin)}`,
        },
      })
      if (authError) {
        setError(authError.message)
        setEstado('error')
      }
      // Si no hay error, el navegador redirige a Google automáticamente
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al conectar con Google')
      setEstado('error')
    }
  }

  const enviando = estado === 'enviando'
  const googleCargando = estado === 'google'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <header
        style={{
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '40px',
          paddingTop: '20px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 800,
          }}
        >
          ⚡
        </div>
        <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          Pulse Motor
        </span>
      </header>

      <div style={{ width: '100%', maxWidth: '420px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 8px' }}>
          Ingresá a tu cuenta
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 28px' }}>
          Tu pipeline te está esperando.
        </p>

        {/* ── Botón Google ── */}
        <button
          type="button"
          onClick={loginConGoogle}
          disabled={googleCargando || enviando}
          style={{
            width: '100%',
            padding: '13px 18px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: googleCargando ? '#1e293b' : 'rgba(255,255,255,0.06)',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 600,
            cursor: googleCargando || enviando ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'background 0.2s',
            boxSizing: 'border-box',
            marginBottom: '20px',
          }}
          onMouseEnter={(e) => { if (!googleCargando && !enviando) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = googleCargando ? '#1e293b' : 'rgba(255,255,255,0.06)' }}
        >
          {/* SVG logo Google */}
          {!googleCargando ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
              <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
            </svg>
          ) : (
            <span style={{ fontSize: '14px' }}>⏳</span>
          )}
          {googleCargando ? 'Conectando con Google...' : 'Continuar con Google'}
        </button>

        {/* Separador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>o con email</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* ── Formulario email/contraseña ── */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={enviando || googleCargando}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={enviando || googleCargando}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={enviando || googleCargando || !email.trim() || !password}
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              border: 'none',
              background: enviando || googleCargando || !email.trim() || !password
                ? '#475569'
                : 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 700,
              cursor: enviando || googleCargando || !email.trim() || !password ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              marginTop: '8px',
              transition: 'background 0.2s',
            }}
          >
            {enviando ? 'Ingresando...' : 'Ingresar →'}
          </button>

          {error && (
            <p style={{ fontSize: '13px', color: '#fca5a5', margin: '4px 0 0', textAlign: 'center' }}>
              {error}
            </p>
          )}
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0' }}>
            ¿Todavía no tenés cuenta?{' '}
            <a href="/pulse/signup" style={{ color: '#fdba74', textDecoration: 'none', fontWeight: 600 }}>
              Crear cuenta →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '13px 16px',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  background: 'rgba(0,0,0,0.2)',
  color: '#fff',
  fontSize: '15px',
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
