'use client'

import { useState, useEffect, useRef } from 'react'

interface Bot {
  id: string
  nombre: string
  empresa: string
  industria: string
  tono: string
  bienvenida: string
  productos: string
  faqs: string
  whatsapp: string
}

interface Props {
  bot: Bot
}

const INDUSTRIA_ICONS: Record<string, string> = {
  Automotriz: '🚗', Inmobiliaria: '🏠', Retail: '👗', Alimentos: '🍔',
  Salud: '💊', Servicios: '🛠️', Tecnología: '💻', Educación: '🎓',
  Fitness: '🏋️', Turismo: '✈️',
}

export function BotChat({ bot }: Props) {
  const [messages, setMessages] = useState<{ who: 'user' | 'bot'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Mostrar mensaje de bienvenida al cargar
    setTimeout(() => {
      setStarted(true)
    }, 600)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, started])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { who: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/bot-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: bot, message: userMsg, history: messages }),
      })
      const data = await res.json()
      setMessages(m => [...m, { who: 'bot', text: data.reply }])
    } catch {
      setMessages(m => [...m, { who: 'bot', text: 'Hubo un error. Por favor intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  const openWhatsApp = () => {
    if (bot.whatsapp) {
      const num = bot.whatsapp.replace(/\D/g, '')
      window.open(`https://wa.me/${num}`, '_blank')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1c2e',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: "var(--font-jakarta,'Plus Jakarta Sans',system-ui,sans-serif)",
    }}>

      {/* Card del chat */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#fff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,.4)',
        display: 'flex',
        flexDirection: 'column',
        height: 'min(680px, 90vh)',
      }}>

        {/* Header */}
        <div style={{ background: '#0f1c2e', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF6B2B,#ff9a5c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
              {INDUSTRIA_ICONS[bot.industria] || '🤖'}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>{bot.nombre}</div>
              <div style={{ fontSize: '12px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                {bot.empresa}
              </div>
            </div>
          </div>
          {bot.whatsapp && (
            <button onClick={openWhatsApp} style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Asesor
            </button>
          )}
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f9fafb' }}>

          {/* Bienvenida animada */}
          {started && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'fadeIn .4s ease' }}>
              <div style={{ maxWidth: '82%', background: '#FF6B2B', borderRadius: '4px 18px 18px 18px', padding: '12px 16px', boxShadow: '0 2px 8px rgba(255,107,43,.25)' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.7)', marginBottom: '4px', letterSpacing: '.07em', textTransform: 'uppercase' }}>{bot.nombre}</div>
                <div style={{ fontSize: '14px', color: '#fff', lineHeight: 1.6 }}>
                  {bot.bienvenida || `¡Hola! Soy ${bot.nombre} de ${bot.empresa}. ¿En qué puedo ayudarte hoy?`}
                </div>
              </div>
            </div>
          )}

          {/* Mensajes del chat */}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.who === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeIn .3s ease' }}>
              <div style={{
                maxWidth: '82%',
                background: m.who === 'bot' ? '#FF6B2B' : '#fff',
                borderRadius: m.who === 'bot' ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                padding: '12px 16px',
                boxShadow: m.who === 'bot' ? '0 2px 8px rgba(255,107,43,.2)' : '0 1px 4px rgba(0,0,0,.08)',
                border: m.who === 'user' ? '0.5px solid #e5e7eb' : 'none',
              }}>
                {m.who === 'bot' && (
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.7)', marginBottom: '4px', letterSpacing: '.07em', textTransform: 'uppercase' }}>{bot.nombre}</div>
                )}
                <div style={{ fontSize: '14px', color: m.who === 'bot' ? '#fff' : '#1f2937', lineHeight: 1.6 }}>{m.text}</div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: '#FF6B2B', borderRadius: '4px 18px 18px 18px', padding: '14px 18px', display: 'flex', gap: '5px', alignItems: 'center', boxShadow: '0 2px 8px rgba(255,107,43,.2)' }}>
                {[0, 1, 2].map(d => (
                  <span key={d} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'rgba(255,255,255,.8)', display: 'inline-block', animation: `bounce 1.2s ease ${d * 0.25}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '1rem', background: '#fff', borderTop: '0.5px solid #f3f4f6', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Escribe tu mensaje..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: '#f9fafb', color: '#111827' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ width: '44px', height: '44px', borderRadius: '12px', background: input.trim() ? '#FF6B2B' : '#e5e7eb', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={input.trim() ? '#fff' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Powered by */}
      <div style={{ marginTop: '1rem', fontSize: '12px', color: 'rgba(255,255,255,.3)', fontWeight: 500 }}>
        Powered by <span style={{ color: '#FF6B2B', fontWeight: 700 }}>Ventas10x</span>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
      `}</style>
    </div>
  )
}
