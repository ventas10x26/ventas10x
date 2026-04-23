'use client'

import Link from 'next/link'

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 h-16"
      style={{ background: 'rgba(15,15,15,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>
        <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center text-base"
          style={{ background: 'var(--orange)' }}>
          📊
        </div>
        Ventas<span style={{ color: 'var(--orange)' }}>10x</span>
      </div>

      {/* Links */}
      <div className="hidden md:flex items-center gap-8">
        {[
          { href: '#como-funciona', label: 'Cómo funciona' },
          { href: '#bot-ia',        label: 'Bot IA' },
          { href: '#catalogo-ia',   label: 'Catálogo IA' },
          { href: '#sectores',      label: 'Sectores' },
          { href: '#precios',       label: 'Precios' },
        ].map(l => (
          <a key={l.href} href={l.href}
            className="text-sm font-medium transition-colors hover:text-white"
            style={{ color: '#cccccc', textDecoration: 'none' }}>
            {l.label}
          </a>
        ))}
        <Link href="/auth/login" className="text-sm font-medium text-white hover:text-white/80">
          Ingresar
        </Link>
      </div>

      {/* CTA */}
      <Link href="/auth/register"
        className="text-sm font-semibold text-white px-5 py-2.5 rounded-lg transition-all hover:-translate-y-px"
        style={{ background: 'var(--orange)', textDecoration: 'none' }}>
        Empezar gratis →
      </Link>
    </nav>
  )
}
