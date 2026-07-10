'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const GRAD = 'linear-gradient(90deg, #38bdf8, #34d399, #a855f7)'
const gradText: React.CSSProperties = { backgroundImage: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }

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
    borderRadius: '12px', padding: 0, cursor: 'pointer', textAlign: 'left',
    position: 'relative', overflow: 'hidden', width: '100%',
    background: 'transparent', border: 'none', outline: 'none',
  }

  const inner = (active: boolean): React.CSSProperties => ({
    borderRadius: '12px', padding: '28px', position: 'relative', zIndex: 1,
    background: active ? 'rgba(56,189,246,0.07)' : 'rgba(255,255,255,0.03)',
    border: active ? '1px solid rgba(56,189,248,0.45)' : '1px solid rgba(255,255,255,0.09)',
    boxShadow: active ? '0 10px 30px rgba(56,189,248,0.16), 0 6px 16px rgba(168,85,247,0.1)' : 'none',
    transition: 'all .2s',
  })

  const icnStyle = (active: boolean): React.CSSProperties => ({
    width: '52px', height: '52px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1.25rem', position: 'relative',
    background: active ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${active ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.12)'}`,
  })

  const tagStyle = (active: boolean): React.CSSProperties => ({
    fontSize: '11px', fontWeight: 500,
    color: active ? '#f3f5fa' : '#9aa3ba',
    background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '6px', padding: '3px 9px', transition: 'all .2s',
  })

  return (
    <>
      <div style={{ width: '100%', padding: '2.5rem 0 1.5rem' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#9aa3ba', textAlign: 'center', marginBottom: '1.5rem' }}>
          Antes de continuar
        </p>

        <div className="segment-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%' }}>

          {/* ── CONCESIONARIO (izquierda) ── */}
          <button onClick={pickConcesionario} style={base}
            onMouseEnter={e => { if (elegido !== 'concesionario') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)' }}
            onMouseLeave={e => { if (elegido !== 'concesionario') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)' }}
          >
            <div className="seg-inner" style={inner(elegido === 'concesionario')}>
              <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '10px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: '#9aa3ba', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '6px', padding: '2px 9px' }}>Nuevo</div>
              <div style={icnStyle(elegido === 'concesionario')}>
                <span style={{ fontSize: '22px' }}>🏢</span>
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', fontFamily: "'Syne',sans-serif", letterSpacing: '-.2px', ...gradText }}>Soy el concesionario</div>
              <div style={{ fontSize: '13px', color: '#9aa3ba', lineHeight: 1.6, marginBottom: '1rem' }}>Visibilidad 360° del negocio: inventario, retomas, financiación, pólizas y accesorios.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['DataBridge 360', 'Todos los asesores', 'BI en tiempo real'].map(t => (
                  <span key={t} style={tagStyle(elegido === 'concesionario')}>{t}</span>
                ))}
              </div>
              {elegido === 'concesionario' && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '14px', fontSize: '12px', fontWeight: 600, color: '#f3f5fa' }}>→ Ver detalle</div>}
            </div>
          </button>

          {/* ── ASESOR (derecha) ── */}
          <button onClick={pickAsesor} style={base}
            onMouseEnter={e => { if (elegido !== 'asesor') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.borderColor = 'rgba(255,255,255,0.22)' }}
            onMouseLeave={e => { if (elegido !== 'asesor') (e.currentTarget.querySelector('.seg-inner') as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)' }}
          >
            <div className="seg-inner" style={inner(elegido === 'asesor')}>
              <div style={icnStyle(elegido === 'asesor')}>
                <span style={{ fontSize: '22px' }}>👤</span>
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px', fontFamily: "'Syne',sans-serif", letterSpacing: '-.2px', ...gradText }}>Soy asesor de ventas</div>
              <div style={{ fontSize: '13px', color: '#9aa3ba', lineHeight: 1.6, marginBottom: '1rem' }}>Un agente IA en mi WhatsApp que responde leads mientras trabajo en el concesionario.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['WhatsApp propio', 'Follow-up automático', '$99k/mes'].map(t => (
                  <span key={t} style={tagStyle(elegido === 'asesor')}>{t}</span>
                ))}
              </div>
              {elegido === 'asesor' && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '14px', fontSize: '12px', fontWeight: 600, color: '#f3f5fa' }}>↓ Ver más abajo</div>}
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
