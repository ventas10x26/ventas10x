// Ruta destino: src/components/admin/FenixLeadsAgenteClient.tsx
// Panel para editar el mensaje de bienvenida, el nombre del entregable y la
// pregunta de cierre que el agente informativo le manda a los leads
// comerciales por WhatsApp (ver /api/fenix-contacto y
// /api/fenix/whatsapp/webhook). Mismo tema claro/oscuro compartido con
// FenixAgenteClient (misma THEME_KEY) para que el toggle sea consistente
// entre las dos páginas de configuración de agentes.
'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'

const ACCENT = '#F5821F'
const THEME_KEY = 'fenix_admin_theme'

type Tema = 'claro' | 'oscuro'

function colores(tema: Tema) {
  return tema === 'oscuro'
    ? {
        pageBg: '#0b1220', headerBg: '#0b1220', cardBg: 'rgba(15,23,42,0.5)',
        border: '#1e293b', ink: '#fff', ink2: '#94a3b8', ink3: '#64748b',
        inputBg: 'rgba(15,23,42,0.8)', inputBorder: '#334155', inputColor: '#fff',
        linkBg: 'rgba(255,255,255,0.04)', linkBorder: '#334155', linkColor: '#94a3b8',
      }
    : {
        pageBg: '#f7f6f4', headerBg: '#f7f6f4', cardBg: '#fff',
        border: '#e2e8f0', ink: '#0f172a', ink2: '#64748b', ink3: '#94a3b8',
        inputBg: '#fff', inputBorder: '#e2e8f0', inputColor: '#0f172a',
        linkBg: '#fff', linkBorder: '#e2e8f0', linkColor: '#64748b',
      }
}

type FenixLeadsAgente = {
  id: string
  mensaje_bienvenida: string | null
  nombre_archivo_entregable: string | null
  pregunta_cierre: string | null
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

export function FenixLeadsAgenteClient({ initialAgente }: { initialAgente: FenixLeadsAgente | null }) {
  const [form, setForm]           = useState<FenixLeadsAgente | null>(initialAgente)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje]     = useState('')
  const [error, setError]         = useState('')

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

  const patch = (p: Partial<FenixLeadsAgente>) => setForm((f) => (f ? { ...f, ...p } : f))

  const guardar = async () => {
    if (!form) return
    setGuardando(true)
    setMensaje('')
    setError('')
    try {
      const res  = await fetch('/api/admin/fenix-leads-agente', {
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
          <p style={{ color: c.ink2, fontSize: 14, marginBottom: 12 }}>No hay una configuración de agente de leads todavía.</p>
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
              Agente IA · Leads comerciales
            </h1>
            <p style={{ fontSize: 13, color: c.ink2, margin: 0, maxWidth: 480 }}>
              Edita lo que el asistente le escribe por WhatsApp a las empresas que llenan el formulario de contacto de la landing.
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

        <Section c={c} title="Mensaje de bienvenida" badge="1er MENSAJE">
          <p style={{ fontSize: 12, color: c.ink3, margin: '0 0 10px' }}>
            Se envía apenas el lead llena el formulario, antes del documento. Usa {'{nombre}'} y {'{empresa}'} como variables.
          </p>
          <textarea
            value={form.mensaje_bienvenida || ''}
            onChange={(e) => patch({ mensaje_bienvenida: e.target.value })}
            rows={7}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Section>

        <Section c={c} title="Entregable (PDF)" badge="DOCUMENTO">
          <label style={labelStyle}>Nombre visible del archivo en WhatsApp</label>
          <p style={{ fontSize: 12, color: c.ink3, margin: '0 0 10px' }}>
            Así se ve el archivo adjunto en el chat del lead (en vez del link crudo del PDF).
          </p>
          <input
            style={inputStyle}
            placeholder="Ej: Factores claves - Fénix Consultores.pdf"
            value={form.nombre_archivo_entregable || ''}
            onChange={(e) => patch({ nombre_archivo_entregable: e.target.value })}
          />
        </Section>

        <Section c={c} title="Pregunta de cierre" badge="3er MENSAJE">
          <p style={{ fontSize: 12, color: c.ink3, margin: '0 0 10px' }}>
            Se envía justo después del documento, para arrancar la conversación.
          </p>
          <textarea
            value={form.pregunta_cierre || ''}
            onChange={(e) => patch({ pregunta_cierre: e.target.value })}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Section>

        <Section c={c} title="System prompt avanzado" badge="AVANZADO">
          <p style={{ fontSize: 12, color: c.ink3, margin: '0 0 10px' }}>
            Instrucciones que usa la IA para seguir la conversación con el lead después del primer contacto. Déjalo vacío para usar el prompt por defecto (info de Fénix, modelo UREA®, líneas de contacto). Edítalo solo si sabes lo que haces.
          </p>
          <textarea
            value={form.system_prompt || ''}
            onChange={(e) => patch({ system_prompt: e.target.value })}
            rows={9}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
          />
        </Section>

        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/admin/fenix/agente" style={{
            display: 'inline-block', padding: '10px 16px', borderRadius: 10,
            border: `1px solid ${c.linkBorder}`, background: c.linkBg, color: c.linkColor,
            fontSize: 13, textDecoration: 'none', fontWeight: 600,
          }}>
            ← Agente de cobro
          </Link>
          <Link href="/admin/fenix" style={{
            display: 'inline-block', padding: '10px 16px', borderRadius: 10,
            border: `1px solid ${c.linkBorder}`, background: c.linkBg, color: c.linkColor,
            fontSize: 13, textDecoration: 'none', fontWeight: 600,
          }}>
            Leads y pipeline →
          </Link>
        </div>
      </div>
    </div>
  )
}
