// Ruta destino: src/components/dashboard/PipelineKanban.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Lead } from '@/types/database'

const ETAPAS = [
  { key: 'nuevo',       label: 'Nuevo',        color: '#64748b', emoji: '🔵' },
  { key: 'contactado',  label: 'Contactado',   color: '#3b82f6', emoji: '📞' },
  { key: 'interesado',  label: 'Interesado',   color: '#f59e0b', emoji: '🔥' },
  { key: 'propuesta',   label: 'Propuesta',    color: '#8b5cf6', emoji: '📄' },
  { key: 'negociacion', label: 'Negociación',  color: '#f97316', emoji: '🤝' },
  { key: 'cerrado',     label: 'Cerrado ✓',    color: '#22c55e', emoji: '🏆' },
  { key: 'perdido',     label: 'Perdido',      color: '#ef4444', emoji: '❌' },
]

const TIPOS_ACTIVIDAD = [
  { key: 'nota',      label: 'Nota',       emoji: '📝' },
  { key: 'llamada',   label: 'Llamada',    emoji: '📞' },
  { key: 'whatsapp',  label: 'WhatsApp',   emoji: '💬' },
  { key: 'email',     label: 'Email',      emoji: '📧' },
  { key: 'reunion',   label: 'Reunión',    emoji: '🤝' },
  { key: 'propuesta', label: 'Propuesta',  emoji: '📄' },
]

type FuenteConfig = { emoji: string; label: string; color: string; bg: string; texto: string }
const FUENTES: Record<string, FuenteConfig> = {
  bot_landing: { emoji: '🤖', label: 'Bot Landing', color: '#3B82F6', bg: 'rgba(59,130,246,.1)', texto: '#1d4ed8' },
  bot_ia:      { emoji: '✦',  label: 'Bot IA',      color: '#FF6B2B', bg: 'rgba(255,107,43,.1)', texto: '#c2410c' },
  formulario:  { emoji: '📝', label: 'Formulario',  color: '#10b981', bg: 'rgba(16,185,129,.1)', texto: '#047857' },
  manual:      { emoji: '✋', label: 'Manual',      color: '#a855f7', bg: 'rgba(168,85,247,.1)', texto: '#7e22ce' },
  otro:        { emoji: '📍', label: 'Otro',        color: '#9ca3af', bg: 'rgba(156,163,175,.1)', texto: '#4b5563' },
}
function getFuenteConfig(fuente: string | null | undefined): FuenteConfig {
  if (!fuente) return FUENTES.otro
  return FUENTES[fuente] || FUENTES.otro
}

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
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

type Actividad = {
  id: string
  tipo: string
  descripcion: string
  created_at: string
}
type Recordatorio = {
  id: string
  descripcion: string
  fecha_recordatorio: string
  completado: boolean
}

async function updateLeadAPI(id: string, data: Record<string, string | null>) {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al actualizar lead')
  return res.json()
}

interface Props {
  initialLeads: Lead[]
  userId: string
}

export function PipelineKanban({ initialLeads }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filtroFuente, setFiltroFuente] = useState<string | null>(null)
  const [filtroEtapa, setFiltroEtapa] = useState<string | null>(null)

  // Modal de detalle del lead
  const [leadDetalle, setLeadDetalle] = useState<Lead | null>(null)
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [recordatorio, setRecordatorio] = useState<Recordatorio | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // Form nueva actividad
  const [tipoActividad, setTipoActividad] = useState('nota')
  const [descripcionActividad, setDescripcionActividad] = useState('')
  const [fechaRecordatorio, setFechaRecordatorio] = useState('')
  const [conRecordatorio, setConRecordatorio] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggingId(leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e: React.DragEvent, etapaKey: string) => {
    e.preventDefault()
    if (!draggingId) return
    const lead = leads.find(l => l.id === draggingId)
    if (!lead || lead.etapa === etapaKey) { setDraggingId(null); return }

    const prev = leads
    setLeads(ls => ls.map(l => l.id === draggingId ? { ...l, etapa: etapaKey } : l))
    setDraggingId(null)
    try {
      await updateLeadAPI(draggingId, { etapa: etapaKey })
    } catch {
      setLeads(prev)
      setError('No se pudo mover el lead. Intenta de nuevo.')
    }
  }

  const abrirDetalle = useCallback(async (lead: Lead) => {
    setLeadDetalle(lead)
    setLoadingDetalle(true)
    setActividades([])
    setRecordatorio(null)
    try {
      const res = await fetch(`/api/leads/actividades?lead_id=${lead.id}`)
      const data = await res.json()
      setActividades(data.actividades || [])
      setRecordatorio(data.recordatorio || null)
    } catch {
      // silencioso
    } finally {
      setLoadingDetalle(false)
    }
  }, [])

  const guardarActividad = async () => {
    if (!leadDetalle || !descripcionActividad.trim()) return
    setGuardando(true)
    try {
      const res = await fetch('/api/leads/actividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadDetalle.id,
          tipo: tipoActividad,
          descripcion: descripcionActividad.trim(),
          fecha_recordatorio: conRecordatorio && fechaRecordatorio ? fechaRecordatorio : null,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setActividades(prev => [data.actividad, ...prev])
        if (data.recordatorio) setRecordatorio(data.recordatorio)
        setDescripcionActividad('')
        setFechaRecordatorio('')
        setConRecordatorio(false)
        setTipoActividad('nota')
      }
    } catch {
      setError('Error al guardar actividad')
    } finally {
      setGuardando(false)
    }
  }

  const completarRecordatorio = async () => {
    if (!recordatorio) return
    await fetch('/api/leads/actividades', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordatorio_id: recordatorio.id }),
    })
    setRecordatorio(null)
  }

  const cambiarEtapaDesdeDetalle = async (etapa: string) => {
    if (!leadDetalle) return
    const prev = leads
    setLeads(ls => ls.map(l => l.id === leadDetalle.id ? { ...l, etapa } : l))
    setLeadDetalle(ld => ld ? { ...ld, etapa } : ld)
    try {
      await updateLeadAPI(leadDetalle.id, { etapa })
    } catch {
      setLeads(prev)
    }
  }

  const leadsFiltrados = leads.filter(l => {
    if (filtroFuente && (l.fuente || 'otro') !== filtroFuente) return false
    if (filtroEtapa && (l.etapa || 'nuevo') !== filtroEtapa) return false
    return true
  })

  const conteoFuentes = leads.reduce<Record<string, number>>((acc, l) => {
    const f = l.fuente || 'otro'; acc[f] = (acc[f] || 0) + 1; return acc
  }, {})
  const fuentesPresentes = Object.keys(conteoFuentes)

  // Métricas
  const totalValor = leads.filter(l => l.etapa !== 'perdido').reduce((s, l) => s + ((l as Lead & { valor_estimado?: number }).valor_estimado || 0), 0)
  const cerrados = leads.filter(l => l.etapa === 'cerrado').length
  const tasaConversion = leads.length > 0 ? Math.round((cerrados / leads.length) * 100) : 0

  const etapasMostradas = filtroEtapa
    ? ETAPAS.filter(e => e.key === filtroEtapa)
    : ETAPAS

  return (
    <div style={{ padding: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Pipeline de ventas</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0' }}>Arrastra tarjetas entre columnas o haz click para ver detalle</p>
        </div>
        {/* Métricas rápidas */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total leads', valor: leads.length, color: '#3b82f6' },
            { label: 'Cerrados', valor: cerrados, color: '#22c55e' },
            { label: 'Conversión', valor: `${tasaConversion}%`, color: '#f59e0b' },
            { label: 'Perdidos', valor: leads.filter(l => l.etapa === 'perdido').length, color: '#ef4444' },
          ].map(m => (
            <div key={m.label} style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '12px', padding: '10px 16px', textAlign: 'center', minWidth: '80px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: m.color }}>{m.valor}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '13px', color: '#dc2626', display: 'flex', justifyContent: 'space-between' }}>
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>FILTROS:</span>

        {/* Por etapa */}
        {ETAPAS.map(e => {
          const count = leads.filter(l => (l.etapa || 'nuevo') === e.key).length
          if (count === 0) return null
          const activo = filtroEtapa === e.key
          return (
            <button key={e.key} onClick={() => setFiltroEtapa(activo ? null : e.key)} style={{
              fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
              background: activo ? e.color : `${e.color}15`,
              color: activo ? '#fff' : e.color,
              border: `1px solid ${e.color}40`, cursor: 'pointer',
            }}>
              {e.emoji} {e.label} · {count}
            </button>
          )
        })}

        {/* Por fuente */}
        {fuentesPresentes.length > 1 && (
          <>
            <span style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />
            {fuentesPresentes.map(f => {
              const cfg = getFuenteConfig(f)
              const activo = filtroFuente === f
              return (
                <button key={f} onClick={() => setFiltroFuente(activo ? null : f)} style={{
                  fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
                  background: activo ? cfg.color : cfg.bg, color: activo ? '#fff' : cfg.texto,
                  border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}>
                  {cfg.emoji} {cfg.label} · {conteoFuentes[f]}
                </button>
              )
            })}
          </>
        )}

        {(filtroEtapa || filtroFuente) && (
          <button onClick={() => { setFiltroEtapa(null); setFiltroFuente(null) }} style={{
            fontSize: '11px', padding: '4px 10px', borderRadius: '999px',
            background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer'
          }}>✕ Limpiar</button>
        )}
      </div>

      {/* Kanban */}
      <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${etapasMostradas.length}, minmax(220px, 1fr))`,
          gap: '12px',
          minWidth: `${etapasMostradas.length * 232}px`,
        }}>
          {etapasMostradas.map(etapa => {
            const etapaLeads = leadsFiltrados.filter(l => (l.etapa || 'nuevo') === etapa.key)
            return (
              <div key={etapa.key}
                style={{
                  background: '#f8fafc', borderRadius: '16px', padding: '16px',
                  minHeight: '500px', border: '1px solid #e2e8f0',
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, etapa.key)}
              >
                {/* Header columna */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: etapa.color }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>{etapa.label}</span>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                    borderRadius: '999px', background: `${etapa.color}20`, color: etapa.color
                  }}>{etapaLeads.length}</span>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {etapaLeads.length === 0 && (
                    <div style={{
                      border: '2px dashed #e2e8f0', borderRadius: '12px',
                      padding: '24px', textAlign: 'center', fontSize: '12px', color: '#cbd5e1'
                    }}>
                      Sin prospectos
                    </div>
                  )}
                  {etapaLeads.map(lead => {
                    const cfg = getFuenteConfig(lead.fuente)
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => handleDragStart(e, lead.id)}
                        onClick={() => abrirDetalle(lead)}
                        style={{
                          background: '#fff', borderRadius: '12px', padding: '14px',
                          cursor: 'pointer', border: '1px solid #f1f5f9',
                          borderLeft: `3px solid ${cfg.color}`,
                          transition: 'box-shadow 0.15s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                        className="lead-card"
                      >
                        {/* Badge fuente */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                          borderRadius: '999px', background: cfg.bg, color: cfg.texto,
                          marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.04em',
                        }}>
                          <span style={{ fontSize: '11px' }}>{cfg.emoji}</span>
                          {cfg.label}
                        </div>

                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                          {lead.nombre}
                        </div>
                        <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '4px' }}>
                          📱 {lead.whatsapp}
                        </div>
                        {lead.producto && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                            🎯 {lead.producto}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
                          {timeAgo(lead.created_at)}
                        </div>

                        {/* Acciones rápidas */}
                        <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          <a
                            href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                              flex: 1, padding: '6px', textAlign: 'center', fontSize: '12px',
                              fontWeight: 600, background: '#f0fdf4', color: '#16a34a',
                              borderRadius: '8px', textDecoration: 'none',
                            }}
                          >
                            💬 WA
                          </a>
                          <button
                            onClick={() => abrirDetalle(lead)}
                            style={{
                              flex: 1, padding: '6px', fontSize: '12px', fontWeight: 600,
                              background: '#eff6ff', color: '#2563eb', border: 'none',
                              borderRadius: '8px', cursor: 'pointer',
                            }}
                          >
                            📋 Detalle
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Modal detalle del lead ── */}
      {leadDetalle && (
        <div
          onClick={() => setLeadDetalle(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '560px',
              maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* Header modal */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{leadDetalle.nombre}</div>
                  <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '2px' }}>📱 {leadDetalle.whatsapp}</div>
                  {leadDetalle.producto && (
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>🎯 {leadDetalle.producto}</div>
                  )}
                </div>
                <button onClick={() => setLeadDetalle(null)} style={{
                  background: '#f1f5f9', border: 'none', borderRadius: '8px',
                  width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: '#64748b'
                }}>×</button>
              </div>

              {/* Selector de etapa */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Etapa actual
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {ETAPAS.map(e => {
                    const activa = (leadDetalle.etapa || 'nuevo') === e.key
                    return (
                      <button key={e.key} onClick={() => cambiarEtapaDesdeDetalle(e.key)} style={{
                        fontSize: '11px', fontWeight: 700, padding: '5px 10px',
                        borderRadius: '999px', cursor: 'pointer', border: 'none',
                        background: activa ? e.color : `${e.color}15`,
                        color: activa ? '#fff' : e.color,
                        transition: 'all 0.15s',
                      }}>
                        {e.emoji} {e.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Recordatorio activo */}
            {recordatorio && (
              <div style={{
                margin: '16px 24px 0',
                padding: '12px 16px', borderRadius: '12px',
                background: '#fffbeb', border: '1px solid #fde68a',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', marginBottom: '2px' }}>
                    ⏰ PRÓXIMA ACCIÓN
                  </div>
                  <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>{recordatorio.descripcion}</div>
                  <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
                    {formatFecha(recordatorio.fecha_recordatorio)}
                  </div>
                </div>
                <button onClick={completarRecordatorio} style={{
                  background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                }}>
                  ✓ Hecho
                </button>
              </div>
            )}

            {/* Nueva actividad */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Registrar actividad
              </div>

              {/* Tipo de actividad */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {TIPOS_ACTIVIDAD.map(t => (
                  <button key={t.key} onClick={() => setTipoActividad(t.key)} style={{
                    fontSize: '11px', fontWeight: 600, padding: '5px 10px',
                    borderRadius: '999px', cursor: 'pointer', border: '1px solid',
                    borderColor: tipoActividad === t.key ? '#3b82f6' : '#e2e8f0',
                    background: tipoActividad === t.key ? '#eff6ff' : '#fff',
                    color: tipoActividad === t.key ? '#2563eb' : '#64748b',
                  }}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>

              <textarea
                value={descripcionActividad}
                onChange={e => setDescripcionActividad(e.target.value)}
                placeholder="¿Qué pasó con este prospecto?"
                rows={2}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: '1px solid #e2e8f0', fontSize: '13px', resize: 'none',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />

              {/* Toggle recordatorio */}
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="conRecordatorio"
                  checked={conRecordatorio}
                  onChange={e => setConRecordatorio(e.target.checked)}
                />
                <label htmlFor="conRecordatorio" style={{ fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                  ⏰ Programar recordatorio
                </label>
              </div>

              {conRecordatorio && (
                <input
                  type="datetime-local"
                  value={fechaRecordatorio}
                  onChange={e => setFechaRecordatorio(e.target.value)}
                  style={{
                    marginTop: '8px', padding: '8px 12px', borderRadius: '10px',
                    border: '1px solid #e2e8f0', fontSize: '13px', width: '100%',
                    fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
                  }}
                />
              )}

              <button
                onClick={guardarActividad}
                disabled={guardando || !descripcionActividad.trim()}
                style={{
                  marginTop: '10px', width: '100%', padding: '10px',
                  background: descripcionActividad.trim() ? '#0f172a' : '#e2e8f0',
                  color: descripcionActividad.trim() ? '#fff' : '#94a3b8',
                  border: 'none', borderRadius: '10px', fontSize: '13px',
                  fontWeight: 700, cursor: descripcionActividad.trim() ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                }}
              >
                {guardando ? 'Guardando…' : '+ Registrar actividad'}
              </button>
            </div>

            {/* Timeline */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Historial de actividades
              </div>

              {loadingDetalle && (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
                  Cargando historial…
                </div>
              )}

              {!loadingDetalle && actividades.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '32px', color: '#cbd5e1', fontSize: '13px',
                  border: '2px dashed #f1f5f9', borderRadius: '12px'
                }}>
                  Sin actividades registradas.<br />¡Registra el primer seguimiento!
                </div>
              )}

              {actividades.map((act, i) => {
                const tipoConfig = TIPOS_ACTIVIDAD.find(t => t.key === act.tipo) || TIPOS_ACTIVIDAD[0]
                return (
                  <div key={act.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    {/* Línea de tiempo */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: '#f1f5f9', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '14px', flexShrink: 0,
                      }}>
                        {tipoConfig.emoji}
                      </div>
                      {i < actividades.length - 1 && (
                        <div style={{ width: '1px', flex: 1, background: '#f1f5f9', marginTop: '4px', minHeight: '16px' }} />
                      )}
                    </div>
                    {/* Contenido */}
                    <div style={{ flex: 1, paddingTop: '4px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {tipoConfig.label}
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', marginTop: '2px', lineHeight: 1.5 }}>
                        {act.descripcion}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        {formatFecha(act.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .lead-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; }
      `}</style>
    </div>
  )
}
