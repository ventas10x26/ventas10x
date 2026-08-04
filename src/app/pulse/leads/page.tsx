// Ruta destino: src/app/pulse/leads/page.tsx
//
// Bandeja de contactos capturados por el sitio: gate del panel demo, descarga
// del ebook y formularios de las landings.
//
// Los datos NO se consultan a Supabase desde acá. pulse_contactos tiene RLS
// activo sin políticas, así que la tabla es ilegible desde el navegador por
// diseño; toda la lectura pasa por /api/pulse/admin/leads, que valida el token
// y el correo del administrador del lado del servidor.
//
// La columna que ordena esta pantalla es `fuente`. Un lead que pidió una demo y
// uno que descargó un PDF no tienen el mismo grado de intención, y mezclarlos en
// una sola lista hace perder el tiempo en el seguimiento: quien pidió demo se
// llama hoy, quien descargó se nutre.

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'

type Lead = {
  id: string
  nombre: string | null
  email: string | null
  telefono: string | null
  fuente: string | null
  estado: string | null
  notas: string | null
  created_at: string
}

// Etiqueta legible y grado de intención por fuente. El color no decora: separa
// "pedí hablar con ustedes" de "me llevé un documento".
const FUENTES: Record<string, { label: string; intencion: 'alta' | 'media'; color: string }> = {
  demo_panel:            { label: 'Gate del panel demo',  intencion: 'alta',  color: '#2DD4BF' },
  demo_contacto:         { label: 'Formulario de demo',   intencion: 'alta',  color: '#2DD4BF' },
  ebook_rentabilidad:    { label: 'Ebook rentabilidad',   intencion: 'media', color: '#FBBF24' },
  landing_como_funciona: { label: 'Landing cómo funciona', intencion: 'media', color: '#A78BFA' },
}

function metaFuente(f: string | null) {
  if (!f) return { label: 'Sin origen', intencion: 'media' as const, color: '#7F8FAE' }
  return FUENTES[f] ?? { label: f, intencion: 'media' as const, color: '#7F8FAE' }
}

// El concesionario y el cargo viven dentro de `notas` como texto separado por
// " · " porque la tabla no tiene columnas propias. Se extraen para poder
// mostrarlos en su columna; si algún día se agregan al esquema, esto se borra.
function campoDeNotas(notas: string | null, clave: string): string {
  if (!notas) return ''
  const parte = notas.split('·').map(p => p.trim()).find(p => p.toLowerCase().startsWith(clave.toLowerCase() + ':'))
  return parte ? parte.slice(parte.indexOf(':') + 1).trim() : ''
}

function fecha(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function PulseLeadsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{ nombre: string; email: string } | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'denegado' | 'error'>('cargando')
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<string>('todas')
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
        const res = await fetch('/api/pulse/admin/leads', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.status === 404 || res.status === 401) { setEstado('denegado'); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al cargar')
        setLeads(data.leads as Lead[])
        setEstado('listo')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar')
        setEstado('error')
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const conteos = useMemo(() => {
    const m: Record<string, number> = {}
    leads.forEach(l => { const k = l.fuente || 'sin_origen'; m[k] = (m[k] || 0) + 1 })
    return m
  }, [leads])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return leads.filter(l => {
      if (filtro !== 'todas' && (l.fuente || 'sin_origen') !== filtro) return false
      if (!q) return true
      return [l.nombre, l.email, l.telefono, l.notas].some(v => (v || '').toLowerCase().includes(q))
    })
  }, [leads, filtro, busqueda])

  // Exportar lo que se está viendo, no la tabla entera: si el usuario filtró por
  // ebook y exporta, espera el ebook.
  function exportarCSV() {
    const cab = ['Fecha', 'Nombre', 'Correo', 'Teléfono', 'Concesionario', 'Cargo', 'Origen']
    const filas = visibles.map(l => [
      new Date(l.created_at).toISOString(),
      l.nombre || '',
      l.email || '',
      l.telefono || '',
      campoDeNotas(l.notas, 'Concesionario'),
      campoDeNotas(l.notas, 'Cargo'),
      metaFuente(l.fuente).label,
    ])
    const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = [cab, ...filas].map(f => f.map(escapar).join(',')).join('\n')
    // BOM al inicio: sin él, Excel en Windows abre los acentos rotos.
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `contactos-pulse-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const cuerpo = (
    <div style={{ padding: '26px 22px', maxWidth: '1180px', margin: '0 auto' }}>
      <style>{`
        .lead-row:hover { background: rgba(255,255,255,.035) }
        .lead-chip { transition: border-color .15s ease, color .15s ease, background .15s ease }
        .lead-btn:hover { transform: translateY(-1px) }
        @media (max-width: 820px) { .lead-tabla { min-width: 780px } }
      `}</style>

      <h1 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: '24px', fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px', letterSpacing: '-.02em' }}>
        Contactos
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--ink-dim)', margin: '0 0 20px' }}>
        Todo lo que capturó el sitio, ordenado por lo más reciente. Máximo 500.
      </p>

      {estado === 'cargando' && <p style={{ color: 'var(--ink-dim)', fontSize: '14px' }}>Cargando…</p>}

      {estado === 'denegado' && (
        <div style={{ padding: '18px', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--bg-1)' }}>
          <p style={{ color: 'var(--ink)', fontWeight: 700, margin: '0 0 6px' }}>Esta bandeja no está disponible para tu cuenta.</p>
          <p style={{ color: 'var(--ink-dim)', fontSize: '13px', margin: 0, lineHeight: 1.55 }}>
            Los contactos solo los ven las cuentas listadas en <code>PULSE_ADMIN_EMAILS</code>. Si deberías estar ahí, agregá tu correo a esa variable en Vercel y volvé a entrar.
          </p>
        </div>
      )}

      {estado === 'error' && (
        <p style={{ color: '#F87171', fontSize: '13.5px' }}>{error}</p>
      )}

      {estado === 'listo' && (
        <>
          {/* Filtros por origen. El conteo va en el chip para no necesitar una
              fila de tarjetas de resumen que diga lo mismo. */}
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {[['todas', `Todas · ${leads.length}`] as const,
              ...Object.entries(conteos).map(([k, n]) => [k, `${metaFuente(k).label} · ${n}`] as const)]
              .map(([id, label]) => {
                const activo = filtro === id
                return (
                  <button
                    key={id}
                    onClick={() => setFiltro(id)}
                    className="lead-chip"
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

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, correo o concesionario…"
              style={{
                flex: '1 1 260px', padding: '9px 13px', borderRadius: '9px',
                border: '1px solid var(--line)', background: 'var(--bg-1)',
                color: 'var(--ink)', fontSize: '13.5px', fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={exportarCSV}
              className="lead-btn"
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
            <div className="lead-tabla">
              <div style={{ display: 'grid', gridTemplateColumns: '112px 1.1fr 1.3fr 1.1fr .9fr 1fr', gap: '10px', padding: '11px 14px', borderBottom: '1px solid var(--line)', fontSize: '10.5px', color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '.6px', fontWeight: 700 }}>
                <span>Fecha</span><span>Nombre</span><span>Correo</span><span>Concesionario</span><span>Teléfono</span><span>Origen</span>
              </div>

              {visibles.map(l => {
                const f = metaFuente(l.fuente)
                return (
                  <div key={l.id} className="lead-row" style={{ display: 'grid', gridTemplateColumns: '112px 1.1fr 1.3fr 1.1fr .9fr 1fr', gap: '10px', padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '12.5px', color: 'var(--ink)', alignItems: 'center' }}>
                    <span style={{ color: 'var(--ink-dim)', fontSize: '11.5px' }}>{fecha(l.created_at)}</span>
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nombre || '—'}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={`mailto:${l.email}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{l.email || '—'}</a>
                    </span>
                    <span style={{ color: 'var(--ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {campoDeNotas(l.notas, 'Concesionario') || '—'}
                    </span>
                    <span style={{ color: 'var(--ink-dim)' }}>
                      {l.telefono && l.telefono !== '—'
                        ? <a href={`https://wa.me/${l.telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-dim)', textDecoration: 'none' }}>{l.telefono}</a>
                        : <span style={{ opacity: .45 }}>sin número</span>}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '2px', background: f.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '11.5px', color: 'var(--ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</span>
                    </span>
                  </div>
                )
              })}

              {visibles.length === 0 && (
                <p style={{ padding: '26px 14px', textAlign: 'center', color: 'var(--ink-dim)', fontSize: '13px', margin: 0 }}>
                  Nada con ese filtro.
                </p>
              )}
            </div>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--ink-dim)', marginTop: '12px', lineHeight: 1.55 }}>
            Los contactos del ebook no traen teléfono a propósito: el formulario no lo pide, para no bajar la descarga. Se consigue en el primer correo de seguimiento.
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
