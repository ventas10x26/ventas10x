'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Variables definidas por next/font/google en src/app/pulse/layout.tsx
const F_DISPLAY = "var(--font-oswald), sans-serif"
const F_MONO    = "var(--font-mono), monospace"

export function SegmentSelector() {
  const router = useRouter()
  const [elegido, setElegido] = useState<'asesor' | 'concesionario' | null>(null)

  const pickConcesionario = () => {
    setElegido('concesionario')
    router.push('/pulse/databridge')
  }

  const pickAsesor = () => {
    setElegido('asesor')
    setTimeout(() => {
      document.getElementById('pm-hero-headline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  const base: React.CSSProperties = {
    borderRadius: '6px', padding: 0, cursor: 'pointer', textAlign: 'left',
    position: 'relative', overflow: 'hidden', width: '100%',
    background: 'transparent', border: 'none', outline: 'none',
  }

  const inner = (active: boolean): React.CSSProperties => ({
    borderRadius: '6px', padding: '24px', position: 'relative', zIndex: 1,
    background: active ? 'rgba(242,169,59,0.05)' : 'var(--bg-1, #14120F)',
    border: active ? '1px solid var(--amber-dim, #8A6423)' : '1px solid var(--line, #2A2620)',
    transition: 'border-color .2s, background-color .2s',
  })

  const icnStyle = (active: boolean): React.CSSProperties => ({
    width: '44px', height: '44px', borderRadius: '4px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1rem', position: 'relative',
    background: 'transparent',
    border: `1px solid ${active ? 'var(--amber-dim, #8A6423)' : 'var(--line, #2A2620)'}`,
  })

  const tagStyle = (): React.CSSProperties => ({
    fontSize: '11px', fontFamily: F_MONO, textTransform: 'uppercase', letterSpacing: '.4px',
    color: 'var(--ink-dim, #9B958A)',
    border: '1px solid var(--line, #2A2620)',
    borderRadius: '3px', padding: '3px 8px',
  })

  return (
    <>
      <div style={{ width: '100%', padding: '2.5rem 0 1.5rem' }}>
        <p style={{ fontSize: '11px', fontFamily: F_MONO, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink-dim, #9B958A)', textAlign: 'center', marginBottom: '1.5rem' }}>
          Antes de continuar
        </p>

        <div className="segment-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%' }}>

          {/* ── CONCESIONARIO (izquierda) ── */}
          <button onClick={pickConcesionario} style={base}
            onMouseEnter={e => { if (elegido !== 'concesionario') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.borderColor = 'var(--ink-dim, #9B958A)' }}
            onMouseLeave={e => { if (elegido !== 'concesionario') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.borderColor = 'var(--line, #2A2620)' }}
          >
            <div className="seg-inner" style={inner(elegido === 'concesionario')}>
              <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '10px', fontFamily: F_MONO, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-dim, #9B958A)', border: '1px solid var(--line, #2A2620)', borderRadius: '3px', padding: '2px 8px' }}>Nuevo</div>
              <div style={icnStyle(elegido === 'concesionario')}>
                <span style={{ fontSize: '20px' }}>🏢</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', fontFamily: F_DISPLAY, textTransform: 'uppercase', letterSpacing: '.3px', color: elegido === 'concesionario' ? 'var(--amber, #F2A93B)' : 'var(--ink, #F3EFE7)' }}>Soy el concesionario</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-dim, #9B958A)', lineHeight: 1.6, marginBottom: '1rem' }}>Visibilidad 360° del negocio: inventario, retomas, financiación, pólizas y accesorios.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['DataBridge 360', 'Todos los asesores', 'BI en tiempo real'].map(t => (
                  <span key={t} style={tagStyle()}>{t}</span>
                ))}
              </div>
              {elegido === 'concesionario' && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '14px', fontSize: '11px', fontFamily: F_MONO, textTransform: 'uppercase', color: 'var(--green, #3ECF7E)' }}>→ Ver detalle</div>}
            </div>
          </button>

          {/* ── ASESOR (derecha) ── */}
          <button onClick={pickAsesor} style={base}
            onMouseEnter={e => { if (elegido !== 'asesor') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.borderColor = 'var(--ink-dim, #9B958A)' }}
            onMouseLeave={e => { if (elegido !== 'asesor') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.borderColor = 'var(--line, #2A2620)' }}
          >
            <div className="seg-inner" style={inner(elegido === 'asesor')}>
              <div style={icnStyle(elegido === 'asesor')}>
                <span style={{ fontSize: '20px' }}>👤</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', fontFamily: F_DISPLAY, textTransform: 'uppercase', letterSpacing: '.3px', color: elegido === 'asesor' ? 'var(--amber, #F2A93B)' : 'var(--ink, #F3EFE7)' }}>Soy asesor de ventas</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-dim, #9B958A)', lineHeight: 1.6, marginBottom: '1rem' }}>Un agente IA en mi WhatsApp que cubre el turno mientras trabajo en el concesionario.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['WhatsApp propio', 'Relevo automático', '$99k/mes'].map(t => (
                  <span key={t} style={tagStyle()}>{t}</span>
                ))}
              </div>
              {elegido === 'asesor' && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '14px', fontSize: '11px', fontFamily: F_MONO, textTransform: 'uppercase', color: 'var(--green, #3ECF7E)' }}>↓ Ver más abajo</div>}
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
