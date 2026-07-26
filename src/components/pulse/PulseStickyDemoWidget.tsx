// Ruta destino: src/components/pulse/PulseStickyDemoWidget.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { PulseDemoForm } from './PulseDemoForm'

const SESSION_KEY = 'pulse-demo-widget-dismissed'
export const PULSE_DEMO_OPEN_EVENT = 'pulse:abrir-demo'

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function PulseStickyDemoWidget() {
  const [scrolledPastHero, setScrolledPastHero] = useState(false)
  const [nearFooter, setNearFooter] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setDismissed(true)
  }, [])

  useEffect(() => {
    const hero = document.getElementById('plataforma')
    const footer = document.querySelector('footer')
    if (!hero) return

    const heroObserver = new IntersectionObserver(([entry]) => {
      setScrolledPastHero(!entry.isIntersecting)
    }, { threshold: 0 })
    heroObserver.observe(hero)

    let footerObserver: IntersectionObserver | null = null
    if (footer) {
      footerObserver = new IntersectionObserver(([entry]) => {
        setNearFooter(entry.isIntersecting)
      }, { threshold: 0.1 })
      footerObserver.observe(footer)
    }

    return () => {
      heroObserver.disconnect()
      footerObserver?.disconnect()
    }
  }, [])

  useEffect(() => {
    function handleOpen() {
      sessionStorage.removeItem(SESSION_KEY)
      setDismissed(false)
    }
    window.addEventListener(PULSE_DEMO_OPEN_EVENT, handleOpen)
    return () => window.removeEventListener(PULSE_DEMO_OPEN_EVENT, handleOpen)
  }, [])

  const visible = scrolledPastHero && !nearFooter && !dismissed

  if (!visible) return null

  function handleDismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setDismissed(true)
  }

  return (
    <div ref={rootRef} className="pulse-demo-widget" style={{
      position: 'fixed', bottom: '20px', right: '20px', zIndex: 80,
      maxWidth: '340px', width: 'calc(100vw - 40px)', maxHeight: '85vh', overflowY: 'auto',
    }}>
      <div style={{
        position: 'relative', background: 'var(--bg-1)', border: '1px solid var(--line)',
        borderRadius: '8px', padding: '22px', boxShadow: '0 24px 48px rgba(0,0,0,.45), 0 8px 16px rgba(0,0,0,.3)',
      }}>
        <button onClick={handleDismiss} aria-label="Cerrar" style={{
          position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none',
          color: 'var(--ink-dim)', cursor: 'pointer', padding: '4px', display: 'flex',
        }}>
          <IconClose />
        </button>

        <p style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '11px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '6px' }}>
          Demo personalizada
        </p>
        <h3 style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: '18px', fontWeight: 800, color: 'var(--ink)', marginBottom: '4px', lineHeight: 1.2 }}>
          Agenda tu demo
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-dim)', marginBottom: '16px', lineHeight: 1.4 }}>
          Te contactamos por WhatsApp para mostrarte el agente en acción.
        </p>

        <PulseDemoForm compact />
      </div>

      <style>{`
        .pulse-demo-widget { animation: pulse-demo-in .5s ease-out; }
        @keyframes pulse-demo-in { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .pulse-demo-widget { animation: none; } }
      `}</style>
    </div>
  )
}
