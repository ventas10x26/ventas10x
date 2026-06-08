// src/components/pulse/PulseAppShell.tsx
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

const SIDEBAR_EXPANDED  = 220
const SIDEBAR_COLLAPSED = 64

interface CreditosData { saldo: number; saldo_total: number }

interface Props {
  children: React.ReactNode
  userName?: string
  userEmail?: string
}

// ── Pill de créditos estilo Railway ──────────────────────────────────────────
function CreditosPill() {
  const [creditos, setCreditos] = useState<CreditosData | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('pulse_creditos')
        .select('saldo, saldo_total')
        .eq('user_id', user.id)
        .single()
      if (data) setCreditos(data as CreditosData)
    }
    cargar()

    const channel = supabase
      .channel('creditos-pill')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pulse_creditos' }, (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCreditos((payload.new as any) as CreditosData)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  if (!creditos) return null

  const { saldo, saldo_total } = creditos
  const pct      = Math.min(100, Math.round((saldo / Math.max(saldo_total, 500)) * 100))
  const critico  = saldo <= 30
  const bajo     = saldo <= 100 && !critico

  const bg     = critico ? 'rgba(239,68,68,0.15)'   : bajo ? 'rgba(234,179,8,0.12)'  : 'rgba(255,255,255,0.06)'
  const border = critico ? 'rgba(239,68,68,0.5)'    : bajo ? 'rgba(234,179,8,0.4)'   : 'rgba(255,255,255,0.1)'
  const color  = critico ? '#fca5a5'                 : bajo ? '#fde047'               : '#94a3b8'
  const barBg  = critico ? '#ef4444'                 : bajo ? '#eab308'               : '#10b981'

  return (
    <a
      href="/pulse/pricing"
      title="Ver plan de créditos"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '5px 10px 5px 8px',
        borderRadius: '6px',
        background: bg, border: `1px solid ${border}`,
        textDecoration: 'none', cursor: 'pointer',
        transition: 'opacity .15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '.8')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      {/* Mini barra circular de progreso */}
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
        <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <circle
          cx="7" cy="7" r="5.5" fill="none"
          stroke={barBg} strokeWidth="2"
          strokeDasharray={`${2 * Math.PI * 5.5}`}
          strokeDashoffset={`${2 * Math.PI * 5.5 * (1 - pct / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 7 7)"
          style={{ transition: 'stroke-dashoffset .5s ease' }}
        />
      </svg>
      <span style={{ fontSize: '12px', fontWeight: 600, color, whiteSpace: 'nowrap', lineHeight: 1 }}>
        {saldo.toLocaleString('es-CO')} créditos
      </span>
    </a>
  )
}

// ── Paywall Modal (se muestra cuando saldo = 0) ───────────────────────────────
function PaywallModal() {
  const [show, setShow] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('pulse_creditos').select('saldo').eq('user_id', user.id).single()
      if (data && (data as CreditosData).saldo <= 0) setShow(true)
    }
    check()
    const channel = supabase.channel('paywall-check')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pulse_creditos' }, (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (((payload.new as any) as CreditosData).saldo <= 0) setShow(true)
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  if (!show) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,15,26,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#0d1b2e', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '460px', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '2px solid #f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>🔴</div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>Tus créditos se agotaron</h2>
        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, marginBottom: '8px' }}>Tu agente respondió activamente leads por vos. 🎉</p>
        <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '28px' }}>
          Activá tu plan por <strong style={{ color: '#10b981' }}>$99.000/mes</strong> para responder leads ilimitados.
        </p>
        <a href="/pulse/pricing" style={{ display: 'block', padding: '15px', borderRadius: '12px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: '16px', fontWeight: 700, textDecoration: 'none', marginBottom: '12px' }}>
          Activar plan — $99.000/mes →
        </a>
        <p style={{ fontSize: '11px', color: '#334155' }}>Sin tarjeta · Cancelás cuando querás · Garantía 7 días</p>
      </div>
    </div>
  )
}

export function PulseAppShell({ children, userName = 'Vendedor', userEmail = '' }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile]     = useState(false)
  const [hydrated, setHydrated]     = useState(false)

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

  const navigate = (href: string) => { setMobileOpen(false); router.push(href) }

  const logout = async () => { await supabase.auth.signOut(); router.push('/pulse') }

  const isActive = (item: typeof NAV_ITEMS[0]) => item.match.some(m => pathname?.startsWith(m))

  if (!hydrated) return <div style={{ minHeight: '100vh', background: '#0f172a' }}>{children}</div>

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
        <PaywallModal />
        <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', padding: '6px', lineHeight: 1, flexShrink: 0 }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={iconLogoStyle}>⚡</div>
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px' }}>Pulse Motor</span>
          </div>
          {/* Pill créditos en mobile */}
          <CreditosPill />
        </header>

        {mobileOpen && (
          <>
            <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
            <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: `${SIDEBAR_EXPANDED}px`, background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.05)', zIndex: 41, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px', marginBottom: '24px' }}>
                <div style={iconLogoStyle}>⚡</div>
                <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px' }}>Pulse Motor</span>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                {NAV_ITEMS.map(item => <NavLink key={item.href} item={item} active={isActive(item)} collapsed={false} onClick={() => navigate(item.href)} />)}
              </nav>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '12px' }}>
                <div style={{ padding: '8px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{userName.split(' ')[0]}</div>
                  {userEmail && <div style={{ fontSize: '10px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>}
                </div>
                <button onClick={logout} style={logoutStyle(false)}><span style={{ fontSize: '15px' }}>🚪</span><span style={{ fontSize: '13px' }}>Salir</span></button>
              </div>
            </aside>
          </>
        )}
        <main>{children}</main>
      </div>
    )
  }

  // ── DESKTOP ───────────────────────────────────────────────────────────────
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)', color: '#fff', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex' }}>
      <PaywallModal />

      {/* Sidebar */}
      <aside style={{ width: `${sidebarWidth}px`, background: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '20px 10px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', transition: 'width 0.2s ease', flexShrink: 0 }}>
        <button onClick={toggleCollapse} aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', marginBottom: '24px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff', fontFamily: 'inherit', textAlign: 'left', borderRadius: '8px', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <div style={iconLogoStyle}>⚡</div>
          {!collapsed && <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>Pulse Motor</span>}
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {NAV_ITEMS.map(item => <NavLink key={item.href} item={item} active={isActive(item)} collapsed={collapsed} onClick={() => navigate(item.href)} />)}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '12px' }}>
          {!collapsed && (
            <div style={{ padding: '8px', marginBottom: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{userName.split(' ')[0]}</div>
              {userEmail && <div style={{ fontSize: '10px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>}
            </div>
          )}
          <button onClick={logout} style={logoutStyle(collapsed)} title={collapsed ? 'Salir' : undefined}>
            <span style={{ fontSize: '15px' }}>🚪</span>
            {!collapsed && <span style={{ fontSize: '13px' }}>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Main con topbar que tiene la pill */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar con pill de créditos */}
        <div style={{ height: '44px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', gap: '10px', flexShrink: 0, background: 'rgba(0,0,0,0.1)' }}>
          <CreditosPill />
        </div>
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function NavLink({ item, active, collapsed, onClick }: { item: typeof NAV_ITEMS[0]; active: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} title={collapsed ? item.label : undefined} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '10px' : '10px 12px', borderRadius: '8px', border: 'none', background: active ? 'rgba(249,115,22,0.12)' : 'transparent', color: active ? '#fdba74' : '#cbd5e1', fontSize: '13px', fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%', transition: 'background 0.15s, color 0.15s', justifyContent: collapsed ? 'center' : 'flex-start' }} onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
      <span style={{ fontSize: '15px', lineHeight: 1 }}>{item.icon}</span>
      {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
    </button>
  )
}

const iconLogoStyle: React.CSSProperties = {
  width: '32px', height: '32px', borderRadius: '9px',
  background: 'linear-gradient(135deg,#f97316,#ea580c)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '17px', fontWeight: 800, flexShrink: 0,
}

function logoutStyle(collapsed: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: collapsed ? '10px' : '10px 12px', borderRadius: '8px',
    border: 'none', background: 'transparent', color: '#94a3b8',
    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit', textAlign: 'left', width: '100%',
    justifyContent: collapsed ? 'center' : 'flex-start',
  }
}
