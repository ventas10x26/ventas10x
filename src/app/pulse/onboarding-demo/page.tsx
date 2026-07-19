// Ruta destino: src/app/pulse/onboarding-demo/page.tsx
// FIX audio: activarAsistente() sube blob a voz-muestra antes de configure-agent
// ESTILO: paleta azul/verde + DM Sans (mismo que landing)

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ── Tokens de color (mismo que landing) ──────────────────────────────────────
const C = {
  blue:       '#0ea5e9',
  blueDark:   '#0284c7',
  green:      '#10b981',
  greenDark:  '#059669',
  gradBtn:    'linear-gradient(135deg, #0ea5e9, #059669)',
  gradText:   'linear-gradient(135deg, #0ea5e9, #10b981)',
  pill:       'rgba(14,165,233,0.15)',
  pillBorder: 'rgba(14,165,233,0.3)',
  pillText:   '#7dd3fc',
  logo:       'linear-gradient(135deg, #0ea5e9, #10b981)',
}
const FONT = "'DM Sans', system-ui, -apple-system, sans-serif"

const VOZ_MIN_CARACTERES = 40
const VOZ_MIN_SEGUNDOS = 8

// Mismo listado que /pulse/signup — Pulse Motor no se casa con ninguna marca de autos
// (ver skill pulsemotor-strategy).
const MARCAS = ['KIA', 'Hyundai', 'Renault', 'Chevrolet', 'Toyota', 'Mazda', 'Nissan', 'Otro']

function limpiarTranscripcion(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim().replace(/\b(\w+)(\s+\1\b)+/gi, '$1')
}

type Paso = 1 | 2 | 3 | 'voz' | 'analizando' | 'exito'
type AgentConfig = {
  perfil: string; especializacion: string; propuesta_valor: string
  primer_mensaje: string; agent_id?: string | null
}

export default function OnboardingDemo() {
  const [paso, setPaso] = useState<Paso>(1)
  const [respuesta1, setRespuesta1] = useState('')
  const [respuesta2, setRespuesta2] = useState('')
  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null)
  const [configError, setConfigError] = useState('')

  const [muestraVoz, setMuestraVoz] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duracionVoz, setDuracionVoz] = useState(0)
  const [grabandoEntrenamiento, setGrabandoEntrenamiento] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
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

  // Pre-llenar nombre, email y marca desde Supabase Auth (Google/signup), la URL, o
  // sessionStorage (landing) — nunca asumir KIA por default.
  useEffect(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const urlMarca = params?.get('marca') || ''

    const prefill = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (data.user) {
          const fullName =
            (data.user.user_metadata?.full_name as string) ||
            (data.user.user_metadata?.name as string) || ''
          const marcaAuth = (data.user.user_metadata?.pulse_marca as string) || ''
          if (fullName) setNombre((prev) => prev || fullName)
          if (data.user.email) setEmail((prev) => prev || data.user!.email!)
          if (marcaAuth || urlMarca) setMarca((prev) => prev || marcaAuth || urlMarca)
          return
        }
      } catch { /* ignorar */ }
      // Fallback sessionStorage (viene del landing sin login)
      if (typeof window !== 'undefined') {
        const sEmail = sessionStorage.getItem('pulse_onboarding_email') || ''
        const sNombre = sessionStorage.getItem('pulse_onboarding_nombre') || ''
        const sMarca = sessionStorage.getItem('pulse_onboarding_marca') || ''
        if (sEmail) setEmail((prev) => prev || sEmail)
        if (sNombre) setNombre((prev) => prev || sNombre)
        if (sMarca || urlMarca) setMarca((prev) => prev || sMarca || urlMarca)
      }
    }
    prefill()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const vozListaParaActivar = useMemo(() => {
    return muestraVoz.trim().length >= VOZ_MIN_CARACTERES || duracionVoz >= VOZ_MIN_SEGUNDOS
  }, [muestraVoz, duracionVoz])

  const [vozTranscrita, setVozTranscrita] = useState('')
  const [transcripcionFallo, setTranscripcionFallo] = useState(false)

  const aplicarTranscripcionDesdeRefs = useCallback(() => {
    const texto = limpiarTranscripcion(`${transcriptFinalRef.current} ${transcriptInterimRef.current}`.trim())
    if (texto) { setMuestraVoz(texto); muestraVozRef.current = texto; setTranscripcionFallo(false) }
    setVozTranscrita(transcriptInterimRef.current)
    return texto
  }, [])

  const detenerEntrenamientoVoz = useCallback(() => {
    grabandoEntrenamientoRef.current = false
    setGrabandoEntrenamiento(false)
    if (timerVozRef.current) { clearInterval(timerVozRef.current); timerVozRef.current = null }
    if (recognitionEntrenamientoRef.current) { try { recognitionEntrenamientoRef.current.stop() } catch { /* ya detenido */ } }
    window.setTimeout(() => {
      const texto = aplicarTranscripcionDesdeRefs()
      if (!texto) setTranscripcionFallo(true)
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
      setVozTranscrita('')
    }, 600)
  }, [aplicarTranscripcionDesdeRefs])

  const iniciarEntrenamientoVoz = useCallback(async () => {
    try {
      transcriptFinalRef.current = ''
      transcriptInterimRef.current = ''
      setMuestraVoz(''); setVozTranscrita(''); setTranscripcionFallo(false)
      muestraVozRef.current = ''; audioBlobRef.current = null

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 }
      })
      streamRef.current = stream
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioBlobRef.current = blob
        setAudioUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob) })
      }
      mediaRecorderRef.current = recorder
      recorder.start()

      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognitionCtor) {
        setTranscripcionFallo(true)
      } else {
        const recognition = new SpeechRecognitionCtor()
        recognition.lang = 'es-CO'; recognition.continuous = true; recognition.interimResults = true
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalPart = ''; let interimPart = ''
          for (let i = 0; i < event.results.length; i++) {
            const t = event.results[i][0].transcript
            if (event.results[i].isFinal) finalPart += `${t} `; else interimPart += t
          }
          transcriptFinalRef.current = limpiarTranscripcion(finalPart)
          transcriptInterimRef.current = interimPart
          aplicarTranscripcionDesdeRefs()
        }
        recognition.onend = () => {
          if (!grabandoEntrenamientoRef.current) { aplicarTranscripcionDesdeRefs(); return }
          try { recognition.start() } catch { /* ignorar */ }
        }
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          const err = event.error
          if (err === 'no-speech' || err === 'aborted') return
          if (grabandoEntrenamientoRef.current) { try { recognition.start() } catch { /* ignorar */ } }
        }
        recognitionEntrenamientoRef.current = recognition
        recognition.start()
      }

      duracionVozRef.current = 0; setDuracionVoz(0)
      timerVozRef.current = setInterval(() => { duracionVozRef.current += 1; setDuracionVoz(duracionVozRef.current) }, 1000)
      grabandoEntrenamientoRef.current = true; setGrabandoEntrenamiento(true)
    } catch {
      alert('Necesitamos acceso a tu micrófono. Permítelo en el navegador e intenta de nuevo.')
    }
  }, [aplicarTranscripcionDesdeRefs])

  const activarAsistente = useCallback(async () => {
    setConfigError(''); setPaso('analizando')
    try {
      const res = await fetch('/api/pulse/onboarding/configure-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(), marca: marca.trim(), whatsapp: whatsapp.trim(), email: email.trim(),
          estilo_venta: respuesta1.trim(), obstaculo: respuesta2.trim(),
          muestra_voz: muestraVoz.trim(), duracion_voz_seg: duracionVoz,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'No pudimos configurar el asistente.')

      if (audioBlobRef.current && audioBlobRef.current.size > 100) {
        const fd = new FormData()
        fd.append('audio', audioBlobRef.current, 'muestra-voz.webm')
        fd.append('transcripcion', muestraVoz.trim())
        fd.append('duracion_seg', String(duracionVoz))
        fd.append('email', email.trim().toLowerCase())
        const vozRes = await fetch('/api/pulse/agente/voz-muestra', { method: 'POST', body: fd })
        if (!vozRes.ok) { const vozData = await vozRes.json(); console.warn('[onboarding] voz-muestra falló:', vozData.error) }
      }

      setAgentConfig({ perfil: data.perfil, especializacion: data.especializacion, propuesta_valor: data.propuesta_valor, primer_mensaje: data.primer_mensaje, agent_id: data.agent_id })
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pulse_onboarding_email', email.trim().toLowerCase())
        if (marca.trim()) sessionStorage.setItem('pulse_onboarding_marca', marca.trim())
      }
      setPaso('exito')
    } catch (e) {
      setPaso('voz')
      setConfigError(e instanceof Error ? e.message : 'No pudimos configurar el asistente. Intenta de nuevo.')
    }
  }, [nombre, marca, whatsapp, email, respuesta1, respuesta2, muestraVoz, duracionVoz])

  const [loadingText, setLoadingText] = useState('Cargando catálogo...')
  useEffect(() => {
    if (paso === 'analizando') {
      const marcaTxt = marca.trim() || 'tu marca'
      const texts = [
        `Cargando catálogo ${marcaTxt}...`,
        `Modelando fichas técnicas de la gama ${marcaTxt}...`,
        'Diseñando flujo de seguimiento con financiación...',
        `Optimizando respuestas para leads ${marcaTxt}...`,
        'Entrenando tu tono de voz en el agente...',
        'Activando tu asistente Speed-to-Lead...'
      ]
      let i = 0
      const interval = setInterval(() => { i++; if (i < texts.length) setLoadingText(texts[i]) }, 1300)
      return () => clearInterval(interval)
    }
  }, [paso, marca])

  const getPasoIndice = (): number | null => {
    if (paso === 'voz') return 4
    if (typeof paso === 'number') return paso
    return null
  }
  const getProgressPercentage = () => {
    switch (paso) { case 1: return 25; case 2: return 50; case 3: return 75; case 'voz': return 100; default: return 100 }
  }

  // Pulse Motor no se casa con ninguna marca de autos (ver skill pulsemotor-strategy):
  // el copy de ejemplo usa la marca real capturada, con un genérico mientras no se conozca.
  const marcaLabel = marca.trim() || 'tu marca'

  const guionVoz = nombre.trim()
    ? `Hola, soy ${nombre.split(' ')[0]}. Soy asesor de ventas ${marcaLabel}. Así le hablo a un cliente cuando le interesa un carro nuevo: primero le pregunto para qué lo necesita, le explico los equipamientos que más le sirven y le ofrezco simular la cuota de financiación. Mi meta es responderle al instante y cerrar la venta.`
    : `Hola, soy asesor de ventas ${marcaLabel}. Cuando llega un cliente interesado en un carro nuevo, le pregunto para qué lo necesita, le explico equipamientos y simulo la cuota de financiación.`

  // Detección de línea/versión detallada solo tiene sentido para KIA (nomenclatura conocida
  // del piloto Almotores) — para cualquier otra marca devolvemos un portafolio genérico en
  // vez de inventar nombres de modelo que no le corresponden.
  const getVehiculo = () => {
    if (marca.trim().toUpperCase() !== 'KIA') return `Portafolio de ${marcaLabel} Nuevos 🚗`
    const t = (respuesta1 + ' ' + respuesta2).toLowerCase()
    if (t.includes('sportage')) return 'KIA Sportage Nuevos 🚗'
    if (t.includes('picanto')) return 'KIA Picanto Nuevos 🚗'
    if (t.includes('k3') || t.includes('cross')) return 'KIA K3 & K3 Cross Nuevos 🚗'
    if (t.includes('niro') || t.includes('hibrid')) return 'KIA Niro Híbrido Nuevos 🚗'
    if (t.includes('sorento')) return 'KIA Sorento Nuevos 🚗'
    if (t.includes('ev6') || t.includes('ev9')) return 'KIA EV6 / EV9 Eléctrico 🔋'
    return 'Portafolio Completo KIA Nuevos 🚗'
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '16px 18px', borderRadius: '12px',
    border: '1px solid rgba(14,165,233,0.2)', backgroundColor: 'rgba(3,7,18,0.6)',
    color: '#ffffff', fontSize: '15px', fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }
  const textareaBase: React.CSSProperties = { ...inputBase, resize: 'none' as const }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .ob-input:focus { border-color: #0ea5e9 !important; box-shadow: 0 0 0 3px rgba(14,165,233,0.15) !important; }
        .ob-btn-primary { transition: all 0.25s ease; }
        .ob-btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(14,165,233,0.35) !important; }
        .ob-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .ob-btn-back { transition: all 0.2s; }
        .ob-btn-back:hover { border-color: #0ea5e9 !important; color: #fff !important; }
        .fade-in { animation: fadeIn 0.45s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .spinner { border: 3px solid rgba(14,165,233,0.1); border-top: 3px solid #0ea5e9; border-radius: 50%; width: 48px; height: 48px; animation: spin 1s linear infinite; box-shadow: 0 0 20px rgba(14,165,233,0.25); }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Tarjeta voz */
        .voice-card {
          background: linear-gradient(145deg, rgba(14,165,233,0.12) 0%, rgba(5,15,30,0.9) 50%, rgba(16,185,129,0.06) 100%);
          border: 1.5px solid rgba(14,165,233,0.4); border-top: 3px solid #0ea5e9;
          border-radius: 18px; padding: 24px; display: flex; gap: 18px; align-items: flex-start;
          backdrop-filter: blur(14px); position: relative; overflow: hidden;
          box-shadow: 0 4px 28px rgba(14,165,233,0.12);
        }
        .voice-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, #0ea5e9 40%, #10b981 70%, transparent); border-radius: 18px 18px 0 0; }
        .voice-icon-wrap { flex-shrink: 0; width: 50px; height: 50px; border-radius: 14px; background: linear-gradient(135deg, rgba(14,165,233,0.3), rgba(16,185,129,0.15)); border: 1.5px solid rgba(14,165,233,0.5); display: flex; align-items: center; justify-content: center; font-size: 24px; animation: vPulse 2.4s ease-in-out infinite; }
        @keyframes vPulse { 0%,100% { box-shadow: 0 0 8px rgba(14,165,233,0.3); } 50% { box-shadow: 0 0 20px rgba(14,165,233,0.5), 0 0 0 8px rgba(14,165,233,0); } }

        /* Banner grabación */
        .rec-banner { background: linear-gradient(145deg, rgba(14,165,233,0.08), rgba(5,15,30,0.95)); border: 1.5px solid rgba(14,165,233,0.25); border-top: 2.5px solid #0ea5e9; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 14px; backdrop-filter: blur(10px); }
        .rec-banner.grabando { border-color: rgba(14,165,233,0.6); box-shadow: 0 0 0 3px rgba(14,165,233,0.08), 0 4px 32px rgba(14,165,233,0.2); animation: recGlow 1.8s ease-in-out infinite; }
        .rec-banner.listo { border-color: rgba(16,185,129,0.5); border-top-color: #10b981; }
        @keyframes recGlow { 0%,100% { box-shadow: 0 0 0 1px rgba(14,165,233,0.1), 0 4px 24px rgba(14,165,233,0.15); } 50% { box-shadow: 0 0 0 4px rgba(14,165,233,0.06), 0 4px 40px rgba(14,165,233,0.3); } }
        .rec-mic-btn { flex-shrink: 0; width: 52px; height: 52px; border-radius: 50%; border: 2px solid rgba(14,165,233,0.5); background: linear-gradient(135deg, rgba(14,165,233,0.2), rgba(16,185,129,0.1)); display: flex; align-items: center; justify-content: center; font-size: 22px; cursor: pointer; transition: all 0.2s; }
        .rec-mic-btn:hover { transform: scale(1.08); box-shadow: 0 0 20px rgba(14,165,233,0.4); }
        .rec-mic-btn.grabando { border-color: #0ea5e9; animation: micPulse 1.2s ease-in-out infinite; }
        .rec-mic-btn.listo { border-color: #10b981; background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1)); }
        @keyframes micPulse { 0% { box-shadow: 0 0 0 0 rgba(14,165,233,0.5); } 70% { box-shadow: 0 0 0 12px rgba(14,165,233,0); } 100% { box-shadow: 0 0 0 0 rgba(14,165,233,0); } }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #070a13 0%, #0f172a 50%, #070a13 100%)', color: '#fff', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ── */}
        <header style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '32px 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setPaso(1)}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: C.logo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 0 14px rgba(14,165,233,0.35)' }}>⚡</div>
            <span style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              Pulse <span style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Motor</span>
            </span>
          </div>
          {getPasoIndice() !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '1px' }}>PASO {getPasoIndice()} <span style={{ color: '#334155' }}>DE 4</span></span>
              <div style={{ position: 'relative', width: '110px', height: '2px', backgroundColor: '#1e293b', borderRadius: '999px' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${getProgressPercentage()}%`, background: C.gradBtn, transition: 'width 0.5s ease' }} />
                <div style={{ position: 'absolute', left: `calc(${getProgressPercentage()}% - 4px)`, top: '-3px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: C.green, boxShadow: `0 0 10px ${C.green}`, transition: 'left 0.5s ease' }} />
              </div>
            </div>
          )}
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 24px 80px', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: '620px', width: '100%' }}>

            {/* ──────── PASO 1 ──────── */}
            {paso === 1 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.pillText, background: C.pill, border: `1px solid ${C.pillBorder}`, padding: '5px 12px', borderRadius: '999px', letterSpacing: '0.8px' }}>EXCLUSIVO ASESORES DE VEHÍCULOS NUEVOS 🚗</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.green, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '0.8px' }}>PORTAFOLIO {marcaLabel.toUpperCase()} VEHÍCULOS NUEVOS ⚡</span>
                </div>
                <h1 style={{ fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 800, lineHeight: '1.1', letterSpacing: '-0.8px', margin: '0', fontFamily: FONT }}>
                  ¿Por qué quieres usar{' '}
                  <span style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic' }}>este asistente?</span>
                </h1>
                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.65', margin: '0', fontWeight: 400 }}>
                  Diseñado para asesores de vehículos nuevos de cualquier marca. Nuestro motor de IA aplica la misma lógica comercial 360° al catálogo y estrategia de tu concesionario. Cuéntanos tu meta principal este mes.
                </p>
                <textarea className="ob-input" value={respuesta1} onChange={(e) => setRespuesta1(e.target.value)} placeholder="Cuéntame cómo hablas tú con un cliente: por ejemplo — cuando me llega alguien interesado en un modelo puntual, yo primero le pregunto para qué lo necesita, luego le hablo de los accesorios y le ofrezco simular la cuota de financiación antes de hablar de precio..." rows={5} style={textareaBase} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#475569' }}>Sin filtros — escribe como pienses.</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: respuesta1.trim().length >= 8 ? C.green : '#475569' }}>{respuesta1.trim().length}/8+</span>
                </div>

                {/* Card voz */}
                <div className="voice-card">
                  <div className="voice-icon-wrap">🎙️</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: C.blue, letterSpacing: '1.8px', textTransform: 'uppercase' as const, display: 'block', marginBottom: '8px' }}>AGENTE PERSONALIZADO · VOZ Y TEXTO</span>
                    <p style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', fontFamily: FONT }}>
                      Programa tu agente desde{' '}
                      <span style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>tu voz natural</span>
                    </p>
                    <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 12px', fontWeight: 400 }}>
                      Este asistente aprende cómo <strong style={{ color: '#e2e8f0' }}>tú hablas y cierras</strong> tus ventas. En el <strong style={{ color: C.blue }}>paso 4</strong> grabarás tu voz para entrenar el tono.
                    </p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: C.green, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '6px', padding: '4px 10px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'vPulse 1.5s ease-in-out infinite' }} />
                      Sin comportamientos generalizados
                    </span>
                  </div>
                </div>

                <button onClick={() => setPaso(2)} disabled={respuesta1.trim().length < 8} className="ob-btn-primary" style={{ padding: '15px 32px', borderRadius: '12px', border: 'none', background: respuesta1.trim().length < 8 ? '#334155' : C.gradBtn, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: respuesta1.trim().length < 8 ? 'not-allowed' : 'pointer', opacity: respuesta1.trim().length < 8 ? 0.5 : 1, marginRight: 'auto', fontFamily: FONT, boxShadow: '0 4px 16px rgba(14,165,233,0.2)' }}>
                  Continuar →
                </button>
              </div>
            )}

            {/* ──────── PASO 2 ──────── */}
            {paso === 2 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.pillText, background: C.pill, border: `1px solid ${C.pillBorder}`, padding: '5px 12px', borderRadius: '999px', letterSpacing: '0.8px' }}>PERFIL ASESOR {marcaLabel.toUpperCase()}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.green, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '0.8px' }}>CATÁLOGO COMPLETO {marcaLabel.toUpperCase()} ⚡</span>
                </div>
                <h1 style={{ fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 800, lineHeight: '1.1', letterSpacing: '-0.8px', margin: '0', fontFamily: FONT }}>
                  ¿Cuál es tu{' '}
                  <span style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic' }}>mayor obstáculo</span> hoy?
                </h1>
                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.65', margin: '0', fontWeight: 400 }}>
                  Cuéntanos qué te cuesta más al atender un lead (ej: explicar equipamientos de un modelo puntual, o cotizar la financiación al instante).
                </p>
                <textarea className="ob-input" value={respuesta2} onChange={(e) => setRespuesta2(e.target.value)} placeholder="Por ejemplo: a veces me entra un lead cotizando un modelo puntual y por estar en capacitaciones me tardo 2 horas en contestar, perdiendo la venta..." rows={5} style={textareaBase} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#475569' }}>Sé 100% honesto — ayuda a afinar la IA.</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: respuesta2.trim().length >= 8 ? C.green : '#475569' }}>{respuesta2.trim().length}/8+</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setPaso(1)} className="ob-btn-back" style={{ padding: '15px 24px', borderRadius: '12px', border: '1px solid #1e293b', background: 'transparent', color: '#64748b', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Atrás</button>
                  <button onClick={() => setPaso(3)} disabled={respuesta2.trim().length < 8} className="ob-btn-primary" style={{ padding: '15px 32px', borderRadius: '12px', border: 'none', background: respuesta2.trim().length < 8 ? '#334155' : C.gradBtn, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: respuesta2.trim().length < 8 ? 'not-allowed' : 'pointer', opacity: respuesta2.trim().length < 8 ? 0.5 : 1, fontFamily: FONT, boxShadow: '0 4px 16px rgba(14,165,233,0.2)' }}>Siguiente paso →</button>
                </div>
              </div>
            )}

            {/* ──────── PASO 3 ──────── */}
            {paso === 3 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.pillText, background: C.pill, border: `1px solid ${C.pillBorder}`, padding: '5px 12px', borderRadius: '999px', letterSpacing: '0.8px' }}>VINCULACIÓN INMEDIATA</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.green, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '0.8px' }}>WHATSAPP SPEED-TO-LEAD 📈</span>
                </div>
                <h1 style={{ fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 800, lineHeight: '1.1', letterSpacing: '-0.8px', margin: '0', fontFamily: FONT }}>
                  ¿Cómo te llamas y{' '}
                  <span style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic' }}>dónde te escribo?</span>
                </h1>
                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.6', margin: '0', fontWeight: 400 }}>
                  Te enviaremos la simulación entrenada con todo el portafolio de {marcaLabel} directamente a tu WhatsApp.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Nombre: editable solo si no viene pre-llenado */}
                  {nombre ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(14,165,233,0.2)', background: 'rgba(14,165,233,0.05)' }}>
                      <span style={{ fontSize: '18px' }}>👤</span>
                      <div>
                        <span style={{ fontSize: '11px', color: C.blue, fontWeight: 600, display: 'block', marginBottom: '2px' }}>NOMBRE</span>
                        <span style={{ fontSize: '15px', color: '#fff', fontWeight: 500 }}>{nombre}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px', letterSpacing: '0.3px' }}>Nombre Completo</label>
                      <input type="text" className="ob-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Alexander Garavito" style={inputBase} />
                    </div>
                  )}

                  {/* Marca: editable solo si no viene pre-llenada del signup — Pulse Motor
                      no se casa con ninguna marca, así que nunca se asume KIA por default. */}
                  {marca ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(14,165,233,0.2)', background: 'rgba(14,165,233,0.05)' }}>
                      <span style={{ fontSize: '18px' }}>🚗</span>
                      <div>
                        <span style={{ fontSize: '11px', color: C.blue, fontWeight: 600, display: 'block', marginBottom: '2px' }}>MARCA</span>
                        <span style={{ fontSize: '15px', color: '#fff', fontWeight: 500 }}>{marca}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Marca con la que vendés</label>
                      <select value={marca} onChange={(e) => setMarca(e.target.value)} className="ob-input" style={{ ...inputBase, color: marca ? '#fff' : '#64748b', cursor: 'pointer' }}>
                        <option value="">Selecciona tu marca</option>
                        {MARCAS.map(m => <option key={m} value={m} style={{ color: '#0f172a' }}>{m}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Email: editable solo si no viene pre-llenado */}
                  {email ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(14,165,233,0.2)', background: 'rgba(14,165,233,0.05)' }}>
                      <span style={{ fontSize: '18px' }}>✉️</span>
                      <div>
                        <span style={{ fontSize: '11px', color: C.blue, fontWeight: 600, display: 'block', marginBottom: '2px' }}>CORREO</span>
                        <span style={{ fontSize: '15px', color: '#fff', fontWeight: 500 }}>{email}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Correo Corporativo</label>
                      <input type="email" className="ob-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@tuconcesionario.com" style={inputBase} />
                    </div>
                  )}

                  {/* WhatsApp: siempre editable */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>WhatsApp (con código de país)</label>
                    <input type="tel" className="ob-input" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+57 312 345 6789" style={inputBase} autoFocus />
                  </div>
                </div>
                {configError && <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{configError}</p>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setPaso(2)} className="ob-btn-back" style={{ padding: '15px 24px', borderRadius: '12px', border: '1px solid #1e293b', background: 'transparent', color: '#64748b', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Atrás</button>
                  <button onClick={() => { setConfigError(''); setPaso('voz') }} disabled={!nombre.trim() || !whatsapp.trim() || !email.trim()} className="ob-btn-primary" style={{ flex: 1, padding: '15px 24px', borderRadius: '12px', border: 'none', background: (!nombre.trim() || !whatsapp.trim() || !email.trim()) ? '#334155' : C.gradBtn, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: (!nombre.trim() || !whatsapp.trim() || !email.trim()) ? 'not-allowed' : 'pointer', opacity: (!nombre.trim() || !whatsapp.trim() || !email.trim()) ? 0.5 : 1, fontFamily: FONT, boxShadow: '0 4px 16px rgba(14,165,233,0.2)' }}>
                    Entrenar mi voz — Paso exclusivo 🎙️
                  </button>
                </div>
              </div>
            )}

            {/* ──────── PASO 4: VOZ ──────── */}
            {paso === 'voz' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.pillText, background: C.pill, border: `1px solid ${C.pillBorder}`, padding: '5px 12px', borderRadius: '999px', letterSpacing: '0.8px' }}>PASO EXCLUSIVO · ENTRENAMIENTO DE VOZ</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.green, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', padding: '5px 12px', borderRadius: '999px', letterSpacing: '0.8px' }}>CLON DE TONO IA ⚡</span>
                </div>
                <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 800, lineHeight: '1.1', letterSpacing: '-0.8px', margin: '0', fontFamily: FONT }}>
                  Graba tu voz para{' '}
                  <span style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontStyle: 'italic' }}>entrenar</span> al agente
                </h1>
                <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.65', margin: 0, fontWeight: 400 }}>
                  Lee el guion en voz alta o improvisa. La IA captura tu tono y forma de cerrar tus ventas.
                </p>
                <div style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: '12px', padding: '16px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.blue, letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>GUION SUGERIDO (30–45 SEG)</span>
                  <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', margin: 0, fontWeight: 400 }}>{guionVoz}</p>
                </div>

                <div className={`rec-banner${grabandoEntrenamiento ? ' grabando' : ''}${vozListaParaActivar ? ' listo' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button type="button" className={`rec-mic-btn${grabandoEntrenamiento ? ' grabando' : ''}${vozListaParaActivar ? ' listo' : ''}`} onClick={() => grabandoEntrenamiento ? detenerEntrenamientoVoz() : iniciarEntrenamientoVoz()}>
                      {grabandoEntrenamiento ? '⏹' : vozListaParaActivar ? '✓' : '🎙️'}
                    </button>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: grabandoEntrenamiento ? C.blue : '#64748b', letterSpacing: '1.5px', textTransform: 'uppercase' as const, display: 'block' }}>
                        {grabandoEntrenamiento ? `GRABANDO · ${duracionVoz}s` : 'ENTRENAMIENTO DE VOZ'}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff', display: 'block', marginTop: '2px' }}>
                        {grabandoEntrenamiento ? 'Habla ahora — entrenando tu agente…' : 'Pulsa para grabar tu muestra de voz'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '3px' }}>
                        {grabandoEntrenamiento ? (vozTranscrita || 'Capturando audio…') : `Mínimo ~${VOZ_MIN_SEGUNDOS}s o una frase completa. Chrome/Edge.`}
                      </span>
                    </div>
                  </div>
                  {grabandoEntrenamiento && (
                    <button type="button" onClick={detenerEntrenamientoVoz} style={{ alignSelf: 'flex-start', padding: '7px 14px', borderRadius: '8px', border: `1px solid rgba(14,165,233,0.4)`, background: 'rgba(14,165,233,0.1)', color: C.blue, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Finalizar grabación</button>
                  )}
                </div>

                {(muestraVoz.trim().length > 0 || audioUrl) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {audioUrl && <audio controls src={audioUrl} style={{ width: '100%', borderRadius: '10px' }} />}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Transcripción de tu voz (editable)</label>
                      {transcripcionFallo && !muestraVoz.trim() && <p style={{ fontSize: '12px', color: '#fbbf24', margin: '0 0 8px' }}>No detectamos texto. Escribe tu guion o vuelve a grabar en Chrome/Edge.</p>}
                      <textarea className="ob-input" value={muestraVoz} placeholder="Aquí aparecerá lo que digas al grabar…" onChange={(e) => { const l = limpiarTranscripcion(e.target.value); setMuestraVoz(l); muestraVozRef.current = l; if (l) setTranscripcionFallo(false) }} rows={4} style={textareaBase} />
                    </div>
                  </div>
                )}

                {configError && <p style={{ fontSize: '13px', color: '#f87171', margin: 0 }}>{configError}</p>}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setPaso(3)} className="ob-btn-back" style={{ padding: '15px 24px', borderRadius: '12px', border: '1px solid #1e293b', background: 'transparent', color: '#64748b', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Atrás</button>
                  <button type="button" onClick={activarAsistente} disabled={!vozListaParaActivar} className="ob-btn-primary" style={{ flex: 1, padding: '15px 24px', borderRadius: '12px', border: 'none', background: !vozListaParaActivar ? '#334155' : C.gradBtn, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: !vozListaParaActivar ? 'not-allowed' : 'pointer', opacity: !vozListaParaActivar ? 0.5 : 1, fontFamily: FONT, boxShadow: '0 4px 16px rgba(14,165,233,0.2)' }}>
                    Activar Asistente Pulse Motor 🚀
                  </button>
                </div>
              </div>
            )}

            {/* ──────── ANALIZANDO ──────── */}
            {paso === 'analizando' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', textAlign: 'center', padding: '40px 0' }}>
                <div className="spinner" />
                <div>
                  <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: '0 0 10px', fontFamily: FONT }}>
                    Configurando tu asistente{' '}
                    <span style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Pulse Motor</span>
                  </h2>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{loadingText}</p>
                </div>
              </div>
            )}

            {/* ──────── ÉXITO ──────── */}
            {paso === 'exito' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '44px' }}>⚡</span>
                  <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, color: '#fff', margin: '8px 0', fontFamily: FONT }}>
                    ¡Tu asistente{' '}
                    <span style={{ background: C.gradText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Pulse Motor</span>{' '}está listo!
                  </h1>
                  <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '480px', margin: '0 auto', fontWeight: 400 }}>
                    Hola <strong style={{ color: '#fff' }}>{nombre.split(' ')[0]}</strong>, configuramos tu motor Speed-to-Lead con foco en carros nuevos {marcaLabel}.
                    {vozListaParaActivar && <span style={{ display: 'block', marginTop: '8px', color: C.green, fontSize: '13px', fontWeight: 600 }}>✓ Voz del asesor entrenada en el agente</span>}
                  </p>
                </div>

                <div style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: C.blue, display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>PERFIL</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{agentConfig?.perfil ?? `Asesor de Ventas ${marcaLabel} 🚗`}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: C.green, display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>ESPECIALIZACIÓN</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{agentConfig?.especializacion ?? getVehiculo()}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>PROPUESTA DE VALOR</span>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', margin: 0, fontWeight: 400 }}>{agentConfig?.propuesta_valor}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: C.blue, letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>PRIMER MENSAJE WHATSAPP</span>
                    <div style={{ background: '#020617', border: `1px solid rgba(14,165,233,0.15)`, borderRadius: '10px', padding: '14px', fontFamily: 'monospace', fontSize: '13px', color: '#7dd3fc', lineHeight: '1.5' }}>
                      &quot;{agentConfig?.primer_mensaje ?? `¡Hola! Soy el asistente de ${nombre.split(' ')[0]}. ¿En qué modelo de ${marcaLabel} puedo ayudarte? 🚗`}&quot;
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="ob-btn-primary" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: C.gradBtn, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT, boxShadow: '0 4px 16px rgba(14,165,233,0.2)' }} onClick={() => { window.location.href = '/pulse/agente?from=onboarding' }}>
                    Entrenar y personalizar mi agente 🤖
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="ob-btn-primary" style={{ flex: 1, padding: '13px', borderRadius: '12px', border: 'none', background: 'rgba(14,165,233,0.15)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT }} onClick={() => { const t = agentConfig?.primer_mensaje || '¡Hola!'; window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t)}`, '_blank') }}>
                      Probar en WhatsApp 📲
                    </button>
                    <button style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '1px solid #1e293b', background: 'transparent', color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT }} onClick={() => { window.location.href = '/pulse/dashboard' }}>
                      Dashboard de Leads 📊
                    </button>
                  </div>
                </div>

                <button onClick={() => {
                  setRespuesta1(''); setRespuesta2(''); setNombre(''); setWhatsapp(''); setEmail('')
                  setMuestraVoz(''); setDuracionVoz(0)
                  if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null)
                  audioBlobRef.current = null; setAgentConfig(null); setConfigError(''); setPaso(1)
                }} style={{ alignSelf: 'center', padding: '6px 14px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#475569', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: FONT }}>
                  Volver a empezar
                </button>
              </div>
            )}

          </div>
        </main>

        <footer style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: '#334155', borderTop: '1px solid rgba(255,255,255,0.04)', fontFamily: FONT }}>
          © 2026 Pulse Motor · Asistente IA para Asesores de Vehículos Nuevos · Hecho en Cali 🇨🇴
        </footer>
      </div>
    </>
  )
}
