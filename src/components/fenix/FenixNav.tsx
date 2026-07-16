// Ruta destino: src/components/fenix/FenixNav.tsx
'use client'
import { useState } from 'react'

const ACCENT = '#F5821F'

const LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#empresa', label: 'Empresa' },
  { href: '#servicios', label: 'Servicios de Derecho' },
  { href: '#cartera', label: 'Gestión Cartera' },
]

function FlameLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 2c1 5-3 6-3 10 0 2 1 3 2 3-1-2 0-4 1-5 0 3 3 4 3 7 0 4-3 7-7 7s-7-3-7-7c0-6 5-8 7-13 1-1 2-2 4-2z"
        fill={ACCENT}
      />
    </svg>
  )
}

export function FenixNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(6,10,18,.97)', backdropFilter: 'blur(14px)',
      }}>
        <a href="#inicio" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <FlameLogo />
          <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-.02em', color: '#fff', lineHeight: 1.1 }}>
            Fenix <span style={{ fontWeight: 500, color: 'rgba(255,255,255,.55)' }}>Consultores</span>
          </span>
        </a>

        <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }} className="fenix-nav-desktop">
          {LINKS.map(({ href, label }) => (
            <a key={href} href={href} style={{ fontSize: '13px', color: 'rgba(255,255,255,.65)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="#contacto" className="fenix-nav-desktop" style={{
            background: ACCENT, color: '#050505',
            padding: '10px 22px', borderRadius: '999px',
            fontSize: '13px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
            boxShadow: `0 4px 18px ${ACCENT}55`,
          }}>
            Contáctanos!
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
            <span style={{ display: 'block', width: '22px', height: '2px', background: open ? 'transparent' : '#fff', transition: 'all 0.2s', transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', transition: 'all 0.2s', transform: open ? 'rotate(-45deg)' : 'none', marginTop: open ? '-7px' : '0' }} />
          </button>
        </div>
      </nav>

      {open && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0,
          background: 'rgba(6,10,18,.98)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          zIndex: 49, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {LINKS.map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setOpen(false)} style={{
              padding: '14px 16px', fontSize: '16px', fontWeight: 600,
              color: 'rgba(255,255,255,.8)', textDecoration: 'none',
              borderRadius: '12px', display: 'block',
              borderBottom: '1px solid rgba(255,255,255,.05)',
            }}>{label}</a>
          ))}
          <a href="#contacto" onClick={() => setOpen(false)} style={{
            marginTop: '8px', padding: '16px', textAlign: 'center',
            background: ACCENT, color: '#050505', borderRadius: '999px',
            fontSize: '16px', fontWeight: 700, textDecoration: 'none',
            display: 'block', boxShadow: `0 4px 20px ${ACCENT}55`,
          }}>
            Contáctanos!
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
