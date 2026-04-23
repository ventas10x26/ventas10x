'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface Mensaje {
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

interface ChatBotWidgetProps {
  slug: string                    // slug del asesor
  nombreAsesor?: string           // para personalizar el header
  colorAcento?: string            // color de marca del asesor
  industria?: string              // para el avatar/icono
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID()
  const key = 'v10x_bot_session'
  let id = sessionStorage.getItem(key)
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(key, id) }
  return id
}

const INDUSTRIA_AVATAR: Record<string, string> = {
  automotriz:   '🚘',
  inmobiliaria: '🏠',
  retail:       '🛍️',
  manufactura:  '🏭',
  seguros:      '🛡️',
  tecnologia:   '💻',
  default:      '🤖',
}

// ─── Componente ──────────────────────────────────────────────────────────────
export default function ChatBotWidget({
  slug,
  nombreAsesor = 'Asistente',
  colorAcento = '#FF6B2B',
  industria = 'default',
}: ChatBotWidgetProps) {
  const [abierto, setAbierto]             = useState(false)
  const [mensajes, setMensajes]           = useState<Mensaje[]>([])
  const [input, setInput]                 = useState('')
  const [cargando, setCargando]           = useState(false)
  const [convId, setConvId]               = useState<string | undefined>()
  const [leadCreado, setLeadCreado]       = useState(false)
  const [notifBurbuja, setNotifBurbuja]   = useState(true)
  const chatRef   = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const sessionId = useRef(getOrCreateSessionId())

  // Saludo automático al abrir por primera vez
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

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensajes, cargando])

  const enviar = useCallback(async () => {
    const texto = input.trim()
    if (!texto || cargando) return

    // Mostrar mensaje del usuario inmediatamente
    setMensajes(prev => [...prev, { role: 'user', text: texto, timestamp: new Date() }])
    setInput('')
    setCargando(true)

    try {
      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          session_id:      sessionId.current,
          message:         texto,
          conversacion_id: convId,
        }),
      })

      const data = await res.json()

      if (data.conversacion_id) setConvId(data.conversacion_id)
      if (data.lead_creado)     setLeadCreado(true)

      setMensajes(prev => [...prev, {
        role: 'assistant',
        text: data.reply ?? 'Ocurrió un error. Por favor intenta de nuevo.',
        timestamp: new Date(),
      }])
    } catch {
      setMensajes(prev => [...prev, {
        role: 'assistant',
        text: 'Ups, tuve un problema de conexión. ¿Puedes intentarlo de nuevo?',
        timestamp: new Date(),
      }])
    } finally {
      setCargando(false)
    }
  }, [input, cargando, slug, convId])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  const avatar = INDUSTRIA_AVATAR[industria.toLowerCase()] ?? INDUSTRIA_AVATAR.default

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, fontFamily: 'Inter, sans-serif' }}>

      {/* ── Ventana del chat ─── */}
      {abierto && (
        <div style={{
          position: 'absolute', bottom: 72, right: 0,
          width: 360, maxHeight: 560,
          background: '#fff', borderRadius: 20,
          boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'botSlideUp .25s ease',
        }}>

          {/* Header */}
          <div style={{
            background: colorAcento,
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>
              {avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {nombreAsesor}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                En línea · responde al instante
              </div>
            </div>
            <button onClick={() => setAbierto(false)} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, cursor: 'pointer', color: '#fff',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>

          {/* Mensajes */}
          <div ref={chatRef} style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: 10,
            background: '#f8f8f6', minHeight: 0,
          }}>
            {mensajes.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                animation: 'botFadeUp .2s ease',
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? colorAcento : '#ffffff',
                  color:      m.role === 'user' ? '#fff' : '#222',
                  fontSize: 13, lineHeight: 1.55,
                  border: m.role === 'assistant' ? '1px solid rgba(0,0,0,0.07)' : 'none',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {m.text}
                </div>
                <div style={{
                  fontSize: 10, color: '#aaa', marginTop: 3,
                  textAlign: m.role === 'user' ? 'right' : 'left',
                  paddingInline: 4,
                }}>
                  {m.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {/* Indicador "escribiendo…" */}
            {cargando && (
              <div style={{ alignSelf: 'flex-start', animation: 'botFadeUp .2s ease' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                  background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span key={i} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: colorAcento, opacity: 0.7,
                      animation: `botTyping 1.2s ${d}s infinite`,
                      display: 'inline-block',
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Confirmación de lead */}
            {leadCreado && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 12, color: '#166534', textAlign: 'center',
              }}>
                ✅ Tus datos fueron enviados. {nombreAsesor} te contactará pronto.
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 14px',
            background: '#fff',
            borderTop: '1px solid rgba(0,0,0,0.07)',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe tu mensaje…"
              disabled={cargando}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 100,
                border: '1px solid rgba(0,0,0,0.12)',
                fontSize: 13, outline: 'none',
                background: cargando ? '#f5f5f5' : '#fff',
                color: '#222', fontFamily: 'Inter, sans-serif',
              }}
            />
            <button onClick={enviar} disabled={cargando || !input.trim()} style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: !input.trim() || cargando ? '#e5e7eb' : colorAcento,
              border: 'none', cursor: !input.trim() || cargando ? 'default' : 'pointer',
              color: '#fff', fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .2s',
            }}>
              ➤
            </button>
          </div>

          {/* Powered by */}
          <div style={{
            textAlign: 'center', padding: '6px 0 10px',
            fontSize: 10, color: '#bbb', background: '#fff',
          }}>
            Impulsado por <strong style={{ color: colorAcento }}>Ventas10x IA</strong>
          </div>
        </div>
      )}

      {/* ── Botón flotante ─── */}
      <button onClick={() => setAbierto(o => !o)} style={{
        width: 56, height: 56, borderRadius: '50%',
        background: colorAcento,
        border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, transition: 'transform .2s',
        position: 'relative',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        {abierto ? '✕' : '💬'}

        {/* Notificación burbuja */}
        {notifBurbuja && !abierto && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 18, height: 18, borderRadius: '50%',
            background: '#ef4444', color: '#fff',
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
            animation: 'botPulse 2s infinite',
          }}>1</span>
        )}
      </button>

      {/* ── Animaciones ─── */}
      <style>{`
        @keyframes botSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes botFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes botTyping {
          0%, 60%, 100% { transform: translateY(0); opacity: .4; }
          30%           { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes botPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
