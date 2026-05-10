// Ruta destino: src/app/pulse/signup/page.tsx
//
// Página de registro de Pulse Motor con:
// - Contador en vivo de cupos early adopter disponibles
// - Llamada automática al endpoint /post-signup después del registro
// - Mensaje de bienvenida diferenciado según si quedó como early adopter o no

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PulseSignupPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [marca, setMarca] = useState('')
  const [concesionario, setConcesionario] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'error'>('idle')
  const [error, setError] = useState('')
  const [cuposDisponibles, setCuposDisponibles] = useState<number | null>(null)

  // Cargar cupos disponibles al montar
  useEffect(() => {
    const cargarCupos = async () => {
      try {
        const res = await fetch('/api/pulse/early-adopter-status')
        const data = await res.json()
        if (data.ok) {
          setCuposDisponibles(data.cupos_disponibles)
        }
      } catch {
        // Silent fail, no bloqueante
      }
    }
    cargarCupos()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password || !nombre.trim()) return
    setEstado('enviando')
    setError('')

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: nombre.trim(),
            pulse_signup: true,
            pulse_marca: marca || null,
            pulse_concesionario: concesionario.trim() || null,
            pulse_whatsapp: whatsapp.trim() || null,
          },
        },
      })

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          setError('Este email ya está registrado. Intenta con otro o ingresá a tu cuenta.')
        } else {
          setError(authError.message)
        }
        setEstado('error')
        return
      }

      if (!authData.user) {
        setError('No se pudo crear la cuenta. Intenta de nuevo.')
        setEstado('error')
        return
      }

      // 2. Asignar flag early adopter (no bloqueante si falla)
      try {
        await fetch('/api/pulse/auth/post-signup', { method: 'POST' })
      } catch (e) {
        console.error('post-signup falló:', e)
      }

      // 3. Redirigir a onboarding
      router.push('/pulse/onboarding')
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
          maxWidth: '440px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px',
          paddingTop: '12px',
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

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Banner Early Adopter */}
        {cuposDisponibles !== null && cuposDisponibles > 0 && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.1))',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '24px' }}>⚡</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fdba74', marginBottom: '2px' }}>
                Early Adopter — quedan {cuposDisponibles} cupos
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Precio especial $9 USD/mes los primeros 3 meses (después $14)
              </div>
            </div>
          </div>
        )}

        {cuposDisponibles === 0 && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Cupos early adopter agotados. Te registrás como Pulse Pro standard a $14 USD/mes.
            </div>
          </div>
        )}

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            margin: '0 0 8px',
          }}
        >
          Crea tu cuenta
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 24px' }}>
          Tarda 30 segundos. Después cargás tu primer lead y ves la magia.
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            disabled={estado === 'enviando'}
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={estado === 'enviando'}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={estado === 'enviando'}
            style={inputStyle}
          />
          <select
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            disabled={estado === 'enviando'}
            style={{ ...inputStyle, color: marca ? '#fff' : '#94a3b8', cursor: 'pointer' }}
          >
            <option value="" style={{ color: '#0f172a' }}>Marca con la que vendés</option>
            <option value="KIA" style={{ color: '#0f172a' }}>KIA</option>
            <option value="Hyundai" style={{ color: '#0f172a' }}>Hyundai</option>
            <option value="Renault" style={{ color: '#0f172a' }}>Renault</option>
            <option value="Chevrolet" style={{ color: '#0f172a' }}>Chevrolet</option>
            <option value="Toyota" style={{ color: '#0f172a' }}>Toyota</option>
            <option value="Mazda" style={{ color: '#0f172a' }}>Mazda</option>
            <option value="Nissan" style={{ color: '#0f172a' }}>Nissan</option>
            <option value="Otro" style={{ color: '#0f172a' }}>Otro</option>
          </select>
          <input
            type="text"
            placeholder="Concesionario (ej: Almotores Cali)"
            value={concesionario}
            onChange={(e) => setConcesionario(e.target.value)}
            disabled={estado === 'enviando'}
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="WhatsApp (ej: +573001234567)"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            disabled={estado === 'enviando'}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={estado === 'enviando' || !email.trim() || !password || !nombre.trim()}
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              border: 'none',
              background:
                estado === 'enviando' || !email.trim() || !password || !nombre.trim()
                  ? '#475569'
                  : 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 700,
              cursor:
                estado === 'enviando' || !email.trim() || !password || !nombre.trim()
                  ? 'not-allowed'
                  : 'pointer',
              fontFamily: 'inherit',
              marginTop: '8px',
            }}
          >
            {estado === 'enviando' ? 'Creando cuenta...' : 'Crear mi cuenta →'}
          </button>

          {error && (
            <p style={{ fontSize: '13px', color: '#fca5a5', margin: '4px 0 0', textAlign: 'center' }}>
              {error}
            </p>
          )}
        </form>
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
