'use client'
// Ruta destino: src/components/pulse/VoiceWidget.tsx
// Usa @11labs/client SDK oficial — maneja VAD, echo y audio internamente

import { useState, useRef, useCallback, useEffect } from 'react'

type EstadoConexion = 'idle' | 'conectando' | 'activo' | 'error'

interface Props {
  slug: string
  nombreAsesor?: string
  colorPrimario?: string
}

export default function VoiceWidget({ slug, nombreAsesor = 'tu asesor KIA', colorPrimario = '#0ea5e9' }: Props) {
  const [estado, setEstado] = useState<EstadoConexion>('idle')
  const [transcript, setTranscript] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [volumen, setVolumen] = useState(0)
  const [duracion, setDuracion] = useState(0)

  const convRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { return () => { desconectar() } }, [])

  const desconectar = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (convRef.current) {
      try { await convRef.current.endSession() } catch {}
      convRef.current = null
    }
    setEstado('idle')
    setDuracion(0)
    setVolumen(0)
    setTranscript('')
    setRespuesta('')
  }, [])

  async function iniciarLlamada() {
    try {
      setEstado('conectando')
      setTranscript('')
      setRespuesta('')

      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
      if (!agentId) throw new Error('Agent ID no configurado')

      // Importar SDK dinámicamente
      const { Conversation } = await import('@elevenlabs/client')

      const conv = await Conversation.startSession({
        agentId,
        dynamicVariables: {
          nombre_asesor: nombreAsesor,
          modelo_interes: '',
        },
        onConnect: () => {
          console.log('[voice] conectado')
          setEstado('activo')
          timerRef.current = setInterval(() => setDuracion(d => d + 1), 1000)
        },
        onDisconnect: () => {
          console.log('[voice] desconectado')
          if (timerRef.current) clearInterval(timerRef.current)
          setEstado('idle')
          setDuracion(0)
          setVolumen(0)
        },
        onError: (error: any) => {
          console.error('[voice] error:', error)
          setEstado('error')
          setTimeout(() => setEstado('idle'), 3000)
        },
        onModeChange: (mode: any) => {
          console.log('[voice] modo:', mode.mode)
        },
        onMessage: (msg: any) => {
          console.log('[voice] mensaje:', msg.source, msg.message?.slice(0, 50))
          if (msg.source === 'user') setTranscript(msg.message || '')
          if (msg.source === 'ai') setRespuesta(msg.message || '')
        },
      })

      convRef.current = conv
    } catch (e: any) {
      console.error('[voice] error iniciando:', e)
      setEstado('error')
      setTimeout(() => setEstado('idle'), 3000)
    }
  }

  const fmt = (s: number) => Math.floor(s / 60).toString().padStart(2, '0') + ':' + (s % 60).toString().padStart(2, '0')

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 border border-white/10 w-full max-w-sm mx-auto">
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          {estado === 'idle' && 'Agente de voz KIA'}
          {estado === 'conectando' && 'Conectando...'}
          {estado === 'activo' && 'En llamada · ' + fmt(duracion)}
          {estado === 'error' && 'Error de conexión'}
        </p>
        <p className="text-sm text-slate-300">
          {estado === 'idle' ? 'Habla con ' + nombreAsesor : estado === 'activo' ? 'Escuchando...' : ''}
        </p>
      </div>

      <button
        onClick={estado === 'idle' ? iniciarLlamada : desconectar}
        disabled={estado === 'conectando'}
        style={{
          background: estado === 'activo'
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, ' + colorPrimario + ', #10b981)',
        }}
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed relative transition-transform"
      >
        {estado === 'activo' && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} />
        )}
        {estado === 'conectando' ? (
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : estado === 'activo' ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
          </svg>
        )}
      </button>

      {(transcript || respuesta) && (
        <div className="w-full space-y-2">
          {transcript && (
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Tú</p>
              <p className="text-sm text-slate-300">{transcript}</p>
            </div>
          )}
          {respuesta && (
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-3">
              <p className="text-xs text-sky-400 mb-1">{nombreAsesor}</p>
              <p className="text-sm text-white">{respuesta}</p>
            </div>
          )}
        </div>
      )}

      {estado === 'error' && (
        <p className="text-xs text-red-400 text-center">No se pudo conectar. Verifica tu micrófono e intenta de nuevo.</p>
      )}
      <p className="text-xs text-slate-600 text-center">
        {estado === 'idle' ? 'Toca el botón y habla directamente' : 'Toca para colgar'}
      </p>
    </div>
  )
}
