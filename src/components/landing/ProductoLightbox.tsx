// Ruta destino: src/components/landing/ProductoLightbox.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = {
  imagenes: string[]
  indiceInicial?: number
  nombre: string
  onClose: () => void
}

export function ProductoLightbox({ imagenes, indiceInicial = 0, nombre, onClose }: Props) {
  const [indice, setIndice] = useState(indiceInicial)

  const anterior = useCallback(() => {
    setIndice(i => (i === 0 ? imagenes.length - 1 : i - 1))
  }, [imagenes.length])

  const siguiente = useCallback(() => {
    setIndice(i => (i === imagenes.length - 1 ? 0 : i + 1))
  }, [imagenes.length])

  // Teclado: ESC cierra, flechas navegan
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') anterior()
      if (e.key === 'ArrowRight') siguiente()
    }
    window.addEventListener('keydown', handler)
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [anterior, siguiente, onClose])

  // Swipe en mobile
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX)
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) siguiente()
      else anterior()
    }
    setTouchStart(null)
  }

  if (imagenes.length === 0) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,.6), transparent)',
        zIndex: 2,
      }}>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
          {nombre}
        </div>
        <div style={{ color: 'rgba(255,255,255,.7)', fontSize: '0.8rem' }}>
          {indice + 1} / {imagenes.length}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,.1)',
            border: 'none',
            color: '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '1.25rem',
          }}
        >
          ✕
        </button>
      </div>

      {/* Imagen central */}
      <div
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagenes[indice]}
          alt={`${nombre} ${indice + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: '8px',
          }}
        />
      </div>

      {/* Flechas navegación (solo si hay más de 1) */}
      {imagenes.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); anterior() }}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,.1)',
              border: 'none',
              color: '#fff',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.5rem',
              backdropFilter: 'blur(8px)',
            }}
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); siguiente() }}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,.1)',
              border: 'none',
              color: '#fff',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.5rem',
              backdropFilter: 'blur(8px)',
            }}
            aria-label="Siguiente"
          >
            ›
          </button>
        </>
      )}

      {/* Thumbnails */}
      {imagenes.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.4rem',
            padding: '0.5rem',
            background: 'rgba(0,0,0,.5)',
            borderRadius: '12px',
            backdropFilter: 'blur(8px)',
            maxWidth: '90vw',
            overflowX: 'auto',
          }}
        >
          {imagenes.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndice(i)}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '6px',
                overflow: 'hidden',
                border: i === indice ? '2px solid #fff' : '2px solid transparent',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0,
                opacity: i === indice ? 1 : 0.6,
                transition: 'opacity .15s',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
