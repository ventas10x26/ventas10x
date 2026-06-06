// src/components/pulse/FollowUpConfig.tsx
'use client'

import { useState, useEffect } from 'react'

const FONT = "'Syne', system-ui, sans-serif"
const FONT_BODY = "'DM Sans', system-ui, sans-serif"

// Nombres exactos de columna en pulse_agentes
interface AgenteConfig {
  followup_activo: boolean
  followup_dia1: boolean
  followup_msg_dia1: string
  followup_dia3: boolean
  followup_msg_dia3: string
  followup_dia7: boolean
  followup_msg_dia7: string
}

const DEFAULTS: AgenteConfig = {
  followup_activo:   true,
  followup_dia1:     true,
  followup_msg_dia1: '¡Hola {nombre}! 👋 Soy {asesor} de KIA. Solo quería confirmar si pudiste ver la info del {modelo}. ¿Tienes alguna pregunta? 🚗',
  followup_dia3:     true,
  followup_msg_dia3: '¡Hola {nombre}! 😊 Quería saber si pudiste revisar el catálogo del {modelo}. Esta semana tenemos disponibilidad para test drive. ¿Te interesa?',
  followup_dia7:     true,
  followup_msg_dia7: 'Hola {nombre}, es mi último mensaje 🙏. Si en algún momento querés info sobre el {modelo} u otro vehículo KIA, acá estoy. ¡Que tengas un excelente día!',
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none',
        background: on ? 'linear-gradient(135deg,#0ea5e9,#10b981)' : 'rgba(255,255,255,0.1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', flexShrink: 0,
        transition: 'background 0.25s',
        opacity: disabled ? 0.4 : 1,
        boxShadow: on ? '0 0 10px rgba(14,165,233,0.3)' : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: on ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

type DayKey = 1 | 3 | 7
const DAY_META: { day: DayKey; label: string; sub: string; icon: string; activoKey: keyof AgenteConfig; msgKey: keyof AgenteConfig }[] = [
  { day: 1, icon: '⚡', label: 'Día 1 — Primer seguimiento',  sub: 'Se envía 24h después si no hubo respuesta',   activoKey: 'followup_dia1', msgKey: 'followup_msg_dia1' },
  { day: 3, icon: '📋', label: 'Día 3 — Segundo seguimiento', sub: 'Se envía 72h después si sigue sin responder',  activoKey: 'followup_dia3', msgKey: 'followup_msg_dia3' },
  { day: 7, icon: '🎯', label: 'Día 7 — Mensaje final',       sub: 'Último intento — 168h después del contacto',  activoKey: 'followup_dia7', msgKey: 'followup_msg_dia7' },
]

function DayBlock({
  meta, config, masterOff, onChange,
}: {
  meta: typeof DAY_META[0]
  config: AgenteConfig
  masterOff: boolean
  onChange: (patch: Partial<AgenteConfig>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const activo = config[meta.activoKey] as boolean
  const mensaje = config[meta.msgKey] as string
  const disabled = masterOff || !activo

  return (
    <div style={{
      border: `1px solid ${activo && !masterOff ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '12px',
      background: activo && !masterOff ? 'rgba(14,165,233,0.04)' : 'rgba(255,255,255,0.02)',
      overflow: 'hidden',
      transition: 'all .2s',
      opacity: masterOff ? 0.45 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
          background: activo && !masterOff ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${activo && !masterOff ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
        }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', fontFamily: FONT }}>{meta.label}</div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{meta.sub}</div>
        </div>
        <Toggle
          on={activo}
          onChange={(v) => onChange({ [meta.activoKey]: v } as Partial<AgenteConfig>)}
          disabled={masterOff}
        />
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '7px', padding: '5px 10px', cursor: 'pointer',
            color: '#475569', fontSize: '12px', fontFamily: FONT_BODY,
          }}
        >
          {expanded ? '▲ cerrar' : '✏ editar'}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', color: '#334155', margin: '12px 0 6px' }}>
            Variables: <span style={{ color: '#0ea5e9' }}>{'{nombre}'}</span> · <span style={{ color: '#0ea5e9' }}>{'{asesor}'}</span> · <span style={{ color: '#0ea5e9' }}>{'{modelo}'}</span>
          </div>
          <textarea
            value={mensaje}
            onChange={(e) => onChange({ [meta.msgKey]: e.target.value } as Partial<AgenteConfig>)}
            disabled={disabled}
            rows={3}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${disabled ? 'rgba(255,255,255,0.06)' : 'rgba(14,165,233,0.2)'}`,
              borderRadius: '8px', padding: '10px 12px',
              color: disabled ? '#334155' : '#e2e8f0', fontSize: '13px',
              fontFamily: FONT_BODY, lineHeight: '1.5', resize: 'vertical',
              outline: 'none', cursor: disabled ? 'not-allowed' : 'text',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function FollowUpConfig() {
  const [config, setConfig] = useState<AgenteConfig>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/pulse/followup-config')
      .then(r => r.json())
      .then(({ data, defaults }) => {
        if (!defaults && data) {
          setConfig({
            followup_activo:   data.followup_activo   ?? true,
            followup_dia1:     data.followup_dia1     ?? true,
            followup_msg_dia1: data.followup_msg_dia1 ?? DEFAULTS.followup_msg_dia1,
            followup_dia3:     data.followup_dia3     ?? true,
            followup_msg_dia3: data.followup_msg_dia3 ?? DEFAULTS.followup_msg_dia3,
            followup_dia7:     data.followup_dia7     ?? true,
            followup_msg_dia7: data.followup_msg_dia7 ?? DEFAULTS.followup_msg_dia7,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleChange = (patch: Partial<AgenteConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/pulse/followup-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (json.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
      else setError(json.error || 'Error al guardar')
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding: '32px', textAlign: 'center', color: '#475569', fontSize: '14px', fontFamily: FONT_BODY }}>
      Cargando configuración de follow-up…
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: FONT_BODY }}>

      {/* ── TOGGLE MAESTRO ── */}
      <div style={{
        background: config.followup_activo
          ? 'linear-gradient(135deg,rgba(14,165,233,0.08),rgba(16,185,129,0.06))'
          : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${config.followup_activo ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '14px', padding: '20px',
        transition: 'all .25s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
            background: config.followup_activo ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${config.followup_activo ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>🔁</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', fontFamily: FONT }}>
              Follow-up automático
            </div>
            <div style={{ fontSize: '13px', color: config.followup_activo ? '#6ee7b7' : '#475569', marginTop: '2px' }}>
              {config.followup_activo
                ? 'Activo — el agente hace seguimiento en días 1, 3 y 7'
                : 'Inactivo — no se enviarán mensajes de seguimiento'}
            </div>
          </div>
          <Toggle on={config.followup_activo} onChange={(v) => handleChange({ followup_activo: v })} />
        </div>

        {/* Pills de estado */}
        {config.followup_activo && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Día 1', active: config.followup_dia1 },
              { label: 'Día 3', active: config.followup_dia3 },
              { label: 'Día 7', active: config.followup_dia7 },
            ].map(d => (
              <div key={d.label} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                background: d.active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${d.active ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
                color: d.active ? '#6ee7b7' : '#334155',
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: d.active ? '#10b981' : '#334155', display: 'inline-block' }} />
                {d.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DÍAS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
          Mensajes por día
        </div>
        {DAY_META.map(meta => (
          <DayBlock key={meta.day} meta={meta} config={config} masterOff={!config.followup_activo} onChange={handleChange} />
        ))}
      </div>

      {/* ── GUARDAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 28px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg,#0ea5e9,#10b981)',
            color: '#fff', fontSize: '14px', fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: FONT, opacity: saving ? 0.7 : 1,
            boxShadow: '0 4px 16px rgba(14,165,233,0.25)', transition: 'all .2s',
          }}
        >
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
        {saved && <div style={{ fontSize: '13px', color: '#6ee7b7', fontWeight: 600 }}>✓ Guardado correctamente</div>}
        {error && <div style={{ fontSize: '13px', color: '#f87171' }}>⚠ {error}</div>}
      </div>

    </div>
  )
}
