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
        toggleOff: '#334155',
      }
    : {
        pageBg: '#f7f6f4', headerBg: '#f7f6f4', cardBg: '#fff',
        border: '#e2e8f0', ink: '#0f172a', ink2: '#64748b', ink3: '#94a3b8',
        inputBg: '#fff', inputBorder: '#e2e8f0', inputColor: '#0f172a',
        linkBg: '#fff', linkBorder: '#e2e8f0', linkColor: '#64748b',
        toggleOff: '#e2e8f0',
      }
}

type FenixLeadsAgente = {
  id: string
  activo: boolean
  mensaje_bienvenida: string | null
  nombre_archivo_entregable: string | null
  pregunta_cierre: string | null
  mensaje_followup: string | null
  horas_followup: number
  horas_perdido: number
  video_activo: boolean
  video_caption: string | null
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
  const [probando, setProbando]   = useState(false)
  const [resultadoPrueba, setResultadoPrueba] = useState<{
    followupsEnviados: number; marcadosPerdidos: number; detalle: string[]; errores: string[]
  } | null>(null)

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

  const probarFollowup = async () => {
    setProbando(true)
    setResultadoPrueba(null)
    setError('')
    try {
      const res = await fetch('/api/admin/fenix-leads-agente/followup-test', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo ejecutar')
      setResultadoPrueba(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al probar el follow-up')
    } finally {
      setProbando(false)
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

        <section style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 4px', color: c.ink }}>Autorespuesta a leads</h2>
              <p style={{ fontSize: 12, color: c.ink2, margin: 0 }}>
                {form.activo
                  ? '🟢 Activa — se envía apenas alguien llena el formulario de contacto'
                  : '⚪ Inactiva — los leads se siguen guardando y avisando al equipo, pero no reciben WhatsApp automático'}
              </p>
              <p style={{ fontSize: 11, color: c.ink3, margin: '6px 0 0' }}>
                Este interruptor es independiente del estado de conexión de WhatsApp (en Agente de cobro → Avanzado). Actívalo o desactívalo sin importar si el WhatsApp está conectado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => patch({ activo: !form.activo })}
              style={{
                position: 'relative', width: 52, height: 28, borderRadius: 999,
                border: 'none', padding: 0, flexShrink: 0, cursor: 'pointer',
                background: form.activo ? ACCENT : c.toggleOff,
                transition: 'background 0.2s',
              }}
              aria-label={form.activo ? 'Desactivar autorespuesta a leads' : 'Activar autorespuesta a leads'}
            >
              <span style={{
                position: 'absolute', top: 3, left: form.activo ? 27 : 3,
                width: 22, height: 22, borderRadius: '50%',
                background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.2s', display: 'block',
              }} />
            </button>
          </div>
        </section>

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

        <section style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 14.5, fontWeight: 800, margin: 0, color: c.ink }}>Video</h2>
              <span style={{ fontSize: 9, fontWeight: 800, color: ACCENT, background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, padding: '4px 10px', borderRadius: 999, letterSpacing: 0.5 }}>
                DESPUÉS DEL PDF
              </span>
            </div>
            <button
              type="button"
              onClick={() => patch({ video_activo: !form.video_activo })}
              style={{
                position: 'relative', width: 52, height: 28, borderRadius: 999,
                border: 'none', padding: 0, flexShrink: 0, cursor: 'pointer',
                background: form.video_activo ? ACCENT : c.toggleOff,
                transition: 'background 0.2s',
              }}
              aria-label={form.video_activo ? 'Desactivar video' : 'Activar video'}
            >
              <span style={{
                position: 'absolute', top: 3, left: form.video_activo ? 27 : 3,
                width: 22, height: 22, borderRadius: '50%',
                background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'left 0.2s', display: 'block',
              }} />
            </button>
          </div>
          <p style={{ fontSize: 12, color: c.ink3, margin: '0 0 10px' }}>
            {form.video_activo
              ? '🟢 Se envía justo después del PDF, antes de la pregunta de cierre.'
              : '⚪ Desactivado -- la secuencia sigue igual, solo sin el video.'}
          </p>
          <label style={labelStyle}>Texto que acompaña al video (opcional)</label>
          <input
            style={inputStyle}
            placeholder="Ej: Un video corto para conocernos mejor 🎥"
            value={form.video_caption || ''}
            onChange={(e) => patch({ video_caption: e.target.value })}
            disabled={!form.video_activo}
          />
        </section>

        <Section c={c} title="Pregunta de cierre" badge="4to MENSAJE">
          <p style={{ fontSize: 12, color: c.ink3, margin: '0 0 10px' }}>
            Se envía justo después del documento{form.video_activo ? ' y el video' : ''}, para arrancar la conversación.
          </p>
          <textarea
            value={form.pregunta_cierre || ''}
            onChange={(e) => patch({ pregunta_cierre: e.target.value })}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Section>

        <Section c={c} title="Mensaje de seguimiento (follow-up)" badge="AUTOMÁTICO">
          <p style={{ fontSize: 12, color: c.ink3, margin: '0 0 10px' }}>
            Si el lead nunca responde, este mensaje se envía solo, una vez, cuando pasen las horas de abajo desde la autorespuesta -- pregunta si quiere seguir la conversación e incluye el link de la landing. Si tampoco responde a este, cuando pasen las otras horas el lead se marca automáticamente como &quot;Perdido&quot; en el pipeline (solo si sigue en &quot;Nuevo&quot;, nunca pisa una etapa que ya hayas movido a mano). Se revisa una vez al día.
          </p>
          <textarea
            value={form.mensaje_followup || ''}
            onChange={(e) => patch({ mensaje_followup: e.target.value })}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Horas sin responder → enviar follow-up</label>
              <input
                type="number" min={1} style={inputStyle}
                value={form.horas_followup}
                onChange={(e) => patch({ horas_followup: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={labelStyle}>Horas después del follow-up → marcar perdido</label>
              <input
                type="number" min={1} style={inputStyle}
                value={form.horas_perdido}
                onChange={(e) => patch({ horas_perdido: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 14 }}>
            <p style={{ fontSize: 12, color: c.ink3, margin: '0 0 10px' }}>
              Ejecuta la revisión ahora mismo (lo mismo que hace el cron diario) -- útil para probar sin esperar. Si hay leads elegibles en este momento, les llega el mensaje de verdad.
            </p>
            <button
              type="button"
              onClick={probarFollowup}
              disabled={probando}
              style={{
                padding: '9px 16px', borderRadius: 10, border: `1px solid ${c.linkBorder}`,
                background: c.linkBg, color: c.linkColor, fontWeight: 700, fontSize: 12.5,
                cursor: probando ? 'default' : 'pointer', opacity: probando ? 0.6 : 1, fontFamily: 'inherit',
              }}
            >
              {probando ? 'Ejecutando…' : '▶ Probar ahora'}
            </button>

            {resultadoPrueba && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: c.inputBg, border: `1px solid ${c.border}` }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: c.ink, margin: '0 0 6px' }}>
                  {resultadoPrueba.followupsEnviados} follow-up(s) enviados · {resultadoPrueba.marcadosPerdidos} marcado(s) perdido(s)
                </p>
                {resultadoPrueba.detalle.length === 0 && resultadoPrueba.errores.length === 0 && (
                  <p style={{ fontSize: 12, color: c.ink3, margin: 0 }}>Nadie era elegible todavía (nadie cumplía las horas configuradas en este momento).</p>
                )}
                {resultadoPrueba.detalle.map((linea, i) => (
                  <p key={i} style={{ fontSize: 12, color: c.ink2, margin: '2px 0' }}>• {linea}</p>
                ))}
                {resultadoPrueba.errores.map((linea, i) => (
                  <p key={i} style={{ fontSize: 12, color: '#dc2626', margin: '2px 0' }}>⚠ {linea}</p>
                ))}
              </div>
            )}
          </div>
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
