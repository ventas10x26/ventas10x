'use client'

import { useEffect, useRef, useState } from 'react'

const FONT = "'Syne', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const GRAD = 'linear-gradient(90deg, #38bdf8, #34d399, #a855f7)'
const gradText: React.CSSProperties = { backgroundImage: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }

interface PulseContactModalProps {
  open: boolean
  onClose: () => void
}

export default function PulseContactModal({ open, onClose }: PulseContactModalProps) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [estado, setEstado] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const backdropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus primer input al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async () => {
    if (!nombre.trim() || !email.trim() || !telefono.trim()) {
      setErrorMsg('Por favor completá todos los campos.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('El email no parece válido.')
      return
    }
    setErrorMsg('')
    setEstado('loading')
    try {
      const res = await fetch('/api/pulse/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim() }),
      })
      if (!res.ok) throw new Error('Error del servidor')
      setEstado('success')
    } catch {
      setEstado('error')
      setErrorMsg('Hubo un problema. Intentá de nuevo o escribinos por WhatsApp.')
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(2,4,9,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          animation: 'fadeInBackdrop .2s ease',
        }}
      >
        {/* Modal */}
        <div style={{
          background: '#0a0e18',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '40px',
          width: '100%', maxWidth: '480px',
          position: 'relative',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(56,189,248,0.08)',
          animation: 'slideUpModal .25s cubic-bezier(.22,.68,0,1.2)',
        }}>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              borderRadius: '8px', width: '32px', height: '32px',
              cursor: 'pointer', color: '#9aa3ba', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            ✕
          </button>

          {estado === 'success' ? (
            /* ── Estado éxito ── */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(52,211,153,0.12)', border: '2px solid rgba(52,211,153,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', margin: '0 auto 24px', color: '#6ee7b7',
              }}>✓</div>
              <h3 style={{ fontFamily: FONT, fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: '#f3f5fa' }}>
                ¡Listo! <span style={gradText}>Te contactamos pronto</span>
              </h3>
              <p style={{ fontFamily: FONT_BODY, fontSize: '15px', color: '#9aa3ba', lineHeight: 1.6, marginBottom: '28px' }}>
                Recibimos tus datos. Un asesor de Pulse Motor te va a escribir en menos de 24 horas para armar tu agente personalizado.
              </p>
              <button
                onClick={onClose}
                className="pm-btn"
                style={{ width: 'auto', fontSize: '15px', padding: '12px 32px' }}
              >
                Perfecto, gracias
              </button>
            </div>
          ) : (
            /* ── Formulario ── */
            <>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: '20px', padding: '4px 12px', marginBottom: '20px',
              }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: '12px', color: '#9aa3ba', fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase' }}>
                  Lo hacemos por vos
                </span>
              </div>

              <h2 style={{
                fontFamily: FONT, fontSize: '24px', fontWeight: 700,
                marginBottom: '10px', lineHeight: 1.2, color: '#f3f5fa',
              }}>
                Dejanos tus datos y <span style={gradText}>armamos tu agente</span>
              </h2>
              <p style={{
                fontFamily: FONT_BODY, fontSize: '14px', color: '#9aa3ba',
                lineHeight: 1.6, marginBottom: '28px',
              }}>
                Vos no hacés nada. Nosotros te contactamos, te hacemos 2 preguntas y configuramos todo. En menos de 24 horas tu agente está listo.
              </p>

              {/* Campos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Tu nombre', value: nombre, setter: setNombre, type: 'text', placeholder: 'Ej: Carlos Sanabria', ref: inputRef },
                  { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'carlos@kiacali.com' },
                  { label: 'WhatsApp / Teléfono', value: telefono, setter: setTelefono, type: 'tel', placeholder: '+57 300 123 4567' },
                ].map(({ label, value, setter, type, placeholder, ref }, i) => (
                  <div key={i}>
                    <label style={{
                      display: 'block', fontFamily: FONT_BODY, fontSize: '12px',
                      fontWeight: 600, color: '#9aa3ba', marginBottom: '6px',
                      letterSpacing: '.4px', textTransform: 'uppercase',
                    }}>
                      {label}
                    </label>
                    <input
                      ref={ref as React.RefObject<HTMLInputElement> | undefined}
                      type={type}
                      value={value}
                      onChange={e => { setter(e.target.value); setErrorMsg('') }}
                      placeholder={placeholder}
                      onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px', padding: '12px 16px',
                        fontFamily: FONT_BODY, fontSize: '15px', color: '#f3f5fa',
                        outline: 'none', transition: 'border-color .15s',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(56,189,248,0.55)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                ))}
              </div>

              {/* Error */}
              {errorMsg && (
                <p style={{
                  fontFamily: FONT_BODY, fontSize: '13px', color: '#fb7185',
                  marginTop: '12px', padding: '10px 14px',
                  background: 'rgba(251,113,133,0.08)', borderRadius: '8px',
                }}>
                  {errorMsg}
                </p>
              )}

              {/* CTA */}
              <button
                onClick={handleSubmit}
                disabled={estado === 'loading'}
                className="pm-btn"
                style={{
                  marginTop: '24px',
                  fontSize: '16px',
                  padding: '15px',
                  opacity: estado === 'loading' ? 0.5 : 1,
                  cursor: estado === 'loading' ? 'not-allowed' : 'pointer',
                }}
              >
                {estado === 'loading' ? 'Enviando...' : 'Quiero mi agente →'}
              </button>

              <p style={{
                fontFamily: FONT_BODY, fontSize: '12px', color: '#5c637a',
                textAlign: 'center', marginTop: '12px',
              }}>
                Sin compromiso · Te contactamos en menos de 24 hs
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInBackdrop {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(24px) scale(.97) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>
    </>
  )
}
