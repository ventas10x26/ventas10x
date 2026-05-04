// Ruta destino: src/components/NavResponsive.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'

type NavLink = { href: string; label: string; isRoute?: boolean }

type Props = {
  links: NavLink[]
  ctaHref: string
  ctaLabel: string
}

export function NavResponsive({ links, ctaHref, ctaLabel }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(11,17,32,.97)', backdropFilter: 'blur(14px)',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
            <rect width="52" height="52" rx="13" fill="#FF6B2B"/>
            <rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/>
            <rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/>
            <rect x="28" y="16" width="7" height="28" rx="2" fill="white"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-.02em', color: '#fff' }}>
            Ventas<span style={{ color: '#FF6B2B' }}>10x</span>
          </span>
        </Link>

        {/* Links desktop */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }} className="nav-desktop">
          {links.map(({ href, label, isRoute }) =>
            isRoute || href.startsWith('/')
              ? <Link key={href} href={href} style={{ fontSize: '13px', color: 'rgba(255,255,255,.65)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</Link>
              : <a key={href} href={href} style={{ fontSize: '13px', color: 'rgba(255,255,255,.65)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</a>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* CTA — siempre visible */}
          <Link href={ctaHref} style={{
            background: '#FF6B2B', color: '#fff',
            padding: '10px 20px', borderRadius: '10px',
            fontSize: '13px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(255,107,43,0.35)',
          }}>
            {ctaLabel} →
          </Link>

          {/* Hamburger — solo mobile */}
          <button
            onClick={() => setOpen(o => !o)}
            className="nav-hamburger"
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

      {/* Menú mobile desplegable */}
      {open && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0,
          background: 'rgba(11,17,32,.98)', backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          zIndex: 49, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {links.map(({ href, label }) => (
            href.startsWith('/')
              ? <Link key={href} href={href} onClick={() => setOpen(false)} style={{
                  padding: '14px 16px', fontSize: '16px', fontWeight: 600,
                  color: 'rgba(255,255,255,.8)', textDecoration: 'none',
                  borderRadius: '12px', display: 'block',
                  borderBottom: '1px solid rgba(255,255,255,.05)',
                }}>{label}</Link>
              : <a key={href} href={href} onClick={() => setOpen(false)} style={{
                  padding: '14px 16px', fontSize: '16px', fontWeight: 600,
                  color: 'rgba(255,255,255,.8)', textDecoration: 'none',
                  borderRadius: '12px', display: 'block',
                  borderBottom: '1px solid rgba(255,255,255,.05)',
                }}>{label}</a>
          ))}
          <Link href="/auth/login" onClick={() => setOpen(false)} style={{
            padding: '14px 16px', fontSize: '16px', fontWeight: 600,
            color: 'rgba(255,255,255,.5)', textDecoration: 'none',
            borderRadius: '12px', display: 'block',
          }}>Ingresar</Link>
          <Link href={ctaHref} onClick={() => setOpen(false)} style={{
            marginTop: '8px', padding: '16px', textAlign: 'center',
            background: '#FF6B2B', color: '#fff', borderRadius: '12px',
            fontSize: '16px', fontWeight: 700, textDecoration: 'none',
            display: 'block', boxShadow: '0 4px 20px rgba(255,107,43,0.4)',
          }}>
            {ctaLabel} →
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}
