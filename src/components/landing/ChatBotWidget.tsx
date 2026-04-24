'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Mensaje {
  role: 'user' | 'assistant' | 'form'
  text?: string
  timestamp: Date
}

interface ChatBotWidgetProps {
  slug: string
  nombreAsesor?: string
  colorAcento?: string
  industria?: string
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID()
  const key = 'v10x_bot_session'
  let id = sessionStorage.getItem(key)
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(key, id) }
  return id
}

const INDUSTRIA_AVATAR: Record<string, string> = {
  automotriz: '🚘', inmobiliaria: '🏠', retail: '🛍️',
  manufactura: '🏭', seguros: '🛡️', tecnologia: '💻', default: '🤖',
}

export default function ChatBotWidget({
  slug,
  nombreAsesor = 'Asistente',
  colorAcento = '#FF6B2B',
  industria = 'default',
}: ChatBotWidgetProps) {
  const [abierto, setAbierto]           = useState(true)
  const [mensajes, setMensajes]         = useState<Mensaje[]>([])
  const [input, setInput]               = useState('')
  const [cargando, setCargando]         = useState(false)
  const [convId, setConvId]             = useState<string | undefined>()
  const [leadCreado, setLeadCreado]     = useState(false)
  const [notifBurbuja, setNotifBurbuja] = useState(true)
  const [formVisible, setFormVisible]   = useState(false)
  const [leadForm, setLeadForm]         = useState({ nombre: '', whatsapp: '', interes: '' })
  const [submitting, setSubmitting]     = useState(false)
  const [formSent, setFormSent]         = useState(false)
  const chatRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sessionId = useRef(getOrCreateSessionId())

  useEffect(() => {
    if (abierto && mensajes.length === 0) {
      setMensajes([{
        role: 'assistant',
        text: `¡Hola! 👋 Soy el asistente virtual de ${nombreAsesor}. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date(),
      }])
    }
    if (abierto) {
      setNotifBurbuja(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [abierto, mensajes.length, nombreAsesor])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [mensajes, cargando, formVisible])

  const mostrarFormulario = useCallback(() => {
    if (!formVisible && !formSent) {
      setFormVisible(true)
      setMensajes(prev => [...prev, { role: 'form', timestamp: new Date() }])
    }
  }, [formVisible, formSent])

  const enviar = useCallback(async () => {
    const texto = input.trim()
    if (!texto || cargando) return

    setMensajes(prev => [...prev, { role: 'user', text: texto, timestamp: new Date() }])
    setInput('')
    setCargando(true)

    try {
      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          session_id: sessionId.current,
          message: texto,
          conversacion_id: convId,
        }),
      })

      const data = await res.json()
      if (data.conversacion_id) setConvId(data.conversacion_id)
      if (data.lead_creado) setLeadCreado(true)

      setMensajes(prev => [...prev, {
        role: 'assistant',
        text: data.reply ?? 'Ocurrió un error. Por favor intenta de nuevo.',
        timestamp: new Date(),
      }])

      // Mostrar formulario si el bot detectó interés, creó lead, o después de 4 mensajes
      const userMsgCount = mensajes.filter(m => m.role === 'user').length + 1
      if (data.accion === 'crear_lead' || data.accion === 'agendar_cita' || userMsgCount >= 4) {
        setTimeout(mostrarFormulario, 600)
      }
    } catch {
      setMensajes(prev => [...prev, {
        role: 'assistant',
        text: 'Ups, tuve un problema de conexión. ¿Puedes intentarlo de nuevo?',
        timestamp: new Date(),
      }])
    } finally {
      setCargando(false)
    }
  }, [input, cargando, slug, convId, mostrarFormulario])

  const submitForm = async () => {
    if (!leadForm.nombre.trim() || !leadForm.whatsapp.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/bot-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_id: null,
          vendedor_id: null,
          slug,
          nombre: leadForm.nombre,
          whatsapp: leadForm.whatsapp,
          producto: leadForm.interes,
          fuente: 'bot_landing',
          etapa: 'nuevo',
        }),
      })
      setFormSent(true)
      setMensajes(prev => [...prev, {
        role: 'assistant',
        text: `¡Perfecto ${leadForm.nombre.split(' ')[0]}! 🎉 ${nombreAsesor} te contactará al ${leadForm.whatsapp} en menos de 30 minutos.`,
        timestamp: new Date(),
      }])
    } catch {
      alert('Error al enviar. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  const avatar = INDUSTRIA_AVATAR[industria.toLowerCase()] ?? INDUSTRIA_AVATAR.default

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,.2)', fontSize: '13px',
    fontFamily: 'inherit', outline: 'none',
    background: 'rgba(255,255,255,.1)', color: '#fff',
    boxSizing: 'border-box' as const,
    marginBottom: '6px',
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, fontFamily: 'Inter, sans-serif' }}>

      {abierto && (
        <div style={{
          position: 'absolute', bottom: 72, right: 0,
          width: 360, maxHeight: 580,
          background: '#fff', borderRadius: 20,
          boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'botSlideUp .25s ease',
        }}>

          {/* Header */}
          <div style={{ background: colorAcento, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{nombreAsesor}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                En línea · responde al instante
              </div>
            </div>
            <button onClick={() => setAbierto(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Mensajes */}
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f8f8f6', minHeight: 0 }}>
            {mensajes.map((m, i) => {
              // Formulario de captura
              if (m.role === 'form') {
                return (
                  <div key={i} style={{ animation: 'botFadeUp .3s ease' }}>
                    {!formSent ? (
                      <div style={{ background: '#0f1c2e', borderRadius: '14px', padding: '1rem' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: colorAcento, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '6px' }}>CONTÁCTAME AHORA</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>¿Listo para tu cotización?</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)', marginBottom: '10px' }}>Te respondemos en menos de 30 minutos.</div>
                        <input style={inputStyle} placeholder="Tu nombre completo" value={leadForm.nombre} onChange={e => setLeadForm(f => ({ ...f, nombre: e.target.value }))} />
                        <input style={inputStyle} placeholder="Tu WhatsApp (+57 300...)" value={leadForm.whatsapp} onChange={e => setLeadForm(f => ({ ...f, whatsapp: e.target.value }))} />
                        <input style={{ ...inputStyle, marginBottom: '10px' }} placeholder="¿Qué te interesa? (opcional)" value={leadForm.interes} onChange={e => setLeadForm(f => ({ ...f, interes: e.target.value }))} />
                        <button
                          onClick={submitForm}
                          disabled={submitting || !leadForm.nombre.trim() || !leadForm.whatsapp.trim()}
                          style={{ width: '100%', background: colorAcento, color: '#fff', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: submitting ? .7 : 1 }}>
                          {submitting ? 'Enviando...' : 'Solicitar cotización →'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>✅</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>¡Datos enviados al asesor!</div>
                      </div>
                    )}
                  </div>
                )
              }

              // Mensajes normales
              return (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%', animation: 'botFadeUp .2s ease' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? colorAcento : '#ffffff',
                    color: m.role === 'user' ? '#fff' : '#222',
                    fontSize: 13, lineHeight: 1.55,
                    border: m.role === 'assistant' ? '1px solid rgba(0,0,0,0.07)' : 'none',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    {m.text}
                  </div>
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 3, textAlign: m.role === 'user' ? 'right' : 'left', paddingInline: 4 }}>
                    {m.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )
            })}

            {cargando && (
              <div style={{ alignSelf: 'flex-start', animation: 'botFadeUp .2s ease' }}>
                <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: colorAcento, opacity: 0.7, animation: `botTyping 1.2s ${d}s infinite`, display: 'inline-block' }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', background: '#fff', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe tu mensaje…"
              disabled={cargando}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, outline: 'none', background: cargando ? '#f5f5f5' : '#fff', color: '#222', fontFamily: 'Inter, sans-serif' }}
            />
            <button onClick={enviar} disabled={cargando || !input.trim()} style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: !input.trim() || cargando ? '#e5e7eb' : colorAcento, border: 'none', cursor: !input.trim() || cargando ? 'default' : 'pointer', color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}>
              ➤
            </button>
          </div>

          <div style={{ textAlign: 'center', padding: '6px 0 10px', fontSize: 10, color: '#bbb', background: '#fff' }}>
            Impulsado por <strong style={{ color: colorAcento }}>Ventas10x IA</strong>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button onClick={() => setAbierto(o => !o)} style={{ width: 56, height: 56, borderRadius: '50%', background: colorAcento, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, transition: 'transform .2s', position: 'relative' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {abierto ? '✕' : '💬'}
        {notifBurbuja && !abierto && (
          <span style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', animation: 'botPulse 2s infinite' }}>1</span>
        )}
      </button>

      <style>{`
        @keyframes botSlideUp { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes botFadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes botTyping { 0%,60%,100% { transform:translateY(0); opacity:.4; } 30% { transform:translateY(-4px); opacity:1; } }
        @keyframes botPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.2); } }
      `}</style>
    </div>
  )
}
