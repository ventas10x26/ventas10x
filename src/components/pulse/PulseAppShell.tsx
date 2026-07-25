// src/components/pulse/PulseAppShell.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Íconos: nunca robot/chip/cerebro (regla dura del skill pulsemotor-design) — "Mi agente" usa
// el bullet de chat (WhatsApp es el canal real del agente), no un ícono de IA genérico.
const NAV_ITEMS = [
  { href: '/pulse/dashboard', label: 'Inicio',    icon: '🏠', match: ['/pulse/dashboard'] },
  { href: '/pulse/agente',    label: 'Mi agente', icon: '💬', match: ['/pulse/agente'] },
  { href: '/pulse/pipeline',  label: 'Pipeline',  icon: '🎯', match: ['/pulse/pipeline'] },
  { href: '/pulse/metricas',  label: 'Métricas',  icon: '📊', match: ['/pulse/metricas'] },
  { href: '/pulse/perfil',    label: 'Mi cuenta', icon: '👤', match: ['/pulse/perfil'] },
]

// "Mi agente" y "Pipeline" son vistas del copiloto de UN solo vendedor (su propio WhatsApp,
// su propio embudo) — no aplican a una cuenta de concesionario, que gestiona varios asesores.
// El segmento se guarda en user_metadata.pulse_segmento al registrarse (ver signup/page.tsx);
// las cuentas sin ese campo (todas las creadas antes de esta migración) ven el menú completo.
const ITEMS_OCULTOS_PARA_CONCESIONARIO = ['/pulse/agente', '/pulse/pipeline']

const F_DISPLAY = "var(--font-inter), sans-serif"
const F_MONO    = "var(--font-mono), monospace"
const F_BODY    = "var(--font-inter), sans-serif"

const SIDEBAR_EXPANDED  = 220
const SIDEBAR_COLLAPSED = 64

interface CreditosData { saldo: number; saldo_total: number }

interface Props {
  children: React.ReactNode
  userName?: string
  userEmail?: string
  // 'light' es un opt-in puntual (hoy solo lo usa /pulse/databridge en su paso Subir, que
  // rehizo su pantalla en claro estilo Stitch) — el resto del dashboard sigue oscuro por
  // default para no romper las páginas que ya asumen los tokens --ink/--bg-* actuales.
  theme?: 'dark' | 'light'
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

  // Verde exclusivo para "saldo saludable" (estado aprobado/activo); ámbar para la alerta
  // temprana (familia de acento única); rojo solo para el estado crítico.
  const bg     = critico ? 'rgba(229,72,77,0.15)'   : bajo ? 'rgba(242,169,59,0.12)' : 'var(--bg-2)'
  const border = critico ? 'rgba(229,72,77,0.5)'    : bajo ? 'rgba(242,169,59,0.4)'  : 'var(--line)'
  const color  = critico ? '#f2a3a5'                 : bajo ? 'var(--amber)'          : 'var(--ink-dim)'
  const barBg  = critico ? 'var(--red)'              : bajo ? 'var(--amber)'          : 'var(--green)'

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
        <circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--line)" strokeWidth="2" />
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
      <span style={{ fontFamily: F_MONO, fontSize: '12px', fontWeight: 600, color, whiteSpace: 'nowrap', lineHeight: 1 }}>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(11,13,12,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg-1)', border: '1px solid rgba(229,72,77,0.35)', borderRadius: '8px', padding: '40px', width: '100%', maxWidth: '460px', textAlign: 'center', boxShadow: '0 24px 48px rgba(0,0,0,0.45), 0 8px 16px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(229,72,77,0.12)', border: '2px solid var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 20px' }}>●</div>
        <h2 style={{ fontFamily: F_DISPLAY, fontSize: '22px', fontWeight: 800, color: 'var(--ink)', marginBottom: '10px' }}>Tus créditos se agotaron</h2>
        <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: 1.6, marginBottom: '8px' }}>Tu agente respondió activamente leads por vos.</p>
        <p style={{ fontSize: '14px', color: 'var(--ink-dim)', lineHeight: 1.6, marginBottom: '28px' }}>
          Activá tu plan por <strong className="grad-amber" style={{ fontFamily: F_MONO }}>$99.000/mes</strong> para responder leads ilimitados.
        </p>
        <a href="/pulse/pricing" style={{ display: 'block', padding: '14px', borderRadius: '6px', background: 'var(--amber)', color: '#1a1204', fontFamily: F_DISPLAY, fontSize: '15px', fontWeight: 700, textDecoration: 'none', marginBottom: '12px' }}>
          Activar plan — $99.000/mes →
        </a>
        <p style={{ fontFamily: F_MONO, fontSize: '11px', color: 'var(--ink-dim)' }}>Sin tarjeta · Cancelás cuando querás · Garantía 7 días</p>
      </div>
    </div>
  )
}

export function PulseAppShell({ children, userName = 'Vendedor', userEmail = '', theme = 'dark' }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const isLight = theme === 'light'
  const c = {
    bg0: isLight ? '#f8f9fb' : 'var(--bg-0)',
    bg1: isLight ? '#ffffff' : 'var(--bg-1)',
    bg2: isLight ? '#f1f5f9' : 'var(--bg-2)',
    ink: isLight ? '#0f172a' : 'var(--ink)',
    inkDim: isLight ? '#64748b' : 'var(--ink-dim)',
    line: isLight ? '#d9dadc' : 'var(--line)',
    headerBg: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(11,13,12,0.9)',
  }

  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile]     = useState(false)
  const [hydrated, setHydrated]     = useState(false)
  const [segmento, setSegmento]     = useState<string | null>(null)
  const pendingSegmentoAppliedRef   = useRef(false)

  useEffect(() => {
    setHydrated(true)
    const saved = localStorage.getItem('pulse_sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Aplica el pulse_segmento_pendiente que viaja en la URL cuando alguien se registra con
  // Google (ver signup/page.tsx) — signInWithOAuth no tiene equivalente a options.data de
  // signUp(), así que no hay forma de guardar el segmento directo en el alta por Google; el
  // valor elegido llega como query param y se aplica acá con updateUser() apenas hay sesión.
  // Se usa onAuthStateChange (no solo el getUser() inicial) porque justo después de un
  // redirect de OAuth puede haber una ventana breve donde la sesión todavía no está lista.
  useEffect(() => {
    const handleUser = (u: { user_metadata?: Record<string, unknown> } | null | undefined) => {
      const actual = (u?.user_metadata?.pulse_segmento as string) ?? null
      setSegmento(actual)
      if (!u || pendingSegmentoAppliedRef.current) return
      let params: URLSearchParams
      try { params = new URLSearchParams(window.location.search) } catch { return }
      const pendiente = params.get('pulse_segmento_pendiente')
      if (!pendiente) return
      pendingSegmentoAppliedRef.current = true
      params.delete('pulse_segmento_pendiente')
      const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '')
      window.history.replaceState({}, '', cleanUrl)
      if (actual) return // ya tenía segmento guardado (ej. cuenta con email/password) — no lo pisamos
      supabase.auth.updateUser({ data: { pulse_segmento: pendiente } }).then(({ data, error }) => {
        if (!error && data.user) setSegmento((data.user.user_metadata?.pulse_segmento as string) ?? null)
      })
    }
    supabase.auth.getUser().then(({ data }) => handleUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleUser(session?.user))
    return () => subscription.unsubscribe()
  }, [])

  const navItems = segmento === 'concesionario'
    ? NAV_ITEMS.filter(item => !ITEMS_OCULTOS_PARA_CONCESIONARIO.includes(item.href))
    : NAV_ITEMS

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('pulse_sidebar_collapsed', String(next))
  }

  const navigate = (href: string) => { setMobileOpen(false); router.push(href) }

  const logout = async () => { await supabase.auth.signOut(); router.push('/pulse') }

  const isActive = (item: typeof NAV_ITEMS[0]) => item.match.some(m => pathname?.startsWith(m))

  if (!hydrated) return <div style={{ minHeight: '100vh', background: c.bg0 }}>{children}</div>

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: c.bg0, color: c.ink, fontFamily: F_BODY }}>
        <PaywallModal />
        <header style={{ position: 'sticky', top: 0, zIndex: 30, background: c.headerBg, backdropFilter: 'blur(8px)', borderBottom: `1px solid ${c.line}`, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú" style={{ background: 'transparent', border: 'none', color: c.ink, fontSize: '22px', cursor: 'pointer', padding: '6px', lineHeight: 1, flexShrink: 0 }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={iconLogoStyle}>⚡</div>
            <span style={{ fontFamily: F_DISPLAY, fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px' }}>Pulse Motor</span>
          </div>
          {/* Pill créditos en mobile */}
          <CreditosPill />
        </header>

        {mobileOpen && (
          <>
            <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
            <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: `${SIDEBAR_EXPANDED}px`, background: c.bg1, borderRight: `1px solid ${c.line}`, zIndex: 41, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px', marginBottom: '24px' }}>
                <div style={iconLogoStyle}>⚡</div>
                <span style={{ fontFamily: F_DISPLAY, fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px' }}>Pulse Motor</span>
              </div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                {navItems.map(item => <NavLink key={item.href} item={item} active={isActive(item)} collapsed={false} onClick={() => navigate(item.href)} hoverBg={c.bg2} inkDim={c.inkDim} />)}
              </nav>
              <div style={{ borderTop: `1px solid ${c.line}`, paddingTop: '12px', marginTop: '12px' }}>
                <div style={{ padding: '8px', marginBottom: '6px' }}>
                  <div style={{ fontFamily: F_DISPLAY, fontSize: '12px', fontWeight: 700, color: c.ink, marginBottom: '2px' }}>{userName.split(' ')[0]}</div>
                  {userEmail && <div style={{ fontFamily: F_MONO, fontSize: '10px', color: c.inkDim, overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>}
                </div>
                <button onClick={logout} style={logoutStyle(false, c.inkDim)}><span style={{ fontSize: '15px' }}>🚪</span><span style={{ fontSize: '13px' }}>Salir</span></button>
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
    <div style={{ minHeight: '100vh', background: c.bg0, color: c.ink, fontFamily: F_BODY, display: 'flex' }}>
      <PaywallModal />

      {/* Sidebar */}
      <aside style={{ width: `${sidebarWidth}px`, background: c.bg1, borderRight: `1px solid ${c.line}`, padding: '20px 10px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', transition: 'width 0.2s ease', flexShrink: 0 }}>
        <button onClick={toggleCollapse} aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', marginBottom: '24px', background: 'transparent', border: 'none', cursor: 'pointer', color: c.ink, fontFamily: 'inherit', textAlign: 'left', borderRadius: '6px', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = c.bg2)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <div style={iconLogoStyle}>⚡</div>
          {!collapsed && <span style={{ fontFamily: F_DISPLAY, fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>Pulse Motor</span>}
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {navItems.map(item => <NavLink key={item.href} item={item} active={isActive(item)} collapsed={collapsed} onClick={() => navigate(item.href)} hoverBg={c.bg2} inkDim={c.inkDim} />)}
        </nav>

        <div style={{ borderTop: `1px solid ${c.line}`, paddingTop: '12px', marginTop: '12px' }}>
          {!collapsed && (
            <div style={{ padding: '8px', marginBottom: '6px' }}>
              <div style={{ fontFamily: F_DISPLAY, fontSize: '12px', fontWeight: 700, color: c.ink, marginBottom: '2px' }}>{userName.split(' ')[0]}</div>
              {userEmail && <div style={{ fontFamily: F_MONO, fontSize: '10px', color: c.inkDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>}
            </div>
          )}
          <button onClick={logout} style={logoutStyle(collapsed, c.inkDim)} title={collapsed ? 'Salir' : undefined}>
            <span style={{ fontSize: '15px' }}>🚪</span>
            {!collapsed && <span style={{ fontSize: '13px' }}>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Main con topbar que tiene la pill */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar con pill de créditos */}
        <div style={{ height: '44px', borderBottom: `1px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', gap: '10px', flexShrink: 0, background: c.bg1 }}>
          <CreditosPill />
        </div>
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function NavLink({ item, active, collapsed, onClick, hoverBg, inkDim }: { item: typeof NAV_ITEMS[0]; active: boolean; collapsed: boolean; onClick: () => void; hoverBg: string; inkDim: string }) {
  return (
    <button onClick={onClick} title={collapsed ? item.label : undefined} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '10px' : '10px 12px', borderRadius: '6px', border: 'none', background: active ? 'rgba(242,169,59,0.12)' : 'transparent', color: active ? 'var(--amber)' : inkDim, fontSize: '13px', fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: F_BODY, textAlign: 'left', width: '100%', transition: 'background 0.15s, color 0.15s', justifyContent: collapsed ? 'center' : 'flex-start' }} onMouseEnter={e => { if (!active) e.currentTarget.style.background = hoverBg }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
      <span style={{ fontSize: '15px', lineHeight: 1 }}>{item.icon}</span>
      {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
    </button>
  )
}

const iconLogoStyle: React.CSSProperties = {
  width: '32px', height: '32px', borderRadius: '6px',
  background: 'linear-gradient(135deg,#F2A93B,#C9770B)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '17px', fontWeight: 800, flexShrink: 0, color: '#1a1204',
}

function logoutStyle(collapsed: boolean, inkDim: string): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: collapsed ? '10px' : '10px 12px', borderRadius: '6px',
    border: 'none', background: 'transparent', color: inkDim,
    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
    fontFamily: F_BODY, textAlign: 'left', width: '100%',
    justifyContent: collapsed ? 'center' : 'flex-start',
  }
}
