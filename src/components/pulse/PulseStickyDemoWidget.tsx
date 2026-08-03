// Ruta destino: src/components/pulse/PulseStickyDemoWidget.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { PulseDemoForm } from './PulseDemoForm'
import { PulseLogoMark } from './PulseLogo'

// Widget flotante de captura. Tres decisiones de diseño que vale documentar:
//
// 1. CERRAR MINIMIZA, NO ELIMINA. Antes, la X guardaba un flag de sesión y el
//    widget no volvía a aparecer: quien lo cerraba por reflejo en el primer
//    scroll perdía toda posibilidad de convertir en esa visita. Ahora colapsa a
//    una pastilla compacta que sigue disponible en la esquina. El visitante
//    recupera su pantalla —que es lo que pedía al cerrar— sin que se pierda la
//    puerta de entrada.
//
// 2. LA CABECERA VENDE EL RESULTADO, NO LA HERRAMIENTA. El texto anterior decía
//    "te mostramos el agente en acción". A un gerente de concesionario no le
//    interesa ver un agente; le interesa saber dónde se le está cayendo la
//    conversión. La promesa concreta —20 minutos, sobre sus propios datos— es
//    lo que justifica dejar un teléfono.
//
// 3. LA BANDA DE CABECERA ES LA QUE DA PRESENCIA. Sin ella el widget se lee
//    como una tarjeta más de la página y el ojo la saltea.

const SESSION_KEY = 'pulse-demo-widget-minimizado'
export const PULSE_DEMO_OPEN_EVENT = 'pulse:abrir-demo'

// El isotipo pinta sus ticks y su punto central con var(--blue). Sobre la banda
// azul eso sería azul contra azul, así que se redefine la variable solo para su
// subárbol en vez de agregarle una prop de color al componente de marca.
const MARCA_SOBRE_AZUL = { display: 'flex', '--blue': 'rgba(255,255,255,.8)' } as React.CSSProperties

function IconClose() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  )
}

export function PulseStickyDemoWidget() {
  const [scrolledPastHero, setScrolledPastHero] = useState(false)
  const [nearFooter, setNearFooter] = useState(false)
  const [minimizado, setMinimizado] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') setMinimizado(true)
    } catch { /* modo incógnito: arranca abierto */ }
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

  // Los CTA de la página disparan este evento para abrir el widget expandido.
  useEffect(() => {
    function handleOpen() {
      try { sessionStorage.removeItem(SESSION_KEY) } catch { /* sin storage */ }
      setMinimizado(false)
    }
    window.addEventListener(PULSE_DEMO_OPEN_EVENT, handleOpen)
    return () => window.removeEventListener(PULSE_DEMO_OPEN_EVENT, handleOpen)
  }, [])

  // Cerca del footer se oculta del todo: ahí ya vive el formulario grande de la
  // página, y dos formularios en pantalla compiten entre sí.
  if (!scrolledPastHero || nearFooter) return null

  function minimizar() {
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* sin storage */ }
    setMinimizado(true)
  }

  function expandir() {
    try { sessionStorage.removeItem(SESSION_KEY) } catch { /* sin storage */ }
    setMinimizado(false)
  }

  // ── Estado minimizado ────────────────────────────────────────────────────
  if (minimizado) {
    return (
      <>
        <button
          onClick={expandir}
          className="pulse-demo-pill"
          aria-label="Agendar una demo"
          style={{
            position: 'fixed', bottom: '20px', right: '20px', zIndex: 80,
            display: 'inline-flex', alignItems: 'center', gap: '9px',
            padding: '13px 20px', borderRadius: '999px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: '#fff',
            fontFamily: 'var(--font-inter), sans-serif', fontSize: '14px', fontWeight: 700,
            boxShadow: '0 14px 34px rgba(37,99,235,.45)',
          }}
        >
          <IconChat />
          Agendar demo
          <span className="pulse-demo-ping" aria-hidden="true" />
        </button>
        <EstilosWidget />
      </>
    )
  }

  // ── Estado expandido ─────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      className="pulse-demo-widget"
      role="complementary"
      aria-label="Agendar una demo"
      style={{
        position: 'fixed', bottom: '20px', right: '20px', zIndex: 80,
        width: '378px', maxWidth: 'calc(100vw - 32px)', maxHeight: '86vh', overflowY: 'auto',
      }}
    >
      <div style={{
        position: 'relative', background: 'var(--bg-1)',
        border: '1px solid rgba(59,130,246,.42)', borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 28px 64px rgba(0,0,0,.5), 0 0 0 4px rgba(37,99,235,.13)',
      }}>

        {/* Banda de cabecera */}
        <div style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          padding: '16px 18px 15px', position: 'relative',
        }}>
          <button
            onClick={minimizar}
            aria-label="Minimizar"
            title="Minimizar"
            className="pulse-demo-x"
            style={{
              position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,.16)',
              border: 'none', borderRadius: '7px', color: '#fff', cursor: 'pointer',
              padding: '5px', display: 'flex', lineHeight: 0,
            }}
          >
            <IconClose />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={MARCA_SOBRE_AZUL}>
              <PulseLogoMark size={20} ink="#fff" />
            </span>
            <span style={{
              fontFamily: 'var(--font-mono), monospace', fontSize: '10px', fontWeight: 600,
              letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,.82)',
            }}>
              Demo con tus datos
            </span>
          </div>

          <h3 style={{
            fontFamily: 'var(--font-inter), sans-serif', fontSize: '19px', fontWeight: 800,
            color: '#fff', margin: '0 0 6px', lineHeight: 1.22, letterSpacing: '-0.02em',
            paddingRight: '26px',
          }}>
            Mirá tu operación, no una presentación
          </h3>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.86)', margin: 0, lineHeight: 1.5 }}>
            20 minutos sobre un mes de tus propios datos, para ver en qué etapa se te está cayendo la conversión.
          </p>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '16px 18px 18px' }}>
          <PulseDemoForm compact />

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '7px', marginTop: '12px',
            fontSize: '11px', color: 'var(--ink-dim)', lineHeight: 1.5,
          }}>
            <span aria-hidden="true" style={{ color: 'var(--blue)', flexShrink: 0, marginTop: '1px', display: 'flex' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6l7-3Z" /></svg>
            </span>
            Te escribimos por WhatsApp. Usamos tus datos solo para contactarte — no los compartimos ni los mostramos a nadie.
          </div>
        </div>
      </div>

      <EstilosWidget />
    </div>
  )
}

function EstilosWidget() {
  return (
    <style>{`
      .pulse-demo-widget { animation: pulse-demo-in .45s cubic-bezier(.2,.7,.3,1); }
      @keyframes pulse-demo-in { from { opacity: 0; transform: translateY(26px) scale(.97); } to { opacity: 1; transform: none; } }

      .pulse-demo-pill { animation: pulse-demo-in .35s ease-out; transition: transform .15s ease, box-shadow .15s ease; position: relative; }
      .pulse-demo-pill:hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(37,99,235,.55); }

      /* Punto que late sobre la pastilla: una vez minimizada es lo unico que se
         mueve en la pagina, y alcanza para que la vista vuelva ahi. */
      .pulse-demo-ping {
        position: absolute; top: 8px; right: 12px; width: 8px; height: 8px;
        border-radius: 50%; background: #7DD3FC; box-shadow: 0 0 0 0 rgba(125,211,252,.7);
        animation: pulse-demo-ping 2.2s infinite;
      }
      @keyframes pulse-demo-ping {
        0% { box-shadow: 0 0 0 0 rgba(125,211,252,.65); }
        70% { box-shadow: 0 0 0 9px rgba(125,211,252,0); }
        100% { box-shadow: 0 0 0 0 rgba(125,211,252,0); }
      }

      .pulse-demo-x:hover { background: rgba(255,255,255,.3) !important; }
      .pulse-demo-widget :focus-visible, .pulse-demo-pill:focus-visible { outline: 2px solid #7DD3FC; outline-offset: 2px; }

      @media (prefers-reduced-motion: reduce) {
        .pulse-demo-widget, .pulse-demo-pill, .pulse-demo-ping { animation: none; }
        .pulse-demo-pill:hover { transform: none; }
      }

      /* En movil ocupa el ancho completo: a 378px fijos quedaria flotando con
         margenes desiguales. */
      @media (max-width: 520px) {
        .pulse-demo-widget { left: 12px; right: 12px; bottom: 12px; width: auto !important; max-width: none !important; }
      }
    `}</style>
  )
}
