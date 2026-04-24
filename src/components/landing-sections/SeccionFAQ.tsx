// Ruta destino: src/components/landing-sections/SeccionFAQ.tsx
'use client'

import { useState } from 'react'
import { ContenidoFAQ } from '@/types/secciones'

type Props = {
  titulo?: string | null
  subtitulo?: string | null
  contenido: ContenidoFAQ
  colorAcento?: string
}

export function SeccionFAQ({ titulo, subtitulo, contenido, colorAcento = '#FF6B2B' }: Props) {
  const items = contenido?.items || []
  const [abierto, setAbierto] = useState<string | null>(null)

  if (items.length === 0) return null

  return (
    <section style={{ padding: '4rem 1.5rem', background: '#fff' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        {titulo && (
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700,
            textAlign: 'center',
            color: '#0f1c2e',
            marginBottom: subtitulo ? '0.5rem' : '2.5rem',
          }}>
            {titulo}
          </h2>
        )}
        {subtitulo && (
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2.5rem' }}>
            {subtitulo}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item) => {
            const estaAbierto = abierto === item.id
            return (
              <div
                key={item.id}
                style={{
                  border: `1px solid ${estaAbierto ? colorAcento : 'rgba(0,0,0,.1)'}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'border-color .2s',
                }}
              >
                <button
                  onClick={() => setAbierto(estaAbierto ? null : item.id)}
                  style={{
                    width: '100%', padding: '1rem 1.25rem', background: 'transparent',
                    border: 'none', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', cursor: 'pointer', textAlign: 'left',
                    fontSize: '1rem', fontWeight: 600, color: '#0f1c2e',
                  }}
                >
                  <span>{item.pregunta}</span>
                  <span style={{
                    fontSize: '1.25rem',
                    color: colorAcento,
                    transform: estaAbierto ? 'rotate(45deg)' : 'rotate(0)',
                    transition: 'transform .2s',
                    flexShrink: 0,
                    marginLeft: '1rem',
                  }}>+</span>
                </button>
                {estaAbierto && (
                  <div style={{
                    padding: '0 1.25rem 1.25rem',
                    color: '#475569',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {item.respuesta}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
