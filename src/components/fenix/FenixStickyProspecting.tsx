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

function IconArrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function FenixStickyProspecting() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
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
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 60,
      maxWidth: expanded ? '380px' : '260px',
      width: 'calc(100vw - 40px)',
    }} className="fenix-sticky-widget">
      {!expanded ? (
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: DARK_CARD_BG, border: `3px solid ${ACCENT}`, borderRadius: '15px',
          padding: '16px 18px', boxShadow: '0 20px 50px rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <button onClick={handleDismiss} aria-label="Cerrar" style={{
            position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none',
            color: 'rgba(255,255,255,.5)', cursor: 'pointer', padding: '4px', display: 'flex',
          }}>
            <IconClose />
          </button>
          <button onClick={() => setExpanded(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: '12px', width: '100%', paddingRight: '18px',
          }}>
            <div style={{
              flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%',
              background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050302',
            }}>
              <IconArrow />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: ACCENT, letterSpacing: '.06em', textTransform: 'uppercase' }}>Para empresas</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Solicitar asesoría</div>
            </div>
          </button>
        </div>
      ) : (
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: DARK_CARD_BG, border: `3px solid ${ACCENT}`, borderRadius: '15px',
          padding: '22px', boxShadow: '0 20px 50px rgba(0,0,0,.5)',
          maxHeight: '80vh', overflowY: 'auto',
        }}>
          <button onClick={handleDismiss} aria-label="Cerrar" style={{
            position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none',
            color: 'rgba(255,255,255,.5)', cursor: 'pointer', padding: '4px', display: 'flex', zIndex: 1,
          }}>
            <IconClose />
          </button>
          <div style={{ fontSize: '11px', fontWeight: 700, color: ACCENT, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
            Para empresas
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
            Solicite su asesoría
          </div>
          <FenixLeadForm compact />
        </div>
      )}
    </div>
  )
}

const DARK_CARD_BG = 'linear-gradient(180deg, rgba(20,12,4,.98), rgba(5,3,2,.98))'
