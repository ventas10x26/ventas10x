// Ruta destino: src/components/admin/FenixAgenteClient.tsx
// Adaptación de src/app/pulse/agente/page.tsx al caso de Fenix: mismo
// patrón de tabs (voz/comportamiento/mensajes/avanzado) + guardado, con
// tema claro/oscuro conmutable (el claro es el look base del admin de
// Fenix -- FenixLeadsClient --, el oscuro reutiliza la paleta de
// src/app/pulse/agente para quedar consistente con el resto del código).
// Sin las piezas específicas de Pulse que acá no aplican -- no hay
// grabación de voz, conexión WhatsApp por QR ni banner de créditos,
// porque Fenix no tiene esa infraestructura (es un solo agente para todo
// el equipo, no uno por vendedor).
'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { FenixWhatsappConnect } from './FenixWhatsappConnect'

const ACCENT = '#F5821F'
const THEME_KEY = 'fenix_admin_theme'

type Tema = 'claro' | 'oscuro'

// Tokens de color por tema. El acento naranja de marca no cambia.
function colores(tema: Tema) {
  return tema === 'oscuro'
    ? {
        pageBg: '#0b1220', headerBg: '#0b1220', cardBg: 'rgba(15,23,42,0.5)',
        border: '#1e293b', ink: '#fff', ink2: '#94a3b8', ink3: '#64748b',
        inputBg: 'rgba(15,23,42,0.8)', inputBorder: '#334155', inputColor: '#fff',
        tabInactive: '#94a3b8', tabActiveBg: `${ACCENT}25`,
        linkBg: 'rgba(255,255,255,0.04)', linkBorder: '#334155', linkColor: '#94a3b8',
        toggleOff: '#334155', errBg: 'rgba(220,38,38,0.1)', okBg: 'rgba(22,163,74,0.1)',
      }
    : {
        pageBg: '#f7f6f4', headerBg: '#f7f6f4', cardBg: '#fff',
        border: '#e2e8f0', ink: '#0f172a', ink2: '#64748b', ink3: '#94a3b8',
        inputBg: '#fff', inputBorder: '#e2e8f0', inputColor: '#0f172a',
        tabInactive: '#64748b', tabActiveBg: `${ACCENT}18`,
        linkBg: '#fff', linkBorder: '#e2e8f0', linkColor: '#64748b',
        toggleOff: '#e2e8f0', errBg: '#fef2f2', okBg: '#f0fdf4',
      }
}

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

type C = ReturnType<typeof colores>

function Section({ c, title, badge, children }: { c: C; title: string; badge?: string; children: ReactNode }) {
  return (
    <section style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <h2 style={{ fontSize: 14.5, fontWeight: 800, margin: 0, color: c.ink }}>{title}</h2>
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

  // Arranca en claro y, tras montar, adopta lo guardado -- evita el
  // mismatch de hidratación de leer localStorage durante el render inicial.
  const [tema, setTema] = useState<Tema>('claro')
  useEffect(() => {
    const guardado = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null
    if (guardado === 'claro' || guardado === 'oscuro') setTema(guardado)
  }, [])
  const toggleTema = () => {
    setTema((t) => {
      const nuevo = t === 'claro' ? 'oscuro' : 'claro'
      if (typeof window !== 'undefined') localStorage.setItem(THEME_KEY, nuevo)
      return nuevo
    })
  }

  const c = colores(tema)
  const inputStyle: CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: 10,
    border: `1px solid ${c.inputBorder}`, background: c.inputBg,
    color: c.inputColor, fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const labelStyle: CSSProperties = {
    display: 'block', fontSize: 11.5, fontWeight: 700, color: c.ink2,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em',
  }

  const patch = (p: Partial<FenixAgente>) => setForm((f) => (f ? { ...f, ...p } : f))

  // Cuando se conecta el WhatsApp por QR, Evolution API ya sabe el número real
  // conectado -- lo autoguardamos en "whatsapp del equipo de cobro" para que
  // no haya que escribirlo a mano dos veces (uno para el bot, otro para el
  // campo). Si ya coincide, no hace nada.
  const handleWhatsappConectado = async (phone: string) => {
    setForm((f) => (f && f.whatsapp !== phone ? { ...f, whatsapp: phone } : f))
    if (!form || form.whatsapp === phone) return
    try {
      const res = await fetch('/api/admin/fenix-agente', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: phone }),
      })
      const data = await res.json()
      if (res.ok && data.ok) setForm(data.agente)
    } catch { /* si falla, el número queda en el campo y se guarda con "Guardar cambios" */ }
  }

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

  const ThemeToggle = (
    <button
      type="button"
      onClick={toggleTema}
      title={tema === 'claro' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      aria-label={tema === 'claro' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        border: `1px solid ${c.linkBorder}`, background: c.linkBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: 16, fontFamily: 'inherit',
      }}
    >
      {tema === 'claro' ? '🌙' : '☀️'}
    </button>
  )

  if (!form) {
    return (
      <div style={{ minHeight: '100vh', background: c.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: c.ink2, fontSize: 14, marginBottom: 12 }}>No hay una configuración de agente todavía.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: c.pageBg, fontFamily: 'system-ui, -apple-system, sans-serif', transition: 'background 0.2s' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px clamp(16px, 4vw, 32px) 80px' }}>

        {/* Cabecera */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20, background: c.headerBg,
          marginLeft: -24, marginRight: -24, padding: '0 24px 16px',
          marginBottom: 8, display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, paddingTop: 24,
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, marginBottom: '4px' }}>
              Fénix Consultores
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: c.ink }}>
              Agente IA · Cobro de cartera
            </h1>
            <p style={{ fontSize: 13, color: c.ink2, margin: 0, maxWidth: 480 }}>
              Entrena el tono, las objeciones y los mensajes que usa el agente al gestionar el cobro con los deudores.
            </p>
            {form.updated_at && (
              <p style={{ fontSize: 11, color: c.ink3, margin: '8px 0 0' }}>
                Última actualización: {new Date(form.updated_at).toLocaleString('es-CO')}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {ThemeToggle}
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              style={{
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {guardando ? 'Guardando…': 'Guardar cambios'}
            </button>
          </div>
        </div>

        {error   && <p style={{ color: tema === 'oscuro' ? '#f87171' : '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        {mensaje && <p style={{ color: tema === 'oscuro' ? '#4ade80' : '#16a34a', fontSize: 13, marginBottom: 12 }}>{mensaje}</p>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18, borderBottom: `1px solid ${c.border}`, paddingBottom: 8 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: tab === t.id ? c.tabActiveBg : 'transparent',
                color: tab === t.id ? ACCENT : c.tabInactive,
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
            <Section c={c} title="Nombre y tono del agente">
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
            <Section c={c} title="Estilo de cobro" badge="ENTRENAMIENTO">
              <label style={labelStyle}>Cómo se comunica el agente con el deudor</label>
              <textarea value={form.estilo_cobro || ''} onChange={(e) => patch({ estilo_cobro: e.target.value })} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
            </Section>
            <Section c={c} title="Guion de saludo">
              <label style={labelStyle}>Cómo abre la conversación (usa {'{nombre}'}, {'{empresa_acreedora}'}, {'{monto}'})</label>
              <textarea value={form.saludo_tipo || ''} onChange={(e) => patch({ saludo_tipo: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </Section>
          </>
        )}

        {/* TAB: COMPORTAMIENTO */}
        {tab === 'comportamiento' && (
          <>
            <Section c={c} title="Manejo de objeciones" badge="PERSONALIZADO">
              <label style={labelStyle}>Cómo responde a "no tengo con qué pagar", "ya pagué", "no reconozco la deuda", etc.</label>
              <textarea value={form.manejo_objeciones || ''} onChange={(e) => patch({ manejo_objeciones: e.target.value })} rows={7} style={{ ...inputStyle, resize: 'vertical' }} />
            </Section>
            <Section c={c} title="Respuestas y guiones tipo">
              <label style={labelStyle}>Guiones que usa seguido (propuesta de plan de pago, confirmación de acuerdo…)</label>
              <textarea value={form.respuestas_tipo || ''} onChange={(e) => patch({ respuestas_tipo: e.target.value })} rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
            </Section>
            <Section c={c} title="Reglas de escalamiento a gestión jurídica" badge="IMPORTANTE">
              <label style={labelStyle}>Cuándo pasar el caso de cobro prejurídico a cobro judicial</label>
              <textarea value={form.escalamiento_juridico || ''} onChange={(e) => patch({ escalamiento_juridico: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
            </Section>
          </>
        )}

        {/* TAB: MENSAJES */}
        {tab === 'mensajes' && (
          <>
            <Section c={c} title="Primer mensaje de contacto (WhatsApp)">
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
            <Section c={c} title="Recordatorio de pago">
              <textarea value={form.mensaje_recordatorio || ''} onChange={(e) => patch({ mensaje_recordatorio: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
            </Section>
            <Section c={c} title="Confirmación de acuerdo de pago">
              <textarea value={form.mensaje_acuerdo_pago || ''} onChange={(e) => patch({ mensaje_acuerdo_pago: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
            </Section>
          </>
        )}

        {/* TAB: AVANZADO */}
        {tab === 'avanzado' && (
          <>
            <section style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 4px', color: c.ink }}>Bot de WhatsApp</h2>
                  <p style={{ fontSize: 12, color: c.ink2, margin: 0 }}>
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
                    background: form.bot_activo ? ACCENT : c.toggleOff,
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

            <FenixWhatsappConnect c={c} onConnected={handleWhatsappConectado} />

            <Section c={c} title="Datos de contacto">
              <label style={labelStyle}>WhatsApp del equipo de cobro</label>
              <input style={inputStyle} placeholder="Ej: 573001234567" value={form.whatsapp || ''} onChange={(e) => patch({ whatsapp: e.target.value })} />
            </Section>

            <Section c={c} title="System prompt interno" badge="AVANZADO">
              <p style={{ fontSize: 12, color: c.ink3, margin: '0 0 10px' }}>
                Instrucciones que usa la IA al generar mensajes de cobro. Edítalo solo si sabes lo que haces.
              </p>
              <textarea value={form.system_prompt || ''} onChange={(e) => patch({ system_prompt: e.target.value })} rows={9} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
            </Section>
          </>
        )}

        <div style={{ marginTop: 20 }}>
          <Link href="/admin/fenix" style={{
            display: 'inline-block', padding: '10px 16px', borderRadius: 10,
            border: `1px solid ${c.linkBorder}`, background: c.linkBg, color: c.linkColor,
            fontSize: 13, textDecoration: 'none', fontWeight: 600,
          }}>
            ← Leads y pipeline
          </Link>
        </div>
      </div>
    </div>
  )
}
