// Ruta destino: src/components/fenix/FenixHeroSlider.tsx
// Slider del hero: alterna el panel del software con fotografia de personas y
// empresarios. La primera diapositiva es el producto, que es lo que sostiene el
// posicionamiento tecnologico; las fotos aportan el respaldo humano detras.
//
// Detalle de layout: la diapositiva del software va en el flujo normal y define
// la altura del escenario; las fotos se superponen con `inset: 0`. Asi no hace
// falta una altura fija y la tarjeta flotante del panel (que es absoluta y
// sobresale del recuadro) sigue funcionando sin recortarse.
'use client'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export type SlideFoto = { src: string; alt: string; titulo: string; pie: string }

type Props = {
  software: ReactNode
  fotos: SlideFoto[]
  /** ms por diapositiva */
  intervalo?: number
}

export function FenixHeroSlider({ software, fotos, intervalo = 5000 }: Props) {
  const total = fotos.length + 1
  const [activo, setActivo] = useState(0)
  const [pausado, setPausado] = useState(false)
  const reducido = useRef(false)

  useEffect(() => {
    reducido.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Precarga: evita que la primera rotacion muestre un marco vacio.
    fotos.forEach(f => { const i = new Image(); i.src = f.src })
  }, [fotos])

  useEffect(() => {
    if (pausado || reducido.current) return
    const t = setTimeout(() => setActivo(a => (a + 1) % total), intervalo)
    return () => clearTimeout(t)
  }, [activo, pausado, total, intervalo])

  const ir = useCallback((i: number) => setActivo(i), [])

  return (
    <div
      className="fx-hs"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="fx-hs-stage">
        {/* Diapositiva 0: el software. Define la altura del escenario. */}
        <div className={`fx-hs-slide fx-hs-soft${activo === 0 ? ' is-on' : ''}`}>
          {software}
        </div>

        {/* Diapositivas 1..n: personas y empresarios. */}
        {fotos.map((f, i) => (
          <div key={f.src} className={`fx-hs-slide fx-hs-foto${activo === i + 1 ? ' is-on' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.src} alt={f.alt} loading={i === 0 ? 'eager' : 'lazy'} />
            <div className="fx-hs-veil" aria-hidden="true" />
            <div className="fx-hs-cap">
              <span className="fx-hs-cap-t">{f.titulo}</span>
              <span className="fx-hs-cap-d">{f.pie}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div className="fx-hs-nav">
        <span className="fx-hs-etq">
          {activo === 0 ? 'La plataforma' : fotos[activo - 1].titulo}
        </span>
        <div className="fx-hs-dots">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => ir(i)}
              className={`fx-hs-dot${activo === i ? ' is-on' : ''}`}
              aria-label={i === 0 ? 'Ver la plataforma' : `Ver ${fotos[i - 1].titulo}`}
              aria-current={activo === i}
            />
          ))}
        </div>
      </div>

      <style>{`
        .fx-hs { width: 100%; }
        .fx-hs-stage { position: relative; }

        .fx-hs-slide {
          opacity: 0;
          transition: opacity .8s cubic-bezier(.22,.61,.36,1);
        }
        .fx-hs-slide.is-on { opacity: 1; }

        /* El software queda en flujo: es la referencia de altura. */
        .fx-hs-soft { position: relative; z-index: 1; }
        .fx-hs-soft.is-on { z-index: 3; }

        .fx-hs-foto {
          position: absolute; inset: 0; z-index: 2;
          border-radius: 24px; overflow: hidden;
          box-shadow: 0 1px 2px rgba(20,16,12,.04), 0 24px 60px rgba(20,16,12,.14);
          pointer-events: none;
        }
        .fx-hs-foto.is-on { pointer-events: auto; z-index: 4; }
        .fx-hs-foto img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          transform: scale(1.06);
          transition: transform 6.5s ease-out;
        }
        .fx-hs-foto.is-on img { transform: scale(1); }
        .fx-hs-veil {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(20,16,12,.82) 0%, rgba(20,16,12,.28) 42%, rgba(20,16,12,0) 68%);
        }
        .fx-hs-cap {
          position: absolute; left: 26px; right: 26px; bottom: 24px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .fx-hs-cap-t {
          font-size: 11px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: #F5821F;
        }
        .fx-hs-cap-d {
          font-size: 15px; font-weight: 600; line-height: 1.45; color: #fff;
          max-width: 26rem;
        }

        /* Controles: por debajo del escenario, dejando aire para la tarjeta
           flotante del panel, que sobresale hacia abajo. */
        .fx-hs-nav {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin-top: 64px;
        }
        .fx-hs-etq {
          font-size: 11px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: rgba(20,16,12,.4);
        }
        .fx-hs-dots { display: flex; align-items: center; gap: 7px; }
        .fx-hs-dot {
          width: 8px; height: 8px; padding: 0; border: none; cursor: pointer;
          border-radius: 999px; background: rgba(20,16,12,.16);
          transition: width .3s ease-out, background-color .3s ease-out;
        }
        .fx-hs-dot:hover { background: rgba(20,16,12,.34); }
        .fx-hs-dot.is-on { width: 26px; background: #F5821F; }

        @media (max-width: 1080px) {
          /* La tarjeta flotante pasa a flujo normal: ya no hace falta reservar. */
          .fx-hs-nav { margin-top: 20px; }
          .fx-hs-foto { position: absolute; }
        }
        @media (max-width: 560px) {
          .fx-hs-cap { left: 18px; right: 18px; bottom: 18px; }
          .fx-hs-cap-d { font-size: 13.5px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fx-hs-slide, .fx-hs-foto img { transition: none; }
          .fx-hs-foto img { transform: none; }
        }
      `}</style>
    </div>
  )
}
