'use client'

import { useEffect, useRef, useState } from 'react'

const FONT = "'Syne', sans-serif"
const FONT_BODY = "'DM Sans', sans-serif"
const GRAD = 'linear-gradient(90deg, #3b82f6, #ec4899, #a855f7)'
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
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          animation: 'fadeInBackdrop .2s ease',
        }}
      >
        {/* Modal */}
        <div style={{
          background: '#fafafa',
          border: '1px solid rgba(0,0,0,0.14)',
          borderRadius: '16px',
          padding: '40px',
          width: '100%', maxWidth: '480px',
          position: 'relative',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          animation: 'slideUpModal .25s cubic-bezier(.22,.68,0,1.2)',
        }}>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(0,0,0,0.06)', border: 'none',
              borderRadius: '8px', width: '32px', height: '32px',
              cursor: 'pointer', color: '#475569', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
          >
            ✕
          </button>

          {estado === 'success' ? (
            /* ── Estado éxito ── */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.1)', border: '2px solid rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', margin: '0 auto 24px',
              }}>✓</div>
              <h3 style={{ fontFamily: FONT, fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
                ¡Listo! <span style={gradText}>Te contactamos pronto</span>
              </h3>
              <p style={{ fontFamily: FONT_BODY, fontSize: '15px', color: '#475569', lineHeight: 1.6, marginBottom: '28px' }}>
                Recibimos tus datos. Un asesor de Pulse Motor te va a escribir en menos de 24 horas para armar tu agente personalizado.
              </p>
              <button
                onClick={onClose}
                style={{
                  fontFamily: FONT, fontWeight: 600, fontSize: '15px',
                  padding: '12px 32px', borderRadius: '8px',
                  background: '#000',
                  border: 'none', color: '#fff', cursor: 'pointer',
                }}
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
                background: 'transparent', border: '1px solid rgba(0,0,0,0.16)',
                borderRadius: '20px', padding: '4px 12px', marginBottom: '20px',
              }}>
                <span style={{ fontFamily: FONT_BODY, fontSize: '12px', color: '#888', fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase' }}>
                  Lo hacemos por vos
                </span>
              </div>

              <h2 style={{
                fontFamily: FONT, fontSize: '24px', fontWeight: 700,
                marginBottom: '10px', lineHeight: 1.2,
              }}>
                Dejanos tus datos y <span style={gradText}>armamos tu agente</span>
              </h2>
              <p style={{
                fontFamily: FONT_BODY, fontSize: '14px', color: '#64748b',
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
                      fontWeight: 600, color: '#475569', marginBottom: '6px',
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
                        background: 'rgba(0,0,0,0.04)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '10px', padding: '12px 16px',
                        fontFamily: FONT_BODY, fontSize: '15px', color: '#0a0a0a',
                        outline: 'none', transition: 'border-color .15s',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
                    />
                  </div>
                ))}
              </div>

              {/* Error */}
              {errorMsg && (
                <p style={{
                  fontFamily: FONT_BODY, fontSize: '13px', color: '#f87171',
                  marginTop: '12px', padding: '10px 14px',
                  background: 'rgba(248,113,113,0.08)', borderRadius: '8px',
                }}>
                  {errorMsg}
                </p>
              )}

              {/* CTA */}
              <button
                onClick={handleSubmit}
                disabled={estado === 'loading'}
                style={{
                  marginTop: '24px', width: '100%',
                  fontFamily: FONT, fontWeight: 700, fontSize: '16px',
                  padding: '15px', borderRadius: '12px',
                  background: estado === 'loading'
                    ? 'rgba(0,0,0,0.3)'
                    : '#000',
                  border: 'none', color: '#fff', cursor: estado === 'loading' ? 'not-allowed' : 'pointer',
                  boxShadow: 'none',
                  transition: 'all .2s', letterSpacing: '-.2px',
                }}
                onMouseEnter={e => { if (estado !== 'loading') e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {estado === 'loading' ? 'Enviando...' : 'Quiero mi agente →'}
              </button>

              <p style={{
                fontFamily: FONT_BODY, fontSize: '12px', color: '#cbd5e1',
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
