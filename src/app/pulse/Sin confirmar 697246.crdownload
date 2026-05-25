// Ruta destino: src/app/pulse/page.tsx
// CAMBIOS:
//   - Fuente: DM Sans (similar a Roobert, free via Google Fonts)
//   - Paleta azul/verde
//   - Header con botones Ingresar / Registrarse

'use client'

import { useState } from 'react'

const C = {
  blue:         '#0ea5e9',
  blueDark:     '#0284c7',
  green:        '#10b981',
  greenDark:    '#059669',
  gradText:     'linear-gradient(135deg, #0ea5e9, #10b981)',
  gradBtn:      'linear-gradient(135deg, #0ea5e9, #059669)',
  pill:         'rgba(14, 165, 233, 0.15)',
  pillBorder:   'rgba(14, 165, 233, 0.3)',
  pillText:     '#7dd3fc',
  logo:         'linear-gradient(135deg, #0ea5e9, #10b981)',
  success:      'rgba(16, 185, 129, 0.1)',
  successBorder:'rgba(16, 185, 129, 0.3)',
}

const FONT = "'DM Sans', system-ui, -apple-system, sans-serif"

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
    <>
      {/* ── Importar DM Sans desde Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body { font-family: ${FONT}; }

        .pm-btn-outline:hover {
          color: #fff !important;
          border-color: rgba(255,255,255,0.25) !important;
        }
        .pm-btn-primary:hover { opacity: 0.88; }
        .pm-card:hover { border-color: rgba(14,165,233,0.3) !important; }
        .pm-input:focus {
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
          outline: none;
        }
        select option { background: #1e293b; color: #fff; }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          color: '#fff',
          fontFamily: FONT,
          margin: '0',
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            padding: '20px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1200px',
            margin: '0 auto',
            gap: '16px',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: C.logo,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 0 16px rgba(14,165,233,0.3)',
              }}
            >
              ⚡
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              Pulse Motor
            </span>
          </div>

          {/* Botones acceso */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href="/pulse/login"
              className="pm-btn-outline"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#94a3b8',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
                fontFamily: FONT,
              }}
            >
              Ingresar
            </a>
            <a
              href="/pulse/signup"
              className="pm-btn-primary"
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                padding: '8px 18px',
                borderRadius: '8px',
                background: C.gradBtn,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(14,165,233,0.25)',
                transition: 'opacity 0.2s',
                fontFamily: FONT,
              }}
            >
              Registrarse →
            </a>
          </div>
        </header>

        {/* ── Hero ── */}
        <main
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '40px 24px 80px',
            textAlign: 'center',
          }}
        >
          {/* Pill */}
          <div
            style={{
              display: 'inline-block',
              background: C.pill,
              color: C.pillText,
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '28px',
              border: `1px solid ${C.pillBorder}`,
              letterSpacing: '0.2px',
            }}
          >
            🚗 Para vendedores de concesionario automotriz
          </div>

          {/* Título */}
          <h1
            style={{
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 800,
              lineHeight: '1.08',
              letterSpacing: '-1px',
              margin: '0 0 24px',
              fontFamily: FONT,
            }}
          >
            Responde a tus leads en
            <br />
            <span
              style={{
                background: C.gradText,
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
              maxWidth: '620px',
              margin: '0 auto 16px',
              lineHeight: '1.65',
              fontWeight: 400,
            }}
          >
            El primer asistente IA para vendedores de KIA, Hyundai, Renault y más.
            Pegás el lead nuevo, la IA responde por WhatsApp en 30 segundos, y nunca dejás morir un seguimiento.
          </p>

          <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 52px', fontStyle: 'italic', fontWeight: 300 }}>
            &quot;Uno pierde ventas más por seguimiento que por precio.&quot; — Vendedor KIA, Cali
          </p>

          {/* ── Form waitlist ── */}
          {estado !== 'exito' ? (
            <form
              onSubmit={submit}
              style={{
                maxWidth: '500px',
                margin: '0 auto',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '18px',
                padding: '28px',
                backdropFilter: 'blur(12px)',
              }}
            >
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px', fontFamily: FONT }}>
                Sé de los primeros en probarlo
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px', fontWeight: 400 }}>
                Lanzamiento en 5 semanas. Precio especial para los primeros 30 vendedores.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required disabled={estado === 'enviando'} className="pm-input" style={inputStyle(FONT)} />
                <input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={estado === 'enviando'} className="pm-input" style={inputStyle(FONT)} />
                <select value={marca} onChange={(e) => setMarca(e.target.value)} disabled={estado === 'enviando'} className="pm-input" style={{ ...inputStyle(FONT), color: marca ? '#fff' : '#64748b', cursor: 'pointer' }}>
                  <option value="">Marca con la que vendés (opcional)</option>
                  <option value="KIA">KIA</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="Renault">Renault</option>
                  <option value="Chevrolet">Chevrolet</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Mazda">Mazda</option>
                  <option value="Nissan">Nissan</option>
                  <option value="Otro">Otro</option>
                </select>

                <button
                  type="submit"
                  disabled={estado === 'enviando' || !email.trim() || !nombre.trim()}
                  className="pm-btn-primary"
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: estado === 'enviando' || !email.trim() || !nombre.trim() ? '#334155' : C.gradBtn,
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: estado === 'enviando' || !email.trim() || !nombre.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: FONT,
                    boxShadow: '0 4px 16px rgba(14,165,233,0.2)',
                    letterSpacing: '0.1px',
                  }}
                >
                  {estado === 'enviando' ? 'Guardando...' : 'Quiero probarlo →'}
                </button>

                <p style={{ fontSize: '13px', color: '#475569', margin: '2px 0 0', textAlign: 'center' }}>
                  ¿Ya tienes cuenta?{' '}
                  <a href="/pulse/login" style={{ color: C.blue, textDecoration: 'none', fontWeight: 500 }}>
                    Ingresar →
                  </a>
                </p>

                {estado === 'error' && (
                  <p style={{ fontSize: '13px', color: '#fca5a5', margin: '4px 0 0' }}>{mensajeError}</p>
                )}
              </div>
            </form>
          ) : (
            <div
              style={{
                maxWidth: '500px',
                margin: '0 auto',
                background: C.success,
                border: `1px solid ${C.successBorder}`,
                borderRadius: '18px',
                padding: '32px',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', fontFamily: FONT }}>
                ¡Listo, {nombre.split(' ')[0]}!
              </h3>
              <p style={{ fontSize: '15px', color: '#cbd5e1', margin: '0 0 20px', fontWeight: 400 }}>
                Te avisamos en cuanto Pulse Motor esté listo. Vas a tener precio especial early adopter.
              </p>
              <a
                href="/pulse/login"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: C.gradBtn,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'none',
                  fontFamily: FONT,
                }}
              >
                Ingresar a mi cuenta →
              </a>
            </div>
          )}

          {/* ── Bullets ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginTop: '64px',
              textAlign: 'left',
            }}
          >
            {[
              { icon: '⚡', title: 'Speed-to-Lead', desc: 'IA responde al lead nuevo en menos de 30 segundos por WhatsApp.' },
              { icon: '📲', title: 'Sin app extra', desc: 'Funciona con tu WhatsApp de siempre. Cero curva de aprendizaje.' },
              { icon: '🔁', title: 'Seguimiento automático', desc: 'Recordatorios al día 1, 3 y 7. Ningún lead se queda olvidado.' },
            ].map((b) => (
              <div
                key={b.title}
                className="pm-card"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '14px',
                  padding: '22px',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ fontSize: '26px', marginBottom: '10px' }}>{b.icon}</div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', fontFamily: FONT }}>{b.title}</h4>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0', lineHeight: '1.55', fontWeight: 400 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </main>

        {/* ── Footer ── */}
        <footer
          style={{
            padding: '28px 24px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#475569',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            fontFamily: FONT,
            fontWeight: 400,
          }}
        >
          © 2026 Pulse Motor · Hecho en Cali, Colombia 🇨🇴
        </footer>
      </div>
    </>
  )
}

function inputStyle(font: string): React.CSSProperties {
  return {
    padding: '13px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.25)',
    color: '#fff',
    fontSize: '15px',
    fontFamily: font,
    fontWeight: 400,
    width: '100%',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }
}
