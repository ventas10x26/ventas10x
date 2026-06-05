'use client'
// Ruta destino: src/components/pulse/VoiceWidget.tsx
// Audio sin gaps usando AudioContext scheduling

import { useState, useEffect, useRef, useCallback } from 'react'

type EstadoConexion = 'idle' | 'conectando' | 'activo' | 'error'

interface Props {
  slug: string
  nombreAsesor?: string
  colorPrimario?: string
}

function pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const pcm = new Int16Array(bytes.buffer)
  const float = new Float32Array(pcm.length)
  for (let i = 0; i < pcm.length; i++) float[i] = pcm[i] / 32768.0
  return float
}

export default function VoiceWidget({ slug, nombreAsesor = 'tu asesor KIA', colorPrimario = '#0ea5e9' }: Props) {
  const [estado, setEstado] = useState<EstadoConexion>('idle')
  const [transcript, setTranscript] = useState('')
  const [respuesta, setRespuesta] = useState('')
  const [volumen, setVolumen] = useState(0)
  const [duracion, setDuracion] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureCtxRef = useRef<AudioContext | null>(null)  // para micrófono
  const playCtxRef = useRef<AudioContext | null>(null)     // para reproducción
  const analyserRef = useRef<AnalyserNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const volTimerRef = useRef<NodeJS.Timeout | null>(null)
  const nextPlayTimeRef = useRef(0) // tiempo de scheduling para próximo chunk
  const sampleRate = 16000

  useEffect(() => { return () => { desconectar() } }, [])

  const desconectar = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (volTimerRef.current) clearInterval(volTimerRef.current)
    if (processorRef.current) { try { processorRef.current.disconnect() } catch {} }
    if (analyserRef.current) { try { analyserRef.current.disconnect() } catch {} }
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (wsRef.current) { try { wsRef.current.close() } catch {} }
    if (captureCtxRef.current) { try { captureCtxRef.current.close() } catch {} }
    if (playCtxRef.current) { try { playCtxRef.current.close() } catch {} }
    wsRef.current = null; streamRef.current = null
    captureCtxRef.current = null; playCtxRef.current = null
    nextPlayTimeRef.current = 0
    setEstado('idle'); setDuracion(0); setVolumen(0); setTranscript(''); setRespuesta('')
  }, [])

  function encolarAudio(base64: string) {
    if (!playCtxRef.current || !base64) return
    try {
      const ctx = playCtxRef.current
      const samples = pcm16ToFloat32(base64)
      const audioBuffer = ctx.createBuffer(1, samples.length, sampleRate)
      audioBuffer.copyToChannel(samples, 0)

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)

      // Scheduling sin gaps: encolar justo donde termina el anterior
      const now = ctx.currentTime
      const startTime = Math.max(now, nextPlayTimeRef.current)
      source.start(startTime)
      nextPlayTimeRef.current = startTime + audioBuffer.duration
    } catch (e) {
      console.error('[voice] encolarAudio error:', e)
    }
  }

  function limpiarCola() {
    // Detener reproducción actual reiniciando el contexto de play
    if (playCtxRef.current) {
      try { playCtxRef.current.close() } catch {}
    }
    playCtxRef.current = new AudioContext({ sampleRate })
    nextPlayTimeRef.current = 0
  }

  async function iniciarLlamada() {
    try {
      setEstado('conectando')
      setTranscript(''); setRespuesta('')

      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
      if (!agentId) throw new Error('Agent ID no configurado')

      // Contexto de reproducción
      playCtxRef.current = new AudioContext({ sampleRate })
      nextPlayTimeRef.current = 0

      const ws = new WebSocket('wss://api.elevenlabs.io/v1/convai/conversation?agent_id=' + agentId)
      wsRef.current = ws

      ws.onopen = async () => {
        console.log('[voice] conectado')
        ws.send(JSON.stringify({
          type: 'conversation_initiation_client_data',
          dynamic_variables: { nombre_asesor: nombreAsesor, modelo_interes: '' },
        }))

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { sampleRate, channelCount: 1, echoCancellation: true, noiseSuppression: true }
          })
          streamRef.current = stream
          setEstado('activo')
          timerRef.current = setInterval(() => setDuracion(d => d + 1), 1000)

          // Contexto de captura separado
          const ctx = new AudioContext({ sampleRate })
          captureCtxRef.current = ctx
          const source = ctx.createMediaStreamSource(stream)

          const analyser = ctx.createAnalyser()
          analyser.fftSize = 256
          analyserRef.current = analyser
          source.connect(analyser)

          volTimerRef.current = setInterval(() => {
            const d = new Uint8Array(analyser.frequencyBinCount)
            analyser.getByteFrequencyData(d)
            setVolumen(d.reduce((a, b) => a + b, 0) / d.length / 128)
          }, 100)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const proc = (ctx as any).createScriptProcessor(4096, 1, 1)
          processorRef.current = proc
          analyser.connect(proc)
          proc.connect(ctx.destination)

          proc.onaudioprocess = (e: AudioProcessingEvent) => {
            if (ws.readyState !== WebSocket.OPEN) return
            const inp = e.inputBuffer.getChannelData(0)
            const pcm = new Int16Array(inp.length)
            for (let i = 0; i < inp.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, inp[i] * 32768))
            const bytes = new Uint8Array(pcm.buffer)
            let bin = ''
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
            ws.send(JSON.stringify({ user_audio_chunk: btoa(bin) }))
          }

        } catch (e) {
          console.error('[voice] mic error:', e)
          setEstado('error'); setTimeout(() => setEstado('idle'), 3000)
        }
      }

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data)
          if (msg.type === 'audio') {
            encolarAudio(msg.audio_event?.audio_base_64 || '')
          }
          if (msg.type === 'interruption') {
            limpiarCola()
          }
          if (msg.type === 'user_transcript') setTranscript(msg.user_transcription_event?.user_transcript || '')
          if (msg.type === 'agent_response') setRespuesta(msg.agent_response_event?.agent_response || '')
        } catch (e) { console.error('[voice] msg error:', e) }
      }

      ws.onerror = () => { setEstado('error'); setTimeout(() => setEstado('idle'), 3000) }
      ws.onclose = () => { desconectar() }

    } catch (e: any) {
      console.error('[voice] error:', e)
      setEstado('error'); setTimeout(() => setEstado('idle'), 3000)
    }
  }

  const fmt = (s: number) => Math.floor(s / 60).toString().padStart(2, '0') + ':' + (s % 60).toString().padStart(2, '0')
  const escala = 1 + volumen * 0.3

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
