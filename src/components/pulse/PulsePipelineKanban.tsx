// Ruta destino: src/components/pulse/PulsePipelineKanban.tsx
//
// Kanban de leads para Pulse Motor.
// Adaptado del PipelineKanban.tsx de Ventas10x:
// - Tabla: pulse_leads (no leads)
// - Campo: estado (no etapa)
// - Endpoint: /api/pulse/leads/[id] (no /api/leads/[id])
// - 6 estados: Nuevo → Contactado → Interesado → Test Drive → Cerrado / Perdido
// - Sin tracking de actividades (lo agregamos en Pack 5)

'use client'

import { useState, useCallback } from 'react'

// =====================================================
// TIPOS
// =====================================================
export type PulseLead = {
  id: string
  nombre: string | null
  telefono: string | null
  modelo: string | null
  score: number | null
  urgencia: string | null
  estado: string
  texto_origen: string
  canal: string | null
  mensaje_ia: string | null
  capturado_at: string
  contactado_at: string | null
  created_at: string
}

const ESTADOS = [
  { key: 'nuevo',       label: 'Nuevo',       color: '#f97316', emoji: '⚡' },
  { key: 'contactado',  label: 'Contactado',  color: '#3b82f6', emoji: '💬' },
  { key: 'interesado',  label: 'Interesado',  color: '#f59e0b', emoji: '🔥' },
  { key: 'test_drive',  label: 'Test Drive',  color: '#a855f7', emoji: '🚗' },
  { key: 'cerrado',     label: 'Cerrado ✓',   color: '#22c55e', emoji: '🏆' },
  { key: 'perdido',     label: 'Perdido',     color: '#ef4444', emoji: '❌' },
]

// =====================================================
// HELPERS
// =====================================================
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Ahora'
  if (m < 60) return `Hace ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  return `Hace ${d}d`
}

function scoreColor(score: number | null): { bg: string; text: string } {
  if (!score) return { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' }
  if (score >= 7) return { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' }
  if (score >= 5) return { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' }
  return { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' }
}

async function updateLeadAPI(id: string, data: Record<string, string | null>) {
  const res = await fetch(`/api/pulse/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Error al actualizar lead')
  }
  return res.json()
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================
interface Props {
  initialLeads: PulseLead[]
  userId: string
  onLeadUpdated?: () => void
}

export function PulsePipelineKanban({ initialLeads, onLeadUpdated }: Props) {
  const [leads, setLeads] = useState<PulseLead[]>(initialLeads)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null)

  // Modal de detalle
  const [leadDetalle, setLeadDetalle] = useState<PulseLead | null>(null)

  // =====================================================
  // DRAG & DROP
  // =====================================================
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggingId(leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, estadoKey: string) => {
    e.preventDefault()
    if (!draggingId) return
    const lead = leads.find(l => l.id === draggingId)
    if (!lead || lead.estado === estadoKey) {
      setDraggingId(null)
      return
    }

    // Optimistic update
    const prev = leads
    const updates: Record<string, string | null> = { estado: estadoKey }
    
    // Si pasa a "contactado" y no tiene timestamp, lo marcamos automáticamente
    if (estadoKey === 'contactado' && !lead.contactado_at) {
      updates.contactado_at = new Date().toISOString()
    }
    
    setLeads(ls => ls.map(l => 
      l.id === draggingId 
        ? { ...l, estado: estadoKey, ...(updates.contactado_at ? { contactado_at: updates.contactado_at } : {}) }
        : l
    ))
    setDraggingId(null)

    try {
      await updateLeadAPI(draggingId, updates)
      onLeadUpdated?.()
    } catch (err) {
      setLeads(prev)
      setError(err instanceof Error ? err.message : 'No se pudo mover el lead.')
      setTimeout(() => setError(null), 3500)
    }
  }

  // =====================================================
  // CAMBIO DE ESTADO DESDE EL MODAL
  // =====================================================
  const cambiarEstadoDesdeDetalle = useCallback(async (estado: string) => {
    if (!leadDetalle) return
    const prev = leads
    const updates: Record<string, string | null> = { estado }
    
    if (estado === 'contactado' && !leadDetalle.contactado_at) {
      updates.contactado_at = new Date().toISOString()
    }
    
    setLeads(ls => ls.map(l => 
      l.id === leadDetalle.id 
        ? { ...l, estado, ...(updates.contactado_at ? { contactado_at: updates.contactado_at } : {}) }
        : l
    ))
    setLeadDetalle(ld => ld ? { ...ld, estado, ...(updates.contactado_at ? { contactado_at: updates.contactado_at } : {}) } : ld)
    
    try {
      await updateLeadAPI(leadDetalle.id, updates)
      onLeadUpdated?.()
    } catch {
      setLeads(prev)
      setError('No se pudo cambiar el estado')
      setTimeout(() => setError(null), 3500)
    }
  }, [leadDetalle, leads, onLeadUpdated])

  // =====================================================
  // FILTROS
  // =====================================================
  const leadsFiltrados = leads.filter(l => {
    if (filtroEstado && l.estado !== filtroEstado) return false
    return true
  })

  const conteoEstados = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.estado] = (acc[l.estado] || 0) + 1
    return acc
  }, {})

  // =====================================================
  // MÉTRICAS GENERALES
  // =====================================================
  const totalLeads = leads.length
  const cerrados = conteoEstados['cerrado'] || 0
  const perdidos = conteoEstados['perdido'] || 0
  const tasaConversion = totalLeads > 0 ? Math.round((cerrados / totalLeads) * 100) : 0

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div style={{ width: '100%', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header con métricas */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>
            Pipeline de leads
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            Arrastrá tarjetas entre columnas o clickeá para ver el detalle
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <MetricaMini label="Total" valor={totalLeads.toString()} color="#fff" />
          <MetricaMini label="Cerrados" valor={cerrados.toString()} color="#4ade80" />
          <MetricaMini label="Conversión" valor={`${tasaConversion}%`} color="#fdba74" />
          <MetricaMini label="Perdidos" valor={perdidos.toString()} color="#94a3b8" />
        </div>
      </div>

      {/* Filtros */}
      {totalLeads > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>FILTROS:</span>
          <FiltroChip
            label="Todos"
            count={totalLeads}
            active={filtroEstado === null}
            onClick={() => setFiltroEstado(null)}
            color="#94a3b8"
          />
          {ESTADOS.map(e => {
            const count = conteoEstados[e.key] || 0
            if (count === 0) return null
            return (
              <FiltroChip
                key={e.key}
                label={e.label}
                count={count}
                active={filtroEstado === e.key}
                onClick={() => setFiltroEstado(filtroEstado === e.key ? null : e.key)}
                color={e.color}
              />
            )
          })}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '13px', color: '#fca5a5' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Kanban columnas */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
        {ESTADOS.map(estado => {
          const leadsDeColumna = leadsFiltrados.filter(l => l.estado === estado.key)
          return (
            <div
              key={estado.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, estado.key)}
              style={{
                flex: '0 0 280px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '12px',
                minHeight: '300px',
              }}
            >
              {/* Header columna */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingBottom: '10px',
                borderBottom: `2px solid ${estado.color}22`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{estado.emoji}</span>
                  <strong style={{ fontSize: '13px', color: estado.color }}>{estado.label}</strong>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: `${estado.color}22`,
                  color: estado.color,
                }}>
                  {leadsDeColumna.length}
                </span>
              </div>

              {/* Cards */}
              {leadsDeColumna.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '24px 12px',
                  fontSize: '11px',
                  color: '#475569',
                  border: '1px dashed rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                }}>
                  Sin leads
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {leadsDeColumna.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => setLeadDetalle(lead)}
                      isDragging={draggingId === lead.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal detalle */}
      {leadDetalle && (
        <ModalDetalleLead
          lead={leadDetalle}
          onClose={() => setLeadDetalle(null)}
          onCambiarEstado={cambiarEstadoDesdeDetalle}
        />
      )}
    </div>
  )
}

// =====================================================
// SUB-COMPONENTES
// =====================================================

function MetricaMini({ label, valor, color }: { label: string; valor: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      padding: '8px 12px',
      minWidth: '70px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 800, color }}>{valor}</div>
    </div>
  )
}

function FiltroChip({ label, count, active, onClick, color }: { label: string; count: number; active: boolean; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        borderRadius: '999px',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.08)'}`,
        background: active ? `${color}22` : 'transparent',
        color: active ? color : '#94a3b8',
        fontSize: '11px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label} · {count}
    </button>
  )
}

function LeadCard({ lead, onDragStart, onClick, isDragging }: { lead: PulseLead; onDragStart: (e: React.DragEvent) => void; onClick: () => void; isDragging: boolean }) {
  const sc = scoreColor(lead.score)
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '10px 12px',
        cursor: 'pointer',
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <strong style={{ fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.nombre || '⚠️ Sin clasificar'}
        </strong>
        {lead.score !== null && (
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '999px',
            background: sc.bg,
            color: sc.text,
            flexShrink: 0,
          }}>
            {lead.score}/10
          </span>
        )}
      </div>
      {lead.modelo && (
        <div style={{ fontSize: '11px', color: '#fdba74', marginBottom: '4px' }}>
          🚗 {lead.modelo}
        </div>
      )}
      {lead.telefono && (
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
          📱 {lead.telefono}
        </div>
      )}
      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
        {timeAgo(lead.created_at)}
        {lead.urgencia === 'alta' && <span style={{ marginLeft: '6px', color: '#fca5a5' }}>🔥 urgente</span>}
      </div>
    </div>
  )
}

function ModalDetalleLead({ lead, onClose, onCambiarEstado }: { lead: PulseLead; onClose: () => void; onCambiarEstado: (estado: string) => void }) {
  const [procesandoIA, setProcesandoIA] = useState<'clasificar' | 'responder' | null>(null)
  const [leadActual, setLeadActual] = useState(lead)
  const [mensajeEditable, setMensajeEditable] = useState(lead.mensaje_ia || '')

  const clasificar = async () => {
    setProcesandoIA('clasificar')
    try {
      const res = await fetch(`/api/pulse/leads/${leadActual.id}/clasificar`, { method: 'POST' })
      const data = await res.json()
      if (data.ok && data.lead) {
        setLeadActual(data.lead)
      }
    } catch (e) {
      console.error('clasificar:', e)
    } finally {
      setProcesandoIA(null)
    }
  }

  const generarMensaje = async () => {
    setProcesandoIA('responder')
    try {
      const res = await fetch(`/api/pulse/leads/${leadActual.id}/responder`, { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setMensajeEditable(data.mensaje)
        setLeadActual({ ...leadActual, mensaje_ia: data.mensaje })
      }
    } catch (e) {
      console.error('responder:', e)
    } finally {
      setProcesandoIA(null)
    }
  }

  const enviarWhatsApp = () => {
    if (!leadActual.telefono) {
      alert('Este lead no tiene teléfono.')
      return
    }
    const numero = leadActual.telefono.replace(/[^\d+]/g, '').replace(/^\+/, '')
    const msg = encodeURIComponent(mensajeEditable || leadActual.mensaje_ia || '')
    window.open(`https://wa.me/${numero}?text=${msg}`, '_blank')
    // Marcar como contactado automáticamente
    if (leadActual.estado === 'nuevo') {
      onCambiarEstado('contactado')
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>
              {leadActual.nombre || '⚠️ Lead sin clasificar'}
            </h3>
            {leadActual.modelo && (
              <p style={{ fontSize: '13px', color: '#fdba74', margin: 0 }}>
                🚗 {leadActual.modelo} · {leadActual.telefono || 'sin teléfono'}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer', padding: '0 4px' }}>×</button>
        </div>

        {/* Cambiar estado */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Cambiar estado:</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {ESTADOS.map(e => (
              <button
                key={e.key}
                onClick={() => onCambiarEstado(e.key)}
                disabled={leadActual.estado === e.key}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: leadActual.estado === e.key ? `1px solid ${e.color}` : '1px solid rgba(255,255,255,0.08)',
                  background: leadActual.estado === e.key ? `${e.color}22` : 'transparent',
                  color: leadActual.estado === e.key ? e.color : '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: leadActual.estado === e.key ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {e.emoji} {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Texto origen */}
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', borderLeft: '3px solid #f97316' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>Texto original del lead</div>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: '1.5' }}>{leadActual.texto_origen}</p>
        </div>

        {/* Acciones IA */}
        {!leadActual.nombre && (
          <button onClick={clasificar} disabled={!!procesandoIA} style={btnPrimaryStyle}>
            {procesandoIA === 'clasificar' ? '🔮 Clasificando con IA...' : '🔮 Clasificar lead con IA'}
          </button>
        )}

        {leadActual.nombre && !leadActual.mensaje_ia && (
          <button onClick={generarMensaje} disabled={!!procesandoIA} style={btnPrimaryStyle}>
            {procesandoIA === 'responder' ? '✍️ Generando...' : '✍️ Generar mensaje WhatsApp con IA'}
          </button>
        )}

        {leadActual.mensaje_ia && (
          <>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Mensaje listo para enviar:</div>
            <textarea
              value={mensajeEditable}
              onChange={(e) => setMensajeEditable(e.target.value)}
              rows={5}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                marginBottom: '12px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              {leadActual.telefono && (
                <button onClick={enviarWhatsApp} style={{ ...btnPrimaryStyle, flex: 1, background: '#25D366', marginBottom: 0 }}>
                  📤 Enviar por WhatsApp
                </button>
              )}
              <button onClick={generarMensaje} disabled={!!procesandoIA} style={btnSecondaryStyle}>
                🔄 Regenerar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const btnPrimaryStyle: React.CSSProperties = {
  padding: '11px 16px',
  borderRadius: '10px',
  border: 'none',
  background: 'linear-gradient(135deg, #f97316, #ea580c)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  width: '100%',
  marginBottom: '12px',
}

const btnSecondaryStyle: React.CSSProperties = {
  padding: '11px 16px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'transparent',
  color: '#94a3b8',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
