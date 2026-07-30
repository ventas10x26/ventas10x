// Ruta destino: src/components/fenix/FenixNav.tsx
'use client'
import { useState } from 'react'
import { FenixLogo } from './FenixLogo'

const ACCENT = '#F5821F'

const LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#modelo', label: 'El Modelo' },
  { href: '#plataforma', label: 'Plataforma' },
  { href: '#tecnologia', label: 'Tecnología' },
]

export function FenixNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.15rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,.09)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(12,9,7,.94)', backdropFilter: 'blur(16px)',
      }}>
        <a href="#inicio" className="fenix-nav-marca" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Fénix Consultores Empresariales S.A.S.">
          <FenixLogo uid="nav" size={50} theme="dark" />
        </a>

        <div style={{ display: 'flex', gap: '2.25rem', alignItems: 'center' }} className="fenix-nav-desktop">
          {LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="fenix-nav-link" style={{
              fontSize: '15.5px', color: 'rgba(255,255,255,.82)', textDecoration: 'none',
              fontWeight: 500, whiteSpace: 'nowrap',
            }}>{label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="#contacto" className="fenix-nav-desktop" style={{
            background: ACCENT, color: '#12100C',
            padding: '13px 28px', borderRadius: '999px',
            fontSize: '15px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
            boxShadow: `0 6px 24px ${ACCENT}45`,
          }}>
            Diagnóstico Gratuito
          </a>

          <button
            onClick={() => setOpen(o => !o)}
            className="fenix-nav-hamburger"
            style={{
              display: 'none', flexDirection: 'column', gap: '5px',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', borderRadius: '8px',
            }}
            aria-label="Menú"
          >
            <span style={{ display: 'block', width: '24px', height: '2px', background: open ? 'transparent' : '#fff', transition: 'all 0.2s', transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: '24px', height: '2px', background: '#fff', transition: 'all 0.2s', transform: open ? 'rotate(-45deg)' : 'none', marginTop: open ? '-7px' : '0' }} />
          </button>
        </div>
      </nav>

      {open && (
        <div style={{
          position: 'fixed', top: '88px', left: 0, right: 0,
          background: 'rgba(12,9,7,.98)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,.09)',
          zIndex: 49, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {LINKS.map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setOpen(false)} style={{
              padding: '16px', fontSize: '17px', fontWeight: 600,
              color: 'rgba(255,255,255,.86)', textDecoration: 'none',
              borderRadius: '12px', display: 'block',
              borderBottom: '1px solid rgba(255,255,255,.07)',
            }}>{label}</a>
          ))}
          <a href="#contacto" onClick={() => setOpen(false)} style={{
            marginTop: '12px', padding: '17px', textAlign: 'center',
            background: ACCENT, color: '#12100C', borderRadius: '999px',
            fontSize: '16.5px', fontWeight: 700, textDecoration: 'none',
            display: 'block', boxShadow: `0 6px 24px ${ACCENT}45`,
          }}>
            Diagnóstico Gratuito
          </a>
        </div>
      )}

      <style>{`
        .fenix-nav-link { transition: color .2s ease-out; }
        .fenix-nav-link:hover { color: ${ACCENT} !important; }
        @media (max-width: 860px) {
          .fenix-nav-desktop { display: none !important; }
          .fenix-nav-hamburger { display: flex !important; }
        }
        @media (max-width: 560px) {
          /* El lockup completo no cabe: se recorta el bajada del logotipo. */
          .fenix-nav-marca span:nth-child(2) > span:nth-child(2) { display: none; }
        }
      `}</style>
    </>
  )
}
