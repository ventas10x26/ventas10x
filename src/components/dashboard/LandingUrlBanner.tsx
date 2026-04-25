// Ruta destino: src/components/dashboard/LandingUrlBanner.tsx
// Se oculta automáticamente en /dashboard (la pagina Resumen) porque ahí
// ya hay un card grande con la URL. Aparece en todas las demás páginas.

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'

type Props = {
  slug: string
}

export function LandingUrlBanner({ slug }: Props) {
  const pathname = usePathname()
  const [oculto, setOculto] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    const guardado = localStorage.getItem('landing-url-banner-oculto')
    if (guardado === 'true') setOculto(true)
  }, [])

  if (!slug) return null

  // No mostrar en el Resumen (ya hay un card grande ahí)
  if (pathname === '/dashboard') return null

  const landingUrl = `${BASE_URL}/u/${slug}`

  const ocultar = () => {
    setOculto(true)
    localStorage.setItem('landing-url-banner-oculto', 'true')
  }

  const mostrar = () => {
    setOculto(false)
    localStorage.removeItem('landing-url-banner-oculto')
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(landingUrl)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // ignorar
    }
  }

  if (oculto) {
    return (
      <button
        onClick={mostrar}
        title="Mostrar URL de mi landing"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          marginLeft: 'auto',
          marginRight: '0.75rem',
          marginTop: '0.5rem',
          padding: '6px 12px',
          background: 'rgba(15,28,46,0.92)',
          color: '#93c5fd',
          border: '1px solid rgba(29,78,216,.4)',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          alignSelf: 'flex-end',
        }}
      >
        🔗 Mostrar URL
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'linear-gradient(135deg, #0f1c2e 0%, #1a1a2e 100%)',
        borderBottom: '1px solid rgba(29,78,216,.25)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.4)', marginBottom: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          🔗 Tu landing
        </div>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: '#93c5fd',
          wordBreak: 'break-all',
          fontFamily: 'monospace',
        }}>
          {landingUrl}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
        <button
          onClick={copiar}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,.12)',
            background: copiado ? 'rgba(34,197,94,.2)' : 'rgba(255,255,255,.06)',
            color: copiado ? '#86efac' : 'rgba(255,255,255,.75)',
            cursor: 'pointer',
            transition: 'all .15s',
            whiteSpace: 'nowrap',
          }}
        >
          {copiado ? '✓ Copiado' : 'Copiar'}
        </button>

        <a
          href={landingUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(29,78,216,.4)',
            background: 'rgba(29,78,216,.18)',
            color: '#93c5fd',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Ver →
        </a>

        <button
          onClick={ocultar}
          title="Ocultar este banner"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,.4)',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'background .15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,.08)')}
          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
