'use client'
// Ruta destino: src/components/pulse/VoiceWidget.tsx
// Widget de voz bidireccional con ElevenLabs Conversational AI
// Conexión directa (agente público) — sin token firmado

import { useState, useEffect, useRef, useCallback } from 'react'

type EstadoConexion = 'idle' | 'conectando' | 'activo' | 'error'

interface Props {
  slug: string
  nombreAsesor?: string
  colorPrimario?: string
}

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || ''

export default function VoiceWidget({ slug, nombreAsesor = 'tu asesor KIA', colorPrimario = '#0ea5e9' }: Props) {
  const [estado, setEstado] = useState<EstadoConexion>('idle')
  const [transcript, setTranscript] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [volumen, setVolumen] = useState(0)
  const [duracion, setDuracion] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioQueueRef = useRef<AudioBuffer[]>([])
  const isPlayingRef = useRef(false)

  useEffect(() => {
    return () => { desconectar() }
  }, [])

  const desconectar = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (processorRef.current) processorRef.current.disconnect()
    if (analyserRef.current) analyserRef.current.disconnect()
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (wsRef.current) wsRef.current.close()
    if (audioCtxRef.current) audioCtxRef.current.close()
    wsRef.current = null
    streamRef.current = null
    audioCtxRef.current = null
    setEstado('idle')
    setDuracion(0)
    setVolumen(0)
    setTranscript('')
    setRespuesta('')
  }, [])

  async function reproducirAudio(base64: string) {
    if (!audioCtxRef.current || !base64) return
    try {
      const bytes = atob(base64)
      const buffer = new Uint8Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i)
      const audioBuffer = await audioCtxRef.current.decodeAudioData(buffer.buffer)
      audioQueueRef.current.push(audioBuffer)
      if (!isPlayingRef.current) reproducirCola()
    } catch (e) {
      console.error('[voice] error reproduciendo audio:', e)
    }
  }

  function reproducirCola() {
    if (!audioCtxRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      return
    }
    isPlayingRef.current = true
    const buffer = audioQueueRef.current.shift()!
    const source = audioCtxRef.current.createBufferSource()
    source.buffer = buffer
    source.connect(audioCtxRef.current.destination)
    source.onended = reproducirCola
    source.start()
  }

  async function iniciarLlamada() {
    try {
      setEstado('conectando')
      setTranscript('')
      setRespuesta('')

      const agentId = AGENT_ID
      if (!agentId) throw new Error('Agent ID no configurado')

      // Conexión directa a ElevenLabs (agente público)
      const wsUrl = 'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=' + agentId
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      audioCtxRef.current = new AudioContext({ sampleRate: 16000 })

      ws.onopen = async () => {
        // Enviar variables dinámicas del asesor
        ws.send(JSON.stringify({
          type: 'conversation_initiation_client_data',
          dynamic_variables: {
            nombre_asesor: nombreAsesor,
            modelo_interes: '',
          },
        }))

        // Capturar micrófono
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
          })
          streamRef.current = stream

          setEstado('activo')

          timerRef.current = setInterval(() => setDuracion(d => d + 1), 1000)

          const source = audioCtxRef.current!.createMediaStreamSource(stream)
          const analyser = audioCtxRef.current!.createAnalyser()
          analyser.fftSize = 256
          analyserRef.current = analyser
          source.connect(analyser)

          const processor = audioCtxRef.current!.createScriptProcessor(4096, 1, 1)
          processorRef.current = processor
          analyser.connect(processor)
          processor.connect(audioCtxRef.current!.destination)

          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return

            const data = new Uint8Array(analyser.frequencyBinCount)
            analyser.getByteFrequencyData(data)
            const avg = data.reduce((a, b) => a + b, 0) / data.length
            setVolumen(avg / 128)

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
        } catch (micError) {
          console.error('[voice] error micrófono:', micError)
          setEstado('error')
          setTimeout(() => setEstado('idle'), 3000)
        }
      }

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'audio') {
            await reproducirAudio(msg.audio_event?.audio_base_64 || '')
          }
          if (msg.type === 'transcript' || msg.type === 'user_transcript') {
            setTranscript(msg.transcript?.text || msg.user_transcription_event?.user_transcript || '')
          }
          if (msg.type === 'agent_response') {
            setRespuesta(msg.agent_response_event?.agent_response || '')
          }
        } catch (e) {
          console.error('[voice] error mensaje:', e)
        }
      }

      ws.onerror = (e) => {
        console.error('[voice] WebSocket error:', e)
        setEstado('error')
        setTimeout(() => setEstado('idle'), 3000)
      }

      ws.onclose = () => {
        if (estado === 'activo') desconectar()
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
          {estado === 'idle' && 'Habla con ' + nombreAsesor}
          {estado === 'activo' && 'Escuchando...'}
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
