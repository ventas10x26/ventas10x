// Ruta destino: src/app/pulse/admin/onboarding-envios/page.tsx
//
// Seguimiento de la secuencia de onboarding de DataBridge: cada fila es un correo
// enviado (touch 1, 2 o 3), con su estado de entrega/apertura/clic. Mismo patrón visual
// que /pulse/admin/proyectos, dentro de PulseAppShell.
//
// Entregado/abierto/clic dependen del webhook de Resend (ver /api/webhooks/resend) y de
// que el tracking de apertura esté activado en el dominio de envío -- si esas columnas
// aparecen vacías para TODOS los envíos, lo más probable es que ese paso manual (dashboard
// de Resend) todavía no se hizo, no que la automatización esté fallando.

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'

type Envio = {
  id: string
  email: string
  touch: number
  enviado_at: string
  entregado_at: string | null
  abierto_at: string | null
  clic_at: string | null
  rebotado_at: string | null
  quejado_at: string | null
}

function fecha(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function estadoEnvio(e: Envio): { label: string; color: string } {
  if (e.quejado_at) return { label: 'Quejado', color: '#F87171' }
  if (e.rebotado_at) return { label: 'Rebotado', color: '#F87171' }
  if (e.clic_at) return { label: 'Hizo clic', color: '#2DD4BF' }
  if (e.abierto_at) return { label: 'Abierto', color: '#2DD4BF' }
  if (e.entregado_at) return { label: 'Entregado', color: 'var(--blue)' }
  return { label: 'Enviado', color: 'var(--ink-dim)' }
}

export default function PulseOnboardingEnviosPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{ nombre: string; email: string } | null>(null)
  const [envios, setEnvios] = useState<Envio[]>([])
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'denegado' | 'error'>('cargando')
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'abiertos' | 'sin_abrir' | 'rebotados'>('todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/pulse/login'); return }
      setUser({
        nombre: (session.user.user_metadata?.full_name as string) || session.user.email?.split('@')[0] || 'Admin',
        email: session.user.email || '',
      })
      try {
        const res = await fetch('/api/pulse/admin/onboarding-envios', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.status === 404 || res.status === 401) { setEstado('denegado'); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al cargar')
        setEnvios(data.envios as Envio[])
        setEstado('listo')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar')
        setEstado('error')
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resumen = useMemo(() => {
    const enviados = envios.length
    const entregados = envios.filter(e => e.entregado_at).length
    const abiertos = envios.filter(e => e.abierto_at).length
    const clics = envios.filter(e => e.clic_at).length
    const rebotados = envios.filter(e => e.rebotado_at).length
    return { enviados, entregados, abiertos, clics, rebotados }
  }, [envios])

  const sinDatosDeApertura = resumen.enviados > 0 && resumen.abiertos === 0 && resumen.entregados === 0

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return envios.filter(e => {
      if (filtro === 'abiertos' && !e.abierto_at) return false
      if (filtro === 'sin_abrir' && e.abierto_at) return false
      if (filtro === 'rebotados' && !e.rebotado_at) return false
      if (!q) return true
      return e.email.toLowerCase().includes(q)
    })
  }, [envios, filtro, busqueda])

  const cuerpo = (
    <div style={{ padding: '26px 22px', maxWidth: '1180px', margin: '0 auto' }}>
      <style>{`
        .envio-row:hover { background: rgba(255,255,255,.035) }
        .envio-chip { transition: border-color .15s ease, color .15s ease, background .15s ease }
        @media (max-width: 820px) { .envio-tabla { min-width: 760px } }
      `}</style>

      <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: '24px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px', letterSpacing: '-.02em' }}>
        Envíos de onboarding
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--ink-dim)', margin: '0 0 20px' }}>
        Cada correo de la secuencia DataBridge, con su estado de entrega y apertura. Máximo 500.
      </p>

      {estado === 'cargando' && <p style={{ color: 'var(--ink-dim)', fontSize: '14px' }}>Cargando…</p>}

      {estado === 'denegado' && (
        <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--bg-1)' }}>
          <p style={{ color: 'var(--ink)', fontWeight: 700, margin: '0 0 6px' }}>Esta vista no está disponible para tu cuenta.</p>
          <p style={{ color: 'var(--ink-dim)', fontSize: '13px', margin: 0, lineHeight: 1.55 }}>
            Solo la ven las cuentas listadas en <code>PULSE_ADMIN_EMAILS</code>.
          </p>
        </div>
      )}

      {estado === 'error' && <p style={{ color: '#F87171', fontSize: '13.5px' }}>{error}</p>}

      {estado === 'listo' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '18px' }}>
            {[
              ['Enviados', resumen.enviados, 'var(--ink)'],
              ['Entregados', resumen.entregados, 'var(--blue)'],
              ['Abiertos', resumen.abiertos, '#2DD4BF'],
              ['Con clic', resumen.clics, '#2DD4BF'],
              ['Rebotados', resumen.rebotados, '#F87171'],
            ].map(([label, val, color]) => (
              <div key={label as string} style={{ border: '1px solid var(--line)', borderRadius: '10px', padding: '12px 14px', background: 'var(--bg-1)' }}>
                <p style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: color as string, fontFamily: 'var(--font-display), sans-serif' }}>{val as number}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--ink-dim)' }}>{label as string}</p>
              </div>
            ))}
          </div>

          {sinDatosDeApertura && (
            <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.08)', marginBottom: '18px' }}>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#FBBF24', lineHeight: 1.55 }}>
                Ningún envío tiene fecha de entrega ni de apertura todavía. Si ya pasó un rato desde que se mandaron, probablemente falte activar el tracking de apertura/clics en el dominio desde el dashboard de Resend, o crear el webhook que apunta a <code>/api/webhooks/resend</code>.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {[
              ['todos', `Todos · ${envios.length}`],
              ['abiertos', `Abiertos · ${resumen.abiertos}`],
              ['sin_abrir', `Sin abrir · ${envios.length - resumen.abiertos}`],
              ['rebotados', `Rebotados · ${resumen.rebotados}`],
            ].map(([id, label]) => {
              const activo = filtro === id
              return (
                <button
                  key={id}
                  onClick={() => setFiltro(id as typeof filtro)}
                  className="envio-chip"
                  style={{
                    padding: '6px 12px', borderRadius: '999px', cursor: 'pointer',
                    border: `1px solid ${activo ? 'var(--blue)' : 'var(--line)'}`,
                    background: activo ? 'rgba(37,99,235,.14)' : 'transparent',
                    color: activo ? 'var(--blue)' : 'var(--ink-dim)',
                    fontSize: '12px', fontWeight: activo ? 700 : 500, fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por correo…"
            style={{
              width: '100%', maxWidth: '360px', padding: '9px 13px', borderRadius: '9px',
              border: '1px solid var(--line)', background: 'var(--bg-1)',
              color: 'var(--ink)', fontSize: '13.5px', fontFamily: 'inherit', outline: 'none',
              marginBottom: '16px',
            }}
          />

          <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '12px', background: 'var(--bg-1)' }}>
            <div className="envio-tabla">
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 70px 130px 130px 130px 110px', gap: '10px', padding: '11px 14px', borderBottom: '1px solid var(--line)', fontSize: '10.5px', color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '.6px', fontWeight: 700 }}>
                <span>Correo</span><span>Touch</span><span>Enviado</span><span>Entregado</span><span>Abierto</span><span>Estado</span>
              </div>

              {visibles.map(e => {
                const est = estadoEnvio(e)
                return (
                  <div key={e.id} className="envio-row" style={{ display: 'grid', gridTemplateColumns: '1.4fr 70px 130px 130px 130px 110px', gap: '10px', padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '12.5px', color: 'var(--ink)', alignItems: 'center' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.email}</span>
                    <span style={{ color: 'var(--ink-dim)' }}>{e.touch}</span>
                    <span style={{ color: 'var(--ink-dim)', fontSize: '11.5px' }}>{fecha(e.enviado_at)}</span>
                    <span style={{ color: 'var(--ink-dim)', fontSize: '11.5px' }}>{fecha(e.entregado_at) || '—'}</span>
                    <span style={{ color: 'var(--ink-dim)', fontSize: '11.5px' }}>{fecha(e.abierto_at) || '—'}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: est.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: 'var(--ink-dim)' }}>{est.label}</span>
                    </span>
                  </div>
                )
              })}

              {visibles.length === 0 && (
                <p style={{ padding: '26px 14px', textAlign: 'center', color: 'var(--ink-dim)', fontSize: '13px', margin: 0 }}>
                  {envios.length === 0 ? 'Todavía no se envió ningún correo de la secuencia.' : 'Nada con ese filtro.'}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )

  if (!user) return null

  return (
    <PulseAppShell userName={user.nombre} userEmail={user.email}>
      {cuerpo}
    </PulseAppShell>
  )
}
