'use client'
// src/app/pulse/playground/page.tsx

import { useState, useRef, useEffect } from 'react'
import { PulseAppShell } from '@/components/pulse/PulseAppShell'

type Mensaje = {
  role: 'user' | 'assistant'
  content: string
  latencia_ms?: number
  tokens?: number
}

type Meta = {
  modelo: string
  latencia_ms: number
  input_tokens: number
  output_tokens: number
}

const SYSTEM_PROMPT_DEFAULT = `Eres el asistente de ventas de Carlos Sanabria, asesor KIA. Estilo: cuando me llega alguien interesado en una Sportage, yo primero le pregunto para qué la necesita, luego le hablo de los accesorios que más le van a servir y le ofrezco simular la cuota con KIA Crédito antes de hablar de precio. Así cierro más rápido.... Obstáculo a resolver: A veces me entra un lead cotizando el nuevo KIA K3 o una Sportage y por estar en capacitaciones de marca o entregando otros carros nuevos me tardo 2 horas en contestar sobre accesorios o tasas de interés, perdiendo la venta.`

const REGLAS = `REGLAS ESTRICTAS:
- Responde en español colombiano, tono cercano y natural
- Máximo 2-3 oraciones — esto es WhatsApp
- No uses asteriscos ni markdown
- Suena como el asesor, no como un bot
- NUNCA inventes datos: ciudad, precios exactos, tasas, fechas de entrega
- Si no sabes algo con certeza, di "te confirmo ese dato" o "déjame verificar"
- Si mencionan inicial + crédito + plazo: di que vas a simular la cuota con KIA Crédito y pide confirmar el modelo exacto
- Si quieren ver el carro: ofrece enviar la foto y el enlace del concesionario`

const SUGERENCIAS = [
  'Hola, me interesa la KIA Sportage',
  'Cuánto vale la Seltos 2025?',
  'Tengo 30 millones de inicial y quiero financiar el resto, qué cuota me sale?',
  'Qué diferencia hay entre la Sportage híbrida y la normal?',
  'Tiene disponible la K3 Cross en color blanco?',
  'Cuál es la tasa de KIA Crédito actualmente?',
  'Me puede enviar la ficha técnica de la Stonic?',
  'Vivo en Cali, puedo ir a una concesionaria hoy?',
]

export default function PlaygroundPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT_DEFAULT)
  const [editandoPrompt, setEditandoPrompt] = useState(false)
  const [ultimaMeta, setUltimaMeta] = useState<Meta | null>(null)
  const [totalTokens, setTotalTokens] = useState(0)
  const [panelAbierto, setPanelAbierto] = useState(true)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensajes])

  const enviar = async (texto?: string) => {
    const msg = (texto || input).trim()
    if (!msg || enviando) return

    const nuevoMensajeUser: Mensaje = { role: 'user', content: msg }
    const historialActual = [...mensajes, nuevoMensajeUser]
    setMensajes(historialActual)
    setInput('')
    setEnviando(true)

    try {
      const res = await fetch('/api/pulse/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: msg,
          historial: mensajes.map(m => ({ role: m.role, content: m.content })),
          email: 'ricaza81@gmail.com',
          systemPromptOverride: systemPrompt,
        }),
      })

      const data = await res.json()

      if (data.ok && data.respuesta) {
        setMensajes([
          ...historialActual,
          {
            role: 'assistant',
            content: data.respuesta,
            latencia_ms: data.meta?.latencia_ms,
            tokens: data.meta?.output_tokens,
          },
        ])
        setUltimaMeta(data.meta)
        setTotalTokens(t => t + (data.meta?.input_tokens || 0) + (data.meta?.output_tokens || 0))
      } else {
        setMensajes([
          ...historialActual,
          { role: 'assistant', content: `⚠️ Error: ${data.error || 'Sin respuesta'}` },
        ])
      }
    } catch (e) {
      setMensajes([
        ...historialActual,
        { role: 'assistant', content: `⚠️ Error de red: ${String(e)}` },
      ])
    } finally {
      setEnviando(false)
      inputRef.current?.focus()
    }
  }

  const limpiar = () => {
    setMensajes([])
    setUltimaMeta(null)
    setTotalTokens(0)
    inputRef.current?.focus()
  }

  return (
    <PulseAppShell>
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* ── PANEL IZQUIERDO: System Prompt ── */}
        {panelAbierto && (
          <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(15,23,42,0.8)' }}>
            <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>⚙️ System Prompt</h2>
                <div style={{ display: 'flex', gap: 6 }}>
                  {editandoPrompt ? (
                    <button onClick={() => setEditandoPrompt(false)} style={btnSm('#22c55e')}>✓ Listo</button>
                  ) : (
                    <button onClick={() => setEditandoPrompt(true)} style={btnSm('#f97316')}>✏️ Editar</button>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0' }}>
                Mismo prompt que usa el agente de WhatsApp. Editalo y prueba en tiempo real.
              </p>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              {editandoPrompt ? (
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid #f97316', borderRadius: 8, color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace', padding: 10, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              ) : (
                <div>
                  <pre style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{systemPrompt}</pre>
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#f97316', margin: '0 0 6px', letterSpacing: 0.5 }}>REGLAS FIJAS (no editables)</p>
                    <pre style={{ fontSize: 10, color: '#64748b', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>{REGLAS}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #1e293b', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Stat label="Modelo" valor="haiku-4-5" />
              <Stat label="Tokens usados" valor={totalTokens.toLocaleString()} />
              {ultimaMeta && <Stat label="Última latencia" valor={`${ultimaMeta.latencia_ms}ms`} />}
            </div>
          </div>
        )}

        {/* ── PANEL DERECHO: Chat ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0f172a' }}>

          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setPanelAbierto(p => !p)} style={{ background: 'transparent', border: '1px solid #1e293b', borderRadius: 6, color: '#64748b', fontSize: 12, padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                {panelAbierto ? '◀ Ocultar prompt' : '▶ Ver prompt'}
              </button>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>🧪 Playground — Agente WhatsApp</span>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>Comportamiento idéntico al bot real</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {mensajes.length > 0 && (
                <span style={{ fontSize: 11, color: '#475569' }}>{mensajes.length} mensajes</span>
              )}
              <button onClick={limpiar} style={btnSm('#475569')}>🗑 Limpiar</button>
            </div>
          </div>

          {/* Mensajes */}
          <div ref={chatRef} style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mensajes.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 32, margin: '0 0 8px' }}>🤖</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>Playground del Agente KIA</p>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Escribe como si fueras un lead. El bot responde exactamente igual que en WhatsApp.</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 560 }}>
                  {SUGERENCIAS.map((s, i) => (
                    <button key={i} onClick={() => enviar(s)} style={{ padding: '8px 12px', borderRadius: 20, border: '1px solid #1e293b', background: 'rgba(255,255,255,0.03)', color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#fdba74' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#94a3b8' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensajes.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
                )}
                <div style={{ maxWidth: '72%' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: m.role === 'user' ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'rgba(255,255,255,0.07)',
                    border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    color: '#fff',
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}>
                    {m.content}
                  </div>
                  {m.role === 'assistant' && (m.latencia_ms || m.tokens) && (
                    <div style={{ fontSize: 10, color: '#334155', marginTop: 3, paddingLeft: 4 }}>
                      {m.latencia_ms && `${m.latencia_ms}ms`}
                      {m.latencia_ms && m.tokens && ' · '}
                      {m.tokens && `${m.tokens} tokens`}
                    </div>
                  )}
                </div>
                {m.role === 'user' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
                )}
              </div>
            ))}

            {enviando && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
                <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    enviar()
                  }
                }}
                placeholder="Escribe como si fueras un lead... (Enter para enviar)"
                rows={2}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid #334155', background: 'rgba(15,23,42,0.8)', color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.5 }}
              />
              <button
                onClick={() => enviar()}
                disabled={enviando || !input.trim()}
                style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: enviando || !input.trim() ? '#1e293b' : 'linear-gradient(135deg, #f97316, #ea580c)', color: enviando || !input.trim() ? '#475569' : '#fff', fontSize: 14, fontWeight: 700, cursor: enviando || !input.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                {enviando ? '...' : '↑'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#334155', margin: '6px 0 0', textAlign: 'center' }}>
              Enter para enviar · Shift+Enter para nueva línea · El bot usa el mismo modelo y reglas que WhatsApp
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </PulseAppShell>
  )
}

function Stat({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{valor}</div>
    </div>
  )
}

function btnSm(color: string): React.CSSProperties {
  return {
    padding: '4px 10px', borderRadius: 6, border: `1px solid ${color}22`,
    background: `${color}11`, color, fontSize: 11, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  }
}
