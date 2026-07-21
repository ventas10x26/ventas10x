// src/app/pulse/signup/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

export default function PulseSignupPage() {
  return (
    <Suspense fallback={null}>
      <PulseSignupForm />
    </Suspense>
  )
}

function PulseSignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [marca, setMarca] = useState(searchParams.get('marca') || '')
  const [concesionario, setConcesionario] = useState(searchParams.get('concesionario') || '')
  const [whatsapp, setWhatsapp] = useState(searchParams.get('whatsapp') || '')
  const [segmento, setSegmento] = useState<'asesor' | 'concesionario'>((searchParams.get('segmento') as 'asesor' | 'concesionario') || 'asesor')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'google' | 'error'>('idle')
  const [error, setError] = useState('')
  const [cuposDisponibles, setCuposDisponibles] = useState<number | null>(null)
  const [modoGoogle, setModoGoogle] = useState(false)
  // Si viene de /pulse/databridge (subió fuentes de datos como visitante anónimo, plan
  // Enterprise), saltamos el onboarding genérico de "pegá tu primer lead" — ya tiene
  // trabajo real hecho y debe volver directo a ver sus resultados desbloqueados.
  const from = searchParams.get('from')
  const destinoPostRegistro = from === 'databridge' ? '/pulse/databridge' : '/pulse/onboarding'

  useEffect(() => {
    fetch('/api/pulse/early-adopter-status')
      .then(r => r.json())
      .then(data => { if (data.ok) setCuposDisponibles(data.cupos_disponibles) })
      .catch(() => {})
  }, [])

  // Login con Google
  const signUpGoogle = async () => {
    setEstado('google')
    setError('')
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${destinoPostRegistro}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (oauthErr) {
      setError(oauthErr.message)
      setEstado('error')
    }
    // Si no hay error, Google redirige automáticamente
  }

  // Registro con email/password
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password || !nombre.trim()) return
    setEstado('enviando')
    setError('')

    try {
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
            pulse_segmento: segmento,
          },
        },
      })

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          setError('Este email ya está registrado. Intentá con otro o ingresá a tu cuenta.')
        } else {
          setError(authError.message)
        }
        setEstado('error')
        return
      }

      if (!authData.user) {
        setError('No se pudo crear la cuenta. Intentá de nuevo.')
        setEstado('error')
        return
      }

      try {
        await fetch('/api/pulse/auth/post-signup', { method: 'POST' })
      } catch (e) {
        console.error('post-signup falló:', e)
      }

      router.push(destinoPostRegistro)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
      setEstado('error')
    }
  }

  const cargando = estado === 'enviando' || estado === 'google'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#fff',
      fontFamily: "var(--font-inter), sans-serif",
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Header */}
      <header style={{ width: '100%', maxWidth: '440px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingTop: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 0 16px rgba(14,165,233,0.3)' }}>⚡</div>
        <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>Pulse Motor</span>
      </header>

      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Banner Early Adopter */}
        {cuposDisponibles !== null && cuposDisponibles > 0 && (
          <div style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(16,185,129,0.08))', border: '1px solid rgba(14,165,233,0.25)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px' }}>⚡</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#7dd3fc', marginBottom: '2px' }}>Early Adopter — quedan {cuposDisponibles} cupos</div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Precio especial $9 USD/mes los primeros 3 meses (después $14)</div>
            </div>
          </div>
        )}

        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 6px' }}>Crea tu cuenta</h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 24px' }}>Tarda 30 segundos. Después cargás tu primer lead y ves la magia.</p>

        {/* ── BOTÓN GOOGLE ── */}
        <button
          type="button"
          onClick={signUpGoogle}
          disabled={cargando}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: estado === 'google' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)',
            color: '#fff', fontSize: '15px', fontWeight: 600,
            cursor: cargando ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px',
            transition: 'background .2s, border-color .2s',
            marginBottom: '16px',
          }}
          onMouseEnter={e => { if (!cargando) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={e => { if (!cargando) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
        >
          {estado === 'google' ? (
            <span style={{ opacity: 0.7 }}>Redirigiendo a Google…</span>
          ) : (
            <>
              {/* Google icon SVG */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Registrarse con Google
            </>
          )}
        </button>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '12px', color: '#475569', whiteSpace: 'nowrap' }}>o con email y contraseña</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* ── FORM EMAIL/PASSWORD ── */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="text" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={cargando} style={inputStyle} />
          <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={cargando} style={inputStyle} />
          <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={cargando} style={inputStyle} />

          <div style={{ display: 'flex', gap: '8px' }}>
            {([
              { value: 'asesor' as const, label: 'Vendedor individual' },
              { value: 'concesionario' as const, label: 'Concesionario' },
            ]).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSegmento(opt.value)}
                disabled={cargando}
                style={{
                  flex: 1, padding: '11px 10px', borderRadius: '10px',
                  border: segmento === opt.value ? '1px solid rgba(242,169,59,0.5)' : '1px solid rgba(255,255,255,0.15)',
                  background: segmento === opt.value ? 'rgba(242,169,59,0.12)' : 'rgba(0,0,0,0.2)',
                  color: segmento === opt.value ? '#F2A93B' : '#94a3b8',
                  fontSize: '13px', fontWeight: 600, cursor: cargando ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <select value={marca} onChange={e => setMarca(e.target.value)} disabled={cargando} style={{ ...inputStyle, color: marca ? '#fff' : '#94a3b8', cursor: 'pointer' }}>
            <option value="">Marca con la que vendés</option>
            {['KIA','Hyundai','Renault','Chevrolet','Toyota','Mazda','Nissan','Otro'].map(m => <option key={m} value={m} style={{ color: '#0f172a' }}>{m}</option>)}
          </select>
          <input type="text" placeholder="Concesionario (ej: Almotores Cali)" value={concesionario} onChange={e => setConcesionario(e.target.value)} disabled={cargando} style={inputStyle} />
          <input type="tel" placeholder="WhatsApp (ej: +573001234567)" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} disabled={cargando} style={inputStyle} />

          <button
            type="submit"
            disabled={cargando || !email.trim() || !password || !nombre.trim()}
            style={{
              padding: '14px 18px', borderRadius: '10px', border: 'none',
              background: cargando || !email.trim() || !password || !nombre.trim()
                ? '#334155'
                : 'linear-gradient(135deg, #0ea5e9, #10b981)',
              color: '#fff', fontSize: '16px', fontWeight: 700,
              cursor: cargando || !email.trim() || !password || !nombre.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', marginTop: '4px',
              boxShadow: cargando ? 'none' : '0 4px 16px rgba(14,165,233,0.25)',
              transition: 'all .2s',
            }}
          >
            {estado === 'enviando' ? 'Creando cuenta…' : 'Crear mi cuenta →'}
          </button>

          {error && <p style={{ fontSize: '13px', color: '#fca5a5', margin: '4px 0 0', textAlign: 'center' }}>⚠ {error}</p>}
        </form>

        <p style={{ fontSize: '13px', color: '#475569', marginTop: '20px', textAlign: 'center' }}>
          ¿Ya tenés cuenta?{' '}
          <a href="/pulse/login" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>Ingresar →</a>
        </p>
      </div>
    </div>
  )
}
