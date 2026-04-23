'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Resumen', icon: '▦' },
  { href: '/dashboard/leads', label: 'Mis leads', icon: '◎' },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: '⊟' },
  { href: '/dashboard/catalogo', label: 'Catálogo IA', icon: '✦' },
  { href: '/dashboard/bot', label: 'Bot IA', icon: '🤖' },
  { href: '/dashboard/landing-editor', label: 'Mi landing', icon: '◈' },
  { href: '/dashboard/perfil', label: 'Mi perfil', icon: '◉' },
]

interface DashboardLayoutProps {
  children: React.ReactNode
  user: { email: string; name: string; initials: string; avatarUrl?: string }
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-navy flex flex-col
        transform transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 border-b border-white/10">
          <Logo dark />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
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
            <div className="w-9 h-9 rounded-full bg-brand-orange flex items-center justify-content text-white text-sm font-bold overflow-hidden flex-shrink-0 flex items-center justify-center">
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

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)}/>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
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
          {children}
        </main>
      </div>
    </div>
  )
}
