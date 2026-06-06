// src/components/pulse/PulseFollowUpPanel.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const FONT = "'Syne', system-ui, sans-serif"
const FONT_BODY = "'DM Sans', system-ui, sans-serif"

interface FollowUpContact {
  remote_jid: string
  phone: string
  nombre_contacto: string | null
  primer_mensaje: string | null
  ultimo_mensaje: string | null
  ultimo_rol: string | null
  updated_at: string
  diff_hours: number
  diff_days: number
  ultimo_followup: { tipo: string; enviado_at: string } | null
  followup_count: number
  proximo_followup: string | null
  tiene_followup_pendiente: boolean
  followup_activo_contacto: boolean
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

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#25d366" style={{ width: '18px', height: '18px' }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.138.565 4.14 1.548 5.873L.057 23.57a.75.75 0 0 0 .92.921l5.697-1.491A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.192-1.457l-.372-.22-3.853 1.009 1.01-3.762-.241-.386A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  )
}

function ContactCard({
  contact,
  onWhatsApp,
  onUpdate,
}: {
  contact: FollowUpContact
  onWhatsApp: (phone: string) => void
  onUpdate: (jid: string, patch: Partial<FollowUpContact>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombre, setNombre] = useState(contact.nombre_contacto ?? '')
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const [guardandoToggle, setGuardandoToggle] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editandoNombre) inputRef.current?.focus()
  }, [editandoNombre])

  const urgencia = contact.diff_days >= 7 ? 'alta' : contact.diff_days >= 3 ? 'media' : 'baja'
  const urgenciaColor  = urgencia === 'alta' ? '#f87171' : urgencia === 'media' ? '#fbbf24' : '#10b981'
  const urgenciaBg     = urgencia === 'alta' ? 'rgba(248,113,113,0.1)' : urgencia === 'media' ? 'rgba(251,191,36,0.1)' : 'rgba(16,185,129,0.1)'
  const urgenciaBorder = urgencia === 'alta' ? 'rgba(248,113,113,0.25)' : urgencia === 'media' ? 'rgba(251,191,36,0.25)' : 'rgba(16,185,129,0.25)'

  const fuActivo = contact.followup_activo_contacto

  const guardarNombre = async () => {
    setGuardandoNombre(true)
    try {
      const jidEncoded = encodeURIComponent(contact.remote_jid)
      await fetch(`/api/pulse/followup-contacts/${jidEncoded}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_contacto: nombre.trim() || null }),
      })
      onUpdate(contact.remote_jid, { nombre_contacto: nombre.trim() || null })
      setEditandoNombre(false)
    } finally {
      setGuardandoNombre(false)
    }
  }

  const toggleFollowup = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setGuardandoToggle(true)
    const nuevoValor = !fuActivo
    try {
      const jidEncoded = encodeURIComponent(contact.remote_jid)
      await fetch(`/api/pulse/followup-contacts/${jidEncoded}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followup_activo: nuevoValor }),
      })
      onUpdate(contact.remote_jid, { followup_activo_contacto: nuevoValor })
    } finally {
      setGuardandoToggle(false)
    }
  }

  const displayName = contact.nombre_contacto || `+${contact.phone}`

  return (
    <div style={{
      background: !fuActivo
        ? 'rgba(255,255,255,0.015)'
        : contact.tiene_followup_pendiente
          ? 'rgba(14,165,233,0.04)'
          : 'rgba(255,255,255,0.02)',
      border: `1px solid ${!fuActivo ? 'rgba(255,255,255,0.04)' : contact.tiene_followup_pendiente ? 'rgba(14,165,233,0.18)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'all .2s',
      opacity: fuActivo ? 1 : 0.6,
    }}>

      {/* ── Fila principal ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
          background: fuActivo ? (contact.tiene_followup_pendiente ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.06)') : 'rgba(255,255,255,0.04)',
          border: `1px solid ${fuActivo ? (contact.tiene_followup_pendiente ? 'rgba(14,165,233,0.3)' : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.06)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, color: fuActivo ? '#7dd3fc' : '#334155',
        }}>
          {(contact.nombre_contacto ?? contact.phone).slice(0, 2).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', fontFamily: FONT }}>
              {displayName}
            </span>
            {contact.nombre_contacto && (
              <span style={{ fontSize: '11px', color: '#334155' }}>· +{contact.phone}</span>
            )}
            {contact.proximo_followup && fuActivo && (
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#7dd3fc' }}>
                📅 Pendiente {contact.proximo_followup}
              </span>
            )}
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: urgenciaBg, border: `1px solid ${urgenciaBorder}`, color: urgenciaColor }}>
              {urgencia === 'alta' ? '🔴' : urgencia === 'media' ? '🟡' : '🟢'} {urgencia}
            </span>
            {!fuActivo && (
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>
                ⏸ pausado
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#475569', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span>{tiempoRelativo(contact.diff_hours)}</span>
            {contact.followup_count > 0 && <span>· {contact.followup_count} follow-up{contact.followup_count > 1 ? 's' : ''}</span>}
            {contact.ultimo_rol === 'user' && <span style={{ color: '#10b981' }}>· Respondió</span>}
          </div>
        </div>

        {/* Toggle follow-up individual */}
        <button
          type="button"
          onClick={toggleFollowup}
          disabled={guardandoToggle}
          title={fuActivo ? 'Pausar follow-up para este contacto' : 'Activar follow-up para este contacto'}
          style={{
            flexShrink: 0, position: 'relative',
            width: '36px', height: '20px', borderRadius: '10px', border: 'none',
            background: fuActivo ? 'linear-gradient(135deg,#0ea5e9,#10b981)' : 'rgba(255,255,255,0.1)',
            cursor: guardandoToggle ? 'wait' : 'pointer',
            opacity: guardandoToggle ? 0.6 : 1,
            transition: 'background .2s',
            boxShadow: fuActivo ? '0 0 8px rgba(14,165,233,0.25)' : 'none',
          }}
        >
          <span style={{
            position: 'absolute', top: '2px',
            left: fuActivo ? '18px' : '2px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#fff', transition: 'left .18s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </button>

        {/* Botón WA */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onWhatsApp(contact.phone) }}
          style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          title="Abrir WhatsApp"
        >
          <WaIcon />
        </button>

        <span style={{ color: '#334155', fontSize: '11px', flexShrink: 0, transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>

      {/* ── Panel expandido ── */}
      {expanded && (
        <div style={{ padding: '12px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Editar nombre */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              Nombre del contacto
            </div>
            {editandoNombre ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  ref={inputRef}
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') guardarNombre(); if (e.key === 'Escape') setEditandoNombre(false) }}
                  placeholder="Ej: Sandra Vélez"
                  style={{
                    flex: 1, padding: '7px 10px', borderRadius: '8px',
                    border: '1.5px solid rgba(14,165,233,0.35)', background: 'rgba(14,165,233,0.06)',
                    color: '#e2e8f0', fontSize: '13px', fontFamily: FONT_BODY, outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={guardarNombre}
                  disabled={guardandoNombre}
                  style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#10b981)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT_BODY }}
                >
                  {guardandoNombre ? '…' : '✓'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditandoNombre(false); setNombre(contact.nombre_contacto ?? '') }}
                  style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#475569', fontSize: '12px', cursor: 'pointer', fontFamily: FONT_BODY }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: contact.nombre_contacto ? '#e2e8f0' : '#334155' }}>
                  {contact.nombre_contacto || 'Sin nombre asignado'}
                </span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setEditandoNombre(true) }}
                  style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#475569', fontSize: '11px', cursor: 'pointer', fontFamily: FONT_BODY }}
                >
                  ✏ editar
                </button>
              </div>
            )}
          </div>

          {/* Primer mensaje */}
          {contact.primer_mensaje && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
                Primer mensaje
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '8px 10px', borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
                {contact.primer_mensaje.length > 140 ? contact.primer_mensaje.slice(0, 140) + '…' : contact.primer_mensaje}
              </div>
            </div>
          )}

          {/* Último follow-up */}
          {contact.ultimo_followup && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#475569' }}>
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
  const [busqueda, setBusqueda] = useState('')

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

  const abrirWA = (phone: string) => window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank')

  // Actualización optimista local sin recargar la API
  const handleUpdate = useCallback((jid: string, patch: Partial<FollowUpContact>) => {
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        contacts: prev.contacts.map(c => c.remote_jid === jid ? { ...c, ...patch } : c),
      }
    })
  }, [])

  const contactosFiltrados = (data?.contacts ?? []).filter(c => {
    const pasaFiltro = filtro === 'todos' ? true : c.tiene_followup_pendiente
    if (!pasaFiltro) return false
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      c.phone.includes(q) ||
      (c.nombre_contacto ?? '').toLowerCase().includes(q) ||
      (c.primer_mensaje ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ fontFamily: FONT_BODY }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, fontFamily: FONT }}>Follow-up de contactos</h2>
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
          <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
            {data ? `${data.total} contactos · ${data.pendientes} con follow-up pendiente` : 'Cargando…'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Filtros */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
            {(['pendientes', 'todos'] as const).map(f => (
              <button key={f} type="button" onClick={() => setFiltro(f)}
                style={{ padding: '6px 12px', border: 'none', cursor: 'pointer', background: filtro === f ? 'rgba(14,165,233,0.15)' : 'transparent', color: filtro === f ? '#7dd3fc' : '#475569', fontSize: '12px', fontWeight: 600, fontFamily: FONT_BODY, transition: 'all .15s' }}
              >
                {f === 'pendientes' ? '📅 Pendientes' : '👥 Todos'}
              </button>
            ))}
          </div>
          <button type="button" onClick={cargar} disabled={loading}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#475569', cursor: 'pointer', fontSize: '14px', opacity: loading ? 0.5 : 1 }}
            title="Actualizar"
          >🔄</button>
        </div>
      </div>

      {/* ── Buscador ── */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#334155', pointerEvents: 'none' }}>🔍</span>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, número o mensaje…"
          style={{
            width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
            color: '#e2e8f0', fontSize: '13px', fontFamily: FONT_BODY, outline: 'none',
            transition: 'border-color .2s', boxSizing: 'border-box',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(14,165,233,0.35)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
        {busqueda && (
          <button type="button" onClick={() => setBusqueda('')}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
          >×</button>
        )}
      </div>

      {/* ── Métricas ── */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          {[
            { label: 'Total contactos',     val: data.total,                                                         color: '#7dd3fc' },
            { label: 'Follow-up pendiente', val: data.pendientes,                                                    color: '#fbbf24' },
            { label: 'Ya contactados',      val: data.contacts.filter(c => c.followup_count > 0).length,            color: '#6ee7b7' },
            { label: 'Respondieron',        val: data.contacts.filter(c => c.ultimo_rol === 'user').length,          color: '#a78bfa' },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 14px' }}>
              <div style={{ fontSize: '10px', color: '#475569', marginBottom: '4px' }}>{m.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: m.color, fontFamily: FONT }}>{m.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lista ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: '#475569', fontSize: '13px' }}>Cargando contactos…</div>
      ) : !data?.followup_activo ? (
        <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔁</div>
          <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 4px' }}>Follow-up desactivado</p>
          <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>Activalo en <strong style={{ color: '#7dd3fc' }}>Mi agente → Avanzado → Follow-up automático</strong></p>
        </div>
      ) : contactosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>{busqueda ? '🔍' : '✅'}</div>
          <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
            {busqueda ? `Sin resultados para "${busqueda}"` : filtro === 'pendientes' ? 'No hay follow-ups pendientes' : 'Sin contactos con conversaciones'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {contactosFiltrados.map(contact => (
            <ContactCard key={contact.remote_jid} contact={contact} onWhatsApp={abrirWA} onUpdate={handleUpdate} />
          ))}
          {busqueda && (
            <p style={{ fontSize: '11px', color: '#334155', textAlign: 'center', margin: '4px 0 0' }}>
              {contactosFiltrados.length} resultado{contactosFiltrados.length !== 1 ? 's' : ''} para &quot;{busqueda}&quot;
            </p>
          )}
        </div>
      )}
    </div>
  )
}
