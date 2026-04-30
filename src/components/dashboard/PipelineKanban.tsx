// Ruta destino: src/components/dashboard/PipelineKanban.tsx
// FIX: ahora usa /api/leads/[id] (endpoint propio con auth correcto)
// en vez de pegarle directo al REST API de Supabase con la anon key.
// Incluye rollback visual si la actualización falla.

'use client'

import { useState } from 'react'
import type { Lead } from '@/types/database'

const ETAPAS = [
  { key: 'nuevo', label: 'Nuevo', color: '#888780' },
  { key: 'contactado', label: 'Contactado', color: '#185FA5' },
  { key: 'interesado', label: 'Interesado', color: '#EF9F27' },
  { key: 'cerrado', label: 'Cerrado ✓', color: '#3B6D11' },
]

type FuenteConfig = {
  emoji: string
  label: string
  color: string
  bg: string
  texto: string
}

const FUENTES: Record<string, FuenteConfig> = {
  bot_landing: {
    emoji: '🤖',
    label: 'Bot Landing',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,.1)',
    texto: '#1d4ed8',
  },
  bot_ia: {
    emoji: '✦',
    label: 'Bot IA',
    color: '#FF6B2B',
    bg: 'rgba(255,107,43,.1)',
    texto: '#c2410c',
  },
  formulario: {
    emoji: '📝',
    label: 'Formulario',
    color: '#10b981',
    bg: 'rgba(16,185,129,.1)',
    texto: '#047857',
  },
  manual: {
    emoji: '✋',
    label: 'Manual',
    color: '#a855f7',
    bg: 'rgba(168,85,247,.1)',
    texto: '#7e22ce',
  },
  otro: {
    emoji: '📍',
    label: 'Otro',
    color: '#9ca3af',
    bg: 'rgba(156,163,175,.1)',
    texto: '#4b5563',
  },
}

function getFuenteConfig(fuente: string | null | undefined): FuenteConfig {
  if (!fuente) return FUENTES.otro
  return FUENTES[fuente] || FUENTES.otro
}

interface Props {
  initialLeads: Lead[]
  userId: string
}

// ── Llama al endpoint propio (con auth de cookies) ──
async function updateLeadAPI(id: string, data: Record<string, string | null>) {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${res.status}`)
  }
  return res.json()
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Hace menos de 1h'
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  return `Hace ${d} día${d > 1 ? 's' : ''}`
}

export function PipelineKanban({ initialLeads }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [notaLead, setNotaLead] = useState<Lead | null>(null)
  const [notaText, setNotaText] = useState('')
  const [filtroFuente, setFiltroFuente] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardandoNota, setGuardandoNota] = useState(false)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e: React.DragEvent, etapa: string) => {
    e.preventDefault()
    if (!draggingId) return

    const lead = leads.find(l => l.id === draggingId)
    if (!lead || lead.etapa === etapa) {
      setDraggingId(null)
      return
    }

    const etapaPrevia = lead.etapa
    const idMovido = draggingId

    // 1. Actualizar visualmente (optimistic update)
    setLeads(prev => prev.map(l => l.id === idMovido ? { ...l, etapa } : l))
    setDraggingId(null)
    setError(null)

    // 2. Persistir en backend
    try {
      await updateLeadAPI(idMovido, { etapa })
    } catch (e) {
      // 3. Si falla, hacer ROLLBACK visual
      setLeads(prev => prev.map(l => l.id === idMovido ? { ...l, etapa: etapaPrevia } : l))
      setError(e instanceof Error ? e.message : 'Error al guardar el cambio')
      // Auto-clear del error después de 5s
      setTimeout(() => setError(null), 5000)
    }
  }

  const saveNota = async () => {
    if (!notaLead) return
    setGuardandoNota(true)
    setError(null)
    try {
      await updateLeadAPI(notaLead.id, { notas: notaText })
      setLeads(prev => prev.map(l => l.id === notaLead.id ? { ...l, notas: notaText } : l))
      setNotaLead(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar la nota')
    } finally {
      setGuardandoNota(false)
    }
  }

  const leadsFiltrados = filtroFuente
    ? leads.filter(l => (l.fuente || 'otro') === filtroFuente)
    : leads

  const conteoFuentes = leads.reduce<Record<string, number>>((acc, l) => {
    const f = l.fuente || 'otro'
    acc[f] = (acc[f] || 0) + 1
    return acc
  }, {})

  const fuentesPresentes = Object.keys(conteoFuentes)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-display font-bold text-gray-900">Pipeline de ventas</h2>
        <span className="text-xs text-gray-400">Arrastra las tarjetas entre columnas</span>
      </div>

      {/* Banner de error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Filtros por fuente */}
      {fuentesPresentes.length > 1 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Filtrar:</span>
          <button
            onClick={() => setFiltroFuente(null)}
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '999px',
              background: filtroFuente === null ? '#0f1c2e' : '#f3f4f6',
              color: filtroFuente === null ? '#fff' : '#6b7280',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Todos · {leads.length}
          </button>
          {fuentesPresentes.map(f => {
            const cfg = getFuenteConfig(f)
            const activo = filtroFuente === f
            return (
              <button
                key={f}
                onClick={() => setFiltroFuente(activo ? null : f)}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: activo ? cfg.color : cfg.bg,
                  color: activo ? '#fff' : cfg.texto,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{cfg.emoji}</span>
                {cfg.label} · {conteoFuentes[f]}
              </button>
            )
          })}
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-4 gap-4 min-w-[900px]">
          {ETAPAS.map(etapa => {
            const etapaLeads = leadsFiltrados.filter(l => (l.etapa || 'nuevo') === etapa.key)
            return (
              <div key={etapa.key}
                className="bg-gray-50 rounded-2xl p-4 min-h-[500px]"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, etapa.key)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: etapa.color }}/>
                    <span className="text-sm font-semibold text-gray-700">{etapa.label}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                    {etapaLeads.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {etapaLeads.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
                      Sin prospectos aquí
                    </div>
                  )}
                  {etapaLeads.map(lead => {
                    const cfgFuente = getFuenteConfig(lead.fuente)
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => handleDragStart(e, lead.id)}
                        className="bg-white rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow select-none"
                        style={{
                          borderLeft: `3px solid ${cfgFuente.color}`,
                          border: '1px solid #f3f4f6',
                          borderLeftWidth: '3px',
                          borderLeftColor: cfgFuente.color,
                        }}
                      >
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: cfgFuente.bg,
                          color: cfgFuente.texto,
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '.04em',
                        }}>
                          <span style={{ fontSize: '0.75rem' }}>{cfgFuente.emoji}</span>
                          {cfgFuente.label}
                        </div>

                        <div className="font-semibold text-sm text-gray-900 mb-1">{lead.nombre}</div>
                        <div className="text-xs text-blue-600 mb-1">📱 {lead.whatsapp}</div>
                        {lead.producto && <div className="text-xs text-gray-500 mb-1">🎯 {lead.producto}</div>}
                        {lead.notas && (
                          <div className="text-xs text-amber-700 italic mb-1 truncate">📝 {lead.notas}</div>
                        )}
                        <div className="text-xs text-gray-400 mb-3">{timeAgo(lead.created_at)}</div>
                        <div className="flex gap-2">
                          <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g,'')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex-1 py-1.5 text-center text-xs font-semibold bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                            💬 WA
                          </a>
                          <button
                            onClick={() => { setNotaLead(lead); setNotaText(lead.notas || '') }}
                            className="flex-1 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                            📝 Nota
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

      {notaLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !guardandoNota && setNotaLead(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-4">📝 Nota — {notaLead.nombre}</h3>
            <textarea value={notaText} onChange={e => setNotaText(e.target.value)} rows={4}
              placeholder="Escribe una nota sobre este prospecto..."
              disabled={guardandoNota}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 resize-none"/>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setNotaLead(null)}
                disabled={guardandoNota}
                className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={saveNota}
                disabled={guardandoNota}
                className="flex-1 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {guardandoNota ? 'Guardando…' : 'Guardar nota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
