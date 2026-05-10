// Ruta destino: src/app/pulse/page.tsx
//
// Landing principal de pulsemotor.co
// Pre-lanzamiento: captura emails para waitlist
// Diseño limpio, mobile-first, optimizado para conversión

'use client'

import { useState } from 'react'

export default function PulseMotorLanding() {
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'exito' | 'error'>('idle')
  const [mensajeError, setMensajeError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !nombre.trim()) return
    setEstado('enviando')
    setMensajeError('')

    try {
      const res = await fetch('/api/pulse/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          nombre: nombre.trim(),
          marca: marca.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setEstado('exito')
      } else {
        setEstado('error')
        setMensajeError(data.error || 'No pudimos guardar tu email. Intenta de nuevo.')
      }
    } catch {
      setEstado('error')
      setMensajeError('Error de conexión. Intenta de nuevo.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '0',
        margin: '0',
      }}
    >
      {/* Header simple */}
      <header
        style={{
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto',
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
        <span
          style={{
            fontSize: '12px',
            color: '#94a3b8',
            background: 'rgba(255,255,255,0.05)',
            padding: '6px 12px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Próximamente
        </span>
      </header>

      {/* Hero */}
      <main
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '40px 24px 80px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(249, 115, 22, 0.15)',
            color: '#fdba74',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '24px',
            border: '1px solid rgba(249, 115, 22, 0.3)',
          }}
        >
          🚗 Para vendedores de concesionario automotriz
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 800,
            lineHeight: '1.05',
            letterSpacing: '-1.5px',
            margin: '0 0 24px',
          }}
        >
          Responde a tus leads en
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #f97316, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            30 segundos
          </span>
          , aunque estés ocupado.
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            color: '#cbd5e1',
            maxWidth: '640px',
            margin: '0 auto 16px',
            lineHeight: '1.6',
          }}
        >
          El primer asistente IA para vendedores de KIA, Hyundai, Renault y más.
          Pegás el lead nuevo, la IA responde por WhatsApp en 30 segundos, y nunca dejás morir un seguimiento.
        </p>

        <p
          style={{
            fontSize: '15px',
            color: '#94a3b8',
            margin: '0 0 48px',
            fontStyle: 'italic',
          }}
        >
          &quot;Uno pierde ventas más por seguimiento que por precio.&quot; — Vendedor KIA, Cali
        </p>

        {/* Form de waitlist */}
        {estado !== 'exito' ? (
          <form
            onSubmit={submit}
            style={{
              maxWidth: '520px',
              margin: '0 auto',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '28px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px' }}>
              Sé de los primeros en probarlo
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px' }}>
              Lanzamiento en 5 semanas. Precio especial para los primeros 30 vendedores.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={estado === 'enviando'}
                style={{
                  padding: '13px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={estado === 'enviando'}
                style={{
                  padding: '13px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <select
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                disabled={estado === 'enviando'}
                style={{
                  padding: '13px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(0,0,0,0.2)',
                  color: marca ? '#fff' : '#94a3b8',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="" style={{ color: '#0f172a' }}>
                  Marca con la que vendés (opcional)
                </option>
                <option value="KIA" style={{ color: '#0f172a' }}>KIA</option>
                <option value="Hyundai" style={{ color: '#0f172a' }}>Hyundai</option>
                <option value="Renault" style={{ color: '#0f172a' }}>Renault</option>
                <option value="Chevrolet" style={{ color: '#0f172a' }}>Chevrolet</option>
                <option value="Toyota" style={{ color: '#0f172a' }}>Toyota</option>
                <option value="Mazda" style={{ color: '#0f172a' }}>Mazda</option>
                <option value="Nissan" style={{ color: '#0f172a' }}>Nissan</option>
                <option value="Otro" style={{ color: '#0f172a' }}>Otro</option>
              </select>

              <button
                type="submit"
                disabled={estado === 'enviando' || !email.trim() || !nombre.trim()}
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background:
                    estado === 'enviando' || !email.trim() || !nombre.trim()
                      ? '#475569'
                      : 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor:
                    estado === 'enviando' || !email.trim() || !nombre.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  transition: 'transform 0.1s',
                  fontFamily: 'inherit',
                }}
              >
                {estado === 'enviando' ? 'Guardando...' : 'Quiero probarlo →'}
              </button>

              {estado === 'error' && (
                <p style={{ fontSize: '13px', color: '#fca5a5', margin: '4px 0 0' }}>
                  {mensajeError}
                </p>
              )}
            </div>
          </form>
        ) : (
          <div
            style={{
              maxWidth: '520px',
              margin: '0 auto',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '16px',
              padding: '32px',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>
              ¡Listo, {nombre.split(' ')[0]}!
            </h3>
            <p style={{ fontSize: '15px', color: '#cbd5e1', margin: '0' }}>
              Te avisamos en cuanto Pulse Motor esté listo. Vas a tener precio especial early adopter por estar acá desde el inicio.
            </p>
          </div>
        )}

        {/* Bullets de propuesta de valor */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginTop: '64px',
            textAlign: 'left',
          }}
        >
          {[
            {
              icon: '⚡',
              title: 'Speed-to-Lead',
              desc: 'IA responde al lead nuevo en menos de 30 segundos por WhatsApp.',
            },
            {
              icon: '📲',
              title: 'Sin app extra',
              desc: 'Funciona con tu WhatsApp de siempre. Cero curva de aprendizaje.',
            },
            {
              icon: '🔁',
              title: 'Seguimiento automático',
              desc: 'Recordatorios al día 1, 3 y 7. Ningún lead se queda olvidado.',
            },
          ].map((b) => (
            <div
              key={b.title}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '22px',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{b.icon}</div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px' }}>
                {b.title}
              </h4>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0', lineHeight: '1.5' }}>
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#64748b',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        © 2026 Pulse Motor · Hecho en Cali, Colombia 🇨🇴
      </footer>
    </div>
  )
}
