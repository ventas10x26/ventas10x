// Ruta destino: src/components/dashboard/DashboardLayout.tsx
// REEMPLAZA. Cambios:
// - Agrega "Mi plan" como menú principal con submenú
// - Inyecta SuscripcionBanner debajo del header

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { LandingUrlBanner } from './LandingUrlBanner'
import { SuscripcionBanner } from './SuscripcionBanner'

type SubItem = { href: string; label: string; icon?: string }
type NavItem = {
  href: string
  label: string
  icon: string
  subitems?: SubItem[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Resumen', icon: '▦' },
  { href: '/dashboard/leads', label: 'Mis leads', icon: '◎' },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: '⊟' },
  {
    href: '/dashboard/catalogo',
    label: 'Catálogo IA',
    icon: '✦',
    subitems: [
      { href: '/dashboard/productos', label: 'Productos', icon: '📦' },
      { href: '/dashboard/banco-imagenes', label: 'Banco IA', icon: '🖼' },
    ],
  },
  { href: '/dashboard/bot', label: 'Bot IA', icon: '🤖' },
  { href: '/dashboard/landing-editor', label: 'Mi landing', icon: '◈' },
  {
    href: '/dashboard/mi-suscripcion',
    label: 'Mi plan',
    icon: '💎',
    subitems: [
      { href: '/dashboard/mi-suscripcion', label: 'Mi suscripción', icon: '📋' },
      { href: '/dashboard/planes', label: 'Cambiar plan', icon: '⚡' },
    ],
  },
  { href: '/dashboard/perfil', label: 'Mi perfil', icon: '◉' },
]

interface DashboardLayoutProps {
  children: React.ReactNode
  user: { email: string; name: string; initials: string; avatarUrl?: string }
  slug?: string
}

export function DashboardLayout({ children, user, slug }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const [submenusAbiertos, setSubmenusAbiertos] = useState<Record<string, boolean>>(() => {
    const inicial: Record<string, boolean> = {}
    NAV_ITEMS.forEach(item => {
      if (item.subitems) {
        const algunoActivo = item.subitems.some(
          s => pathname === s.href || pathname.startsWith(s.href + '/')
        )
        const padreActivo = pathname === item.href || pathname.startsWith(item.href + '/')
        inicial[item.href] = algunoActivo || padreActivo
      }
    })
    return inicial
  })

  const toggleSubmenu = (href: string) => {
    setSubmenusAbiertos(s => ({ ...s, [href]: !s[href] }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-navy flex flex-col
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 border-b border-white/10">
          <Logo dark />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const tieneSubmenu = item.subitems && item.subitems.length > 0
            const submenuAbierto = submenusAbiertos[item.href]

            if (tieneSubmenu) {
              const algunHijoActivo = item.subitems!.some(
                s => pathname === s.href || pathname.startsWith(s.href + '/')
              )

              return (
                <div key={item.href}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                        ${isActive && !algunHijoActivo
                          ? 'bg-brand-orange text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </Link>
                    <button
                      onClick={() => toggleSubmenu(item.href)}
                      className="p-2 ml-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Mostrar submenu"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                        style={{
                          transform: submenuAbierto ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform .2s',
                        }}
                      >
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  {submenuAbierto && (
                    <div className="ml-3 mt-1 space-y-1 pl-4 border-l border-white/10">
                      {item.subitems!.map(sub => {
                        const subActive = pathname === sub.href || pathname.startsWith(sub.href + '/')
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setMobileOpen(false)}
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
                              ${subActive
                                ? 'bg-brand-orange text-white'
                                : 'text-white/50 hover:text-white hover:bg-white/10'
                              }
                            `}
                          >
                            {sub.icon && <span className="text-sm">{sub.icon}</span>}
                            {sub.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-brand-orange text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-orange flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover"/>
                : user.initials
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user.name}</div>
              <div className="text-xs text-white/40 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client')
              const sb = createClient()
              await sb.auth.signOut()
              window.location.href = '/auth/login'
            }}
            className="mt-3 w-full text-left text-xs text-white/40 hover:text-white/70 transition-colors py-1">
            Cerrar sesión →
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)}/>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-40">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <Logo size="sm" />
          <div className="w-9 h-9 rounded-full bg-brand-orange flex items-center justify-center text-white text-sm font-bold">
            {user.initials}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {/* Banner de trial / vencimiento */}
          <SuscripcionBanner />

          {/* Banner URL pública */}
          {slug && <LandingUrlBanner slug={slug} />}
          {children}
        </main>
      </div>
    </div>
  )
}
