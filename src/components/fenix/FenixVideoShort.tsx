// Ruta destino: src/components/fenix/FenixVideoShort.tsx
//
// Estrategia para que el video se vea "sin querer" (patron Reels/Shorts):
//
//  1. poster  → nada cargado. Cero costo mientras el video esta lejos.
//  2. preview → al entrar en pantalla se carga el embed en SILENCIO, en
//               bucle y sin controles. El movimiento periferico atrae la
//               mirada: el usuario ya esta "viendo" sin haber decidido.
//  3. full    → un toque activa el sonido y los controles. El unico paso
//               consciente es subir el volumen a algo que ya esta viendo.
//
// Al salir de pantalla vuelve a poster: se descarga el iframe para no
// dejar dos videos corriendo a la vez.
'use client'
import { useEffect, useRef, useState } from 'react'

const ACCENT = '#F5821F'

type Modo = 'poster' | 'preview' | 'full'

type Props = {
  videoId: string
  label: string
}

function IconSonido() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

export function FenixVideoShort({ videoId, label }: Props) {
  const [modo, setModo] = useState<Modo>('poster')
  const ref = useRef<HTMLDivElement>(null)
  const modoRef = useRef<Modo>('poster')
  modoRef.current = modo

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Si el usuario pidió menos movimiento, no se autorreproduce nada.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (modoRef.current === 'poster') setModo('preview')
        } else if (modoRef.current === 'preview') {
          setModo('poster') // libera el iframe al salir de pantalla
        }
      },
      { threshold: 0.55 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const base = `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`
  const src =
    modo === 'full'
      ? `${base}&autoplay=1&mute=0&controls=1`
      : `${base}&autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '300px',
        aspectRatio: '9 / 16',
        borderRadius: '26px',
        overflow: 'hidden',
        border: `2px solid ${ACCENT}55`,
        background: '#0d0a08',
        boxShadow: '0 24px 60px rgba(0,0,0,.5)',
      }}
    >
      {modo === 'poster' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', transform: 'scale(1.45)',
          }}
        />
      ) : (
        <iframe
          src={src}
          title={label}
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', border: 0,
            // El preview sin controles se amplia un poco para tapar el
            // encuadre del reproductor y que se lea como video nativo.
            transform: modo === 'preview' ? 'scale(1.35)' : 'none',
          }}
        />
      )}

      {/* Capa de invitación: solo mientras no hay sonido */}
      {modo !== 'full' && (
        <button
          onClick={() => setModo('full')}
          aria-label={`${label} (activar sonido)`}
          className="fenix-video-capa"
        >
          <span className="fenix-video-pill">
            <IconSonido />
            {modo === 'preview' ? 'Toca para activar el sonido' : 'Ver video'}
          </span>
        </button>
      )}

      <style>{`
        .fenix-video-capa {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          padding: 0;
          cursor: pointer;
          background: linear-gradient(180deg, rgba(0,0,0,.05) 40%, rgba(0,0,0,.55) 100%);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 20px;
        }
        .fenix-video-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,.94);
          color: #17120e;
          border-radius: 999px;
          padding: 10px 18px;
          font-size: 12.5px;
          font-weight: 700;
          font-family: inherit;
          box-shadow: 0 8px 24px rgba(0,0,0,.35);
          transition: transform .25s ease-out, background-color .25s ease-out;
        }
        .fenix-video-capa:hover .fenix-video-pill {
          transform: translateY(-3px);
          background: ${ACCENT};
          color: #fff;
        }
        @media (prefers-reduced-motion: reduce) {
          .fenix-video-capa:hover .fenix-video-pill { transform: none; }
        }
      `}</style>
    </div>
  )
}
