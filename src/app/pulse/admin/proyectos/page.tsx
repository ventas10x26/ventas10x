// Ruta destino: src/app/pulse/admin/proyectos/page.tsx
//
// Todos los proyectos de DataBridge, de todos los usuarios -- vista de seguimiento para
// el fundador/admin, no una herramienta de gestión de la cuenta de un cliente puntual
// (por eso no hay renombrar/borrar acá: eso ya vive en /pulse/databridge, bajo el dueño
// real de cada proyecto). Mismo patrón que /pulse/leads: PulseAppShell + fetch autenticado
// contra /api/pulse/admin/proyectos, que valida el token y el correo en el servidor.
//
// "Filas" es la señal de seguimiento más útil acá: un proyecto con pocas filas es alguien
// probando el flujo; uno con cientos o miles es una operación real subida -- ese es quien
// vale la pena llamar primero.

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'

type Proyecto = {
  id: string
  nombre: string
  userEmail: string
  tablas: number
  relaciones: number
  filas: number
  createdAt: string
  updatedAt: string
}

// Umbral simple para separar "está probando" de "subió su operación real" -- ver nota de
// arriba. No es un juicio de valor sobre el usuario, solo prioriza a quién seguir primero.
const UMBRAL_DATOS_REALES = 50

function fecha(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function PulseAdminProyectosPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{ nombre: string; email: string } | null>(null)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'denegado' | 'error'>('cargando')
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'reales' | 'prueba'>('todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/pulse/login')
        return
      }
      setUser({
        nombre: (session.user.user_metadata?.full_name as string) || session.user.email?.split('@')[0] || 'Admin',
        email: session.user.email || '',
      })
      try {
        const res = await fetch('/api/pulse/admin/proyectos', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.status === 404 || res.status === 401) { setEstado('denegado'); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al cargar')
        setProyectos(data.proyectos as Proyecto[])
        setEstado('listo')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar')
        setEstado('error')
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const usuariosUnicos = useMemo(() => new Set(proyectos.map(p => p.userEmail)).size, [proyectos])
  const reales = useMemo(() => proyectos.filter(p => p.filas >= UMBRAL_DATOS_REALES).length, [proyectos])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return proyectos.filter(p => {
      if (filtro === 'reales' && p.filas < UMBRAL_DATOS_REALES) return false
      if (filtro === 'prueba' && p.filas >= UMBRAL_DATOS_REALES) return false
      if (!q) return true
      return [p.nombre, p.userEmail].some(v => v.toLowerCase().includes(q))
    })
  }, [proyectos, filtro, busqueda])

  function exportarCSV() {
    const cab = ['Creado', 'Proyecto', 'Usuario', 'Tablas', 'Filas', 'Relaciones', 'Última actividad', 'Enlace']
    const filas = visibles.map(p => [
      new Date(p.createdAt).toISOString(),
      p.nombre,
      p.userEmail,
      String(p.tablas),
      String(p.filas),
      String(p.relaciones),
      new Date(p.updatedAt).toISOString(),
      `https://pulsemotor.co/pulse/databridge/panel/${p.id}`,
    ])
    const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = [cab, ...filas].map(f => f.map(escapar).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `proyectos-databridge-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const cuerpo = (
    <div style={{ padding: '26px 22px', maxWidth: '1240px', margin: '0 auto' }}>
      <style>{`
        .proy-row:hover { background: rgba(255,255,255,.035) }
        .proy-chip { transition: border-color .15s ease, color .15s ease, background .15s ease }
        .proy-btn:hover { transform: translateY(-1px) }
        @media (max-width: 900px) { .proy-tabla { min-width: 880px } }
      `}</style>

      <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: '24px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px', letterSpacing: '-.02em' }}>
        Proyectos de la comunidad
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--ink-dim)', margin: '0 0 20px' }}>
        Todos los proyectos de DataBridge desplegados en Pulse Motor, de cualquier usuario. Máximo 500.
      </p>

      {estado === 'cargando' && <p style={{ color: 'var(--ink-dim)', fontSize: '14px' }}>Cargando…</p>}

      {estado === 'denegado' && (
        <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--bg-1)' }}>
          <p style={{ color: 'var(--ink)', fontWeight: 700, margin: '0 0 6px' }}>Esta vista no está disponible para tu cuenta.</p>
          <p style={{ color: 'var(--ink-dim)', fontSize: '13px', margin: 0, lineHeight: 1.55 }}>
            Solo la ven las cuentas listadas en <code>PULSE_ADMIN_EMAILS</code>. Si deberías estar ahí, agregá tu correo a esa variable en Vercel y volvé a entrar.
          </p>
        </div>
      )}

      {estado === 'error' && (
        <p style={{ color: '#F87171', fontSize: '13.5px' }}>{error}</p>
      )}

      {estado === 'listo' && (
        <>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {[
              ['todos', `Todos · ${proyectos.length}`],
              ['reales', `Datos reales (≥${UMBRAL_DATOS_REALES} filas) · ${reales}`],
              ['prueba', `Prueba · ${proyectos.length - reales}`],
            ].map(([id, label]) => {
              const activo = filtro === id
              return (
                <button
                  key={id}
                  onClick={() => setFiltro(id as typeof filtro)}
                  className="proy-chip"
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

          <p style={{ fontSize: '12px', color: 'var(--ink-dim)', margin: '0 0 16px' }}>
            {usuariosUnicos} {usuariosUnicos === 1 ? 'usuario distinto' : 'usuarios distintos'}
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre de proyecto o correo…"
              style={{
                flex: '1 1 260px', padding: '9px 13px', borderRadius: '9px',
                border: '1px solid var(--line)', background: 'var(--bg-1)',
                color: 'var(--ink)', fontSize: '13.5px', fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={exportarCSV}
              className="proy-btn"
              style={{
                padding: '9px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#3B82F6,#2563EB)', color: '#fff',
                fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', transition: 'transform .15s ease',
              }}
            >
              Exportar CSV ({visibles.length})
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '12px', background: 'var(--bg-1)' }}>
            <div className="proy-tabla">
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1.3fr 1.3fr 70px 80px 90px 100px 90px', gap: '10px', padding: '11px 14px', borderBottom: '1px solid var(--line)', fontSize: '10.5px', color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '.6px', fontWeight: 700 }}>
                <span>Creado</span><span>Proyecto</span><span>Usuario</span><span>Tablas</span><span>Filas</span><span>Relaciones</span><span>Actividad</span><span>Panel</span>
              </div>

              {visibles.map(p => {
                const real = p.filas >= UMBRAL_DATOS_REALES
                return (
                  <div key={p.id} className="proy-row" style={{ display: 'grid', gridTemplateColumns: '100px 1.3fr 1.3fr 70px 80px 90px 100px 90px', gap: '10px', padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '12.5px', color: 'var(--ink)', alignItems: 'center' }}>
                    <span style={{ color: 'var(--ink-dim)', fontSize: '11.5px' }}>{fecha(p.createdAt)}</span>
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={`mailto:${p.userEmail}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{p.userEmail}</a>
                    </span>
                    <span style={{ color: 'var(--ink-dim)' }}>{p.tablas}</span>
                    <span style={{ color: 'var(--ink-dim)' }}>{p.filas.toLocaleString('es-CO')}</span>
                    <span style={{ color: 'var(--ink-dim)' }}>{p.relaciones}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: real ? '#2DD4BF' : '#FBBF24', flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: 'var(--ink-dim)' }}>{real ? 'Real' : 'Prueba'}</span>
                    </span>
                    <a href={`/pulse/databridge/panel/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600, fontSize: '12px' }}>
                      Ver →
                    </a>
                  </div>
                )
              })}

              {visibles.length === 0 && (
                <p style={{ padding: '26px 14px', textAlign: 'center', color: 'var(--ink-dim)', fontSize: '13px', margin: 0 }}>
                  {proyectos.length === 0 ? 'Todavía no hay proyectos desplegados.' : 'Nada con ese filtro.'}
                </p>
              )}
            </div>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--ink-dim)', marginTop: '12px', lineHeight: 1.55 }}>
            &quot;Actividad&quot; compara las filas totales del proyecto contra un umbral de {UMBRAL_DATOS_REALES} — una señal aproximada de quién subió su operación real y quién todavía está probando el flujo, no un juicio sobre el proyecto.
          </p>
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
