// Ruta destino: src/components/fenix/FenixStickyProspecting.tsx
'use client'
import { useEffect, useState } from 'react'
import { FenixLeadForm } from './FenixLeadForm'

const ACCENT = '#F5821F'
const SESSION_KEY = 'fenix-sticky-opened-once'

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function IconMessage() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

export function FenixStickyProspecting() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showLabel, setShowLabel] = useState(false)

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

  // La etiqueta junto a la burbuja aparece una vez, con un pequeño delay, solo si
  // el usuario nunca abrió el widget en esta sesión — invita a abrir sin insistir.
  useEffect(() => {
    if (!visible) return
    if (sessionStorage.getItem(SESSION_KEY) === '1') return
    const t = setTimeout(() => setShowLabel(true), 900)
    return () => clearTimeout(t)
  }, [visible])

  function handleOpen() {
    setExpanded(true)
    setShowLabel(false)
    sessionStorage.setItem(SESSION_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="fenix-sticky-widget" style={{
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 60,
      maxWidth: expanded ? '360px' : undefined, width: expanded ? 'calc(100vw - 40px)' : undefined,
      maxHeight: expanded ? '85vh' : undefined, overflowY: expanded ? 'auto' : 'visible',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px',
    }}>
      {expanded ? (
        <div className="fenix-sticky-card" style={{
          position: 'relative', overflow: 'hidden', width: '100%',
          background: 'linear-gradient(165deg, rgba(20,12,4,.98), rgba(4,2,1,.98))',
          border: `1px solid ${ACCENT}55`, borderRadius: '20px',
          padding: '24px', boxShadow: `0 24px 60px rgba(0,0,0,.6), 0 0 0 1px ${ACCENT}20, 0 0 44px ${ACCENT}18`,
        }}>
          <div className="fenix-sticky-glow" style={{
            position: 'absolute', top: '-70px', left: '-40px',
            width: '220px', height: '220px', borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT}40 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', right: '-50px',
            width: '180px', height: '180px', borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <button onClick={() => setExpanded(false)} aria-label="Minimizar" style={{
            position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none',
            color: 'rgba(255,255,255,.5)', cursor: 'pointer', padding: '4px', display: 'flex', zIndex: 1,
          }}>
            <IconClose />
          </button>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
                background: `${ACCENT}18`, border: `1px solid ${ACCENT}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT,
              }}>
                <IconMessage />
              </div>
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, color: ACCENT, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Para empresas
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  Solicite su asesoría
                </h3>
              </div>
            </div>
            <FenixLeadForm compact />
          </div>
        </div>
      ) : (
        <button
          onClick={handleOpen}
          aria-label="Abrir formulario de asesoría legal"
          className="fenix-bubble"
          style={{
            position: 'relative', display: 'flex', alignItems: 'center', gap: '10px',
            background: ACCENT, color: '#050302', border: 'none', cursor: 'pointer',
            borderRadius: '999px', padding: '14px 20px 14px 16px',
            boxShadow: `0 12px 32px ${ACCENT}55, 0 0 0 1px rgba(0,0,0,.15)`,
            fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 700,
          }}
        >
          <span className="fenix-bubble-ring" aria-hidden="true" />
          <span style={{
            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconMessage />
          </span>
          Asesoría legal gratis
        </button>
      )}

      {!expanded && showLabel && (
        <div className="fenix-bubble-toast" style={{
          background: 'rgba(10,6,2,.94)', border: `1px solid ${ACCENT}45`,
          borderRadius: '12px', padding: '10px 14px', maxWidth: '220px',
          fontSize: '12.5px', color: 'rgba(255,255,255,.8)', lineHeight: 1.5,
          boxShadow: '0 10px 30px rgba(0,0,0,.5)',
        }}>
          ¿Su empresa necesita apoyo legal o recaudo de cartera? Un especialista le responde en menos de 24h.
        </div>
      )}

      <style>{`
        .fenix-sticky-widget { animation: fenix-sticky-in .5s ease-out; }
        .fenix-sticky-glow { animation: fenix-sticky-pulse 4s ease-in-out infinite; }
        .fenix-bubble-ring {
          position: absolute; inset: 0; border-radius: 999px;
          box-shadow: 0 0 0 0 ${ACCENT}70;
          animation: fenix-bubble-pulse 2.4s ease-out infinite;
          pointer-events: none;
        }
        .fenix-bubble { transition: transform .2s ease, box-shadow .2s ease; }
        .fenix-bubble:hover { transform: translateY(-3px); box-shadow: 0 16px 40px ${ACCENT}70, 0 0 0 1px rgba(0,0,0,.15); }
        .fenix-bubble-toast { animation: fenix-toast-in .4s ease-out; }
        @keyframes fenix-sticky-in {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fenix-sticky-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes fenix-bubble-pulse {
          0% { box-shadow: 0 0 0 0 ${ACCENT}60; }
          70% { box-shadow: 0 0 0 14px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes fenix-toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
          .fenix-bubble-toast { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fenix-sticky-widget, .fenix-sticky-glow, .fenix-bubble-ring, .fenix-bubble-toast { animation: none; }
          .fenix-bubble:hover { transform: none; }
        }
      `}</style>
    </div>
  )
}
