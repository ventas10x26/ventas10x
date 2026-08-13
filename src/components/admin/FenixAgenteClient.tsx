// Ruta destino: src/components/admin/FenixAgenteClient.tsx
// Adaptación de src/app/pulse/agente/page.tsx al caso de Fenix: mismo
// patrón de tabs (voz/comportamiento/mensajes/avanzado) + guardado, pero
// con el estilo claro del admin de Fenix (FenixLeadsClient) en vez del
// tema oscuro de Pulse, y sin las piezas específicas de Pulse que acá no
// aplican -- no hay grabación de voz, conexión WhatsApp por QR ni banner
// de créditos, porque Fenix no tiene esa infraestructura (es un solo
// agente para todo el equipo, no uno por vendedor).
'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'

const ACCENT = '#F5821F'

type FenixAgente = {
  id: string
  nombre: string
  estilo_cobro: string | null
  tono: string | null
  saludo_tipo: string | null
  manejo_objeciones: string | null
  respuestas_tipo: string | null
  escalamiento_juridico: string | null
  primer_mensaje: string | null
  mensaje_recordatorio: string | null
  mensaje_acuerdo_pago: string | null
  whatsapp: string | null
  bot_activo: boolean
  system_prompt: string | null
  updated_at: string | null
}

const inputStyle: CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: 10,
  border: '1px solid #e2e8f0', background: '#fff',
  color: '#0f172a', fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box',
}

const labelStyle: CSSProperties = {
  display: 'block', fontSize: 11.5, fontWeight: 700, color: '#94a3b8',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em',
}

function Section({ title, badge, children }: { title: string; badge?: string; children: ReactNode }) {
  return (
    <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <h2 style={{ fontSize: 14.5, fontWeight: 800, margin: 0, color: '#0f172a' }}>{title}</h2>
        {badge && (
          <span style={{ fontSize: 9, fontWeight: 800, color: ACCENT, background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, padding: '4px 10px', borderRadius: 999, letterSpacing: 0.5 }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

type Tab = 'voz' | 'comportamiento' | 'mensajes' | 'avanzado'
const TABS: { id: Tab; label: string }[] = [
  { id: 'voz',            label: '🎙️ Voz y tono' },
  { id: 'comportamiento', label: '🧠 Comportamiento' },
  { id: 'mensajes',       label: '💬 Mensajes' },
  { id: 'avanzado',       label: '⚙️ Avanzado' },
]

export function FenixAgenteClient({ initialAgente }: { initialAgente: FenixAgente | null }) {
  const [form, setForm]           = useState<FenixAgente | null>(initialAgente)
  const [tab, setTab]             = useState<Tab>('voz')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje]     = useState('')
  const [error, setError]         = useState('')

  const patch = (p: Partial<FenixAgente>) => setForm((f) => (f ? { ...f, ...p } : f))

  const guardar = async () => {
    if (!form) return
    setGuardando(true)
    setMensaje('')
    setError('')
    try {
      const res  = await fetch('/api/admin/fenix-agente', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo guardar')
      setForm(data.agente)
      setMensaje('✓ Configuración guardada')
      setTimeout(() => setMensaje(''), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  if (!form) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7f6f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>No hay una configuración de agente todavía.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px clamp(16px, 4vw, 32px) 80px' }}>

        {/* Cabecera */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20, background: '#f7f6f4',
          marginLeft: -24, marginRight: -24, padding: '0 24px 16px',
          marginBottom: 8, display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, paddingTop: 24,
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, marginBottom: '4px' }}>
              Fénix Consultores
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
              Agente IA · Cobro de cartera
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, maxWidth: 480 }}>
              Entrena el tono, las objeciones y los mensajes que usa el agente al gestionar el cobro con los deudores.
            </p>
            {form.updated_at && (
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0' }}>
                Última actualización: {new Date(form.updated_at).toLocaleString('es-CO')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1,
              fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>

        {error   && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        {mensaje && <p style={{ color: '#16a34a', fontSize: 13, marginBottom: 12 }}>{mensaje}</p>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: tab === t.id ? `${ACCENT}18` : 'transparent',
                color: tab === t.id ? ACCENT : '#64748b',
                fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: VOZ Y TONO */}
        {tab === 'voz' && (
          <>
            <Section title="Nombre y tono del agente">
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Nombre del agente</label>
                  <input style={inputStyle} value={form.nombre} onChange={(e) => patch({ nombre: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Tono</label>
                  <input style={inputStyle} placeholder="Ej: Firme, empático, profesional" value={form.tono || ''} onChange={(e) => patch({ tono: e.target.value })} />
                </div>
              </div>
            </Section>
            <Section title="Estilo de cobro" badge="ENTRENAMIENTO">
              <label style={labelStyle}>Cómo se comunica el agente con el deudor</label>
              <textarea value={form.estilo_cobro || ''} onChange={(e) => patch({ estilo_cobro: e.target.value })} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
            </Section>
            <Section title="Guion de saludo">
              <label style={labelStyle}>Cómo abre la conversación (usa {'{nombre}'}, {'{empresa_acreedora}'}, {'{monto}'})</label>
              <textarea value={form.saludo_tipo || ''} onChange={(e) => patch({ saludo_tipo: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </Section>
          </>
        )}

        {/* TAB: COMPORTAMIENTO */}
        {tab === 'comportamiento' && (
          <>
            <Section title="Manejo de objeciones" badge="PERSONALIZADO">
              <label style={labelStyle}>Cómo responde a "no tengo con qué pagar", "ya pagué", "no reconozco la deuda", etc.</label>
              <textarea value={form.manejo_objeciones || ''} onChange={(e) => patch({ manejo_objeciones: e.target.value })} rows={7} style={{ ...inputStyle, resize: 'vertical' }} />
            </Section>
            <Section title="Respuestas y guiones tipo">
              <label style={labelStyle}>Guiones que usa seguido (propuesta de plan de pago, confirmación de acuerdo…)</label>
              <textarea value={form.respuestas_tipo || ''} onChange={(e) => patch({ respuestas_tipo: e.target.value })} rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
            </Section>
            <Section title="Reglas de escalamiento a gestión jurídica" badge="IMPORTANTE">
              <label style={labelStyle}>Cuándo pasar el caso de cobro prejurídico a cobro judicial</label>
              <textarea value={form.escalamiento_juridico || ''} onChange={(e) => patch({ escalamiento_juridico: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
            </Section>
          </>
        )}

        {/* TAB: MENSAJES */}
        {tab === 'mensajes' && (
          <>
            <Section title="Primer mensaje de contacto (WhatsApp)">
              <textarea value={form.primer_mensaje || ''} onChange={(e) => patch({ primer_mensaje: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
              <button
                type="button"
                onClick={() => {
                  if (!form.whatsapp) { alert('Configura el WhatsApp del equipo de cobro en la pestaña Avanzado'); return }
                  window.open(`https://wa.me/${form.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(form.primer_mensaje || '')}`, '_blank')
                }}
                style={{ marginTop: 12, padding: '10px 16px', borderRadius: 10, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Probar mensaje en WhatsApp
              </button>
            </Section>
            <Section title="Recordatorio de pago">
              <textarea value={form.mensaje_recordatorio || ''} onChange={(e) => patch({ mensaje_recordatorio: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
            </Section>
            <Section title="Confirmación de acuerdo de pago">
              <textarea value={form.mensaje_acuerdo_pago || ''} onChange={(e) => patch({ mensaje_acuerdo_pago: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
            </Section>
          </>
        )}

        {/* TAB: AVANZADO */}
        {tab === 'avanzado' && (
          <>
            <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>Bot de WhatsApp</h2>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                    {form.bot_activo
                      ? '🟢 Activo — el agente responde automáticamente a los deudores'
                      : '⚪ Inactivo — la gestión de cobro sigue siendo manual'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => patch({ bot_activo: !form.bot_activo })}
                  style={{
                    position: 'relative', width: 52, height: 28, borderRadius: 999,
                    border: 'none', padding: 0, flexShrink: 0, cursor: 'pointer',
                    background: form.bot_activo ? ACCENT : '#e2e8f0',
                    transition: 'background 0.2s',
                  }}
                  aria-label={form.bot_activo ? 'Desactivar bot' : 'Activar bot'}
                >
                  <span style={{
                    position: 'absolute', top: 3, left: form.bot_activo ? 27 : 3,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s', display: 'block',
                  }} />
                </button>
              </div>
            </section>

            <Section title="Datos de contacto">
              <label style={labelStyle}>WhatsApp del equipo de cobro</label>
              <input style={inputStyle} placeholder="Ej: 573001234567" value={form.whatsapp || ''} onChange={(e) => patch({ whatsapp: e.target.value })} />
            </Section>

            <Section title="System prompt interno" badge="AVANZADO">
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 10px' }}>
                Instrucciones que usa la IA al generar mensajes de cobro. Edítalo solo si sabes lo que haces.
              </p>
              <textarea value={form.system_prompt || ''} onChange={(e) => patch({ system_prompt: e.target.value })} rows={9} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
            </Section>
          </>
        )}

        <div style={{ marginTop: 20 }}>
          <Link href="/admin/fenix" style={{
            display: 'inline-block', padding: '10px 16px', borderRadius: 10,
            border: '1px solid #e2e8f0', background: '#fff', color: '#64748b',
            fontSize: 13, textDecoration: 'none', fontWeight: 600,
          }}>
            ← Leads y pipeline
          </Link>
        </div>
      </div>
    </div>
  )
}
