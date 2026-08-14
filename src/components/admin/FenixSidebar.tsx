// Ruta destino: src/components/admin/FenixSidebar.tsx
// Menú lateral compartido por todas las páginas de /admin/fenix (ver
// src/app/admin/fenix/layout.tsx). Fondo oscuro fijo, independiente del
// tema claro/oscuro que cada página de agente pueda tener -- así la
// navegación se ve igual sin importar en qué sección estés.
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ACCENT = '#F5821F'

const ITEMS = [
  { href: '/admin/fenix/visitas', label: 'Visitas de la landing', icon: '📊' },
  { href: '/admin/fenix', label: 'Leads y pipeline', icon: '🗂️', exact: true },
  { href: '/admin/fenix/agente', label: 'Agente de cobro', icon: '🤖' },
  { href: '/admin/fenix/leads-agente', label: 'Agente de leads', icon: '💬' },
] as const

export function FenixSidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 232, flexShrink: 0, background: '#14100C', minHeight: '100vh',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      padding: '24px 14px', boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ padding: '0 10px', marginBottom: 28 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: ACCENT }}>
          Fénix
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>
          Consultores
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {ITEMS.map((item) => {
          const activo = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                color: activo ? '#fff' : 'rgba(255,255,255,0.55)',
                background: activo ? `${ACCENT}25` : 'transparent',
                borderLeft: activo ? `3px solid ${ACCENT}` : '3px solid transparent',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
