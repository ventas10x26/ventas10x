// Ruta destino: src/components/fenix/FenixNav.tsx
// Barra de navegación con el logotipo centrado y los enlaces repartidos a
// ambos lados. La rejilla es `1fr auto 1fr`: las dos columnas laterales miden
// lo mismo pase lo que pase, así que el logotipo queda en el centro óptico de
// la pantalla y no en el centro del espacio sobrante.
'use client'
import { useState } from 'react'
import { FenixLogo } from './FenixLogo'

const ACCENT = '#F5821F'

const IZQUIERDA = [
  { href: '#modelo', label: 'El Modelo' },
  { href: '#plataforma', label: 'Plataforma' },
  { href: '#tecnologia', label: 'Tecnología' },
]

const DERECHA = [
  { href: '#videos', label: 'Véalo en video' },
]

const TELEFONO = { label: 'Llamar', href: 'tel:+573215036414' }

export function FenixNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="fenix-nav">
        {/* Izquierda */}
        <div className="fenix-nav-lado fenix-nav-desktop">
          {IZQUIERDA.map(({ href, label }) => (
            <a key={href} href={href} className="fenix-nav-link">{label}</a>
          ))}
        </div>

        {/* Centro: logotipo */}
        <a
          href="#inicio"
          className="fenix-nav-marca"
          aria-label="Fénix Consultores Empresariales S.A.S."
        >
          <FenixLogo uid="nav" size={50} theme="dark" />
        </a>

        {/* Derecha */}
        <div className="fenix-nav-lado fenix-nav-der">
          <div className="fenix-nav-desktop fenix-nav-der-grupo">
            {DERECHA.map(({ href, label }) => (
              <a key={href} href={href} className="fenix-nav-link">{label}</a>
            ))}
            <a href={TELEFONO.href} className="fenix-pill fenix-pill-ghost">
              {TELEFONO.label} <IconoTel />
            </a>
            <a href="#contacto" className="fenix-pill fenix-pill-solid">
              Diagnóstico Gratuito
            </a>
          </div>

          <button
            onClick={() => setOpen(o => !o)}
            className="fenix-nav-hamburger"
            aria-label="Menú"
            aria-expanded={open}
          >
            <span style={{ background: open ? 'transparent' : '#fff', transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ background: '#fff', transform: open ? 'rotate(-45deg)' : 'none', marginTop: open ? '-7px' : '0' }} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="fenix-nav-panel">
          {[...IZQUIERDA, ...DERECHA].map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a href={TELEFONO.href} onClick={() => setOpen(false)} className="fenix-panel-tel">
            {TELEFONO.label} · +57 321 5036414
          </a>
          <a href="#contacto" onClick={() => setOpen(false)} className="fenix-panel-cta">
            Diagnóstico Gratuito
          </a>
        </div>
      )}

      <style>{`
        .fenix-nav {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 1.15rem 2rem;
          border-bottom: 1px solid rgba(255,255,255,.09);
          position: sticky; top: 0; z-index: 50;
          background: rgba(12,9,7,.94);
          backdrop-filter: blur(16px);
        }
        .fenix-nav-lado { display: flex; align-items: center; gap: 2rem; min-width: 0; }
        .fenix-nav-der { justify-content: flex-end; }
        .fenix-nav-der-grupo { display: flex; align-items: center; gap: 1.5rem; }
        .fenix-nav-marca { display: flex; align-items: center; justify-content: center; text-decoration: none; }

        .fenix-nav-link {
          font-size: 15.5px; font-weight: 500; white-space: nowrap;
          color: rgba(255,255,255,.82); text-decoration: none;
          transition: color .2s ease-out;
        }
        .fenix-nav-link:hover { color: ${ACCENT}; }

        .fenix-pill {
          display: inline-flex; align-items: center; gap: 8px;
          border-radius: 999px; padding: 12px 24px;
          font-size: 14.5px; font-weight: 700; white-space: nowrap;
          text-decoration: none;
          transition: background-color .25s ease-out, color .25s ease-out, border-color .25s ease-out;
        }
        .fenix-pill-ghost {
          border: 1px solid rgba(255,255,255,.28); color: #fff; background: transparent;
        }
        .fenix-pill-ghost:hover { border-color: ${ACCENT}; color: ${ACCENT}; }
        .fenix-pill-solid {
          background: ${ACCENT}; color: #12100C;
          box-shadow: 0 6px 24px ${ACCENT}45;
        }
        .fenix-pill-solid:hover { background: #ff9440; }

        .fenix-nav-hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 4px;
        }
        .fenix-nav-hamburger span {
          display: block; width: 24px; height: 2px; transition: all .2s;
        }

        .fenix-nav-panel {
          position: fixed; top: 88px; left: 0; right: 0; z-index: 49;
          background: rgba(12,9,7,.98); backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,.09);
          padding: 1.5rem;
          display: flex; flex-direction: column; gap: 4px;
        }
        .fenix-nav-panel a {
          padding: 16px; font-size: 17px; font-weight: 600;
          color: rgba(255,255,255,.86); text-decoration: none;
          border-radius: 12px; border-bottom: 1px solid rgba(255,255,255,.07);
        }
        .fenix-nav-panel .fenix-panel-tel { color: ${ACCENT}; border-bottom: none; }
        .fenix-nav-panel .fenix-panel-cta {
          margin-top: 8px; padding: 17px; text-align: center;
          background: ${ACCENT}; color: #12100C; border-radius: 999px;
          font-size: 16.5px; font-weight: 700; border-bottom: none;
          box-shadow: 0 6px 24px ${ACCENT}45;
        }

        /* Por debajo de 1180px los tres bloques ya no caben sin apretarse. */
        @media (max-width: 1180px) {
          .fenix-nav { grid-template-columns: auto 1fr; padding: 1.15rem 1.25rem; }
          .fenix-nav-desktop { display: none !important; }
          .fenix-nav-marca { justify-content: flex-start; }
          .fenix-nav-hamburger { display: flex !important; }
        }
        @media (max-width: 560px) {
          /* El lockup completo no cabe: se recorta la bajada del logotipo. */
          .fenix-nav-marca span:nth-child(2) > span:nth-child(2) { display: none; }
        }
      `}</style>
    </>
  )
}

function IconoTel() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  )
}
