'use client'

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'
import { PulseVozRecorder } from '@/components/pulse/PulseVozRecorder'
import type { PulseAgenteDTO } from '@/lib/pulse-agent'
import { PulseAudioLogs } from '@/components/pulse/PulseAudioLogs'
import { PulseWhatsappConnect } from '@/components/pulse/PulseWhatsappConnect'
import FollowUpConfig from '@/components/pulse/FollowUpConfig'
import CreditosBanner from '@/components/pulse/CreditosBanner'   // ← NUEVO

const EMPTY: PulseAgenteDTO = {
  agent_id: null, email: '', nombre: '', marca: '', whatsapp: '',
  estilo_venta: '', obstaculo: '', muestra_voz: '', duracion_voz_seg: null,
  manejo_objeciones: '', respuestas_tipo: '', voz_historial: [],
  perfil: '', especializacion: '', propuesta_valor: '', primer_mensaje: '',
  system_prompt: '', configured_at: null, updated_at: null,
  bot_activo: true,
}

const inputStyle: CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '1px solid #334155', background: 'rgba(15,23,42,0.8)',
  color: '#fff', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
}

const labelStyle: CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6,
}

function Section({ title, badge, children }: { title: string; badge?: string; children: ReactNode }) {
  return (
    <section style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid #1e293b', borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#fff' }}>{title}</h2>
        {badge && (
          <span style={{ fontSize: 9, fontWeight: 800, color: '#f97316', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', padding: '4px 10px', borderRadius: 999, letterSpacing: 0.5 }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

export default function PulseAgentePage() {
  const router  = useRouter()
  const supabase = createClient()

  const [user, setUser]                   = useState<{ nombre: string; email: string } | null>(null)
  const [form, setForm]                   = useState<PulseAgenteDTO>(EMPTY)
  const [loading, setLoading]             = useState(true)
  const [guardando, setGuardando]         = useState(false)
  const [regenerando, setRegenerando]     = useState(false)
  const [mensaje, setMensaje]             = useState('')
  const [error, setError]                 = useState('')
  const [sinAgente, setSinAgente]         = useState(false)
  const [subiendoVoz, setSubiendoVoz]     = useState(false)
  const [tab, setTab]                     = useState<'voz' | 'comportamiento' | 'mensajes' | 'avanzado'>('voz')
  const [whatsappConectado, setWhatsappConectado] = useState(false)
  const [creditosAgotados, setCreditosAgotados]   = useState(false)  // ← NUEVO

  const patch = (p: Partial<PulseAgenteDTO>) => setForm((f) => ({ ...f, ...p }))

  const cargarAgente = useCallback(async (emailHint?: string) => {
    setLoading(true)
    setError('')
    try {
      const q = emailHint ? `?email=${encodeURIComponent(emailHint)}` : ''
      const res  = await fetch(`/api/pulse/agente${q}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      if (!data.agente) {
        setSinAgente(true)
        setForm((f) => ({ ...f, email: emailHint || f.email }))
      } else {
        setSinAgente(false)
        setForm(data.agente)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar agente')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const params = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams()

      const urlEmail      = params.get('email')
      const urlTab        = params.get('tab') as typeof tab | null
      const fromOnboarding = params.get('from') === 'onboarding'

      if (urlTab && ['voz', 'comportamiento', 'mensajes', 'avanzado'].includes(urlTab)) {
        setTab(urlTab)
      } else if (fromOnboarding) {
        setTab('voz')
      }

      const { data: { user: authUser } } = await supabase.auth.getUser()
      let email = ''

      if (authUser?.email) {
        email = authUser.email
        setUser({
          email:  authUser.email,
          nombre: (authUser.user_metadata?.full_name as string) || authUser.email.split('@')[0],
        })
      } else {
        const stored = typeof window !== 'undefined'
          ? sessionStorage.getItem('pulse_onboarding_email')
          : null
        email = urlEmail || stored || ''
        if (urlEmail) sessionStorage.setItem('pulse_onboarding_email', urlEmail)
        setUser(email ? { email, nombre: email.split('@')[0] } : null)
      }

      if (email) await cargarAgente(email)
      else setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const guardar = async (regenerarIa = false) => {
    setGuardando(!regenerarIa)
    setRegenerando(regenerarIa)
    setMensaje('')
    setError('')
    try {
      const res  = await fetch('/api/pulse/agente', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, regenerar_ia: regenerarIa }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo guardar')
      setForm(data.agente)
      setSinAgente(false)
      setMensaje(regenerarIa ? '✓ Agente re-entrenado con IA según tu voz y reglas' : '✓ Configuración guardada')
      sessionStorage.setItem('pulse_onboarding_email', data.agente.email)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setGuardando(false)
      setRegenerando(false)
    }
  }

  const subirMuestraVoz = useCallback(
    async (blob: Blob, texto: string, dur: number) => {
      setSubiendoVoz(true)
      setError('')
      try {
        const fd = new FormData()
        fd.append('audio', blob, 'muestra-voz.webm')
        fd.append('transcripcion', texto)
        fd.append('duracion_seg', String(dur))
        if (form.email) fd.append('email', form.email)
        const res  = await fetch('/api/pulse/agente/voz-muestra', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo guardar el audio')
        setMensaje('✓ Grabación guardada en tu historial de voz')
        await cargarAgente(form.email || undefined)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al guardar audio')
      } finally {
        setSubiendoVoz(false)
      }
    },
    [form.email, cargarAgente]
  )

  const guion = form.nombre
    ? `Hola, soy ${form.nombre.split(' ')[0]}. Soy asesor${form.marca ? ` ${form.marca}` : ''}. Así le hablo a un cliente interesado en un carro nuevo…`
    : undefined

  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'voz',            label: '🎙️ Voz y tono' },
    { id: 'comportamiento', label: '🧠 Comportamiento' },
    { id: 'mensajes',       label: '💬 Mensajes' },
    { id: 'avanzado',       label: '⚙️ Avanzado' },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Cargando tu agente IA…</p>
      </div>
    )
  }

  return (
    <PulseAppShell userName={user?.nombre} userEmail={user?.email}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 100px' }}>

        {/* ── BANNER DE CRÉDITOS — arriba de todo ── */}
        <CreditosBanner onAgotado={() => setCreditosAgotados(true)} />

        {/* ── Cabecera — sticky: el formulario es largo (System prompt queda a
            ~1300px de acá) y "Guardar cambios" es el unico boton que guarda
            todo el form. Sin esto, quien edita una seccion de mas abajo tiene
            que scrollear hasta arriba del todo para encontrar donde guardar. */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: '#0b1220', borderBottom: '1px solid #1e293b',
          marginLeft: -24, marginRight: -24, padding: '16px 24px',
          marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px', letterSpacing: -0.5 }}>Mi agente IA{form.marca ? ` ${form.marca}` : ''}</h1>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, maxWidth: 520 }}>
              Entrena voz, objeciones y respuestas. Todo lo que guardes aquí se usa al generar mensajes para tus leads en el dashboard.
            </p>
            {form.updated_at && (
              <p style={{ fontSize: 11, color: '#64748b', margin: '8px 0 0' }}>
                Última actualización: {new Date(form.updated_at).toLocaleString('es-CO')}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => guardar(false)}
              disabled={guardando || regenerando || sinAgente || creditosAgotados}
              style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: (sinAgente || creditosAgotados) ? 'not-allowed' : 'pointer', opacity: (sinAgente || creditosAgotados) ? 0.5 : 1, fontFamily: 'inherit' }}
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={() => guardar(true)}
              disabled={guardando || regenerando || sinAgente || creditosAgotados}
              style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #f97316', background: 'rgba(249,115,22,0.08)', color: '#fdba74', fontWeight: 700, fontSize: 13, cursor: (sinAgente || creditosAgotados) ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >
              {regenerando ? 'Re-entrenando…' : '⚡ Re-entrenar con IA'}
            </button>
          </div>
        </div>

        {/* ── Sin agente ── */}
        {sinAgente && (
          <div style={{ padding: 20, borderRadius: 14, border: '1px solid #f97316', background: 'rgba(249,115,22,0.08)', marginBottom: 20 }}>
            <p style={{ margin: '0 0 12px', color: '#fed7aa', fontSize: 14 }}>Aún no tienes agente configurado con este correo.</p>
            <Link href="/pulse/onboarding-demo" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 10, background: '#f97316', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              Ir al onboarding demo →
            </Link>
          </div>
        )}

        {error   && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        {mensaje && <p style={{ color: '#4ade80', fontSize: 13, marginBottom: 12 }}>{mensaje}</p>}

        {!sinAgente && (
          <>
            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, borderBottom: '1px solid #1e293b', paddingBottom: 8 }}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: tab === t.id ? 'rgba(249,115,22,0.2)' : 'transparent', color: tab === t.id ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB: VOZ Y TONO */}
            {tab === 'voz' && (
              <>
                <Section title="Muestra de voz del asesor" badge="ENTRENAMIENTO">
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px' }}>
                    Cada grabación se guarda en Supabase (audio + transcripción) para comparar tu evolución. Al terminar de grabar se sube automáticamente al historial.
                  </p>
                  <PulseVozRecorder
                    value={form.muestra_voz}
                    guion={guion}
                    subiendo={subiendoVoz}
                    onChange={(texto, dur) => patch({ muestra_voz: texto, duracion_voz_seg: dur })}
                    onRecordingComplete={subirMuestraVoz}
                  />
                </Section>
                <Section title="Estilo de venta">
                  <label style={labelStyle}>Cómo hablas y cerrás (onboarding paso 1)</label>
                  <textarea value={form.estilo_venta} onChange={(e) => patch({ estilo_venta: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                </Section>
                <Section title="Mayor obstáculo">
                  <label style={labelStyle}>Qué te cuesta más hoy con los leads</label>
                  <textarea value={form.obstaculo} onChange={(e) => patch({ obstaculo: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </Section>
              </>
            )}

            {/* TAB: COMPORTAMIENTO */}
            {tab === 'comportamiento' && (
              <>
                <Section title="Manejo de objeciones" badge="PERSONALIZADO">
                  <label style={labelStyle}>Cómo respondes objeciones (precio, competencia, "lo pienso", etc.)</label>
                  <textarea value={form.manejo_objeciones} onChange={(e) => patch({ manejo_objeciones: e.target.value })} placeholder="Ej: Si dicen que está caro, les muestro el valor de equipamiento y simulo la financiación con cuota mensual…" rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
                </Section>
                <Section title="Respuestas tipo">
                  <label style={labelStyle}>Guiones o frases que usás seguido</label>
                  <textarea value={form.respuestas_tipo} onChange={(e) => patch({ respuestas_tipo: e.target.value })} placeholder="Ej: Saludo inicial, cierre test drive, seguimiento 24h…" rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
                </Section>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Perfil detectado</label>
                    <input style={inputStyle} value={form.perfil} onChange={(e) => patch({ perfil: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Especialización{form.marca ? ` ${form.marca}` : ''}</label>
                    <input style={inputStyle} value={form.especializacion} onChange={(e) => patch({ especializacion: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            {/* TAB: MENSAJES */}
            {tab === 'mensajes' && (
              <>
                <Section title="Propuesta de valor del asistente">
                  <textarea value={form.propuesta_valor} onChange={(e) => patch({ propuesta_valor: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                </Section>
                <Section title="Primer mensaje sugerido (WhatsApp)">
                  <textarea value={form.primer_mensaje} onChange={(e) => patch({ primer_mensaje: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
                  <button
                    type="button"
                    onClick={() => {
                      if (!form.whatsapp) { alert('Configura tu WhatsApp en la pestaña Avanzado'); return }
                      window.open(`https://wa.me/${form.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(form.primer_mensaje)}`, '_blank')
                    }}
                    style={{ marginTop: 12, padding: '10px 16px', borderRadius: 10, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Probar mensaje en WhatsApp
                  </button>
                </Section>
              </>
            )}

            {/* TAB: AVANZADO */}
            {tab === 'avanzado' && (
              <>
                <section style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid #1e293b', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>Bot WhatsApp</h2>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                        {!whatsappConectado
                          ? '⚠️ Conectá tu WhatsApp abajo para activar el bot'
                          : form.bot_activo
                            ? '🟢 Activo — el agente responde mensajes automáticamente'
                            : '⚪ Inactivo — los mensajes llegan sin respuesta automática'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!whatsappConectado || creditosAgotados}
                      title={!whatsappConectado ? 'Primero conectá tu WhatsApp con el QR' : creditosAgotados ? 'Sin créditos — activá tu plan' : undefined}
                      onClick={async () => {
                        if (!whatsappConectado || creditosAgotados) return
                        const nuevoValor = !form.bot_activo
                        patch({ bot_activo: nuevoValor })
                        try {
                          const res  = await fetch('/api/pulse/agente', {
                            method:  'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body:    JSON.stringify({ ...form, bot_activo: nuevoValor }),
                          })
                          const data = await res.json()
                          if (!res.ok || !data.ok) throw new Error(data.error)
                          setForm(data.agente)
                          setMensaje(nuevoValor ? '✓ Bot activado' : '✓ Bot desactivado')
                          setTimeout(() => setMensaje(''), 2500)
                        } catch (e) {
                          patch({ bot_activo: !nuevoValor })
                          setError(e instanceof Error ? e.message : 'Error al guardar')
                        }
                      }}
                      style={{
                        position: 'relative', width: 52, height: 28, borderRadius: 999,
                        border: 'none', padding: 0, flexShrink: 0,
                        cursor: (!whatsappConectado || creditosAgotados) ? 'not-allowed' : 'pointer',
                        opacity: (!whatsappConectado || creditosAgotados) ? 0.45 : 1,
                        background: whatsappConectado && form.bot_activo && !creditosAgotados
                          ? 'linear-gradient(135deg, #f97316, #ea580c)'
                          : 'rgba(51,65,85,0.8)',
                        transition: 'background 0.2s, opacity 0.2s',
                      }}
                      aria-label={form.bot_activo ? 'Desactivar bot' : 'Activar bot'}
                    >
                      <span style={{
                        position: 'absolute', top: 3,
                        left: whatsappConectado && form.bot_activo && !creditosAgotados ? 27 : 3,
                        width: 22, height: 22, borderRadius: '50%',
                        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                        transition: 'left 0.2s', display: 'block',
                      }} />
                    </button>
                  </div>
                </section>

                <PulseWhatsappConnect
                  email={form.email}
                  onEstadoChange={setWhatsappConectado}
                  onConnected={(phone) => {
                    patch({ whatsapp: phone })
                    setMensaje('✓ WhatsApp conectado — el bot ya responde automáticamente')
                  }}
                />

                <Section title="Follow-up automático" badge="NUEVO">
                  <FollowUpConfig />
                </Section>

                <Section title="Datos de contacto">
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Nombre</label>
                      <input style={inputStyle} value={form.nombre} onChange={(e) => patch({ nombre: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email (clave del agente en BD)</label>
                      <input style={inputStyle} value={form.email} readOnly />
                    </div>
                    <div>
                      <label style={labelStyle}>WhatsApp</label>
                      <input style={inputStyle} value={form.whatsapp} onChange={(e) => patch({ whatsapp: e.target.value })} />
                    </div>
                  </div>
                </Section>

                <Section title="System prompt interno" badge="AVANZADO">
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>
                    Instrucciones que Claude usa al responder leads. Editalo solo si sabés lo que hacés.
                  </p>
                  <textarea value={form.system_prompt} onChange={(e) => patch({ system_prompt: e.target.value })} rows={10} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
                </Section>

                {form.agent_id && (
                  <p style={{ fontSize: 11, color: '#475569' }}>ID agente (pulse_waitlist): {form.agent_id}</p>
                )}
              </>
            )}

            <PulseAudioLogs
              muestras={form.voz_historial}
              email={form.email}
              onRefresh={() => cargarAgente(form.email || undefined)}
            />
          </>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => router.push('/pulse/dashboard')}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← Dashboard de leads
          </button>
          <button
            type="button"
            onClick={() => router.push('/pulse/onboarding-demo')}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Repetir onboarding
          </button>
        </div>
      </div>
    </PulseAppShell>
  )
}
