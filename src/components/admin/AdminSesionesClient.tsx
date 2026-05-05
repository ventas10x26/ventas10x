// Ruta destino: src/components/admin/AdminSesionesClient.tsx
'use client'
import { useState } from 'react'

const DARK = '#0f1c2e'
const ORANGE = '#FF6B2B'

type LoginLog = {
  id: string
  user_id: string
  email: string | null
  nombre: string | null
  ip: string | null
  user_agent: string | null
  dispositivo: string | null
  pais: string | null
  ciudad: string | null
  exitoso: boolean
  created_at: string
}

type UserInfo = {
  email: string
  created_at: string
  last_sign_in_at: string
}

type Props = {
  logs: LoginLog[]
  userMap: Record<string, UserInfo>
}

function formatFecha(d: string) {
  return new Date(d).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Ahora'
  if (m < 60) return `Hace ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

const DISP_ICONS: Record<string, string> = {
  mobile: '📱',
  desktop: '💻',
  tablet: '📟',
}

export function AdminSesionesClient({ logs, userMap }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroDisp, setFiltroDisp] = useState<string | null>(null)
  const [vistaDetalle, setVistaDetalle] = useState<string | null>(null)

  // Stats rápidas
  const hoy = logs.filter(l => new Date(l.created_at) > new Date(Date.now() - 86400000))
  const semana = logs.filter(l => new Date(l.created_at) > new Date(Date.now() - 7 * 86400000))
  const uniqueUsers = new Set(logs.map(l => l.user_id)).size
  const mobile = logs.filter(l => l.dispositivo === 'mobile').length
  const desktop = logs.filter(l => l.dispositivo === 'desktop').length

  // Usuarios únicos con más actividad
  const actividadPorUser = logs.reduce<Record<string, { email: string; nombre: string | null; count: number; ultimo: string }>>((acc, l) => {
    if (!acc[l.user_id]) acc[l.user_id] = { email: l.email || '', nombre: l.nombre, count: 0, ultimo: l.created_at }
    acc[l.user_id].count++
    if (new Date(l.created_at) > new Date(acc[l.user_id].ultimo)) acc[l.user_id].ultimo = l.created_at
    return acc
  }, {})

  const topUsers = Object.entries(actividadPorUser).sort((a, b) => b[1].count - a[1].count).slice(0, 5)

  const logsFiltrados = logs.filter(l => {
    const q = busqueda.toLowerCase()
    const matchQ = !q || [l.email, l.nombre, l.ip, l.dispositivo].some(v => v?.toLowerCase().includes(q))
    const matchDisp = !filtroDisp || l.dispositivo === filtroDisp
    return matchQ && matchDisp
  })

  const detalleUser = vistaDetalle
    ? { info: actividadPorUser[vistaDetalle], logs: logs.filter(l => l.user_id === vistaDetalle), auth: userMap[vistaDetalle] }
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: DARK, padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>🔐 Log de Sesiones</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', marginTop: '2px' }}>Registro de inicios de sesión · Solo superadmin</div>
        </div>
        <a href="/admin/pagos" style={{ color: 'rgba(255,255,255,.5)', fontSize: '13px', textDecoration: 'none' }}>← Volver</a>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total sesiones', valor: logs.length, color: '#3b82f6', icon: '🔐' },
            { label: 'Hoy', valor: hoy.length, color: ORANGE, icon: '📅' },
            { label: 'Esta semana', valor: semana.length, color: '#8b5cf6', icon: '📊' },
            { label: 'Usuarios únicos', valor: uniqueUsers, color: '#22c55e', icon: '👥' },
            { label: 'Mobile', valor: mobile, color: '#f59e0b', icon: '📱' },
            { label: 'Desktop', valor: desktop, color: '#64748b', icon: '💻' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #f1f5f9', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.valor}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>

          {/* Log principal */}
          <div>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por email, nombre, IP..."
                style={{ flex: 1, minWidth: '200px', padding: '9px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
              />
              {['mobile', 'desktop', 'tablet'].map(d => (
                <button key={d} onClick={() => setFiltroDisp(filtroDisp === d ? null : d)} style={{ padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: filtroDisp === d ? DARK : '#f1f5f9', color: filtroDisp === d ? '#fff' : '#64748b' }}>
                  {DISP_ICONS[d]} {d}
                </button>
              ))}
              <div style={{ fontSize: '13px', color: '#94a3b8', alignSelf: 'center' }}>{logsFiltrados.length} registros</div>
            </div>

            {/* Tabla */}
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Sin logs aún</div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>Los logs aparecerán aquí cuando los usuarios inicien sesión.</div>
                <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', fontSize: '12px', color: '#64748b', textAlign: 'left', maxWidth: '400px', margin: '16px auto 0' }}>
                  <strong>Para activar:</strong> Corre el SQL en Supabase y luego los nuevos logins quedarán registrados automáticamente.
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        {['Usuario', 'Dispositivo', 'IP', 'Hace', 'Fecha'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logsFiltrados.map((log, i) => (
                        <tr
                          key={log.id}
                          onClick={() => setVistaDetalle(log.user_id === vistaDetalle ? null : log.user_id)}
                          style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: vistaDetalle === log.user_id ? `${ORANGE}06` : i % 2 === 0 ? '#fff' : '#fafafa' }}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{log.nombre || log.email?.split('@')[0] || 'Usuario'}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{log.email}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '13px' }}>{DISP_ICONS[log.dispositivo || 'desktop'] || '💻'}</span>
                            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>{log.dispositivo || 'desktop'}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{log.ip || '—'}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{timeAgo(log.created_at)}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatFecha(log.created_at)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Panel derecho */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Detalle usuario seleccionado */}
            {detalleUser && (
              <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${ORANGE}30`, padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                  👤 {detalleUser.info?.nombre || detalleUser.info?.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>{detalleUser.info?.email}</div>

                {[
                  { label: 'Total sesiones', val: detalleUser.info?.count || 0 },
                  { label: 'Último acceso', val: timeAgo(detalleUser.info?.ultimo || '') },
                  { label: 'Registrado', val: detalleUser.auth ? formatFecha(detalleUser.auth.created_at) : '—' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>{r.label}</span>
                    <span style={{ color: '#374151', fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}

                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Últimas sesiones</div>
                  {detalleUser.logs.slice(0, 5).map(l => (
                    <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', borderBottom: '1px solid #f8fafc' }}>
                      <span>{DISP_ICONS[l.dispositivo || 'desktop']} {l.ip || '—'}</span>
                      <span style={{ color: '#94a3b8' }}>{timeAgo(l.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top usuarios */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>🏆 Más activos</div>
              {topUsers.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Sin datos aún</div>
              ) : topUsers.map(([uid, info], i) => (
                <div key={uid} onClick={() => setVistaDetalle(vistaDetalle === uid ? null : uid)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '10px', cursor: 'pointer', marginBottom: '4px', background: vistaDetalle === uid ? `${ORANGE}08` : 'transparent' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{info.nombre || info.email?.split('@')[0]}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{info.count} sesiones · {timeAgo(info.ultimo)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
