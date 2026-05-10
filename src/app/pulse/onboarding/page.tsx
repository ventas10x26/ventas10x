// Ruta destino: src/app/pulse/onboarding/page.tsx
//
// Wizard de onboarding 2 pasos:
// 1. Bienvenida + carga del primer lead
// 2. Confirmación + redirige a /pulse/dashboard

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PulseOnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [paso, setPaso] = useState<1 | 2>(1)
  const [user, setUser] = useState<{ id: string; email: string; nombre: string } | null>(null)
  const [textoLead, setTextoLead] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/pulse/signup')
        return
      }
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        nombre: (authUser.user_metadata?.full_name as string) || authUser.email?.split('@')[0] || 'Vendedor',
      })
    }
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const guardarPrimerLead = async () => {
    if (!textoLead.trim() || textoLead.trim().length < 10) {
      setError('Pegá al menos un par de líneas del lead.')
      return
    }
    setError('')
    setEnviando(true)

    try {
      const res = await fetch('/api/pulse/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texto_origen: textoLead.trim(),
          canal: 'otro',
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setPaso(2)
        // Redirigir al dashboard después de 2.5 segundos
        setTimeout(() => router.push('/pulse/dashboard'), 2500)
      } else {
        setError(data.error || 'No pudimos guardar tu lead. Intenta de nuevo.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const saltarPaso = () => router.push('/pulse/dashboard')

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8' }}>Cargando...</p>
      </div>
    )
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
      {/* Header */}
      <header
        style={{
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          paddingTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        </div>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>
          Paso {paso} de 2
        </span>
      </header>

      <div style={{ width: '100%', maxWidth: '600px' }}>
        {/* Paso 1: Carga primer lead */}
        {paso === 1 && (
          <>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                margin: '0 0 8px',
              }}
            >
              Bienvenido, {user.nombre.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: '15px', color: '#cbd5e1', margin: '0 0 28px', lineHeight: '1.6' }}>
              Vamos a probar la magia ya. Pegá un lead que te llegó hoy
              (de Mercado Libre, web, Instagram, lo que sea) y te muestro cómo Pulse responde por vos.
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '16px',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fdba74',
                  marginBottom: '10px',
                }}
              >
                Pegá el lead acá
              </label>
              <textarea
                value={textoLead}
                onChange={(e) => setTextoLead(e.target.value)}
                placeholder="Ej: Juan Pérez, +57 300 123 4567 — Pregunta por la Sportage 2026 LX, dice que quiere financiación a 60 meses, hoy a las 11am desde Mercado Libre."
                rows={6}
                disabled={enviando}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  lineHeight: '1.5',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={guardarPrimerLead}
                disabled={enviando || !textoLead.trim()}
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background:
                    enviando || !textoLead.trim()
                      ? '#475569'
                      : 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: enviando || !textoLead.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {enviando ? 'Guardando...' : 'Guardar mi primer lead →'}
              </button>

              <button
                onClick={saltarPaso}
                disabled={enviando}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Lo hago después
              </button>

              {error && (
                <p style={{ fontSize: '13px', color: '#fca5a5', margin: '4px 0 0', textAlign: 'center' }}>
                  {error}
                </p>
              )}
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: '20px 0 0' }}>
              💡 La IA va a extraer nombre, teléfono y modelo automáticamente.
            </p>
          </>
        )}

        {/* Paso 2: Confirmación */}
        {paso === 2 && (
          <div
            style={{
              textAlign: 'center',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '16px',
              padding: '40px 24px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 12px' }}>
              ¡Excelente, {user.nombre.split(' ')[0]}!
            </h2>
            <p style={{ fontSize: '15px', color: '#cbd5e1', margin: '0 0 8px', lineHeight: '1.6' }}>
              Tu primer lead está guardado. Te llevo al dashboard donde vas a ver
              cómo la IA procesó la información.
            </p>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '16px 0 0' }}>
              Redirigiendo en 2 segundos...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
