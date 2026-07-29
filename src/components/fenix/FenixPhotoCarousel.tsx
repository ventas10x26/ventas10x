// Ruta destino: src/components/fenix/FenixPhotoCarousel.tsx
// Transición suave entre fotos reales, con un leve zoom (Ken Burns) para que
// la imagen activa no se vea estática. Respeta prefers-reduced-motion.
'use client'
import { useEffect, useState } from 'react'

export type Foto = { src: string; alt: string }

type Props = {
  fotos: Foto[]
  /** ms que permanece cada foto */
  intervalo?: number
}

export function FenixPhotoCarousel({ fotos, intervalo = 4200 }: Props) {
  const [activa, setActiva] = useState(0)

  // Precarga las fotos siguientes tras el montaje. Sin esto, al rotar se
  // mostraba un marco vacío: `loading="lazy"` difiere las imágenes apiladas
  // (opacity 0) y no alcanzan a descargarse antes de su turno.
  useEffect(() => {
    fotos.slice(1).forEach(f => {
      const img = new Image()
      img.src = f.src
    })
  }, [fotos])

  useEffect(() => {
    if (fotos.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const id = setInterval(() => {
      setActiva(i => (i + 1) % fotos.length)
    }, intervalo)
    return () => clearInterval(id)
  }, [fotos.length, intervalo])

  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '4 / 3',
      borderRadius: '28px', overflow: 'hidden',
      background: '#e8e0d7',
      boxShadow: '0 30px 70px rgba(23,18,14,.16)',
    }}>
      {fotos.map((f, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={f.src}
          src={f.src}
          alt={i === activa ? f.alt : ''}
          aria-hidden={i !== activa}
          className={`fenix-carousel-img${i === activa ? ' is-active' : ''}`}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}

      {/* Degradado inferior para que el card superpuesto siempre tenga contraste */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(23,18,14,0) 45%, rgba(23,18,14,.55) 100%)',
      }} />

      {/* Indicadores */}
      <div style={{
        position: 'absolute', bottom: '16px', right: '18px',
        display: 'flex', gap: '6px', zIndex: 2,
      }}>
        {fotos.map((f, i) => (
          <button
            key={f.src}
            onClick={() => setActiva(i)}
            aria-label={`Ver foto ${i + 1}`}
            aria-current={i === activa}
            style={{
              width: i === activa ? '22px' : '7px', height: '7px',
              borderRadius: '999px', border: 'none', padding: 0, cursor: 'pointer',
              background: i === activa ? '#fff' : 'rgba(255,255,255,.5)',
              transition: 'width .35s ease, background-color .35s ease',
            }}
          />
        ))}
      </div>

      <style>{`
        .fenix-carousel-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transform: scale(1.06);
          transition: opacity 1.1s ease, transform 6s ease-out;
        }
        .fenix-carousel-img.is-active {
          opacity: 1;
          transform: scale(1);
        }
        @media (prefers-reduced-motion: reduce) {
          .fenix-carousel-img { transition: opacity .2s linear; transform: none; }
          .fenix-carousel-img.is-active { transform: none; }
        }
      `}</style>
    </div>
  )
}
