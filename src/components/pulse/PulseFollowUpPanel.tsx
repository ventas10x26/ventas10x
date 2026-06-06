// src/components/pulse/PulseFollowUpPanel.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'

const FONT = "'Syne', system-ui, sans-serif"
const FONT_BODY = "'DM Sans', system-ui, sans-serif"

interface FollowUpContact {
  remote_jid: string
  phone: string
  primer_mensaje: string | null
  ultimo_mensaje: string | null
  ultimo_rol: string | null
  updated_at: string
  diff_hours: number
  diff_days: number
  ultimo_followup: { tipo: string; enviado_at: string; status: string } | null
  followup_count: number
  proximo_followup: string | null
  tiene_followup_pendiente: boolean
}

interface FollowUpData {
  contacts: FollowUpContact[]
  followup_activo: boolean
  total: number
  pendientes: number
}

function tiempoRelativo(hours: number): string {
  if (hours < 1) return 'hace menos de 1h'
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hace 1 día'
  if (days < 7) return `hace ${days} días`
  return `hace ${Math.floor(days / 7)} sem`
}

function ContactCard({ contact, onWhatsApp }: { contact: FollowUpContact; onWhatsApp: (phone: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  const urgencia = contact.diff_days >= 7 ? 'alta' : contact.diff_days >= 3 ? 'media' : 'baja'
  const urgenciaColor = urgencia === 'alta' ? '#f87171' : urgencia === 'media' ? '#fbbf24' : '#10b981'
  const urgenciaBg = urgencia === 'alta' ? 'rgba(248,113,113,0.1)' : urgencia === 'media' ? 'rgba(251,191,36,0.1)' : 'rgba(16,185,129,0.1)'
  const urgenciaBorder = urgencia === 'alta' ? 'rgba(248,113,113,0.25)' : urgencia === 'media' ? 'rgba(251,191,36,0.25)' : 'rgba(16,185,129,0.25)'

  return (
    <div style={{
      background: contact.tiene_followup_pendiente
        ? 'rgba(14,165,233,0.04)'
        : 'rgba(255,255,255,0.02)',
      border: `1px solid ${contact.tiene_followup_pendiente ? 'rgba(14,165,233,0.18)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'border-color .2s',
    }}>
      {/* Fila principal */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
          background: contact.tiene_followup_pendiente ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${contact.tiene_followup_pendiente ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: 700, color: '#7dd3fc',
        }}>
          {contact.phone.slice(-2)}
        </div>

        {/* Info principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', fontFamily: FONT }}>
              +{contact.phone}
            </span>

            {/* Badge próximo follow-up */}
            {contact.proximo_followup && (
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px',
                background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)',
                color: '#7dd3fc', letterSpacing: '0.3px',
              }}>
                📅 Pendiente {contact.proximo_followup}
              </span>
            )}

            {/* Badge urgencia */}
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px',
              background: urgenciaBg, border: `1px solid ${urgenciaBorder}`, color: urgenciaColor,
            }}>
              {urgencia === 'alta' ? '🔴' : urgencia === 'media' ? '🟡' : '🟢'} {urgencia}
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#475569', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{tiempoRelativo(contact.diff_hours)}</span>
            {contact.followup_count > 0 && (
              <span style={{ color: '#334155' }}>· {contact.followup_count} follow-up{contact.followup_count > 1 ? 's' : ''} enviado{contact.followup_count > 1 ? 's' : ''}</span>
            )}
            {contact.ultimo_rol === 'user' && (
              <span style={{ color: '#10b981' }}>· Respondió</span>
            )}
          </div>
        </div>

        {/* Botón WA directo */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onWhatsApp(contact.phone) }}
          style={{
            flexShrink: 0, width: '34px', height: '34px', borderRadius: '50%',
            background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '16px', transition: 'all .15s',
          }}
          title="Abrir WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="#25d366" style={{ width: '18px', height: '18px' }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.565 4.14 1.548 5.873L.057 23.57a.75.75 0 0 0 .92.921l5.697-1.491A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.192-1.457l-.372-.22-3.853 1.009 1.01-3.762-.241-.386A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
        </button>

        {/* Chevron */}
        <span style={{ color: '#334155', fontSize: '12px', flexShrink: 0, transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {contact.primer_mensaje && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
                Primer mensaje
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '8px 10px', borderLeft: '2px solid rgba(255,255,255,0.08)' }}>
                {contact.primer_mensaje.length > 120 ? contact.primer_mensaje.slice(0, 120) + '…' : contact.primer_mensaje}
              </div>
            </div>
          )}

          {contact.ultimo_followup && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#475569' }}>
              <span>Último follow-up:</span>
              <span style={{ color: '#6ee7b7', fontWeight: 600 }}>{contact.ultimo_followup.tipo}</span>
              <span>·</span>
              <span>{new Date(contact.ultimo_followup.enviado_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function PulseFollowUpPanel() {
  const [data, setData] = useState<FollowUpData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'pendientes'>('pendientes')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pulse/followup-contacts')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error('followup panel:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirWA = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank')
  }

  const contactosFiltrados = data?.contacts.filter(c =>
    filtro === 'todos' ? true : c.tiene_followup_pendiente
  ) ?? []

  return (
    <div style={{ marginTop: '40px', fontFamily: FONT_BODY }}>

      {/* Header del panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, fontFamily: FONT }}>
                Follow-up de contactos
              </h2>
              {data && (
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px',
                  background: data.followup_activo ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${data.followup_activo ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  color: data.followup_activo ? '#6ee7b7' : '#475569',
                }}>
                  {data.followup_activo ? '● Activo' : '○ Inactivo'}
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#475569', margin: '3px 0 0' }}>
              {data ? `${data.total} contactos · ${data.pendientes} con follow-up pendiente` : 'Cargando…'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Filtros */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
            {(['pendientes', 'todos'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltro(f)}
                style={{
                  padding: '6px 12px', border: 'none', cursor: 'pointer',
                  background: filtro === f ? 'rgba(14,165,233,0.15)' : 'transparent',
                  color: filtro === f ? '#7dd3fc' : '#475569',
                  fontSize: '12px', fontWeight: 600, fontFamily: FONT_BODY,
                  transition: 'all .15s',
                }}
              >
                {f === 'pendientes' ? '📅 Pendientes' : '👥 Todos'}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={cargar}
            disabled={loading}
            style={{
              padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: '#475569', cursor: 'pointer', fontSize: '14px',
              opacity: loading ? 0.5 : 1,
            }}
            title="Actualizar"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Métricas rápidas */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Total contactos', val: data.total, color: '#7dd3fc' },
            { label: 'Follow-up pendiente', val: data.pendientes, color: '#fbbf24' },
            { label: 'Ya contactados', val: data.contacts.filter(c => c.followup_count > 0).length, color: '#6ee7b7' },
            { label: 'Respondieron', val: data.contacts.filter(c => c.ultimo_rol === 'user').length, color: '#a78bfa' },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 14px' }}>
              <div style={{ fontSize: '10px', color: '#475569', marginBottom: '4px' }}>{m.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: m.color, fontFamily: FONT }}>{m.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#475569', fontSize: '13px' }}>
          Cargando contactos…
        </div>
      ) : !data?.followup_activo ? (
        <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔁</div>
          <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 4px' }}>Follow-up desactivado</p>
          <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>
            Activalo en <strong style={{ color: '#7dd3fc' }}>Mi agente → Avanzado → Follow-up automático</strong>
          </p>
        </div>
      ) : contactosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
          <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
            {filtro === 'pendientes' ? 'No hay follow-ups pendientes por ahora' : 'Aún no hay contactos con conversaciones'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {contactosFiltrados.map(contact => (
            <ContactCard key={contact.remote_jid} contact={contact} onWhatsApp={abrirWA} />
          ))}
        </div>
      )}
    </div>
  )
}
