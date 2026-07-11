'use client'

import { useEffect, useRef, useState } from 'react'

// Variables definidas por next/font/google en src/app/pulse/layout.tsx
const F_DISPLAY = "var(--font-oswald), sans-serif"
const F_MONO    = "var(--font-mono), monospace"
const F_BODY    = "var(--font-inter), sans-serif"

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
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          animation: 'fadeInBackdrop .2s ease',
        }}
      >
        {/* Modal */}
        <div style={{
          background: 'var(--bg-1, #14120F)',
          border: '1px solid var(--line, #2A2620)',
          borderRadius: '6px',
          padding: '40px',
          width: '100%', maxWidth: '480px',
          position: 'relative',
          animation: 'slideUpModal .25s ease',
        }}>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'transparent', border: '1px solid var(--line, #2A2620)',
              borderRadius: '4px', width: '30px', height: '30px',
              cursor: 'pointer', color: 'var(--ink-dim, #9B958A)', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ink-dim, #9B958A)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line, #2A2620)')}
          >
            ✕
          </button>

          {estado === 'success' ? (
            /* ── Estado éxito ── */
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '4px',
                background: 'rgba(62,207,126,0.08)', border: '1px solid var(--green, #3ECF7E)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', margin: '0 auto 24px', color: 'var(--green, #3ECF7E)',
              }}>✓</div>
              <h3 style={{ fontFamily: F_DISPLAY, textTransform: 'uppercase', fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink, #F3EFE7)', letterSpacing: '.3px' }}>
                Listo. Te contactamos pronto
              </h3>
              <p style={{ fontFamily: F_BODY, fontSize: '15px', color: 'var(--ink-dim, #9B958A)', lineHeight: 1.6, marginBottom: '28px' }}>
                Recibimos tus datos. Un asesor de Pulse Motor te va a escribir en menos de 24 horas para armar tu turno.
              </p>
              <button
                onClick={onClose}
                style={{
                  fontFamily: F_DISPLAY, textTransform: 'uppercase', fontWeight: 600, fontSize: '14px', letterSpacing: '.5px',
                  padding: '12px 32px', borderRadius: '6px',
                  background: 'var(--amber, #F2A93B)',
                  border: '1px solid var(--amber, #F2A93B)', color: '#1a1204', cursor: 'pointer',
                }}
              >
                Perfecto, gracias
              </button>
            </div>
          ) : (
            /* ── Formulario ── */
            <>
              {/* Badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                border: '1px solid var(--line, #2A2620)',
                borderRadius: '3px', padding: '4px 10px', marginBottom: '20px',
                fontFamily: F_MONO, fontSize: '11px', color: 'var(--ink-dim, #9B958A)', fontWeight: 500, letterSpacing: '.5px', textTransform: 'uppercase',
              }}>
                Lo hacemos por vos
              </span>

              <h2 style={{
                fontFamily: F_DISPLAY, textTransform: 'uppercase', fontSize: '22px', fontWeight: 700, letterSpacing: '.3px',
                marginBottom: '10px', lineHeight: 1.25, color: 'var(--ink, #F3EFE7)',
              }}>
                Dejanos tus datos y armamos tu turno
              </h2>
              <p style={{
                fontFamily: F_BODY, fontSize: '14px', color: 'var(--ink-dim, #9B958A)',
                lineHeight: 1.6, marginBottom: '28px',
              }}>
                Vos no hacés nada. Nosotros te contactamos, te hacemos 2 preguntas y configuramos todo. En menos de 24 horas tu turno está cubierto.
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
                      display: 'block', fontFamily: F_MONO, fontSize: '11px',
                      fontWeight: 500, color: 'var(--ink-dim, #9B958A)', marginBottom: '6px',
                      letterSpacing: '.5px', textTransform: 'uppercase',
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
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--line, #2A2620)',
                        borderRadius: '6px', padding: '12px 16px',
                        fontFamily: F_BODY, fontSize: '15px', color: 'var(--ink, #F3EFE7)',
                        outline: 'none', transition: 'border-color .15s',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--amber-dim, #8A6423)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--line, #2A2620)')}
                    />
                  </div>
                ))}
              </div>

              {/* Error */}
              {errorMsg && (
                <p style={{
                  fontFamily: F_BODY, fontSize: '13px', color: 'var(--red, #E5484D)',
                  marginTop: '12px', padding: '10px 14px',
                  background: 'rgba(229,72,77,0.08)', borderRadius: '4px',
                  border: '1px solid rgba(229,72,77,0.3)',
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
                  fontFamily: F_DISPLAY, textTransform: 'uppercase', fontWeight: 600, fontSize: '15px', letterSpacing: '.5px',
                  padding: '15px', borderRadius: '6px',
                  background: estado === 'loading' ? 'var(--amber-dim, #8A6423)' : 'var(--amber, #F2A93B)',
                  border: '1px solid var(--amber, #F2A93B)', color: '#1a1204', cursor: estado === 'loading' ? 'not-allowed' : 'pointer',
                  transition: 'background-color .2s',
                }}
              >
                {estado === 'loading' ? 'Enviando...' : 'Quiero cubrir mi turno →'}
              </button>

              <p style={{
                fontFamily: F_MONO, fontSize: '11px', color: 'var(--ink-dim, #9B958A)', textTransform: 'uppercase', letterSpacing: '.3px',
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
          from { opacity: 0; transform: translateY(16px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </>
  )
}
