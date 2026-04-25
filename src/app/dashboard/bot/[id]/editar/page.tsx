// Ruta destino: src/app/dashboard/bot/[id]/editar/page.tsx
// Reutiliza el mismo patrón que /dashboard/bot/nuevo/page.tsx pero:
// - Carga el bot existente al inicio
// - Guarda con PATCH al endpoint actualizado
// - Botón final dice "Guardar cambios" en vez de "Activar"

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const INDUSTRIAS = [
  { icon: '🚗', label: 'Automotriz' },
  { icon: '🏠', label: 'Inmobiliaria' },
  { icon: '👗', label: 'Retail' },
  { icon: '🍔', label: 'Alimentos' },
  { icon: '💊', label: 'Salud' },
  { icon: '🛠️', label: 'Servicios' },
  { icon: '💻', label: 'Tecnología' },
  { icon: '🎓', label: 'Educación' },
  { icon: '🏋️', label: 'Fitness' },
  { icon: '✈️', label: 'Turismo' },
]

const TONOS = [
  { value: 'profesional', label: '👔 Profesional', desc: 'Formal y confiable' },
  { value: 'amigable', label: '😊 Amigable', desc: 'Cercano y cálido' },
  { value: 'dinamico', label: '⚡ Dinámico', desc: 'Directo y energético' },
  { value: 'consultivo', label: '🎯 Consultivo', desc: 'Experto y analítico' },
]

const STEPS = ['Identidad', 'Industria', 'Personalidad', 'Productos', 'Preview']

type BotConfig = {
  nombre: string
  empresa: string
  industria: string
  tono: string
  bienvenida: string
  productos: string
  faqs: string
  whatsapp: string
  activo?: boolean
}

const EMPTY: BotConfig = {
  nombre: '', empresa: '', industria: '', tono: '',
  bienvenida: '', productos: '', faqs: '', whatsapp: '',
  activo: true,
}

export default function EditarBotPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const botId = params?.id

  const [step, setStep] = useState(0)
  const [config, setConfig] = useState<BotConfig>(EMPTY)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ who: 'user' | 'bot', text: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [cargandoBot, setCargandoBot] = useState(true)

  // ── Cargar bot existente ──
  useEffect(() => {
    if (!botId) return
    const cargar = async () => {
      try {
        const res = await fetch(`/api/bot-save?id=${botId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar el bot')

        const b = data.bot
        if (!b) {
          setErrorCarga('Bot no encontrado')
          return
        }

        setConfig({
          nombre: b.nombre || '',
          empresa: b.empresa || '',
          industria: b.industria || '',
          tono: b.tono || '',
          bienvenida: b.bienvenida || '',
          productos: b.productos || '',
          faqs: b.faqs || '',
          whatsapp: b.whatsapp || '',
          activo: b.activo ?? true,
        })
      } catch (e) {
        setErrorCarga(e instanceof Error ? e.message : 'Error al cargar')
      } finally {
        setCargandoBot(false)
      }
    }
    cargar()
  }, [botId])

  const set = (key: keyof BotConfig, val: string | boolean) =>
    setConfig(c => ({ ...c, [key]: val }))

  const canNext = () => {
    if (step === 0) return config.nombre.trim() && config.empresa.trim()
    if (step === 1) return !!config.industria
    if (step === 2) return !!config.tono
    if (step === 3) return config.productos.trim().length > 10
    return true
  }

  const sendMessage = async () => {
    if (!chatInput.trim() || loading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(m => [...m, { who: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/bot-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, message: userMsg, history: chatMessages }),
      })
      const data = await res.json()
      setChatMessages(m => [...m, { who: 'bot', text: data.reply }])
    } catch {
      setChatMessages(m => [...m, { who: 'bot', text: 'Hubo un error al conectar con el bot. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  const guardarCambios = async () => {
    setSaving(true)
    setSavedMsg(null)
    try {
      const res = await fetch('/api/bot-save', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: botId, ...config }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      setSavedMsg('✅ Cambios guardados')
      setTimeout(() => setSavedMsg(null), 3000)
    } catch (e) {
      setSavedMsg(`❌ ${e instanceof Error ? e.message : 'Error'}`)
    } finally {
      setSaving(false)
    }
  }

  const eliminarBot = async () => {
    if (!confirm(`¿Eliminar el bot "${config.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(`/api/bot-save?id=${botId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error')
      }
      router.push('/dashboard/bot')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '1px solid #e5e7eb', fontSize: '15px', fontFamily: 'inherit',
    outline: 'none', background: '#fff', color: '#111827',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    fontSize: '14px', fontWeight: 600 as const, color: '#374151',
    marginBottom: '6px', display: 'block' as const,
  }

  // ── Estados de carga / error ──
  if (cargandoBot) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Cargando bot...
        </div>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>😕</div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f1c2e', marginBottom: '0.5rem' }}>{errorCarga}</h2>
          <Link href="/dashboard/bot" style={{
            display: 'inline-block', marginTop: '1rem', padding: '0.6rem 1.25rem',
            background: '#FF6B2B', color: '#fff', borderRadius: '10px',
            textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700,
          }}>
            ← Volver a mis bots
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', fontFamily: "var(--font-jakarta,'Plus Jakarta Sans',system-ui,sans-serif)" }}>

      {/* Header */}
      <div style={{ background: '#0f1c2e', borderBottom: '1px solid rgba(255,255,255,.08)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="30" height="30" viewBox="0 0 52 52" fill="none"><rect width="52" height="52" rx="13" fill="#FF6B2B"/><rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/><rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/><rect x="28" y="16" width="7" height="28" rx="2" fill="white"/></svg>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '17px' }}>Ventas<span style={{ color: '#FF6B2B' }}>10x</span></span>
          <span style={{ color: 'rgba(255,255,255,.3)', margin: '0 8px' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '14px' }}>Editar Bot IA</span>
        </div>
        <Link href="/dashboard/bot" style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', textDecoration: 'none' }}>← Volver a mis bots</Link>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 2rem' }}>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2.5rem', gap: '0' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setStep(i)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: i <= step ? '#FF6B2B' : '#e5e7eb',
                    color: i <= step ? '#fff' : '#9ca3af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, flexShrink: 0,
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  {i < step ? '✓' : i + 1}
                </button>
                <span style={{ fontSize: '11px', fontWeight: 600, color: i === step ? '#FF6B2B' : '#9ca3af', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: i < step ? '#FF6B2B' : '#e5e7eb', margin: '0 8px', marginBottom: '18px' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: '20px', border: '0.5px solid #e5e7eb', padding: '2.5rem', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>

          {/* PASO 0 — Identidad */}
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '.5rem' }}>Identidad del bot</h2>
              <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '2rem' }}>Edita el nombre y la información básica de tu bot.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Nombre del bot</label>
                  <input style={inputStyle} placeholder="ej. Asistente Kia, BotMax, SofIA..." value={config.nombre} onChange={e => set('nombre', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Nombre de tu empresa</label>
                  <input style={inputStyle} placeholder="ej. Concesionario Kia Bogotá" value={config.empresa} onChange={e => set('empresa', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp de contacto (opcional)</label>
                  <input style={inputStyle} placeholder="+57 300 000 0000" value={config.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Mensaje de bienvenida</label>
                  <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="ej. ¡Hola! Soy el asistente de Kia Bogotá. ¿En qué puedo ayudarte hoy?" value={config.bienvenida} onChange={e => set('bienvenida', e.target.value)} />
                </div>

                {/* Toggle activo (solo en editar) */}
                <div style={{
                  background: '#f9fafb', padding: '0.875rem 1rem', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Bot activo</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {config.activo ? 'Está respondiendo a prospectos' : 'Inactivo, no responderá'}
                    </div>
                  </div>
                  <button
                    onClick={() => set('activo', !config.activo)}
                    style={{
                      width: '44px', height: '24px',
                      background: config.activo ? '#10b981' : '#d1d5db',
                      borderRadius: '12px', border: 'none', cursor: 'pointer',
                      position: 'relative', transition: 'background .2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: '2px',
                      left: config.activo ? '22px' : '2px',
                      width: '20px', height: '20px', background: '#fff', borderRadius: '50%',
                      transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,.2)',
                    }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASO 1 — Industria */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '.5rem' }}>¿Cuál es tu industria?</h2>
              <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '2rem' }}>El bot IA se entrena con el lenguaje de tu sector.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '1rem' }}>
                {INDUSTRIAS.map(ind => (
                  <div key={ind.label} onClick={() => set('industria', ind.label)} style={{
                    border: config.industria === ind.label ? '2px solid #FF6B2B' : '1px solid #e5e7eb',
                    borderRadius: '14px', padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
                    background: config.industria === ind.label ? '#fff7f3' : '#fff',
                    transition: 'all .15s',
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{ind.icon}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: config.industria === ind.label ? '#FF6B2B' : '#111827' }}>{ind.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 2 — Personalidad */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '.5rem' }}>Tono de comunicación</h2>
              <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '2rem' }}>¿Cómo quieres que hable tu bot con los prospectos?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {TONOS.map(t => (
                  <div key={t.value} onClick={() => set('tono', t.value)} style={{
                    border: config.tono === t.value ? '2px solid #FF6B2B' : '1px solid #e5e7eb',
                    borderRadius: '14px', padding: '1.25rem 1.5rem', cursor: 'pointer',
                    background: config.tono === t.value ? '#fff7f3' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all .15s',
                  }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: config.tono === t.value ? '#FF6B2B' : '#111827' }}>{t.label}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{t.desc}</div>
                    </div>
                    {config.tono === t.value && <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#FF6B2B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }}>✓</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 3 — Productos */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '.5rem' }}>Productos y servicios</h2>
              <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '2rem' }}>Cuéntale al bot qué vendes. Mientras más detalle, mejor responde.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Describe tus productos o servicios</label>
                  <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                    placeholder="ej. Vendemos vehículos Kia nuevos: EV6 2027 desde $42,900..."
                    value={config.productos} onChange={e => set('productos', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Preguntas frecuentes que responde el bot <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
                  <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                    placeholder="ej. ¿Hacen retomas? Sí, evaluamos tu vehículo sin costo..."
                    value={config.faqs} onChange={e => set('faqs', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* PASO 4 — Preview + Guardar */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '.5rem' }}>Prueba tu bot actualizado</h2>
              <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '1.5rem' }}>
                Chatea con <strong>{config.nombre || 'tu bot'}</strong> para verificar los cambios antes de guardar.
              </p>

              {/* Chat */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ background: '#0f1c2e', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF6B2B,#ff9a5c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{config.nombre || 'Bot IA'} · {config.empresa || 'Tu empresa'}</div>
                    <div style={{ fontSize: '11px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                      En línea
                    </div>
                  </div>
                </div>

                <div style={{ minHeight: '220px', maxHeight: '320px', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {chatMessages.length === 0 && (
                    <div style={{ background: '#FF6B2B', borderRadius: '4px 14px 14px 14px', padding: '10px 14px', maxWidth: '80%', alignSelf: 'flex-start' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.7)', marginBottom: '3px', letterSpacing: '.06em' }}>{(config.nombre || 'BOT').toUpperCase()}</div>
                      <div style={{ fontSize: '14px', color: '#fff', lineHeight: 1.5 }}>
                        {config.bienvenida || `¡Hola! Soy ${config.nombre || 'tu asistente'} de ${config.empresa || 'la empresa'}. ¿En qué puedo ayudarte hoy?`}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.who === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        background: m.who === 'bot' ? '#FF6B2B' : '#e5e7eb',
                        borderRadius: m.who === 'bot' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                        padding: '10px 14px', maxWidth: '80%',
                      }}>
                        {m.who === 'bot' && <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.7)', marginBottom: '3px', letterSpacing: '.06em' }}>{(config.nombre || 'BOT').toUpperCase()}</div>}
                        <div style={{ fontSize: '14px', color: m.who === 'bot' ? '#fff' : '#111827', lineHeight: 1.5 }}>{m.text}</div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', gap: '5px', padding: '10px 14px', background: '#FF6B2B', borderRadius: '4px 14px 14px 14px', maxWidth: '80px' }}>
                      {[0,1,2].map(d => <span key={d} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(255,255,255,.7)', display: 'inline-block', animation: `bounce 1.2s ease ${d*.25}s infinite` }} />)}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', padding: '1rem', display: 'flex', gap: '8px' }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Escribe un mensaje para probar tu bot..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  />
                  <button onClick={sendMessage} disabled={loading} style={{ background: '#FF6B2B', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 20px', fontSize: '15px', cursor: 'pointer', fontWeight: 700 }}>→</button>
                </div>
              </div>

              {/* Mensaje de guardado */}
              {savedMsg && (
                <div style={{
                  background: savedMsg.startsWith('✅') ? '#f0fdf4' : '#fee2e2',
                  border: `1px solid ${savedMsg.startsWith('✅') ? '#86efac' : '#fca5a5'}`,
                  borderRadius: '10px', padding: '0.75rem 1rem',
                  color: savedMsg.startsWith('✅') ? '#166534' : '#991b1b',
                  fontSize: '14px', fontWeight: 600, marginBottom: '1rem',
                }}>
                  {savedMsg}
                </div>
              )}

              {/* Botones de acción finales */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={guardarCambios}
                  disabled={saving}
                  style={{
                    flex: 1, minWidth: '200px',
                    background: '#FF6B2B', color: '#fff', border: 'none',
                    borderRadius: '12px', padding: '14px',
                    fontSize: '15px', fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? .7 : 1,
                  }}
                >
                  {saving ? 'Guardando...' : '💾 Guardar cambios'}
                </button>
                <button
                  onClick={eliminarBot}
                  style={{
                    background: '#fff', color: '#dc2626',
                    border: '1px solid #fca5a5', borderRadius: '12px',
                    padding: '14px 20px', fontSize: '15px', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🗑 Eliminar bot
                </button>
              </div>
            </div>
          )}

          {/* Navegación */}
          {step < 4 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '0.5px solid #f3f4f6' }}>
              <button onClick={() => setStep(s => s - 1)} disabled={step === 0} style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: 600, color: '#374151', cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? .4 : 1 }}>
                ← Atrás
              </button>
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{ background: canNext() ? '#FF6B2B' : '#e5e7eb', color: canNext() ? '#fff' : '#9ca3af', border: 'none', borderRadius: '10px', padding: '10px 32px', fontSize: '14px', fontWeight: 700, cursor: canNext() ? 'pointer' : 'not-allowed' }}>
                {step === 3 ? 'Ver preview →' : 'Continuar →'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
      `}</style>
    </div>
  )
}
