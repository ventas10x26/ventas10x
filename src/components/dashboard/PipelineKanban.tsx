// Ruta destino: src/components/dashboard/PipelineKanban.tsx
// REEMPLAZA. Cambios:
// - Badge de fuente en cada card (Bot Landing / Bot IA / Formulario / Otro)
// - Borde lateral coloreado para identificación rápida visual
// - Resto del comportamiento intacto (drag&drop, notas, WhatsApp)

'use client'

import { useState } from 'react'
import type { Lead } from '@/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const ETAPAS = [
  { key: 'nuevo', label: 'Nuevo', color: '#888780' },
  { key: 'contactado', label: 'Contactado', color: '#185FA5' },
  { key: 'interesado', label: 'Interesado', color: '#EF9F27' },
  { key: 'cerrado', label: 'Cerrado ✓', color: '#3B6D11' },
]

// ── Configuración visual de cada fuente ──
type FuenteConfig = {
  emoji: string
  label: string
  color: string       // color del borde y badge
  bg: string          // background del badge
  texto: string       // color del texto del badge
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
  // Fallback para cualquier otra fuente
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

async function updateLead(id: string, data: Record<string, string>) {
  await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  })
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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e: React.DragEvent, etapa: string) => {
    e.preventDefault()
    if (!draggingId) return
    const lead = leads.find(l => l.id === draggingId)
    if (!lead || lead.etapa === etapa) { setDraggingId(null); return }
    setLeads(prev => prev.map(l => l.id === draggingId ? { ...l, etapa } : l))
    await updateLead(draggingId, { etapa, updated_at: new Date().toISOString() })
    setDraggingId(null)
  }

  const saveNota = async () => {
    if (!notaLead) return
    await updateLead(notaLead.id, { notas: notaText, updated_at: new Date().toISOString() })
    setLeads(prev => prev.map(l => l.id === notaLead.id ? { ...l, notas: notaText } : l))
    setNotaLead(null)
  }

  // Aplicar filtro de fuente
  const leadsFiltrados = filtroFuente
    ? leads.filter(l => (l.fuente || 'otro') === filtroFuente)
    : leads

  // Calcular conteo por fuente para los chips
  const conteoFuentes = leads.reduce<Record<string, number>>((acc, l) => {
    const f = l.fuente || 'otro'
    acc[f] = (acc[f] || 0) + 1
    return acc
  }, {})

  // Solo mostrar chips de fuentes que tienen al menos 1 lead
  const fuentesPresentes = Object.keys(conteoFuentes)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-display font-bold text-gray-900">Pipeline de ventas</h2>
        <span className="text-xs text-gray-400">Arrastra las tarjetas entre columnas</span>
      </div>

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
                        {/* Badge de fuente arriba */}
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
          onClick={() => setNotaLead(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-4">📝 Nota — {notaLead.nombre}</h3>
            <textarea value={notaText} onChange={e => setNotaText(e.target.value)} rows={4}
              placeholder="Escribe una nota sobre este prospecto..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 resize-none"/>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setNotaLead(null)}
                className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={saveNota}
                className="flex-1 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                Guardar nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
