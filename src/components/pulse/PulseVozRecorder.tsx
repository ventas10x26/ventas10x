// src/components/pulse/PulseVozRecorder.tsx
// v3 — diagnóstico integrado + fallback completo sin SpeechRecognition
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

const VOZ_MIN_SEGUNDOS = 8

function limpiarTranscripcion(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim().replace(/\b(\w+)(\s+\1\b)+/gi, '$1')
}

type Props = {
  value: string
  onChange: (texto: string, duracionSeg: number) => void
  onRecordingComplete?: (blob: Blob, texto: string, duracionSeg: number) => void
  guion?: string
  subiendo?: boolean
}

type Estado = 'idle' | 'grabando' | 'listo' | 'error'
type DiagError = 'permiso_denegado' | 'no_microfono' | 'no_https' | 'otro' | null

export function PulseVozRecorder({ value, onChange, onRecordingComplete, guion, subiendo }: Props) {
  const [estado, setEstado] = useState<Estado>('idle')
  const [diagError, setDiagError] = useState<DiagError>(null)
  const [duracion, setDuracion] = useState(0)
  const [vozTranscrita, setVozTranscrita] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [sinSpeech, setSinSpeech] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const grabandoRef = useRef(false)
  const finalRef = useRef('')
  const interimRef = useRef('')
  const duracionRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingBlobRef = useRef<Blob | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    // Detectar soporte de SpeechRecognition al montar
    if (typeof window !== 'undefined') {
      const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!Ctor) setSinSpeech(true)
    }
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const finalizarGrabacion = useCallback((blob: Blob) => {
    const textoFinal = limpiarTranscripcion(
      `${finalRef.current} ${interimRef.current}`.trim()
    ) || value || '[grabación de voz]'

    if (onRecordingComplete) {
      onRecordingComplete(blob, textoFinal, duracionRef.current)
    }
    onChange(textoFinal, duracionRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setVozTranscrita('')
    setEstado('listo')
  }, [onRecordingComplete, onChange, value])

  const detener = useCallback(() => {
    if (!grabandoRef.current) return
    grabandoRef.current = false
    setEstado('listo')
    if (timerRef.current) clearInterval(timerRef.current)
    try { recognitionRef.current?.stop() } catch { /* noop */ }

    const rec = mediaRecorderRef.current
    if (rec && rec.state === 'recording') {
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        pendingBlobRef.current = blob
        setAudioUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob) })
        setTimeout(() => finalizarGrabacion(blob), 400)
      }
      rec.stop()
    }
  }, [finalizarGrabacion])

  const iniciar = useCallback(async () => {
    try {
      setDiagError(null)
      setEstado('grabando')
      finalRef.current = ''
      interimRef.current = ''
      chunksRef.current = []
      duracionRef.current = 0
      setDuracion(0)
      setVozTranscrita('')

      // Solicitar micrófono con constraints de calidad
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          },
        })
      } catch (err: unknown) {
        const e = err as DOMException
        setEstado('error')
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setDiagError('permiso_denegado')
        } else if (e.name === 'NotFoundError') {
          setDiagError('no_microfono')
        } else if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          setDiagError('no_https')
        } else {
          setDiagError('otro')
          console.error('[PulseVozRecorder] getUserMedia error:', e.name, e.message)
        }
        return
      }

      streamRef.current = stream

      // MediaRecorder
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorderRef.current = rec
      rec.start(250) // chunks cada 250ms para no perder datos

      // Timer
      timerRef.current = setInterval(() => {
        duracionRef.current += 1
        setDuracion(d => d + 1)
      }, 1000)

      grabandoRef.current = true

      // SpeechRecognition — opcional, no bloquea si falla
      const Ctor = typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : null

      if (Ctor) {
        try {
          const recognition = new Ctor()
          recognition.lang = 'es-CO'
          recognition.continuous = true
          recognition.interimResults = true
          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let f = '', i = ''
            for (let j = 0; j < event.results.length; j++) {
              const t = event.results[j][0].transcript
              event.results[j].isFinal ? (f += t + ' ') : (i += t)
            }
            finalRef.current = limpiarTranscripcion(f)
            interimRef.current = i
            const combinado = limpiarTranscripcion(`${f}${i}`.trim())
            if (combinado) {
              onChange(combinado, duracionRef.current)
              setVozTranscrita(i)
            }
          }
          recognition.onerror = () => { /* silencioso */ }
          recognition.onend = () => {
            if (grabandoRef.current) {
              try { recognition.start() } catch { /* noop */ }
            }
          }
          recognitionRef.current = recognition
          recognition.start()
          setSinSpeech(false)
        } catch {
          setSinSpeech(true)
        }
      } else {
        setSinSpeech(true)
      }

    } catch (err) {
      console.error('[PulseVozRecorder] error inesperado:', err)
      setEstado('error')
      setDiagError('otro')
    }
  }, [onChange])

  const reiniciar = useCallback(() => {
    setEstado('idle')
    setDiagError(null)
    setDuracion(0)
    setVozTranscrita('')
    finalRef.current = ''
    interimRef.current = ''
    chunksRef.current = []
    pendingBlobRef.current = null
  }, [])

  const grabando = estado === 'grabando'
  const listo = estado === 'listo' || value.trim().length >= 40 || duracion >= VOZ_MIN_SEGUNDOS
  const borderColor = grabando ? '#ef4444' : listo ? '#22c55e' : 'rgba(239,68,68,0.35)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {guion && (
        <div style={{ background: 'rgba(3,7,18,0.7)', border: '1px solid #1e293b', borderRadius: 12, padding: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#f97316', letterSpacing: 1 }}>GUION SUGERIDO</span>
          <p style={{ fontSize: 13, color: '#cbd5e1', margin: '8px 0 0', lineHeight: 1.55 }}>{guion}</p>
        </div>
      )}

      {/* Aviso sin SpeechRecognition */}
      {sinSpeech && estado === 'idle' && (
        <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fbbf24', lineHeight: 1.5 }}>
          ⚠️ Tu navegador no transcribe automáticamente. Podés grabar igual y escribir el texto abajo.
          Mejor soporte en <strong>Chrome o Edge</strong> en escritorio.
        </div>
      )}

      {/* Error de micrófono */}
      {estado === 'error' && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#fca5a5', lineHeight: 1.6 }}>
          {diagError === 'permiso_denegado' && (
            <>
              <strong>🚫 Permiso de micrófono denegado.</strong><br />
              Hacé click en el 🔒 candado de la barra de URL → <strong>Permisos del sitio</strong> → <strong>Micrófono</strong> → <strong>Permitir</strong>. Luego recargá la página.
            </>
          )}
          {diagError === 'no_microfono' && (
            <>
              <strong>🎤 No se encontró micrófono.</strong><br />
              Verificá que tu dispositivo tenga micrófono conectado y funcionando.
            </>
          )}
          {diagError === 'no_https' && (
            <>
              <strong>🔒 Requiere HTTPS.</strong><br />
              La grabación de audio solo funciona en sitios seguros (https://).
            </>
          )}
          {diagError === 'otro' && (
            <>
              <strong>❌ Error al acceder al micrófono.</strong><br />
              Intentá recargar la página o usar Chrome/Edge.
            </>
          )}
          <br />
          <button type="button" onClick={reiniciar} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.12)', color: '#fca5a5', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* Grabador */}
      {estado !== 'error' && (
        <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: 16, padding: 18, background: 'linear-gradient(145deg, rgba(220,38,38,0.06), rgba(15,5,5,0.85))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              onClick={() => grabando ? detener() : iniciar()}
              style={{ width: 52, height: 52, borderRadius: '50%', border: `2px solid ${borderColor}`, background: grabando ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.15)', fontSize: 22, cursor: 'pointer', flexShrink: 0, transition: 'all .2s' }}
            >
              {grabando ? '⏹' : listo ? '✓' : '🎙️'}
            </button>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: grabando ? '#ef4444' : '#f87171', letterSpacing: 1.5 }}>
                {grabando ? `GRABANDO · ${duracion}s` : listo ? 'GRABACIÓN LISTA' : 'MUESTRA DE VOZ'}
              </div>
              <div style={{ fontSize: 15, color: '#fff', marginTop: 4 }}>
                {grabando ? 'Habla ahora…' : listo ? 'Audio listo ✓' : 'Grabar mi tono de venta'}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {grabando
                  ? (vozTranscrita || (sinSpeech ? 'Grabando audio…' : 'Esperando voz…'))
                  : listo ? 'Podés volver a grabar si querés mejorarla'
                  : `Mín. ${VOZ_MIN_SEGUNDOS}s o frase completa`}
              </div>
            </div>
          </div>
          {grabando && duracion >= 3 && (
            <button
              type="button"
              onClick={detener}
              style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Finalizar grabación
            </button>
          )}
        </div>
      )}

      {subiendo && (
        <div style={{ fontSize: 12, color: '#f97316', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
          Guardando audio en Supabase…
        </div>
      )}

      {audioUrl && (
        <audio controls src={audioUrl} style={{ width: '100%', borderRadius: 10 }} />
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(limpiarTranscripcion(e.target.value), duracion)}
        placeholder="Transcripción de tu voz / cómo hablas con clientes…"
        rows={4}
        style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid #1e293b', background: 'rgba(3,7,18,0.6)', color: '#fff', fontSize: 14, lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
      />
    </div>
  )
}
