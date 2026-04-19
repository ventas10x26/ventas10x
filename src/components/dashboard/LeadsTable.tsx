'use client'

import { useState } from 'react'
import type { Lead } from '@/types/database'

const ETAPA_LABELS: Record<string, string> = {
  nuevo: 'Nuevo', contactado: 'Contactado', interesado: 'Interesado', cerrado: 'Cerrado'
}
const ETAPA_COLORS: Record<string, string> = {
  nuevo: '#888780', contactado: '#185FA5', interesado: '#EF9F27', cerrado: '#3B6D11'
}
const ETAPA_BG: Record<string, string> = {
  nuevo: '#f0f0ee', contactado: '#E6F1FB', interesado: '#FAEEDA', cerrado: '#EAF3DE'
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Hace un momento'
  if (m < 60) return `Hace ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  return `Hace ${d}d`
}

function exportCSV(leads: Lead[]) {
  const headers = ['Nombre', 'WhatsApp', 'Interés', 'Etapa', 'Fuente', 'Fecha']
  const rows = leads.map(l => [l.nombre, l.whatsapp, l.producto || '', l.etapa || 'nuevo', l.fuente || 'landing', new Date(l.created_at).toLocaleDateString('es-CO')])
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'leads-ventas10x.csv'; a.click()
}

export function LeadsTable({ initialLeads, userId }: { initialLeads: Lead[], userId: string }) {
  const [leads] = useState<Lead[]>(initialLeads)
  const [search, setSearch] = useState('')
  const [etapaFilter, setEtapaFilter] = useState('')
  const [selected, setSelected] = useState<Lead | null>(null)

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || l.nombre.toLowerCase().includes(q) || l.whatsapp.includes(q) || (l.producto || '').toLowerCase().includes(q)
    const matchEtapa = !etapaFilter || (l.etapa || 'nuevo') === etapaFilter
    return matchSearch && matchEtapa
  })

  const s = {
    wrap: { padding: '1.5rem' },
    header: { display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: '1.25rem', flexWrap: 'wrap' as const, gap: '12px' },
    title: { fontSize: '20px', fontWeight: 700, color: '#1a1a18' },
    controls: { display: 'flex' as const, gap: '8px', flexWrap: 'wrap' as const, alignItems: 'center' as const },
    input: { padding: '8px 14px', borderRadius: '8px', border: '.5px solid rgba(0,0,0,.15)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', width: '200px' },
    select: { padding: '8px 12px', borderRadius: '8px', border: '.5px solid rgba(0,0,0,.15)', fontSize: '13px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' },
    btnExport: { padding: '8px 16px', borderRadius: '8px', background: '#185FA5', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    card: { background: '#fff', border: '.5px solid rgba(0,0,0,.08)', borderRadius: '14px', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' },
    th: { textAlign: 'left' as const, padding: '10px 14px', borderBottom: '.5px solid rgba(0,0,0,.08)', fontWeight: 600, color: '#4a4a47', fontSize: '11px', background: '#f7f6f4', whiteSpace: 'nowrap' as const },
    td: { padding: '11px 14px', borderBottom: '.5px solid rgba(0,0,0,.06)', color: '#1a1a18', verticalAlign: 'middle' as const },
    badge: (etapa: string) => ({ display: 'inline-block', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: ETAPA_BG[etapa] || '#f0f0ee', color: ETAPA_COLORS[etapa] || '#888780' }),
    emptyRow: { textAlign: 'center' as const, padding: '3rem', color: '#888780', fontSize: '14px' },
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Mis leads</div>
          <div style={{ fontSize: '13px', color: '#888780', marginTop: '2px' }}>{filtered.length} de {leads.length} prospectos</div>
        </div>
        <div style={s.controls}>
          <input placeholder="Buscar nombre, WA o producto..." value={search} onChange={e => setSearch(e.target.value)} style={s.input}/>
          <select value={etapaFilter} onChange={e => setEtapaFilter(e.target.value)} style={s.select}>
            <option value="">Todas las etapas</option>
            <option value="nuevo">Nuevo</option>
            <option value="contactado">Contactado</option>
            <option value="interesado">Interesado</option>
            <option value="cerrado">Cerrado</option>
          </select>
          <button onClick={() => exportCSV(filtered)} style={s.btnExport}>↓ Exportar CSV</button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '10px', marginBottom: '1.25rem' }}>
        {['nuevo','contactado','interesado','cerrado'].map(e => (
          <div key={e} style={{ background: '#fff', border: '.5px solid rgba(0,0,0,.08)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: ETAPA_COLORS[e] }}>{leads.filter(l => (l.etapa||'nuevo') === e).length}</div>
            <div style={{ fontSize: '11px', color: '#888780', marginTop: '2px' }}>{ETAPA_LABELS[e]}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Nombre</th>
                <th style={s.th}>WhatsApp</th>
                <th style={s.th}>Interés</th>
                <th style={s.th}>Etapa</th>
                <th style={s.th}>Fuente</th>
                <th style={s.th}>Llegó</th>
                <th style={s.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={s.emptyRow}>
                  {search || etapaFilter ? 'Sin resultados para esta búsqueda' : 'Aún no tienes leads. Comparte tu landing para empezar a recibirlos.'}
                </td></tr>
              ) : filtered.map(lead => (
                <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(lead)}>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#185FA5', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {lead.nombre.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{lead.nombre}</span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#185FA5', textDecoration: 'none', fontWeight: 500 }}
                      onClick={e => e.stopPropagation()}>
                      {lead.whatsapp}
                    </a>
                  </td>
                  <td style={{ ...s.td, color: '#4a4a47' }}>{lead.producto || '—'}</td>
                  <td style={s.td}><span style={s.badge(lead.etapa || 'nuevo')}>{ETAPA_LABELS[lead.etapa || 'nuevo']}</span></td>
                  <td style={{ ...s.td, color: '#888780', fontSize: '12px' }}>{lead.fuente || 'landing'}</td>
                  <td style={{ ...s.td, color: '#888780', fontSize: '12px' }}>{timeAgo(lead.created_at)}</td>
                  <td style={s.td}>
                    <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      style={{ background: '#EAF3DE', color: '#3B6D11', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}>
                      💬 WA
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalle */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '420px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '17px', fontWeight: 700 }}>{selected.nombre}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888780', lineHeight: 1 }}>×</button>
            </div>
            {[
              { l: 'WhatsApp', v: selected.whatsapp },
              { l: 'Interés', v: selected.producto || '—' },
              { l: 'Etapa', v: ETAPA_LABELS[selected.etapa || 'nuevo'] },
              { l: 'Fuente', v: selected.fuente || 'landing' },
              { l: 'Notas', v: selected.notas || '—' },
              { l: 'Llegó', v: new Date(selected.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
            ].map(row => (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '.5px solid rgba(0,0,0,.06)', fontSize: '13px' }}>
                <span style={{ color: '#888780' }}>{row.l}</span>
                <span style={{ fontWeight: 500, color: '#1a1a18', textAlign: 'right', maxWidth: '60%' }}>{row.v}</span>
              </div>
            ))}
            <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', marginTop: '1.25rem', padding: '11px', background: '#25D366', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
              💬 Abrir en WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
