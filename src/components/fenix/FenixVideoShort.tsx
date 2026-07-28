// Ruta destino: src/components/fenix/FenixVideoShort.tsx
// Reproductor de YouTube Shorts con patrón "facade": muestra la miniatura y
// solo carga el iframe cuando el usuario hace clic. Evita cargar 2-3 iframes
// de YouTube en el arranque de la landing (costo alto de LCP en una página
// cuyo objetivo es convertir).
'use client'
import { useState } from 'react'

const ACCENT = '#F5821F'

type Props = {
  videoId: string
  /** Texto accesible del botón de reproducción */
  label: string
}

export function FenixVideoShort({ videoId, label }: Props) {
  const [playing, setPlaying] = useState(false)

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '300px',
      aspectRatio: '9 / 16',
      borderRadius: '26px',
      overflow: 'hidden',
      border: `2px solid ${ACCENT}55`,
      background: '#0d0a08',
      boxShadow: '0 24px 60px rgba(0,0,0,.5)',
    }}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
        />
      ) : (
        <button
          onClick={() => setPlaying(true)}
          aria-label={label}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            padding: 0, border: 'none', cursor: 'pointer', background: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Miniatura de YouTube, recortada al formato vertical */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transform: 'scale(1.45)', // recorta las bandas negras del hqdefault
            }}
          />
          {/* Velo para legibilidad del botón */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.55))',
          }} />
          <span className="fenix-video-play" style={{
            position: 'relative',
            width: '68px', height: '68px', borderRadius: '50%',
            background: ACCENT, color: '#16110d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 30px ${ACCENT}70`,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        </button>
      )}

      <style>{`
        .fenix-video-play { transition: transform .25s ease-out; }
        button:hover .fenix-video-play { transform: scale(1.09); }
        @media (prefers-reduced-motion: reduce) {
          button:hover .fenix-video-play { transform: none; }
        }
      `}</style>
    </div>
  )
}
