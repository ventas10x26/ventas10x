// Ruta destino: src/components/admin/FenixLeadsClient.tsx
// Adaptación de LeadsTable.tsx + PipelineKanban.tsx (dashboard de
// Ventas10x) a los leads de Fenix Consultores: mismas ideas de interacción
// -- filtros, arrastrar entre columnas, modal de detalle -- sobre las
// columnas propias de fenix_leads (empresa, telefono, mensaje, notas).
'use client'
import { useState } from 'react'

type FenixLead = {
  id: string
  empresa: string
  nombre: string
  email: string
  telefono: string
  mensaje: string | null
  fuente: string
  etapa: string
  notas: string | null
  created_at: string
}

const ETAPAS = [
  { key: 'nuevo', label: 'Nuevo', color: '#64748b' },
  { key: 'contactado', label: 'Contactado', color: '#3b82f6' },
  { key: 'diagnostico', label: 'En diagnóstico', color: '#f59e0b' },
  { key: 'propuesta', label: 'Propuesta enviada', color: '#8b5cf6' },
  { key: 'cliente', label: 'Cliente', color: '#22c55e' },
  { key: 'perdido', label: 'Perdido', color: '#ef4444' },
]
const ETAPA_MAP = Object.fromEntries(ETAPAS.map(e => [e.key, e]))
const ACCENT = '#F5821F'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Ahora'
  if (m < 60) return `Hace ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  return `Hace ${d}d`
}

function formatFecha(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function waLink(telefono: string) {
  return `https://wa.me/${telefono.replace(/\D/g, '')}`
}

function exportCSV(leads: FenixLead[]) {
  const headers = ['Empresa', 'Contacto', 'Email', 'Teléfono', 'Qué necesita', 'Etapa', 'Fuente', 'Fecha']
  const rows = leads.map(l => [
    l.empresa, l.nombre, l.email, l.telefono,
    l.mensaje || '', ETAPA_MAP[l.etapa]?.label || l.etapa, l.fuente,
    new Date(l.created_at).toLocaleDateString('es-CO'),
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'leads-fenix.csv'
  a.click()
  URL.revokeObjectURL(url)
}

async function updateLead(id: string, data: { etapa?: string; notas?: string }) {
  const res = await fetch(`/api/admin/fenix-leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al actualizar el lead')
  return res.json()
}

export function FenixLeadsClient({ initialLeads }: {
  initialLeads: FenixLead[]
}) {
  const [leads, setLeads] = useState<FenixLead[]>(initialLeads)
  const [vista, setVista] = useState<'tabla' | 'pipeline'>('pipeline')
  const [search, setSearch] = useState('')
  const [filtroEtapa, setFiltroEtapa] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<FenixLead | null>(null)
  const [notasBorrador, setNotasBorrador] = useState('')
  const [guardandoNotas, setGuardandoNotas] = useState(false)
  const [enviandoAutoresp, setEnviandoAutoresp] = useState(false)
  const [autorespResultado, setAutorespResultado] = useState<{ ok: boolean; texto: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtrados = leads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      l.empresa.toLowerCase().includes(q) ||
      l.nombre.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.telefono.includes(q)
    const matchEtapa = !filtroEtapa || l.etapa === filtroEtapa
    return matchSearch && matchEtapa
  })

  const conteoEtapas = ETAPAS.map(e => ({ ...e, total: leads.filter(l => l.etapa === e.key).length }))
  const cerrados = leads.filter(l => l.etapa === 'cliente').length
  const perdidos = leads.filter(l => l.etapa === 'perdido').length
  const tasaConversion = leads.length > 0 ? Math.round((cerrados / leads.length) * 100) : 0

  function abrirDetalle(lead: FenixLead) {
    setDetalle(lead)
    setNotasBorrador(lead.notas || '')
    setAutorespResultado(null)
  }

  async function cambiarEtapa(id: string, etapa: string) {
    const prev = leads
    setLeads(ls => ls.map(l => (l.id === id ? { ...l, etapa } : l)))
    setDetalle(d => (d && d.id === id ? { ...d, etapa } : d))
    try {
      await updateLead(id, { etapa })
    } catch {
      setLeads(prev)
      setError('No se pudo mover el lead. Intenta de nuevo.')
    }
  }

  async function guardarNotas() {
    if (!detalle) return
    setGuardandoNotas(true)
    try {
      await updateLead(detalle.id, { notas: notasBorrador })
      setLeads(ls => ls.map(l => (l.id === detalle.id ? { ...l, notas: notasBorrador || null } : l)))
      setDetalle(d => (d ? { ...d, notas: notasBorrador || null } : d))
    } catch {
      setError('No se pudieron guardar las notas.')
    } finally {
      setGuardandoNotas(false)
    }
  }

  async function enviarAutorespuesta() {
    if (!detalle) return
    setEnviandoAutoresp(true)
    setAutorespResultado(null)
    try {
      const res = await fetch(`/api/admin/fenix-leads/${detalle.id}/autorespuesta`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo enviar')
      setAutorespResultado({ ok: true, texto: '✓ Autorespuesta enviada por WhatsApp' })
    } catch (e) {
      setAutorespResultado({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo enviar' })
    } finally {
      setEnviandoAutoresp(false)
    }
  }

  function handleDrop(e: React.DragEvent, etapaKey: string) {
    e.preventDefault()
    if (!draggingId) return
    const lead = leads.find(l => l.id === draggingId)
    setDraggingId(null)
    if (!lead || lead.etapa === etapaKey) return
    cambiarEtapa(lead.id, etapaKey)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ padding: '24px clamp(16px, 4vw, 32px)', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, marginBottom: '4px' }}>
              Fénix Consultores
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Leads y pipeline</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '3px' }}>
              {(['pipeline', 'tabla'] as const).map(v => (
                <button key={v} onClick={() => setVista(v)} style={{
                  padding: '7px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                  background: vista === v ? '#0f172a' : 'transparent',
                  color: vista === v ? '#fff' : '#64748b',
                }}>
                  {v === 'pipeline' ? '▦ Pipeline' : '☰ Tabla'}
                </button>
              ))}
            </div>

            <button onClick={() => exportCSV(filtrados)} style={{
              padding: '9px 16px', borderRadius: '10px', border: '1px solid #e2e8f0',
              background: '#fff', color: '#0f172a', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ↓ Exportar CSV
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total leads', valor: leads.length, color: '#0f172a' },
            { label: 'Clientes', valor: cerrados, color: '#22c55e' },
            { label: 'Conversión', valor: `${tasaConversion}%`, color: ACCENT },
            { label: 'Perdidos', valor: perdidos, color: '#ef4444' },
          ].map(m => (
            <div key={m.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 18px', minWidth: '96px' }}>
              <div style={{ fontSize: '19px', fontWeight: 700, color: m.color }}>{m.valor}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '13px', color: '#dc2626', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
          </div>
        )}

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Buscar empresa, contacto, email o teléfono…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: '9px', border: '1px solid #e2e8f0',
              fontSize: '13px', fontFamily: 'inherit', outline: 'none', width: '260px', background: '#fff',
            }}
          />
          {conteoEtapas.map(e => {
            const activo = filtroEtapa === e.key
            if (e.total === 0 && !activo) return null
            return (
              <button key={e.key} onClick={() => setFiltroEtapa(activo ? null : e.key)} style={{
                fontSize: '11.5px', fontWeight: 700, padding: '5px 11px', borderRadius: '999px',
                background: activo ? e.color : `${e.color}18`, color: activo ? '#fff' : e.color,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {e.label} · {e.total}
              </button>
            )
          })}
          {(filtroEtapa || search) && (
            <button onClick={() => { setFiltroEtapa(null); setSearch('') }} style={{
              fontSize: '11.5px', padding: '5px 11px', borderRadius: '999px',
              background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* ── Vista Pipeline ── */}
        {vista === 'pipeline' && (
          <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${(filtroEtapa ? conteoEtapas.filter(e => e.key === filtroEtapa) : conteoEtapas).length}, minmax(230px, 1fr))`,
              gap: '12px',
              minWidth: `${(filtroEtapa ? 1 : ETAPAS.length) * 242}px`,
            }}>
              {(filtroEtapa ? conteoEtapas.filter(e => e.key === filtroEtapa) : conteoEtapas).map(etapa => {
                const columnaLeads = filtrados.filter(l => l.etapa === etapa.key)
                return (
                  <div key={etapa.key}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, etapa.key)}
                    style={{ background: '#f1f0ed', borderRadius: '16px', padding: '14px', minHeight: '480px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: etapa.color }} />
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#374151' }}>{etapa.label}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: `${etapa.color}20`, color: etapa.color }}>
                        {columnaLeads.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                      {columnaLeads.length === 0 && (
                        <div style={{ border: '2px dashed #dcdad4', borderRadius: '12px', padding: '20px', textAlign: 'center', fontSize: '11.5px', color: '#b0aca1' }}>
                          Sin leads
                        </div>
                      )}
                      {columnaLeads.map(lead => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => setDraggingId(lead.id)}
                          onClick={() => abrirDetalle(lead)}
                          style={{
                            background: '#fff', borderRadius: '12px', padding: '13px',
                            cursor: 'pointer', border: '1px solid #ece9e3',
                            borderLeft: `3px solid ${etapa.color}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                          }}
                        >
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>{lead.empresa}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{lead.nombre}</div>
                          <div style={{ fontSize: '12px', color: ACCENT, marginBottom: '4px' }}>📱 {lead.telefono}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '9px' }}>{timeAgo(lead.created_at)}</div>
                          <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                            <a href={waLink(lead.telefono)} target="_blank" rel="noopener noreferrer" style={{
                              flex: 1, padding: '6px', textAlign: 'center', fontSize: '11.5px', fontWeight: 600,
                              background: '#f0fdf4', color: '#16a34a', borderRadius: '8px', textDecoration: 'none',
                            }}>
                              💬 WA
                            </a>
                            <button onClick={() => abrirDetalle(lead)} style={{
                              flex: 1, padding: '6px', fontSize: '11.5px', fontWeight: 600,
                              background: `${ACCENT}18`, color: ACCENT, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                              Detalle
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Vista Tabla ── */}
        {vista === 'tabla' && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['Empresa', 'Contacto', 'Email', 'Teléfono', 'Qué necesita', 'Etapa', 'Llegó', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#4a4a47', fontSize: '11px', background: '#f7f6f4', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '14px' }}>
                      {search || filtroEtapa ? 'Sin resultados para esta búsqueda' : 'Aún no hay leads.'}
                    </td></tr>
                  ) : filtrados.map(lead => {
                    const etapa = ETAPA_MAP[lead.etapa]
                    return (
                      <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => abrirDetalle(lead)}>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f0ed', fontWeight: 700, color: '#0f172a' }}>{lead.empresa}</td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f0ed' }}>{lead.nombre}</td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f0ed' }}>
                          <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()} style={{ color: ACCENT, textDecoration: 'none' }}>{lead.email}</a>
                        </td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f0ed' }}>
                          <a href={waLink(lead.telefono)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: ACCENT, textDecoration: 'none' }}>{lead.telefono}</a>
                        </td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f0ed', color: '#64748b', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lead.mensaje || '—'}
                        </td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f0ed' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: `${etapa?.color}18`, color: etapa?.color }}>
                            {etapa?.label || lead.etapa}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f0ed', color: '#94a3b8', fontSize: '12px' }}>{timeAgo(lead.created_at)}</td>
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f0ed' }}>
                          <a href={waLink(lead.telefono)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
                            background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', textDecoration: 'none',
                          }}>
                            💬 WA
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal de detalle ── */}
      {detalle && (
        <div onClick={() => setDetalle(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '480px',
            maxHeight: '90vh', overflowY: 'auto', padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>{detalle.empresa}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{detalle.nombre}</div>
              </div>
              <button onClick={() => setDetalle(null)} style={{
                background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '30px', height: '30px',
                cursor: 'pointer', fontSize: '16px', color: '#64748b', flexShrink: 0,
              }}>×</button>
            </div>

            {/* Etapa */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Etapa
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ETAPAS.map(e => {
                  const activa = detalle.etapa === e.key
                  return (
                    <button key={e.key} onClick={() => cambiarEtapa(detalle.id, e.key)} style={{
                      fontSize: '11.5px', fontWeight: 700, padding: '6px 11px', borderRadius: '999px',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: activa ? e.color : `${e.color}15`, color: activa ? '#fff' : e.color,
                    }}>
                      {e.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Datos */}
            {[
              { l: 'Email', v: detalle.email },
              { l: 'Teléfono', v: detalle.telefono },
              { l: 'Qué necesita', v: detalle.mensaje || '—' },
              { l: 'Fuente', v: detalle.fuente },
              { l: 'Llegó', v: formatFecha(detalle.created_at) },
            ].map(row => (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#94a3b8', flexShrink: 0 }}>{row.l}</span>
                <span style={{ fontWeight: 500, color: '#0f172a', textAlign: 'right' }}>{row.v}</span>
              </div>
            ))}

            {/* Notas internas */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Notas internas
              </div>
              <textarea
                value={notasBorrador}
                onChange={e => setNotasBorrador(e.target.value)}
                placeholder="Seguimiento, próximos pasos, quién lo está llevando…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0',
                  fontSize: '13px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={guardarNotas}
                disabled={guardandoNotas || notasBorrador === (detalle.notas || '')}
                style={{
                  marginTop: '8px', padding: '9px 16px', borderRadius: '9px', border: 'none',
                  background: notasBorrador === (detalle.notas || '') ? '#e2e8f0' : '#0f172a',
                  color: notasBorrador === (detalle.notas || '') ? '#94a3b8' : '#fff',
                  fontSize: '12.5px', fontWeight: 700, cursor: guardandoNotas ? 'default' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {guardandoNotas ? 'Guardando…' : 'Guardar notas'}
              </button>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
              <a href={waLink(detalle.telefono)} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, textAlign: 'center', padding: '11px', background: '#25D366', color: '#fff',
                borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, textDecoration: 'none',
              }}>
                💬 WhatsApp
              </a>
              <a href={`mailto:${detalle.email}`} style={{
                flex: 1, textAlign: 'center', padding: '11px', background: ACCENT, color: '#fff',
                borderRadius: '10px', fontSize: '13.5px', fontWeight: 700, textDecoration: 'none',
              }}>
                ✉️ Email
              </a>
            </div>

            <button
              onClick={enviarAutorespuesta}
              disabled={enviandoAutoresp}
              style={{
                width: '100%', marginTop: '8px', padding: '11px', borderRadius: '10px', border: `1px solid ${ACCENT}`,
                background: `${ACCENT}12`, color: ACCENT, fontSize: '13.5px', fontWeight: 700,
                cursor: enviandoAutoresp ? 'default' : 'pointer', fontFamily: 'inherit', opacity: enviandoAutoresp ? 0.6 : 1,
              }}
            >
              {enviandoAutoresp ? 'Enviando…' : '🤖 Enviar autorespuesta (bienvenida + PDF)'}
            </button>
            {autorespResultado && (
              <p style={{ marginTop: '8px', fontSize: '12.5px', color: autorespResultado.ok ? '#16a34a' : '#dc2626', textAlign: 'center' }}>
                {autorespResultado.texto}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
