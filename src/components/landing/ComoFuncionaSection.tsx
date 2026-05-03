// Ruta destino: src/components/landing/ComoFuncionaSection.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

type Paso = { titulo: string; descripcion: string }
type Props = {
  pasos: Paso[]
  colorAcento: string
}

export function ComoFuncionaSection({ pasos, colorAcento }: Props) {
  const [visible, setVisible] = useState<boolean[]>(pasos.map(() => false))
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers = refs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisible(prev => {
                const next = [...prev]
                next[i] = true
                return next
              })
            }, i * 180)
            obs.disconnect()
          }
        },
        { threshold: 0.2 }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  if (!pasos || pasos.length === 0) return null

  const icons = ['🎯', '⚡', '✅', '🚀']

  return (
    <section style={{
      padding: '80px 24px',
      background: 'linear-gradient(160deg, #0b1120 0%, #0f1c2e 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow decorativo */}
      <div style={{
        position: 'absolute', top: '-100px', left: '50%',
        transform: 'translateX(-50%)',
        width: '600px', height: '300px',
        background: `radial-gradient(ellipse, ${colorAcento}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: `${colorAcento}15`,
            border: `1px solid ${colorAcento}40`,
            borderRadius: '100px',
            padding: '6px 16px',
            marginBottom: '20px',
          }}>
            <span style={{ fontSize: '12px', color: colorAcento, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Proceso simple
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 700,
            color: '#f8fafc',
            margin: '0',
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
          }}>
            Así de fácil funciona
          </h2>
          <p style={{
            fontSize: 'clamp(16px, 1.8vw, 19px)',
            color: '#64748b',
            marginTop: '14px',
            maxWidth: '480px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6,
          }}>
            Sin formularios complicados. Solo escríbeme y empezamos.
          </p>
        </div>

        {/* Pasos */}
        <div className="pasos-grid">
          {pasos.map((p, i) => (
            <div
              key={i}
              ref={el => { refs.current[i] = el }}
              style={{
                opacity: visible[i] ? 1 : 0,
                transform: visible[i] ? 'translateY(0)' : 'translateY(32px)',
                transition: 'opacity 0.55s ease, transform 0.55s ease',
                position: 'relative',
              }}
            >
              {/* Línea conectora (excepto último) */}
              {i < pasos.length - 1 && (
                <div className="conector" style={{
                  position: 'absolute',
                  top: '28px',
                  left: 'calc(100% - 24px)',
                  width: 'calc(100% - 32px)',
                  height: '1px',
                  background: `linear-gradient(90deg, ${colorAcento}60, ${colorAcento}10)`,
                  zIndex: 0,
                }} />
              )}

              {/* Card */}
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '32px 28px',
                position: 'relative',
                zIndex: 1,
                transition: 'border-color 0.2s, background 0.2s',
                cursor: 'default',
              }}
                className="paso-card"
              >
                {/* Número grande de fondo */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '20px',
                  fontSize: '72px',
                  fontWeight: 900,
                  color: 'rgba(255,255,255,0.03)',
                  lineHeight: 1,
                  userSelect: 'none',
                  letterSpacing: '-0.05em',
                }}>
                  {i + 1}
                </div>

                {/* Ícono */}
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: `${colorAcento}20`,
                  border: `1px solid ${colorAcento}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  marginBottom: '20px',
                }}>
                  {icons[i] || '⭐'}
                </div>

                {/* Step number badge */}
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colorAcento,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
                  Paso {i + 1}
                </div>

                <div style={{
                  fontSize: 'clamp(18px, 2vw, 22px)',
                  fontWeight: 700,
                  color: '#f1f5f9',
                  marginBottom: '10px',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}>
                  {p.titulo}
                </div>

                <div style={{
                  fontSize: '15px',
                  color: '#64748b',
                  lineHeight: 1.65,
                }}>
                  {p.descripcion}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .pasos-grid {
          display: grid;
          grid-template-columns: repeat(${pasos.length}, 1fr);
          gap: 20px;
          align-items: start;
        }
        .paso-card:hover {
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(255,255,255,0.15) !important;
        }
        @media (max-width: 720px) {
          .pasos-grid { grid-template-columns: 1fr; gap: 16px; }
          .conector { display: none; }
        }
      `}</style>
    </section>
  )
}
