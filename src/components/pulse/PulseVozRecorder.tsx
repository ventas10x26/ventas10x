'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

const VOZ_MIN_CARACTERES = 40
const VOZ_MIN_SEGUNDOS = 8

function limpiarTranscripcion(texto: string): string {
  return texto
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b(\w+)(\s+\1\b)+/gi, '$1')
}

type Props = {
  value: string
  onChange: (texto: string, duracionSeg: number) => void
  /** Se llama al terminar la grabación con el blob listo para subir a Supabase */
  onRecordingComplete?: (blob: Blob, texto: string, duracionSeg: number) => void
  guion?: string
  subiendo?: boolean
}

export function PulseVozRecorder({ value, onChange, onRecordingComplete, guion, subiendo }: Props) {
  const [grabando, setGrabando] = useState(false)
  const [vozTranscrita, setVozTranscrita] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duracion, setDuracion] = useState(0)
  const [fallo, setFallo] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const grabandoRef = useRef(false)
  const finalRef = useRef('')
  const interimRef = useRef('')
  const duracionRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const aplicar = useCallback(() => {
    const texto = limpiarTranscripcion(`${finalRef.current} ${interimRef.current}`.trim())
    if (texto) {
      onChange(texto, duracionRef.current)
      setFallo(false)
    }
    return texto
  }, [onChange])

  const pendingBlobRef = useRef<Blob | null>(null)

  const detener = useCallback(() => {
    grabandoRef.current = false
    setGrabando(false)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      recognitionRef.current?.stop()
    } catch {
      /* noop */
    }
    window.setTimeout(() => {
      const texto = aplicar()
      if (!texto) setFallo(true)

      const finalizar = () => {
        const blob = pendingBlobRef.current
        if (blob && texto && onRecordingComplete) {
          onRecordingComplete(blob, texto, duracionRef.current)
        }
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        setVozTranscrita('')
      }

      const rec = mediaRecorderRef.current
      if (rec?.state === 'recording') {
        rec.onstop = () => finalizar()
        rec.stop()
      } else {
        finalizar()
      }
    }, 600)
  }, [aplicar, onRecordingComplete])

  const iniciar = useCallback(async () => {
    try {
      finalRef.current = ''
      interimRef.current = ''
      setFallo(false)
      setVozTranscrita('')

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const chunks: Blob[] = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        pendingBlobRef.current = blob
        setAudioUrl((p) => {
          if (p) URL.revokeObjectURL(p)
          return URL.createObjectURL(blob)
        })
      }
      mediaRecorderRef.current = rec
      rec.start()

      const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition

      if (Ctor) {
        const recognition = new Ctor()
        recognition.lang = 'es-CO'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let f = ''
          let i = ''
          for (let j = 0; j < event.results.length; j++) {
            const t = event.results[j][0].transcript
            if (event.results[j].isFinal) f += `${t} `
            else i += t
          }
          finalRef.current = limpiarTranscripcion(f)
          interimRef.current = i
          onChange(limpiarTranscripcion(`${f}${i}`.trim()), duracionRef.current)
          setVozTranscrita(i)
        }
        recognition.onend = () => {
          if (grabandoRef.current) {
            try {
              recognition.start()
            } catch {
              /* noop */
            }
          }
        }
        recognitionRef.current = recognition
        recognition.start()
      } else {
        setFallo(true)
      }

      duracionRef.current = 0
      setDuracion(0)
      timerRef.current = setInterval(() => {
        duracionRef.current += 1
        setDuracion(duracionRef.current)
      }, 1000)
      grabandoRef.current = true
      setGrabando(true)
    } catch {
      alert('Permite el acceso al micrófono en Chrome o Edge.')
    }
  }, [onChange])

  const lista = value.trim().length >= VOZ_MIN_CARACTERES || duracion >= VOZ_MIN_SEGUNDOS
  const borderColor = grabando ? '#ef4444' : lista ? '#22c55e' : 'rgba(239,68,68,0.35)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {guion && (
        <div
          style={{
            background: 'rgba(3,7,18,0.7)',
            border: '1px solid #1e293b',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 800, color: '#f97316', letterSpacing: 1 }}>
            GUION SUGERIDO
          </span>
          <p style={{ fontSize: 13, color: '#cbd5e1', margin: '8px 0 0', lineHeight: 1.55 }}>{guion}</p>
        </div>
      )}

      <div
        style={{
          border: `1.5px solid ${borderColor}`,
          borderRadius: 16,
          padding: 18,
          background: 'linear-gradient(145deg, rgba(220,38,38,0.06), rgba(15,5,5,0.85))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={() => (grabando ? detener() : iniciar())}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: `2px solid ${borderColor}`,
              background: grabando ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.15)',
              fontSize: 22,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {grabando ? '⏹' : lista ? '✓' : '🎙️'}
          </button>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#f87171', letterSpacing: 1.5 }}>
              {grabando ? `GRABANDO · ${duracion}s` : 'MUESTRA DE VOZ'}
            </div>
            <div style={{ fontSize: 15, color: '#fff', marginTop: 4 }}>
              {grabando ? 'Habla ahora…' : 'Grabar mi tono de venta'}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {grabando ? vozTranscrita || 'Transcribiendo…' : `Mín. ${VOZ_MIN_SEGUNDOS}s o frase completa`}
            </div>
          </div>
        </div>
        {grabando && (
          <button
            type="button"
            onClick={detener}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.5)',
              background: 'rgba(239,68,68,0.15)',
              color: '#fca5a5',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Finalizar grabación
          </button>
        )}
      </div>

      {fallo && !value.trim() && (
        <p style={{ fontSize: 12, color: '#fbbf24', margin: 0 }}>
          Sin transcripción automática. Escribe tu tono abajo.
        </p>
      )}

      {subiendo && (
        <p style={{ fontSize: 12, color: '#f97316', margin: 0 }}>Guardando audio en Supabase…</p>
      )}

      {audioUrl && <audio controls src={audioUrl} style={{ width: '100%', borderRadius: 10 }} />}

      <textarea
        value={value}
        onChange={(e) => onChange(limpiarTranscripcion(e.target.value), duracion)}
        placeholder="Transcripción de tu voz / cómo hablas con clientes…"
        rows={4}
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 12,
          border: '1px solid #1e293b',
          background: 'rgba(3,7,18,0.6)',
          color: '#fff',
          fontSize: 14,
          lineHeight: 1.5,
          fontFamily: 'inherit',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
