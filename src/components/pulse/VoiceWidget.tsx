'use client'
// Ruta destino: src/components/pulse/VoiceWidget.tsx
// Widget de voz bidireccional con ElevenLabs Conversational AI

import { useState, useEffect, useRef, useCallback } from 'react'

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

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const volTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Cola de chunks MP3 para reproducción secuencial
  const audioQueueRef = useRef<Uint8Array[]>([])
  const isPlayingRef = useRef(false)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)

  useEffect(() => { return () => { desconectar() } }, [])

  const desconectar = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (volTimerRef.current) clearInterval(volTimerRef.current)
    if (workletRef.current) workletRef.current.disconnect()
    if (analyserRef.current) analyserRef.current.disconnect()
    if (sourceRef.current) { try { sourceRef.current.stop() } catch {} }
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (wsRef.current) { try { wsRef.current.close() } catch {} }
    if (audioCtxRef.current) { try { audioCtxRef.current.close() } catch {} }
    wsRef.current = null
    streamRef.current = null
    audioCtxRef.current = null
    audioQueueRef.current = []
    isPlayingRef.current = false
    setEstado('idle')
    setDuracion(0)
    setVolumen(0)
    setTranscript('')
    setRespuesta('')
  }, [])

  // Reproducir MP3 usando un elemento Audio (más compatible)
  async function reproducirChunk(base64: string) {
    if (!base64) return
    try {
      const audioEl = new Audio('data:audio/mpeg;base64,' + base64)
      audioEl.play().catch(e => console.error('[voice] play error:', e))
    } catch (e) {
      console.error('[voice] error reproduciendo chunk:', e)
    }
  }

  async function iniciarLlamada() {
    try {
      setEstado('conectando')
      setTranscript('')
      setRespuesta('')

      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
      if (!agentId) throw new Error('NEXT_PUBLIC_ELEVENLABS_AGENT_ID no configurado')

      const wsUrl = 'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=' + agentId
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = async () => {
        console.log('[voice] WebSocket conectado')

        // Enviar variables dinámicas
        ws.send(JSON.stringify({
          type: 'conversation_initiation_client_data',
          dynamic_variables: {
            nombre_asesor: nombreAsesor,
            modelo_interes: '',
          },
        }))

        // Iniciar captura de micrófono
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
          })
          streamRef.current = stream
          setEstado('activo')

          // Timer duración
          timerRef.current = setInterval(() => setDuracion(d => d + 1), 1000)

          // AudioContext para captura
          const ctx = new AudioContext({ sampleRate: 16000 })
          audioCtxRef.current = ctx
          const source = ctx.createMediaStreamSource(stream)

          // Analyser para volumen visual
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 256
          analyserRef.current = analyser
          source.connect(analyser)

          // Timer volumen
          volTimerRef.current = setInterval(() => {
            const data = new Uint8Array(analyser.frequencyBinCount)
            analyser.getByteFrequencyData(data)
            const avg = data.reduce((a, b) => a + b, 0) / data.length
            setVolumen(avg / 128)
          }, 100)

          // ScriptProcessor para enviar PCM al WebSocket
          const processor = ctx.createScriptProcessor(4096, 1, 1)
          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return
            const input = e.inputBuffer.getChannelData(0)
            const pcm = new Int16Array(input.length)
            for (let i = 0; i < input.length; i++) {
              pcm[i] = Math.max(-32768, Math.min(32767, input[i] * 32768))
            }
            const bytes = new Uint8Array(pcm.buffer)
            let binary = ''
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
            ws.send(JSON.stringify({ user_audio_chunk: btoa(binary) }))
          }
          analyser.connect(processor)
          processor.connect(ctx.destination)

        } catch (micErr) {
          console.error('[voice] error micrófono:', micErr)
          setEstado('error')
          setTimeout(() => setEstado('idle'), 3000)
        }
      }

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data)
          console.log('[voice] msg type:', msg.type)

          if (msg.type === 'audio') {
            const b64 = msg.audio_event?.audio_base_64 || msg.audio || ''
            if (b64) await reproducirChunk(b64)
          }

          if (msg.type === 'user_transcript') {
            setTranscript(msg.user_transcription_event?.user_transcript || '')
          }

          if (msg.type === 'agent_response') {
            setRespuesta(msg.agent_response_event?.agent_response || '')
          }

          if (msg.type === 'interruption') {
            // El usuario interrumpió — limpiar cola de audio
            audioQueueRef.current = []
          }

        } catch (e) {
          console.error('[voice] error procesando mensaje:', e)
        }
      }

      ws.onerror = (e) => {
        console.error('[voice] WebSocket error:', e)
        setEstado('error')
        setTimeout(() => setEstado('idle'), 3000)
      }

      ws.onclose = (e) => {
        console.log('[voice] WebSocket cerrado:', e.code, e.reason)
        desconectar()
      }

    } catch (e: any) {
      console.error('[voice] error iniciando llamada:', e)
      setEstado('error')
      setTimeout(() => setEstado('idle'), 3000)
    }
  }

  function formatTiempo(seg: number) {
    const m = Math.floor(seg / 60).toString().padStart(2, '0')
    const s = (seg % 60).toString().padStart(2, '0')
    return m + ':' + s
  }

  const escala = 1 + volumen * 0.3

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 border border-white/10 w-full max-w-sm mx-auto">
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          {estado === 'idle' && 'Agente de voz KIA'}
          {estado === 'conectando' && 'Conectando...'}
          {estado === 'activo' && 'En llamada · ' + formatTiempo(duracion)}
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
          transform: estado === 'activo' ? 'scale(' + escala + ')' : 'scale(1)',
          transition: 'transform 0.1s ease',
          background: estado === 'activo'
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, ' + colorPrimario + ', #10b981)',
        }}
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed relative"
      >
        {estado === 'activo' && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} />
        )}
        {estado === 'conectando' ? (
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : estado === 'activo' ? (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
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
        <p className="text-xs text-red-400 text-center">
          No se pudo conectar. Verifica tu micrófono e intenta de nuevo.
        </p>
      )}

      <p className="text-xs text-slate-600 text-center">
        {estado === 'idle' ? 'Toca el botón y habla directamente' : 'Toca para colgar'}
      </p>
    </div>
  )
}
