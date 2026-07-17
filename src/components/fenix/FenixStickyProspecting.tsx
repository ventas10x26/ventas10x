// Ruta destino: src/components/fenix/FenixStickyProspecting.tsx
'use client'
import { useEffect, useState } from 'react'
import { FenixLeadForm } from './FenixLeadForm'

const ACCENT = '#F5821F'
const SESSION_KEY = 'fenix-sticky-dismissed'

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function FenixStickyProspecting() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setDismissed(true)
  }, [])

  useEffect(() => {
    const hero = document.getElementById('inicio')
    const contacto = document.getElementById('contacto')
    if (!hero || !contacto) return

    let heroVisible = true
    let contactoVisible = false

    const update = () => setVisible(!heroVisible && !contactoVisible)

    const heroObserver = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting
      update()
    }, { threshold: 0 })

    const contactoObserver = new IntersectionObserver(([entry]) => {
      contactoVisible = entry.isIntersecting
      update()
    }, { threshold: 0.15 })

    heroObserver.observe(hero)
    contactoObserver.observe(contacto)

    return () => {
      heroObserver.disconnect()
      contactoObserver.disconnect()
    }
  }, [])

  if (dismissed || !visible) return null

  function handleDismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="fenix-sticky-widget" style={{
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 60,
      maxWidth: '340px', width: 'calc(100vw - 40px)',
      maxHeight: '82vh', overflowY: 'auto',
    }}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(165deg, rgba(20,12,4,.98), rgba(4,2,1,.98))',
        border: `3px solid ${ACCENT}`, borderRadius: '15px',
        padding: '22px', boxShadow: '0 20px 50px rgba(0,0,0,.55)',
      }}>
        <div className="fenix-sticky-glow" style={{
          position: 'absolute', top: '-70px', left: '-40px',
          width: '220px', height: '220px', borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT}45 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <button onClick={handleDismiss} aria-label="Cerrar" style={{
          position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none',
          color: 'rgba(255,255,255,.5)', cursor: 'pointer', padding: '4px', display: 'flex', zIndex: 1,
        }}>
          <IconClose />
        </button>

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: ACCENT, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Para empresas
          </div>
          <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#fff', marginBottom: '14px', lineHeight: 1.2 }}>
            Solicite su asesoría
          </h3>
          <FenixLeadForm compact />
        </div>
      </div>

      <style>{`
        .fenix-sticky-widget {
          animation: fenix-sticky-in .5s ease-out;
        }
        .fenix-sticky-glow {
          animation: fenix-sticky-pulse 4s ease-in-out infinite;
        }
        @keyframes fenix-sticky-in {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fenix-sticky-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fenix-sticky-widget, .fenix-sticky-glow { animation: none; }
        }
      `}</style>
    </div>
  )
}
