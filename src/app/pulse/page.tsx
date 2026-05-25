// Ruta destino: src/app/pulse/page.tsx
// LÓGICA:
//   - Email nuevo → guarda en waitlist → redirige a /onboarding-demo
//   - Email ya registrado → redirige igual a /onboarding-demo (sin error)
//   - Validaciones inline por campo (no bloquea el flujo innecesariamente)
//   - Header detecta sesión activa → muestra "Mi agente" en vez de botones

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const C = {
  blue:       '#0ea5e9',
  green:      '#10b981',
  gradBtn:    'linear-gradient(135deg, #0ea5e9, #059669)',
  gradText:   'linear-gradient(135deg, #0ea5e9, #10b981)',
  pill:       'rgba(14,165,233,0.15)',
  pillBorder: 'rgba(14,165,233,0.3)',
  pillText:   '#7dd3fc',
  logo:       'linear-gradient(135deg, #0ea5e9, #10b981)',
}
const FONT = "'DM Sans', system-ui, -apple-system, sans-serif"

function validarEmail(email: string): string {
  if (!email.trim()) return 'El email es requerido'
  if (!email.includes('@') || !email.includes('.')) return 'Email inválido'
  if (email.trim().length < 6) return 'Email muy corto'
  return ''
}

function validarNombre(nombre: string): string {
  if (!nombre.trim()) return 'El nombre es requerido'
  if (nombre.trim().length < 2) return 'Mínimo 2 caracteres'
  return ''
}

export default function PulseMotorLanding() {
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando'>('idle')

  // Errores inline por campo
  const [errorEmail, setErrorEmail] = useState('')
  const [errorNombre, setErrorNombre] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')

  // Touched — solo mostrar error si el usuario ya tocó el campo
  const [touchedEmail, setTouchedEmail] = useState(false)
  const [touchedNombre, setTouchedNombre] = useState(false)

  // Sesión activa
  const [usuarioLogueado, setUsuarioLogueado] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUsuarioLogueado(data.user.email)
    })
  }, [])

  // Validar en tiempo real cuando el campo ya fue tocado
  useEffect(() => {
    if (touchedEmail) setErrorEmail(validarEmail(email))
  }, [email, touchedEmail])

  useEffect(() => {
    if (touchedNombre) setErrorNombre(validarNombre(nombre))
  }, [nombre, touchedNombre])

  const formularioValido = !validarEmail(email) && !validarNombre(nombre)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Marcar todos como tocados para mostrar errores
    setTouchedEmail(true)
    setTouchedNombre(true)

    const eEmail = validarEmail(email)
    const eNombre = validarNombre(nombre)
    setErrorEmail(eEmail)
    setErrorNombre(eNombre)

    if (eEmail || eNombre) return

    setEstado('enviando')
    setErrorGeneral('')

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

      // ── Si ok O si ya estaba registrado → redirigir igual ──
      if (data.ok || res.status === 409) {
        // Guardar nombre/email en sessionStorage para pre-llenar el onboarding
        sessionStorage.setItem('pulse_onboarding_email', email.trim().toLowerCase())
        sessionStorage.setItem('pulse_onboarding_nombre', nombre.trim())
        window.location.href = '/onboarding-demo'
        return
      }

      // Error real (500, validación del servidor)
      setErrorGeneral(data.error || 'Error inesperado. Intenta de nuevo.')
      setEstado('idle')
    } catch {
      setErrorGeneral('Error de conexión. Verifica tu internet e intenta de nuevo.')
      setEstado('idle')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .pm-input {
          width: 100%; padding: 13px 16px; border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.25);
          color: #fff; fontSize: 15px; font-family: ${FONT}; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-size: 15px;
        }
        .pm-input:focus { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14,165,233,0.15); }
        .pm-input.error { border-color: #f87171; }
        .pm-input.error:focus { border-color: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,0.15); }

        .pm-btn { transition: all 0.2s ease; }
        .pm-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .pm-btn:active:not(:disabled) { transform: translateY(0); }

        .pm-btn-outline { transition: all 0.2s; }
        .pm-btn-outline:hover { color: #fff !important; border-color: rgba(255,255,255,0.25) !important; }

        .pm-card:hover { border-color: rgba(14,165,233,0.25) !important; }

        select option { background: #1e293b; color: #fff; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', color: '#fff', fontFamily: FONT }}>

        {/* ── Header ── */}
        <header style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: C.logo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 0 16px rgba(14,165,233,0.3)' }}>⚡</div>
            <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>Pulse Motor</span>
          </div>

          {/* Botones según sesión */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {usuarioLogueado ? (
              <a href="/pulse/agente" style={{ fontSize: '14px', fontWeight: 600, color: '#fff', padding: '8px 18px', borderRadius: '8px', background: C.gradBtn, textDecoration: 'none', boxShadow: '0 4px 14px rgba(14,165,233,0.25)' }}>
                Mi agente →
              </a>
            ) : (
              <>
                <a href="/pulse/login" className="pm-btn-outline" style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', textDecoration: 'none' }}>
                  Ingresar
                </a>
                <a href="/pulse/signup" className="pm-btn" style={{ fontSize: '14px', fontWeight: 600, color: '#fff', padding: '8px 18px', borderRadius: '8px', background: C.gradBtn, textDecoration: 'none', boxShadow: '0 4px 14px rgba(14,165,233,0.25)', display: 'inline-block' }}>
                  Registrarse →
                </a>
              </>
            )}
          </div>
        </header>

        {/* ── Hero ── */}
        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: C.pill, color: C.pillText, padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 500, marginBottom: '28px', border: `1px solid ${C.pillBorder}` }}>
            🚗 Para vendedores de concesionario automotriz
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: '1.08', letterSpacing: '-1px', margin: '0 0 24px' }}>
            Responde a tus leads en<br />
            <span style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>30 segundos</span>, aunque estés ocupado.
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: '#cbd5e1', maxWidth: '620px', margin: '0 auto 16px', lineHeight: '1.65', fontWeight: 400 }}>
            El primer asistente IA para vendedores de KIA, Hyundai, Renault y más. Pegás el lead nuevo, la IA responde por WhatsApp en 30 segundos, y nunca dejás morir un seguimiento.
          </p>

          <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 48px', fontStyle: 'italic', fontWeight: 300 }}>
            &quot;Uno pierde ventas más por seguimiento que por precio.&quot; — Vendedor KIA, Cali
          </p>

          {/* ── Form ── */}
          <form onSubmit={submit} style={{ maxWidth: '500px', margin: '0 auto', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '18px', padding: '28px', backdropFilter: 'blur(12px)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px' }}>Sé de los primeros en probarlo</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px', fontWeight: 400 }}>
              Configura tu agente KIA en menos de 5 minutos.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onBlur={() => setTouchedNombre(true)}
                disabled={estado === 'enviando'}
                className={`pm-input${touchedNombre && errorNombre ? ' error' : ''}`}
              />
              {touchedNombre && errorNombre && (
                <span style={{ fontSize: '12px', color: '#f87171', textAlign: 'left', paddingLeft: '4px' }}>⚠ {errorNombre}</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouchedEmail(true)}
                disabled={estado === 'enviando'}
                className={`pm-input${touchedEmail && errorEmail ? ' error' : ''}`}
              />
              {touchedEmail && errorEmail && (
                <span style={{ fontSize: '12px', color: '#f87171', textAlign: 'left', paddingLeft: '4px' }}>⚠ {errorEmail}</span>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <select value={marca} onChange={(e) => setMarca(e.target.value)} disabled={estado === 'enviando'} className="pm-input" style={{ cursor: 'pointer', color: marca ? '#fff' : '#64748b' }}>
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
            </div>

            <button type="submit" disabled={estado === 'enviando'} className="pm-btn" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: estado === 'enviando' ? '#334155' : C.gradBtn, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: estado === 'enviando' ? 'not-allowed' : 'pointer', fontFamily: FONT, boxShadow: '0 4px 16px rgba(14,165,233,0.2)', marginBottom: '12px' }}>
              {estado === 'enviando' ? 'Configurando…' : 'Configurar mi agente KIA →'}
            </button>

            {errorGeneral && (
              <p style={{ fontSize: '13px', color: '#f87171', margin: '0 0 8px', textAlign: 'center' }}>⚠ {errorGeneral}</p>
            )}

            <p style={{ fontSize: '13px', color: '#475569', margin: 0, textAlign: 'center' }}>
              ¿Ya tienes cuenta?{' '}
              <a href="/pulse/login" style={{ color: C.blue, textDecoration: 'none', fontWeight: 500 }}>Ingresar →</a>
            </p>
          </form>

          {/* ── Bullets ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '64px', textAlign: 'left' }}>
            {[
              { icon: '⚡', title: 'Speed-to-Lead', desc: 'IA responde al lead nuevo en menos de 30 segundos por WhatsApp.' },
              { icon: '📲', title: 'Sin app extra', desc: 'Funciona con tu WhatsApp de siempre. Cero curva de aprendizaje.' },
              { icon: '🔁', title: 'Seguimiento automático', desc: 'Recordatorios al día 1, 3 y 7. Ningún lead se queda olvidado.' },
            ].map((b) => (
              <div key={b.title} className="pm-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '22px', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: '26px', marginBottom: '10px' }}>{b.icon}</div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px' }}>{b.title}</h4>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0', lineHeight: '1.55', fontWeight: 400 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </main>

        <footer style={{ padding: '28px 24px', textAlign: 'center', fontSize: '13px', color: '#475569', borderTop: '1px solid rgba(255,255,255,0.05)', fontWeight: 400 }}>
          © 2026 Pulse Motor · Hecho en Cali, Colombia 🇨🇴
        </footer>
      </div>
    </>
  )
}
