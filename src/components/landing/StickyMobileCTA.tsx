// Ruta destino: src/components/landing/StickyMobileCTA.tsx

'use client'

import { useEffect, useState } from 'react'

type Props = {
  colorAcento: string
  ctaTexto: string
  whatsapp: string
  mensajeWa: string
}

function whatsappLink(numero: string, mensaje: string): string {
  if (!numero) return '#'
  const num = numero.replace(/\D/g, '')
  const msg = encodeURIComponent(
    mensaje?.trim() || 'Hola, quiero más información'
  )
  return `https://wa.me/${num}?text=${msg}`
}

export function StickyMobileCTA({ colorAcento, ctaTexto, whatsapp, mensajeWa }: Props) {
  const [visible, setVisible] = useState(false)

  // Mostrar solo después de scrollear un poco
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!whatsapp) return null

  return (
    <>
      <div
        className="sticky-mobile-cta"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
          zIndex: 90,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity .25s ease, transform .25s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <a
          href={whatsappLink(whatsapp, mensajeWa)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: colorAcento,
            color: '#fff',
            borderRadius: '14px',
            padding: '14px 20px',
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
            boxShadow: `0 10px 30px ${colorAcento}55, 0 4px 8px rgba(0,0,0,.12)`,
          }}
        >
          {ctaTexto} →
        </a>
      </div>

      <style>{`
        .sticky-mobile-cta { display: none; }
        @media (max-width: 768px) {
          .sticky-mobile-cta { display: block; }
        }
      `}</style>
    </>
  )
}
