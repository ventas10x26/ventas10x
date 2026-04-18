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

export function PipelineKanban({ initialLeads, userId }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [notaLead, setNotaLead] = useState<Lead | null>(null)
  const [notaText, setNotaText] = useState('')

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-bold text-gray-900">Pipeline de ventas</h2>
        <span className="text-xs text-gray-400">Arrastra las tarjetas entre columnas</span>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-4 gap-4 min-w-[900px]">
          {ETAPAS.map(etapa => {
            const etapaLeads = leads.filter(l => (l.etapa || 'nuevo') === etapa.key)
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
                  {etapaLeads.map(lead => (
                    <div key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead.id)}
                      className="bg-white border border-gray-100 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow select-none"
                    >
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
                  ))}
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
