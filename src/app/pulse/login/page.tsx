// Ruta destino: src/app/pulse/login/page.tsx
//
// Página de login propia de Pulse Motor.
// Usa el mismo Supabase Auth que Ventas10x pero en dominio pulsemotor.co.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PulseLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'error'>('idle')
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

      // Login exitoso → redirigir al dashboard
      router.push('/pulse/dashboard')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
      setEstado('error')
    }
  }

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
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            margin: '0 0 8px',
          }}
        >
          Ingresá a tu cuenta
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 28px' }}>
          Tu pipeline te está esperando.
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={estado === 'enviando'}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={estado === 'enviando'}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={estado === 'enviando' || !email.trim() || !password}
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              border: 'none',
              background:
                estado === 'enviando' || !email.trim() || !password
                  ? '#475569'
                  : 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 700,
              cursor:
                estado === 'enviando' || !email.trim() || !password
                  ? 'not-allowed'
                  : 'pointer',
              fontFamily: 'inherit',
              marginTop: '8px',
            }}
          >
            {estado === 'enviando' ? 'Ingresando...' : 'Ingresar →'}
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
