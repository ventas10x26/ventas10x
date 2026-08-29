// Ruta destino: src/components/admin/FenixConversacionesClient.tsx
// Bandeja de TODAS las conversaciones de WhatsApp de Fénix -- leads y
// deudores, sin importar si llegaron por Evolution API (histórico) o por
// WhatsApp Cloud API (fenix-whatsapp-cloud-handler.ts). Antes solo existía
// un visor de conversación colgado del modal del pipeline de leads
// (/admin/fenix), así que las conversaciones tipo 'deudor' -- que no
// vienen de ningún lead del formulario -- no tenían dónde verse.
//
// A propósito NO tiene caja para enviar mensajes manuales todavía: las
// conversaciones mezclan remote_jid de dos épocas distintas (Evolution
// "num@s.whatsapp.net" vs Cloud API solo dígitos) y de números de Cloud
// API distintos (prueba vs producción), y esta tabla no guarda con qué
// cuenta/número se originó cada una. Enviar sin saber por cuál de los dos
// canales/números correspondereia es más riesgoso que útil por ahora --
// queda como bandeja de solo lectura + pausar/reanudar IA.
'use client'
import { useState } from 'react'

type MensajeHistorial = { role: 'user' | 'assistant'; content: string }

type Conversacion = {
  id: string
  telefono: string
  tipo: string
  empresa: string | null
  nombre: string | null
  historial: MensajeHistorial[]
  bot_pausado: boolean
  updated_at: string
}

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
  return `https://wa.me/${telefono}`
}

function nombreMostrar(c: Conversacion): string {
  if (c.empresa) return c.empresa
  return c.telefono
}

export function FenixConversacionesClient({ initialConversaciones }: { initialConversaciones: Conversacion[] }) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>(initialConversaciones)
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'lead' | 'deudor'>('todas')
  const [soloPausadas, setSoloPausadas] = useState(false)
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(initialConversaciones[0]?.id || null)
  const [cargando, setCargando] = useState(false)
  const [cambiandoPausaId, setCambiandoPausaId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtradas = conversaciones.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.telefono.includes(q) ||
      (c.empresa || '').toLowerCase().includes(q) ||
      (c.nombre || '').toLowerCase().includes(q)
    const matchTipo = filtroTipo === 'todas' || c.tipo === filtroTipo
    const matchPausa = !soloPausadas || c.bot_pausado
    return matchSearch && matchTipo && matchPausa
  })

  const seleccionada = conversaciones.find((c) => c.id === seleccionadaId) || null
  const totalLeads = conversaciones.filter((c) => c.tipo === 'lead').length
  const totalDeudores = conversaciones.filter((c) => c.tipo === 'deudor').length
  const totalPausadas = conversaciones.filter((c) => c.bot_pausado).length

  async function refrescar() {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/fenix-conversaciones')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo refrescar')
      setConversaciones(data.conversaciones || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo refrescar')
    } finally {
      setCargando(false)
    }
  }

  async function togglePausa(c: Conversacion) {
    const nuevoValor = !c.bot_pausado
    setCambiandoPausaId(c.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/fenix-conversaciones/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_pausado: nuevoValor }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo actualizar')
      setConversaciones((cs) => cs.map((x) => (x.id === c.id ? { ...x, bot_pausado: data.bot_pausado } : x)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado de la IA')
    } finally {
      setCambiandoPausaId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ padding: '24px clamp(16px, 4vw, 32px)', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, marginBottom: '4px' }}>
              Fénix Consultores
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Conversaciones</h1>
          </div>
          <button onClick={refrescar} disabled={cargando} style={{
            padding: '9px 16px', borderRadius: '10px', border: '1px solid #e2e8f0',
            background: '#fff', color: '#0f172a', fontSize: '13px', fontWeight: 600,
            cursor: cargando ? 'default' : 'pointer', fontFamily: 'inherit',
          }}>
            {cargando ? 'Actualizando…' : '🔄 Actualizar'}
          </button>
        </div>

        {/* Métricas */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total conversaciones', valor: conversaciones.length, color: '#0f172a' },
            { label: 'Leads', valor: totalLeads, color: '#2563eb' },
            { label: 'Deudores', valor: totalDeudores, color: ACCENT },
            { label: 'IA pausada', valor: totalPausadas, color: '#b45309' },
          ].map((m) => (
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

        {/* ── Bandeja: lista + chat ── */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Columna izquierda: lista */}
          <div style={{ flex: '1 1 320px', maxWidth: '380px', minWidth: '280px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              <input
                placeholder="Buscar número, empresa o nombre…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '8px 14px', borderRadius: '9px', border: '1px solid #e2e8f0',
                  fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {([
                  { key: 'todas', label: 'Todas' },
                  { key: 'lead', label: `Leads · ${totalLeads}` },
                  { key: 'deudor', label: `Deudores · ${totalDeudores}` },
                ] as const).map((f) => (
                  <button key={f.key} onClick={() => setFiltroTipo(f.key)} style={{
                    fontSize: '11.5px', fontWeight: 700, padding: '5px 11px', borderRadius: '999px',
                    background: filtroTipo === f.key ? '#0f172a' : '#fff',
                    color: filtroTipo === f.key ? '#fff' : '#64748b',
                    border: '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {f.label}
                  </button>
                ))}
                {totalPausadas > 0 && (
                  <button onClick={() => setSoloPausadas((v) => !v)} style={{
                    fontSize: '11.5px', fontWeight: 700, padding: '5px 11px', borderRadius: '999px',
                    background: soloPausadas ? '#f59e0b' : '#f59e0b18', color: soloPausadas ? '#fff' : '#b45309',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    ⏸ Pausadas
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
              {filtradas.length === 0 && (
                <div style={{ border: '2px dashed #dcdad4', borderRadius: '12px', padding: '24px', textAlign: 'center', fontSize: '12px', color: '#b0aca1', background: '#fff' }}>
                  {conversaciones.length === 0 ? 'Todavía no hay conversaciones.' : 'Sin resultados para este filtro.'}
                </div>
              )}
              {filtradas.map((c) => {
                const ultimo = c.historial[c.historial.length - 1]
                const activa = c.id === seleccionadaId
                return (
                  <div
                    key={c.id}
                    onClick={() => setSeleccionadaId(c.id)}
                    style={{
                      background: activa ? '#fff' : '#fff', borderRadius: '12px', padding: '12px 14px',
                      cursor: 'pointer', border: activa ? `1.5px solid ${ACCENT}` : '1px solid #ece9e3',
                      boxShadow: activa ? '0 2px 8px rgba(245,130,31,.12)' : '0 1px 3px rgba(0,0,0,.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {nombreMostrar(c)}
                      </div>
                      <span style={{
                        fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', flexShrink: 0,
                        background: c.tipo === 'lead' ? '#2563eb18' : `${ACCENT}18`,
                        color: c.tipo === 'lead' ? '#2563eb' : ACCENT,
                      }}>
                        {c.tipo === 'lead' ? 'Lead' : 'Deudor'}
                      </span>
                    </div>
                    {c.empresa && <div style={{ fontSize: '11.5px', color: ACCENT, marginBottom: '3px' }}>📱 {c.telefono}</div>}
                    <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '6px' }}>
                      {ultimo ? ultimo.content : 'Sin mensajes'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{timeAgo(c.updated_at)}</span>
                      {c.bot_pausado && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px', background: '#fef3c7', color: '#b45309' }}>
                          ⏸ IA pausada
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Columna derecha: chat */}
          <div style={{
            flex: '2 1 420px', minWidth: '320px', background: '#e5ddd5', borderRadius: '14px',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '520px',
            maxHeight: 'calc(100vh - 200px)',
          }}>
            {!seleccionada ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c8489', fontSize: '13px' }}>
                Selecciona una conversación de la lista
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', background: '#f7f6f4', borderBottom: '1px solid #e2e8f0', gap: '10px',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      💬 {nombreMostrar(seleccionada)}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                      {seleccionada.telefono} · {seleccionada.tipo === 'lead' ? 'Lead' : 'Deudor'} · {formatFecha(seleccionada.updated_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <a href={waLink(seleccionada.telefono)} target="_blank" rel="noopener noreferrer" style={{
                      padding: '6px 12px', borderRadius: '999px', background: '#25D366', color: '#fff',
                      fontSize: '11.5px', fontWeight: 700, textDecoration: 'none',
                    }}>
                      Abrir en WhatsApp
                    </a>
                    <button
                      onClick={() => togglePausa(seleccionada)}
                      disabled={cambiandoPausaId === seleccionada.id}
                      title={seleccionada.bot_pausado ? 'Reanudar la IA en esta conversación' : 'Pausar la IA en esta conversación'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '999px',
                        border: `1px solid ${seleccionada.bot_pausado ? '#f59e0b' : '#e2e8f0'}`,
                        background: seleccionada.bot_pausado ? '#fef3c7' : '#fff',
                        color: seleccionada.bot_pausado ? '#b45309' : '#64748b',
                        fontSize: '11.5px', fontWeight: 700,
                        cursor: cambiandoPausaId === seleccionada.id ? 'default' : 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {cambiandoPausaId === seleccionada.id ? '…' : seleccionada.bot_pausado ? '⏸ IA pausada' : '🤖 IA activa'}
                    </button>
                  </div>
                </div>

                {seleccionada.bot_pausado && (
                  <div style={{ padding: '8px 16px', background: '#fef3c7', borderBottom: '1px solid #fde68a' }}>
                    <p style={{ fontSize: '11.5px', color: '#92400e', margin: 0 }}>
                      ⏸ La IA no está respondiendo en esta conversación. Los mensajes entrantes se siguen guardando, pero nadie contesta automáticamente.
                    </p>
                  </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {seleccionada.historial.length === 0 ? (
                    <p style={{ fontSize: '12.5px', color: '#7c8489', textAlign: 'center', margin: 'auto 0' }}>
                      Todavía no hay mensajes en esta conversación.
                    </p>
                  ) : seleccionada.historial.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'assistant' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%', padding: '8px 11px', borderRadius: '9px', fontSize: '13.5px',
                        lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        background: m.role === 'assistant' ? '#dcf8c6' : '#fff',
                        boxShadow: '0 1px 1px rgba(0,0,0,.1)', color: '#111b21',
                      }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '10px 16px', background: '#f7f6f4', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, textAlign: 'center' }}>
                    Bandeja de solo lectura por ahora -- para responder manualmente, hazlo desde &quot;Abrir en WhatsApp&quot; o desde el modal del lead en Leads y pipeline.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
