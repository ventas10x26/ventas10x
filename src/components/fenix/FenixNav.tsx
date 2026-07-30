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
        padding: '1rem 1.5rem',
        borderBottom: '1px solid rgba(23,18,14,.08)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250,247,244,.92)', backdropFilter: 'blur(14px)',
      }}>
        <a href="#inicio" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Fénix Consultores Empresariales S.A.S.">
          <FenixLogo uid="nav" size={34} />
        </a>

        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }} className="fenix-nav-desktop">
          {LINKS.map(({ href, label }) => (
            <a key={href} href={href} style={{ fontSize: '13px', color: 'rgba(23,18,14,.65)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="#contacto" className="fenix-nav-desktop" style={{
            background: ACCENT, color: '#050505',
            padding: '10px 22px', borderRadius: '999px',
            fontSize: '13px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
            boxShadow: `0 4px 18px ${ACCENT}55`,
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
            <span style={{ display: 'block', width: '22px', height: '2px', background: open ? 'transparent' : '#17120e', transition: 'all 0.2s', transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#17120e', transition: 'all 0.2s', transform: open ? 'rotate(-45deg)' : 'none', marginTop: open ? '-7px' : '0' }} />
          </button>
        </div>
      </nav>

      {open && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0,
          background: 'rgba(250,247,244,.98)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(23,18,14,.08)',
          zIndex: 49, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {LINKS.map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setOpen(false)} style={{
              padding: '14px 16px', fontSize: '16px', fontWeight: 600,
              color: 'rgba(23,18,14,.8)', textDecoration: 'none',
              borderRadius: '12px', display: 'block',
              borderBottom: '1px solid rgba(23,18,14,.06)',
            }}>{label}</a>
          ))}
          <a href="#contacto" onClick={() => setOpen(false)} style={{
            marginTop: '8px', padding: '16px', textAlign: 'center',
            background: ACCENT, color: '#050505', borderRadius: '999px',
            fontSize: '16px', fontWeight: 700, textDecoration: 'none',
            display: 'block', boxShadow: `0 4px 20px ${ACCENT}55`,
          }}>
            Diagnóstico Gratuito
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .fenix-nav-desktop { display: none !important; }
          .fenix-nav-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}
