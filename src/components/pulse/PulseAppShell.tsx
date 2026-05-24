// Ruta destino: src/components/pulse/PulseAppShell.tsx
//
// Layout shell con sidebar colapsable estilo Supabase.
// Desktop (≥768px): sidebar fija lateral, click logo para colapsar/expandir
// Móvil (<768px): hamburger arriba, sidebar como drawer overlay
//
// Persiste el estado "colapsada" en localStorage.

'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/pulse/dashboard', label: 'Inicio',    icon: '🏠', match: ['/pulse/dashboard'] },
  { href: '/pulse/agente',    label: 'Mi agente', icon: '🤖', match: ['/pulse/agente'] },
  { href: '/pulse/pipeline',  label: 'Pipeline',  icon: '🎯', match: ['/pulse/pipeline'] },
  { href: '/pulse/metricas',  label: 'Métricas',  icon: '📊', match: ['/pulse/metricas'] },
  { href: '/pulse/perfil',    label: 'Mi cuenta', icon: '👤', match: ['/pulse/perfil'] },
]

const SIDEBAR_EXPANDED = 220
const SIDEBAR_COLLAPSED = 64

interface Props {
  children: React.ReactNode
  userName?: string
  userEmail?: string
}

export function PulseAppShell({ children, userName = 'Vendedor', userEmail = '' }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hidratación + detección de viewport
  useEffect(() => {
    setHydrated(true)
    const saved = localStorage.getItem('pulse_sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
    
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('pulse_sidebar_collapsed', String(next))
  }

  const navigate = (href: string) => {
    setMobileOpen(false)
    router.push(href)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/pulse')
  }

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    return item.match.some(m => pathname?.startsWith(m))
  }

  // Render durante hidratación: layout estable
  if (!hydrated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a' }}>
        {children}
      </div>
    )
  }

  // =====================================================
  // MOBILE LAYOUT
  // =====================================================
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Header móvil con hamburger */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '6px',
              lineHeight: 1,
            }}
          >
            ☰
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={iconLogoStyle}>⚡</div>
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px' }}>Pulse Motor</span>
          </div>
          <div style={{ width: '34px' }} /> {/* spacer para centrar logo */}
        </header>

        {/* Drawer overlay */}
        {mobileOpen && (
          <>
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 40,
              }}
            />
            <aside style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${SIDEBAR_EXPANDED}px`,
              background: '#0f172a',
              borderRight: '1px solid rgba(255,255,255,0.05)',
              zIndex: 41,
              padding: '20px 12px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px', marginBottom: '24px' }}>
                <div style={iconLogoStyle}>⚡</div>
                <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px' }}>Pulse Motor</span>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                {NAV_ITEMS.map(item => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item)}
                    collapsed={false}
                    onClick={() => navigate(item.href)}
                  />
                ))}
              </nav>

              {/* Footer: usuario + salir */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '12px' }}>
                <div style={{ padding: '8px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                    {userName.split(' ')[0]}
                  </div>
                  {userEmail && (
                    <div style={{ fontSize: '10px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {userEmail}
                    </div>
                  )}
                </div>
                <button onClick={logout} style={logoutStyle(false)}>
                  <span style={{ fontSize: '15px' }}>🚪</span>
                  <span style={{ fontSize: '13px' }}>Salir</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Contenido */}
        <main>{children}</main>
      </div>
    )
  }

  // =====================================================
  // DESKTOP LAYOUT
  // =====================================================
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: `${sidebarWidth}px`,
        background: 'rgba(0, 0, 0, 0.2)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        padding: '20px 10px',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        transition: 'width 0.2s ease',
        flexShrink: 0,
      }}>
        {/* Logo + toggle */}
        <button
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 8px',
            marginBottom: '24px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            fontFamily: 'inherit',
            textAlign: 'left',
            borderRadius: '8px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={iconLogoStyle}>⚡</div>
          {!collapsed && (
            <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
              Pulse Motor
            </span>
          )}
        </button>

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item)}
              collapsed={collapsed}
              onClick={() => navigate(item.href)}
            />
          ))}
        </nav>

        {/* Footer: usuario + salir */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '12px' }}>
          {!collapsed && (
            <div style={{ padding: '8px', marginBottom: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                {userName.split(' ')[0]}
              </div>
              {userEmail && (
                <div style={{ fontSize: '10px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userEmail}
                </div>
              )}
            </div>
          )}
          <button onClick={logout} style={logoutStyle(collapsed)} title={collapsed ? 'Salir' : undefined}>
            <span style={{ fontSize: '15px' }}>🚪</span>
            {!collapsed && <span style={{ fontSize: '13px' }}>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}

// =====================================================
// SUB-COMPONENTES
// =====================================================

function NavLink({ item, active, collapsed, onClick }: { item: typeof NAV_ITEMS[0]; active: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: collapsed ? '10px' : '10px 12px',
        borderRadius: '8px',
        border: 'none',
        background: active ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
        color: active ? '#fdba74' : '#cbd5e1',
        fontSize: '13px',
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.15s, color 0.15s',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      <span style={{ fontSize: '15px', lineHeight: 1 }}>{item.icon}</span>
      {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
    </button>
  )
}

const iconLogoStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '9px',
  background: 'linear-gradient(135deg, #f97316, #ea580c)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '17px',
  fontWeight: 800,
  flexShrink: 0,
}

function logoutStyle(collapsed: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: collapsed ? '10px' : '10px 12px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
    width: '100%',
    justifyContent: collapsed ? 'center' : 'flex-start',
  }
}
