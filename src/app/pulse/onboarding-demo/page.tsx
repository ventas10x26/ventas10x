// Ruta destino: src/app/pulse/onboarding-demo/page.tsx
// FIX: activarAsistente() ahora:
//   1. Llama configure-agent primero (crea el row en pulse_waitlist)
//   2. Luego sube el blob de audio a /api/pulse/agente/voz-muestra
//      para que el historial tenga storage_path y sea reproducible.

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

const VOZ_MIN_CARACTERES = 40
const VOZ_MIN_SEGUNDOS = 8

function limpiarTranscripcion(texto: string): string {
  return texto
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b(\w+)(\s+\1\b)+/gi, '$1')
}

type Paso = 1 | 2 | 3 | 'voz' | 'analizando' | 'exito'

type AgentConfig = {
  perfil: string
  especializacion: string
  propuesta_valor: string
  primer_mensaje: string
  agent_id?: string | null
}

export default function OnboardingDemo() {
  const [paso, setPaso] = useState<Paso>(1)
  const [respuesta1, setRespuesta1] = useState('')
  const [respuesta2, setRespuesta2] = useState('')
  const [nombre, setNombre] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null)
  const [configError, setConfigError] = useState('')

  // Paso exclusivo: entrenamiento de voz del asesor
  const [muestraVoz, setMuestraVoz] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duracionVoz, setDuracionVoz] = useState(0)
  const [grabandoEntrenamiento, setGrabandoEntrenamiento] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  // ── FIX: conserva el blob grabado para subirlo al bucket en activarAsistente ──
  const audioBlobRef = useRef<Blob | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionEntrenamientoRef = useRef<SpeechRecognition | null>(null)
  const muestraVozRef = useRef(muestraVoz)
  const duracionVozRef = useRef(0)
  const timerVozRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const grabandoEntrenamientoRef = useRef(false)
  const transcriptFinalRef = useRef('')
  const transcriptInterimRef = useRef('')

  useEffect(() => { grabandoEntrenamientoRef.current = grabandoEntrenamiento }, [grabandoEntrenamiento])
  useEffect(() => { muestraVozRef.current = muestraVoz }, [muestraVoz])

  const vozListaParaActivar = useMemo(() => {
    const texto = muestraVoz.trim()
    return texto.length >= VOZ_MIN_CARACTERES || duracionVoz >= VOZ_MIN_SEGUNDOS
  }, [muestraVoz, duracionVoz])

  const [vozTranscrita, setVozTranscrita] = useState('')
  const [transcripcionFallo, setTranscripcionFallo] = useState(false)

  const aplicarTranscripcionDesdeRefs = useCallback(() => {
    const texto = limpiarTranscripcion(
      `${transcriptFinalRef.current} ${transcriptInterimRef.current}`.trim()
    )
    if (texto) {
      setMuestraVoz(texto)
      muestraVozRef.current = texto
      setTranscripcionFallo(false)
    }
    setVozTranscrita(transcriptInterimRef.current)
    return texto
  }, [])

  const detenerEntrenamientoVoz = useCallback(() => {
    grabandoEntrenamientoRef.current = false
    setGrabandoEntrenamiento(false)

    if (timerVozRef.current) {
      clearInterval(timerVozRef.current)
      timerVozRef.current = null
    }

    if (recognitionEntrenamientoRef.current) {
      try { recognitionEntrenamientoRef.current.stop() } catch { /* ya detenido */ }
    }

    window.setTimeout(() => {
      const texto = aplicarTranscripcionDesdeRefs()
      if (!texto) setTranscripcionFallo(true)

      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      setVozTranscrita('')
    }, 600)
  }, [aplicarTranscripcionDesdeRefs])

  const iniciarEntrenamientoVoz = useCallback(async () => {
    try {
      transcriptFinalRef.current = ''
      transcriptInterimRef.current = ''
      setMuestraVoz('')
      setVozTranscrita('')
      setTranscripcionFallo(false)
      muestraVozRef.current = ''
      // Limpiar blob anterior al iniciar nueva grabación
      audioBlobRef.current = null

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      })
      streamRef.current = stream

      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      // ── FIX: guardar blob en ref además de crear object URL local ──
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioBlobRef.current = blob
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return URL.createObjectURL(blob)
        })
      }
      mediaRecorderRef.current = recorder
      recorder.start()

      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognitionCtor) {
        setTranscripcionFallo(true)
      } else {
        const recognition = new SpeechRecognitionCtor()
        recognition.lang = 'es-CO'
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalPart = ''
          let interimPart = ''
          for (let i = 0; i < event.results.length; i++) {
            const t = event.results[i][0].transcript
            if (event.results[i].isFinal) finalPart += `${t} `
            else interimPart += t
          }
          transcriptFinalRef.current = limpiarTranscripcion(finalPart)
          transcriptInterimRef.current = interimPart
          aplicarTranscripcionDesdeRefs()
        }

        recognition.onend = () => {
          if (!grabandoEntrenamientoRef.current) {
            aplicarTranscripcionDesdeRefs()
            return
          }
          try { recognition.start() } catch { /* ignorar si ya está activo */ }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          const err = event.error
          if (err === 'no-speech' || err === 'aborted') return
          if (grabandoEntrenamientoRef.current) {
            try { recognition.start() } catch { /* ignorar */ }
          }
        }

        recognitionEntrenamientoRef.current = recognition
        recognition.start()
      }

      duracionVozRef.current = 0
      setDuracionVoz(0)
      timerVozRef.current = setInterval(() => {
        duracionVozRef.current += 1
        setDuracionVoz(duracionVozRef.current)
      }, 1000)
      grabandoEntrenamientoRef.current = true
      setGrabandoEntrenamiento(true)
    } catch {
      alert('Necesitamos acceso a tu micrófono. Permítelo en el navegador e intenta de nuevo.')
    }
  }, [aplicarTranscripcionDesdeRefs])

  // ── FIX PRINCIPAL: flujo correcto de guardado ──────────────────────────────
  // Orden:
  //   A) configure-agent  → crea/actualiza el row en pulse_waitlist (necesario para el paso B)
  //   B) voz-muestra      → sube el .webm al bucket y agrega entrada a voz_historial con storage_path
  // Así en /pulse/agente los Logs de audio tienen URL firmada y muestran el botón ▶ Escuchar.
  const activarAsistente = useCallback(async () => {
    setConfigError('')
    setPaso('analizando')
    try {
      // ── A: crear/actualizar el agente ──────────────────────────────────────
      const res = await fetch('/api/pulse/onboarding/configure-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          estilo_venta: respuesta1.trim(),
          obstaculo: respuesta2.trim(),
          muestra_voz: muestraVoz.trim(),
          duracion_voz_seg: duracionVoz,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No pudimos configurar el asistente.')
      }

      // ── B: subir audio al bucket (el row ya existe, SELECT va a encontrarlo) ──
      if (audioBlobRef.current && audioBlobRef.current.size > 100) {
        const fd = new FormData()
        fd.append('audio', audioBlobRef.current, 'muestra-voz.webm')
        fd.append('transcripcion', muestraVoz.trim())
        fd.append('duracion_seg', String(duracionVoz))
        fd.append('email', email.trim().toLowerCase())

        const vozRes = await fetch('/api/pulse/agente/voz-muestra', {
          method: 'POST',
          body: fd,
        })
        if (!vozRes.ok) {
          const vozData = await vozRes.json()
          // No abortamos el flujo — el agente ya quedó configurado
          console.warn('[onboarding] voz-muestra falló:', vozData.error)
        }
      }

      setAgentConfig({
        perfil: data.perfil,
        especializacion: data.especializacion,
        propuesta_valor: data.propuesta_valor,
        primer_mensaje: data.primer_mensaje,
        agent_id: data.agent_id,
      })
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pulse_onboarding_email', email.trim().toLowerCase())
      }
      setPaso('exito')
    } catch (e) {
      setPaso('voz')
      setConfigError(e instanceof Error ? e.message : 'No pudimos configurar el asistente. Intenta de nuevo.')
    }
  }, [nombre, whatsapp, email, respuesta1, respuesta2, muestraVoz, duracionVoz])

  const [loadingText, setLoadingText] = useState('Cargando catálogo actual de modelos nuevos KIA (Picanto, K3, Sportage, Niro, EV6)...')

  useEffect(() => {
    if (paso === 'analizando') {
      const texts = [
        'Cargando catálogo actual de modelos nuevos KIA (Picanto, K3, K3 Cross, Sportage, Niro, Sorento, EV6, EV9)...',
        'Modelando fichas técnicas y equipamientos de la gama KIA...',
        'Diseñando tu flujo de seguimiento inteligente de KIA Crédito...',
        'Optimizando motor de respuestas para carros nuevos KIA...',
        'Entrenando el tono de tu voz en el agente de IA...',
        'Activando tu asistente Speed-to-Lead exclusivo para asesores KIA...'
      ]
      let currentIdx = 0
      const interval = setInterval(() => {
        currentIdx++
        if (currentIdx < texts.length) setLoadingText(texts[currentIdx])
      }, 1300)
      return () => clearInterval(interval)
    }
  }, [paso])

  const getPasoIndice = (): number | null => {
    if (paso === 'voz') return 4
    if (typeof paso === 'number') return paso
    return null
  }

  const getProgressPercentage = () => {
    switch (paso) {
      case 1: return 25
      case 2: return 50
      case 3: return 75
      case 'voz': return 100
      default: return 100
    }
  }

  const guionVozEntrenamiento = nombre.trim()
    ? `Hola, soy ${nombre.split(' ')[0]}. Soy asesor de ventas KIA. Así le hablo a un cliente cuando le interesa un carro nuevo: primero le pregunto para qué lo necesita, le explico los equipamientos que más le sirven y le ofrezco simular la cuota con KIA Crédito. Mi meta es responderle al instante y cerrar la venta.`
    : 'Hola, soy asesor de ventas KIA. Así le hablo a un cliente cuando le interesa un carro nuevo: primero le pregunto para qué lo necesita, le explico equipamientos y simulo la cuota con KIA Crédito.'

  const getVehiculoKIASugerido = () => {
    const text = (respuesta1 + ' ' + respuesta2).toLowerCase()
    if (text.includes('sportage')) return 'KIA Sportage Nuevos 🚗 (Línea SUV Premium)'
    if (text.includes('picanto')) return 'KIA Picanto Nuevos 🚗 (Línea Urban)'
    if (text.includes('k3') || text.includes('cross') || text.includes('cerato')) return 'KIA K3 & K3 Cross Nuevos 🚗 (Línea Evolution)'
    if (text.includes('niro') || text.includes('hibrid')) return 'KIA Niro Híbrido Nuevos 🚗 (Línea Eco)'
    if (text.includes('sorento')) return 'KIA Sorento Nuevos 🚗 (Línea Luxury SUV)'
    if (text.includes('ev6') || text.includes('ev9') || text.includes('electri')) return 'KIA EV6 / EV9 Eléctrico 🔋 (Línea Green-Tech)'
    return 'Portafolio Completo KIA Nuevos 🚗 (Gama Actual)'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070a13', color: '#fff', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif", padding: '0', margin: '0', position: 'relative', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        .serif-title { font-family: 'Playfair Display', Georgia, serif; }
        .radial-glow-1 { position: absolute; top: -20%; left: 50%; transform: translateX(-50%); width: 800px; height: 600px; background: radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, rgba(7, 10, 19, 0) 70%); pointer-events: none; z-index: 1; }
        .radial-glow-2 { position: absolute; bottom: -10%; right: -10%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(234, 113, 22, 0.04) 0%, rgba(7, 10, 19, 0) 70%); pointer-events: none; z-index: 1; }
        .custom-textarea { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .custom-textarea:focus { border-color: #f97316 !important; box-shadow: 0 0 16px rgba(249, 115, 22, 0.25) !important; }
        .custom-input { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .custom-input:focus { border-color: #f97316 !important; box-shadow: 0 0 12px rgba(249, 115, 22, 0.2) !important; }
        .yellow-btn { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 20px rgba(249, 115, 22, 0.2); }
        .yellow-btn:hover:not(:disabled) { transform: translateY(-2px) scale(1.02); box-shadow: 0 6px 30px rgba(249, 115, 22, 0.45); background-color: #ff7e29 !important; }
        .yellow-btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .spinner { border: 3px solid rgba(249, 115, 22, 0.1); border-top: 3px solid #f97316; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; box-shadow: 0 0 15px rgba(249, 115, 22, 0.3); }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .voice-card { background: linear-gradient(145deg, rgba(249,115,22,0.13) 0%, rgba(15, 10, 5, 0.85) 50%, rgba(250,204,21,0.07) 100%); border: 1.5px solid rgba(249, 115, 22, 0.55); border-top: 3px solid #f97316; border-radius: 20px; padding: 26px 26px 22px; display: flex; gap: 20px; align-items: flex-start; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 0 0 1px rgba(249,115,22,0.08), 0 4px 32px rgba(249, 115, 22, 0.22), 0 1px 0 rgba(255,255,255,0.06) inset, 0 -1px 0 rgba(249,115,22,0.1) inset; position: relative; overflow: hidden; }
        .voice-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent 0%, #f97316 40%, #facc15 70%, transparent 100%); border-radius: 20px 20px 0 0; opacity: 0.9; pointer-events: none; }
        .voice-card::after { content: ''; position: absolute; top: -40%; right: -5%; width: 260px; height: 260px; background: radial-gradient(circle, rgba(250,204,21,0.1) 0%, transparent 65%); pointer-events: none; }
        .voice-icon-wrap { flex-shrink: 0; width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg, rgba(249,115,22,0.35), rgba(234,88,12,0.2)); border: 1.5px solid rgba(249,115,22,0.6); display: flex; align-items: center; justify-content: center; font-size: 26px; animation: voicePulse 2.4s ease-in-out infinite; box-shadow: 0 0 16px rgba(249,115,22,0.3); }
        @keyframes voicePulse { 0%, 100% { box-shadow: 0 0 8px rgba(249,115,22,0.3), 0 0 0 0 rgba(249,115,22,0.25); } 50% { box-shadow: 0 0 20px rgba(249,115,22,0.5), 0 0 0 10px rgba(249,115,22,0); } }
        .voice-label { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: 2px; color: #fb923c; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .voice-label::before { content: ''; display: inline-block; width: 18px; height: 1.5px; background: linear-gradient(90deg, #f97316, transparent); border-radius: 2px; }
        .voice-headline { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 500; font-style: italic; line-height: 1.4; color: #fff; margin: 0 0 12px 0; text-shadow: 0 0 30px rgba(249,115,22,0.15); }
        .voice-headline em { font-style: normal; background: linear-gradient(90deg, #f97316, #facc15); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 800; }
        .voice-body { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; font-weight: 400; color: #b0b9c6; line-height: 1.65; margin: 0 0 14px 0; }
        .voice-mono-tag { display: inline-flex; align-items: center; gap: 5px; font-family: 'Courier New', Courier, monospace; font-size: 11.5px; font-weight: 700; color: #facc15; background: rgba(250,204,21,0.1); border: 1px solid rgba(250,204,21,0.35); border-radius: 8px; padding: 5px 12px; letter-spacing: 0.4px; box-shadow: 0 0 10px rgba(250,204,21,0.08); }
        .voice-mono-tag::before { content: '●'; font-size: 7px; color: #4ade80; animation: blink 1.5s ease-in-out infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        .voice-rec-banner { background: linear-gradient(145deg, rgba(220,38,38,0.08) 0%, rgba(15,5,5,0.9) 50%, rgba(249,115,22,0.05) 100%); border: 1.5px solid rgba(220, 38, 38, 0.3); border-top: 2.5px solid #ef4444; border-radius: 18px; padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden; backdrop-filter: blur(12px); box-shadow: 0 4px 28px rgba(220,38,38,0.1), inset 0 1px 0 rgba(255,255,255,0.04); }
        .voice-rec-banner.is-recording { border-color: rgba(239,68,68,0.7); border-top-color: #ef4444; box-shadow: 0 0 0 1px rgba(239,68,68,0.15), 0 4px 40px rgba(239,68,68,0.25), inset 0 1px 0 rgba(255,255,255,0.05); animation: recGlow 1.8s ease-in-out infinite; }
        .voice-rec-banner.is-done { border-color: rgba(34,197,94,0.5); border-top-color: #22c55e; box-shadow: 0 4px 28px rgba(34,197,94,0.1); }
        @keyframes recGlow { 0%, 100% { box-shadow: 0 0 0 1px rgba(239,68,68,0.15), 0 4px 30px rgba(239,68,68,0.2); } 50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.08), 0 4px 50px rgba(239,68,68,0.35); } }
        .rec-top-row { display: flex; align-items: center; gap: 14px; }
        .rec-mic-btn { flex-shrink: 0; width: 54px; height: 54px; border-radius: 50%; border: 2px solid rgba(239,68,68,0.5); background: linear-gradient(135deg, rgba(239,68,68,0.25), rgba(185,28,28,0.15)); display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 0 14px rgba(239,68,68,0.2); }
        .rec-mic-btn:hover { transform: scale(1.08); box-shadow: 0 0 24px rgba(239,68,68,0.4); border-color: rgba(239,68,68,0.8); }
        .rec-mic-btn.recording { background: linear-gradient(135deg, rgba(239,68,68,0.45), rgba(185,28,28,0.3)); border-color: #ef4444; animation: micPulse 1.2s ease-in-out infinite; box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
        .rec-mic-btn.done { border-color: rgba(34,197,94,0.6); background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(21,128,61,0.1)); box-shadow: 0 0 16px rgba(34,197,94,0.2); }
        @keyframes micPulse { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); } 70% { box-shadow: 0 0 0 14px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
        .rec-label-col { flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .rec-eyebrow { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 9px; font-weight: 800; letter-spacing: 1.8px; text-transform: uppercase; color: #f87171; }
        .rec-title { font-family: 'Playfair Display', Georgia, serif; font-size: 15px; font-style: italic; font-weight: 500; color: #fff; line-height: 1.35; }
        .rec-subtitle { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #6b7280; line-height: 1.5; margin-top: 2px; }
        .interim-text { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #fb923c; font-style: italic; padding: 10px 14px; background: rgba(249,115,22,0.06); border-left: 2px solid #f97316; border-radius: 0 8px 8px 0; min-height: 36px; line-height: 1.5; }
      `}} />

      <div className="radial-glow-1"></div>
      <div className="radial-glow-2"></div>

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ── Header ── */}
        <header style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '40px 24px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setPaso(1)}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, boxShadow: '0 0 12px rgba(249, 115, 22, 0.4)' }}>⚡</div>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>
              Pulse <span style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Motor</span>
            </span>
          </div>
          {getPasoIndice() !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#4b5563', letterSpacing: '1px' }}>PASO {getPasoIndice()} <span style={{ color: '#374151' }}>DE 4</span></span>
              <div style={{ position: 'relative', width: '120px', height: '2px', backgroundColor: '#1f2937', borderRadius: '999px' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${getProgressPercentage()}%`, backgroundColor: '#f97316', boxShadow: '0 0 6px rgba(249, 115, 22, 0.5)', transition: 'width 0.5s ease-in-out' }} />
                <div style={{ position: 'absolute', left: `calc(${getProgressPercentage()}% - 4px)`, top: '-3px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#facc15', boxShadow: '0 0 10px #facc15, 0 0 20px #facc15', transition: 'left 0.5s ease-in-out' }} />
              </div>
            </div>
          )}
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 24px 80px', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '640px', width: '100%', boxSizing: 'border-box' }}>

            {/* ──────── PASO 1 ──────── */}
            {paso === 1 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.25)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '1px' }}>EXCLUSIVO ASESORES DE VENTAS KIA 🚗</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.25)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '1px', boxShadow: '0 0 8px rgba(250, 204, 21, 0.1)' }}>PORTAFOLIO KIA VEHÍCULOS NUEVOS ⚡</span>
                </div>
                <h1 className="serif-title" style={{ fontSize: 'clamp(32px, 5.5vw, 54px)', fontWeight: 400, lineHeight: '1.15', letterSpacing: '-1px', margin: '0', color: '#ffffff' }}>
                  ¿Por qué quieres usar <span style={{ color: '#f97316', fontStyle: 'italic' }}>este asistente?</span>
                </h1>
                <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: '1.65', margin: '0 0 10px 0', maxWidth: '580px' }}>
                  Diseñado de forma exclusiva para asesores KIA. Nuestro motor de IA está profundamente entrenado con todo el catálogo actual de vehículos nuevos y la lógica comercial de la marca. Cuéntanos tu meta principal este mes para entrenar a tu asistente.
                </p>
                <textarea className="custom-textarea" value={respuesta1} onChange={(e) => setRespuesta1(e.target.value)} placeholder="Cuéntame cómo hablas tú con un cliente: por ejemplo — cuando me llega alguien interesado en una Sportage, yo primero le pregunto para qué la necesita, luego le hablo de los accesorios que más le van a servir y le ofrezco simular la cuota con KIA Crédito antes de hablar de precio. Así cierro más rápido..." rows={6} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b', backgroundColor: 'rgba(3, 7, 18, 0.6)', color: '#ffffff', fontSize: '15px', lineHeight: '1.6', fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-4px' }}>
                  <span style={{ fontSize: '12px', color: '#4b5563' }}>Sin filtros — escribe como pienses. Es solo para configurar tu asistente experto KIA.</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: respuesta1.trim().length >= 8 ? '#10b981' : '#4b5563' }}>{respuesta1.trim().length}/8+</span>
                </div>
                <div className="voice-card">
                  <div className="voice-icon-wrap">🎙️</div>
                  <div style={{ flex: 1 }}>
                    <span className="voice-label">AGENTE PERSONALIZADO · VOZ Y TEXTO</span>
                    <p className="voice-headline">Programa tu agente desde <em>tu voz natural</em><br />y tu forma única de negociar.</p>
                    <p className="voice-body">Este asistente aprende cómo <strong style={{ color: '#e5e7eb' }}>tú hablas, argumentas y cierras</strong> ventas de carros nuevos KIA. En el <strong style={{ color: '#f97316' }}>paso 4 exclusivo</strong> grabarás tu voz para entrenar el tono del agente.</p>
                    <span className="voice-mono-tag">Sin comportamientos generalizados</span>
                  </div>
                </div>
                <button onClick={() => setPaso(2)} disabled={respuesta1.trim().length < 8} className="yellow-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px 36px', borderRadius: '14px', border: 'none', backgroundColor: '#f97316', color: '#ffffff', fontSize: '15px', fontWeight: 800, cursor: respuesta1.trim().length < 8 ? 'not-allowed' : 'pointer', opacity: respuesta1.trim().length < 8 ? 0.4 : 1, marginTop: '12px', marginRight: 'auto', fontFamily: 'inherit' }}>Continuar <span style={{ fontSize: '18px' }}>→</span></button>
                <p style={{ fontSize: '12px', color: '#374151', textAlign: 'center', marginTop: '30px' }}>Apto únicamente para asesores KIA · Soporte completo del portafolio actual.</p>
              </div>
            )}

            {/* ──────── PASO 2 ──────── */}
            {paso === 2 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.25)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '1px' }}>PERFIL ASESOR KIA</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.25)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '1px' }}>CATÁLOGO COMPLETO KIA NUEVOS ⚡</span>
                </div>
                <h1 className="serif-title" style={{ fontSize: 'clamp(32px, 5.5vw, 54px)', fontWeight: 400, lineHeight: '1.15', letterSpacing: '-1px', margin: '0', color: '#ffffff' }}>
                  ¿Cuál es tu <span style={{ color: '#f97316', fontStyle: 'italic' }}>mayor obstáculo</span> hoy?
                </h1>
                <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: '1.65', margin: '0 0 10px 0', maxWidth: '580px' }}>Para optimizar las respuestas de tu asistente, cuéntanos qué te cuesta más hoy al atender un lead de carros nuevos KIA (ej: explicar detalladamente los equipamientos de Sportage, Picanto o Niro Híbrido, o cotizar con KIA Crédito al instante).</p>
                <textarea className="custom-textarea" value={respuesta2} onChange={(e) => setRespuesta2(e.target.value)} placeholder="Por ejemplo: a veces me entra un lead cotizando el nuevo KIA K3 o una Sportage y por estar en capacitaciones de marca o entregando otros carros nuevos me tardo 2 horas en contestar sobre accesorios o tasas de interés, perdiendo la venta..." rows={6} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #1e293b', backgroundColor: 'rgba(3, 7, 18, 0.6)', color: '#ffffff', fontSize: '15px', lineHeight: '1.6', fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-4px' }}>
                  <span style={{ fontSize: '12px', color: '#4b5563' }}>Sé 100% honesto — nos ayuda a afinar la IA para evitar que los leads se enfríen.</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: respuesta2.trim().length >= 8 ? '#10b981' : '#4b5563' }}>{respuesta2.trim().length}/8+</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <button onClick={() => setPaso(1)} style={{ padding: '16px 28px', borderRadius: '14px', border: '1px solid #1e293b', backgroundColor: 'transparent', color: '#9ca3af', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.color = '#fff' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#9ca3af' }}>Atrás</button>
                  <button onClick={() => setPaso(3)} disabled={respuesta2.trim().length < 8} className="yellow-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px 36px', borderRadius: '14px', border: 'none', backgroundColor: '#f97316', color: '#ffffff', fontSize: '15px', fontWeight: 800, cursor: respuesta2.trim().length < 8 ? 'not-allowed' : 'pointer', opacity: respuesta2.trim().length < 8 ? 0.4 : 1, fontFamily: 'inherit' }}>Siguiente paso <span style={{ fontSize: '18px' }}>→</span></button>
                </div>
              </div>
            )}

            {/* ──────── PASO 3 ──────── */}
            {paso === 3 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.25)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '1px' }}>VINCULACIÓN INMEDIATA</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.25)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '1px' }}>CONEXIÓN WHATSAPP SPEED-TO-LEAD KIA 📈</span>
                </div>
                <h1 className="serif-title" style={{ fontSize: 'clamp(32px, 5.5vw, 54px)', fontWeight: 400, lineHeight: '1.15', letterSpacing: '-1px', margin: '0', color: '#ffffff' }}>
                  ¿Cómo te llamas y <span style={{ color: '#f97316', fontStyle: 'italic' }}>dónde te escribo?</span>
                </h1>
                <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 10px 0', maxWidth: '560px' }}>Te enviaremos la simulación interactiva entrenada especialmente con todo el portafolio actual de carros nuevos KIA directos a tu WhatsApp.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>Nombre Completo</label>
                    <input type="text" className="custom-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Alexander Garavito" style={{ width: '100%', padding: '16px 18px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: 'rgba(3, 7, 18, 0.6)', color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>Número de WhatsApp (con código)</label>
                      <input type="tel" className="custom-input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej. +57 312 345 6789" style={{ width: '100%', padding: '16px 18px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: 'rgba(3, 7, 18, 0.6)', color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>Correo Corporativo</label>
                      <input type="email" className="custom-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@concesionariokia.com" style={{ width: '100%', padding: '16px 18px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: 'rgba(3, 7, 18, 0.6)', color: '#ffffff', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                  </div>
                </div>
                {configError && <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{configError}</p>}
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  <button onClick={() => setPaso(2)} style={{ padding: '16px 28px', borderRadius: '14px', border: '1px solid #1e293b', backgroundColor: 'transparent', color: '#9ca3af', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4b5563'; e.currentTarget.style.color = '#fff' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#9ca3af' }}>Atrás</button>
                  <button onClick={() => { setConfigError(''); setPaso('voz') }} disabled={!nombre.trim() || !whatsapp.trim() || !email.trim()} className="yellow-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px 36px', borderRadius: '14px', border: 'none', backgroundColor: '#f97316', color: '#ffffff', fontSize: '15px', fontWeight: 800, cursor: (!nombre.trim() || !whatsapp.trim() || !email.trim()) ? 'not-allowed' : 'pointer', opacity: (!nombre.trim() || !whatsapp.trim() || !email.trim()) ? 0.4 : 1, fontFamily: 'inherit' }}>Entrenar mi voz — Paso exclusivo 🎙️</button>
                </div>
              </div>
            )}

            {/* ──────── PASO 4: ENTRENAMIENTO DE VOZ ──────── */}
            {paso === 'voz' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '1px' }}>PASO EXCLUSIVO · ENTRENAMIENTO DE VOZ</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#facc15', backgroundColor: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.25)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '1px' }}>CLON DE TONO IA KIA ⚡</span>
                </div>
                <h1 className="serif-title" style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 400, lineHeight: '1.15', letterSpacing: '-1px', margin: '0', color: '#ffffff' }}>
                  Graba tu voz para <span style={{ color: '#f97316', fontStyle: 'italic' }}>entrenar</span> al agente
                </h1>
                <p style={{ fontSize: '15px', color: '#9ca3af', lineHeight: '1.65', margin: 0, maxWidth: '580px' }}>Lee el guion en voz alta (o improvisa con tu estilo). La IA captura tu tono, ritmo y forma de cerrar ventas KIA para que cada mensaje de WhatsApp suene como tú.</p>
                <div style={{ backgroundColor: 'rgba(3, 7, 18, 0.7)', border: '1px solid #1e293b', borderRadius: '14px', padding: '18px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#f97316', letterSpacing: '1px' }}>GUION SUGERIDO (30–45 SEG)</span>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', margin: '10px 0 0' }}>{guionVozEntrenamiento}</p>
                </div>

                <div className={`voice-rec-banner${grabandoEntrenamiento ? ' is-recording' : ''}${vozListaParaActivar ? ' is-done' : ''}`}>
                  <div className="rec-top-row">
                    <button type="button" className={`rec-mic-btn${grabandoEntrenamiento ? ' recording' : ''}${vozListaParaActivar ? ' done' : ''}`} onClick={() => (grabandoEntrenamiento ? detenerEntrenamientoVoz() : iniciarEntrenamientoVoz())} aria-label={grabandoEntrenamiento ? 'Detener grabación' : 'Iniciar grabación'}>
                      {grabandoEntrenamiento ? '⏹' : vozListaParaActivar ? '✓' : '🎙️'}
                    </button>
                    <div className="rec-label-col">
                      <span className="rec-eyebrow">{grabandoEntrenamiento ? `GRABANDO · ${duracionVoz}s` : 'ENTRENAMIENTO DE VOZ DEL ASESOR'}</span>
                      <span className="rec-title">{grabandoEntrenamiento ? 'Habla ahora — entrenando tu agente…' : 'Pulsa para grabar tu muestra de voz'}</span>
                      <span className="rec-subtitle">{grabandoEntrenamiento ? (vozTranscrita || 'Capturando audio y transcribiendo tu tono…') : `Mínimo ~${VOZ_MIN_SEGUNDOS} s o una frase completa. Chrome/Edge con micrófono.`}</span>
                    </div>
                  </div>
                  {grabandoEntrenamiento && (
                    <button type="button" onClick={detenerEntrenamientoVoz} style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Finalizar grabación</button>
                  )}
                </div>

                {(muestraVoz.trim().length > 0 || audioUrl) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {audioUrl && <audio controls src={audioUrl} style={{ width: '100%', borderRadius: '10px' }} />}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px' }}>Transcripción de tu voz (editable)</label>
                      {transcripcionFallo && !muestraVoz.trim() && (
                        <p style={{ fontSize: '12px', color: '#fbbf24', margin: '0 0 8px' }}>No detectamos texto automático. Escribe tu guion abajo o vuelve a grabar en Chrome/Edge.</p>
                      )}
                      <textarea className="custom-textarea" value={muestraVoz} placeholder="Aquí aparecerá lo que digas al grabar…" onChange={(e) => { const limpio = limpiarTranscripcion(e.target.value); setMuestraVoz(limpio); muestraVozRef.current = limpio; if (limpio) setTranscripcionFallo(false) }} rows={4} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: 'rgba(3, 7, 18, 0.6)', color: '#ffffff', fontSize: '14px', lineHeight: '1.5', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                )}

                {configError && <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{configError}</p>}

                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setPaso(3)} style={{ padding: '16px 28px', borderRadius: '14px', border: '1px solid #1e293b', backgroundColor: 'transparent', color: '#9ca3af', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Atrás</button>
                  <button type="button" onClick={activarAsistente} disabled={!vozListaParaActivar} className="yellow-btn" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px 36px', borderRadius: '14px', border: 'none', backgroundColor: '#f97316', color: '#ffffff', fontSize: '15px', fontWeight: 800, cursor: !vozListaParaActivar ? 'not-allowed' : 'pointer', opacity: !vozListaParaActivar ? 0.4 : 1, fontFamily: 'inherit' }}>Activar Asistente Pulse KIA 🚀</button>
                </div>
              </div>
            )}

            {/* ──────── ANALIZANDO ──────── */}
            {paso === 'analizando' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px', textAlign: 'center', padding: '40px 0' }}>
                <div className="spinner"></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h2 className="serif-title" style={{ fontSize: '28px', fontWeight: 400, color: '#ffffff', margin: '0' }}>Configurando tu asistente <span style={{ color: '#f97316', fontStyle: 'italic' }}>Pulse Motor KIA</span></h2>
                  <p style={{ fontSize: '15px', color: '#9ca3af', minHeight: '24px', transition: 'all 0.3s' }}>{loadingText}</p>
                </div>
                <span style={{ fontSize: '12px', color: '#374151' }}>Esto tomará unos pocos segundos. Activando tu motor inteligente especializado en el portafolio KIA...</span>
              </div>
            )}

            {/* ──────── ÉXITO ──────── */}
            {paso === 'exito' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '48px', margin: '0' }}>⚡</span>
                  <h1 className="serif-title" style={{ fontSize: '36px', fontWeight: 400, color: '#ffffff', margin: '0' }}>
                    ¡Tu asistente <span style={{ color: '#f97316', fontStyle: 'italic' }}>Pulse Motor KIA</span> está listo!
                  </h1>
                  <p style={{ fontSize: '15px', color: '#9ca3af', maxWidth: '500px', margin: '0 auto' }}>
                    Hola <strong>{nombre.split(' ')[0]}</strong>, hemos configurado tu motor Speed-to-Lead con foco exclusivo en carros nuevos KIA y todo su portafolio actual.
                    {vozListaParaActivar && <span style={{ display: 'block', marginTop: '8px', color: '#4ade80', fontSize: '13px', fontWeight: 700 }}>✓ Voz del asesor capturada y entrenada en el agente</span>}
                  </p>
                </div>

                <div style={{ backgroundColor: 'rgba(3, 7, 18, 0.7)', border: '1px solid #1e293b', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#f97316', display: 'block', marginBottom: '6px' }}>PERFIL PROFESIONAL DETECTADO</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{agentConfig?.perfil ?? 'Asesor de Ventas KIA 🚗'}</span>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#facc15', display: 'block', marginBottom: '6px' }}>ESPECIALIZACIÓN DE NEGOCIO IA</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{agentConfig?.especializacion ?? getVehiculoKIASugerido()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af' }}>PROPUESTA DE VALOR DE TU ASISTENTE KIA</span>
                    <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', margin: '0' }}>{agentConfig?.propuesta_valor ?? 'Cerrar el 100% de tus leads de carros nuevos KIA en menos de 30 segundos por WhatsApp.'}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#f97316' }}>PRIMER MENSAJE DE IA SUGERIDO PARA WHATSAPP</span>
                    <div style={{ backgroundColor: '#020617', border: '1px solid rgba(249, 115, 22, 0.2)', boxShadow: 'inset 0 0 10px rgba(249, 115, 22, 0.05)', borderRadius: '12px', padding: '16px', fontFamily: "'Courier New', Courier, monospace", fontSize: '13px', color: '#fed7aa', lineHeight: '1.5', position: 'relative' }}>
                      <span style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '10px', color: '#f97316', fontWeight: 700, textTransform: 'uppercase' }}>Pulse KIA IA</span>
                      &quot;{agentConfig?.primer_mensaje ?? `¡Hola! Soy el asistente virtual de ${nombre.split(' ')[0]}. ¿En qué modelo KIA puedo ayudarte hoy? 🚗`}&quot;
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  <button className="yellow-btn" style={{ width: '100%', padding: '16px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#f97316', color: '#ffffff', fontSize: '15px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { window.location.href = '/pulse/agente?from=onboarding' }}>Entrenar y personalizar mi agente 🤖</button>
                  <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                    <button className="yellow-btn" style={{ flex: 1, padding: '16px 24px', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(249, 115, 22, 0.35)', color: '#ffffff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => { const texto = agentConfig?.primer_mensaje || `¡Hola! Acabo de activar mi asistente exclusivo de KIA.`; window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(texto)}`, '_blank') }}>Probar en WhatsApp 📲</button>
                    <button style={{ flex: 1, padding: '16px 24px', borderRadius: '12px', border: '1px solid #1e293b', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#ffffff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.05)' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)' }} onClick={() => { window.location.href = '/pulse/dashboard' }}>Dashboard de Leads 📊</button>
                  </div>
                </div>

                <button onClick={() => {
                  setRespuesta1(''); setRespuesta2(''); setNombre(''); setWhatsapp(''); setEmail('')
                  setMuestraVoz(''); setDuracionVoz(0)
                  if (audioUrl) URL.revokeObjectURL(audioUrl)
                  setAudioUrl(null)
                  // ── FIX: limpiar blob al reiniciar ──
                  audioBlobRef.current = null
                  setAgentConfig(null); setConfigError(''); setPaso(1)
                }} style={{ alignSelf: 'center', padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#4b5563', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#9ca3af'} onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}>
                  Volver a empezar el asistente
                </button>
              </div>
            )}

          </div>
        </main>

        <footer style={{ padding: '30px 24px', textAlign: 'center', fontSize: '12px', color: '#1f2937', borderTop: '1px solid rgba(255, 255, 255, 0.01)', boxSizing: 'border-box' }}>
          © 2026 Pulse Motor · Asistente IA Exclusivo para Asesores de Ventas KIA · Todos los derechos reservados.
        </footer>
      </div>
    </div>
  )
}
