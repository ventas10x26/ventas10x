// Ruta destino: src/components/dashboard/KitDifusionClient.tsx
'use client'
import { useRef, useState, useCallback } from 'react'

const ORANGE = '#FF6B2B'
const DARK = '#0b1120'

type Props = {
  nombre: string
  empresa: string
  industria: string
  slug: string
  colorAcento: string
  titulo: string
  subtitulo: string
  avatarUrl: string | null
  initials: string
}

// ── Copy defaults ──
const COPIES_WA = (nombre: string, slug: string, empresa: string) => [
  `Hola 👋 Soy ${nombre}${empresa ? ` de ${empresa}` : ''} y quería compartirte mi nuevo espacio digital:\n\n🔗 ventas10x.co/u/${slug}\n\nTe respondo en minutos. ¡Escríbeme!`,
  `✨ Ya tengo mi página de ventas profesional lista.\n\n👉 ventas10x.co/u/${slug}\n\n¿Te interesa algo? Con gusto te asesoro 🙌`,
  `📱 Mi link directo donde puedes ver todo lo que ofrezco:\n\nventas10x.co/u/${slug}\n\n${nombre} · Atención personalizada ✅`,
]

const COPIES_IG = (nombre: string, slug: string) => [
  `🚀 ¡Ya tengo mi espacio digital!\nEncuentra mis productos y escríbeme:\nventas10x.co/u/${slug}\n\n#ventas #emprendimiento #colombia`,
  `✨ Nueva forma de conectar contigo.\nVe mi catálogo y cotiza en segundos:\nventas10x.co/u/${slug}\n\n#asesor #negocio #latam`,
  `💼 Tu asesor de confianza ahora tiene página propia.\nVisítame:\nventas10x.co/u/${slug}\n\n#ventas10x #emprendedor`,
]

const COPIES_EMAIL = (nombre: string, slug: string, empresa: string, titulo: string) => [
  {
    asunto: `${nombre} tiene algo especial para ti`,
    cuerpo: `Hola,\n\nQuería compartirte mi nueva página de ventas.\n\n${titulo}\n\n👉 ventas10x.co/u/${slug}\n\nEncuentras mi catálogo, cotización rápida y chat directo.\n\n${nombre}${empresa ? `\n${empresa}` : ''}`,
  },
  {
    asunto: `Mi espacio digital ya está listo — ${nombre}`,
    cuerpo: `Hola,\n\nAcabo de lanzar mi página profesional:\n\n🔗 ventas10x.co/u/${slug}\n\nTe respondo en minutos.\n\n${nombre}${empresa ? `\n${empresa}` : ''}`,
  },
]

// ── Canvas helpers ──
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawInitialsAvatar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, initials: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${r * 0.6}px Inter, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(initials, cx, cy)
  ctx.textBaseline = 'alphabetic'
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  for (const word of words) {
    const testLine = line + word + ' '
    if (ctx.measureText(testLine).width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, currentY)
      line = word + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, currentY)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ── Componentes UI ──
function CopyBlock({ label, texto, color }: { label: string; texto: string; color: string }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = () => {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{label}</span>
        <button onClick={copiar} style={{ fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '8px', border: 'none', background: copiado ? '#f0fdf4' : `${color}15`, color: copiado ? '#16a34a' : color, cursor: 'pointer' }}>
          {copiado ? '✓ Copiado' : '📋 Copiar'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '14px 16px', fontSize: '13px', color: '#374151', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>
        {texto}
      </pre>
    </div>
  )
}

// ── Agente IA ──
type KitIA = {
  copies_wa: string[]
  copies_ig: string[]
  asunto_email: string
  cuerpo_email: string
  estrategia: { dia: string; hora: string; formato: string; tip: string }[]
  hashtags: string[]
}

function AgenteKitIA({
  nombre, empresa, industria, slug, colorAcento,
  onApply,
}: {
  nombre: string; empresa: string; industria: string; slug: string; colorAcento: string
  onApply: (kit: KitIA) => void
}) {
  const [instruccion, setInstruccion] = useState('')
  const [generando, setGenerando] = useState(false)
  const [historial, setHistorial] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: `¡Hola! Soy tu agente de difusión ✨\n\nPuedo generar copies personalizados para WhatsApp, Instagram y email, además de una estrategia de publicación para tu sector (${industria || 'general'}).\n\nDime qué quieres lograr o usa una sugerencia.` }
  ])
  const [aplicado, setAplicado] = useState(false)

  const SUGERENCIAS = [
    `Genera kit completo para ${industria || 'mi negocio'}`,
    'Enfócate en conseguir leads esta semana',
    'Estrategia para lanzamiento de nuevo producto',
    'Copies para reactivar clientes inactivos',
  ]

  const generar = async () => {
    if (!instruccion.trim() || generando) return
    const texto = instruccion.trim()
    setInstruccion('')
    setGenerando(true)
    setHistorial(prev => [...prev, { role: 'user', text: texto }])

    try {
      const res = await fetch('/api/dashboard/kit-difusion-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruccion: texto, nombre, empresa, industria, slug }),
      })
      const data = await res.json()
      if (data.ok) {
        setHistorial(prev => [...prev, {
          role: 'ai',
          text: `✅ Kit generado para ${nombre}${empresa ? ` · ${empresa}` : ''}!\n\n📱 ${data.copies_wa?.length || 0} copies de WhatsApp\n📷 ${data.copies_ig?.length || 0} copies de Instagram\n📧 Email personalizado\n📅 ${data.estrategia?.length || 0} días de estrategia\n\n✅ El contenido ya fue aplicado a todas las tabs. Ve a WhatsApp, Instagram, Email o Estrategia para verlo.`,
        }])
        onApply(data)
        setAplicado(true)
      } else {
        setHistorial(prev => [...prev, { role: 'ai', text: '⚠️ Error generando el kit. Intenta de nuevo.' }])
      }
    } catch {
      setHistorial(prev => [...prev, { role: 'ai', text: '❌ Error de conexión.' }])
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${colorAcento}30`, padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${colorAcento}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✨</div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Agente IA de Difusión</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Copy personalizado + estrategia por sector</div>
        </div>
        {aplicado && <div style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: '#22c55e', background: '#f0fdf4', padding: '4px 10px', borderRadius: '999px' }}>✓ Aplicado</div>}
      </div>

      {/* Chat */}
      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '12px', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {historial.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: msg.role === 'user' ? colorAcento : '#fff', color: msg.role === 'user' ? '#fff' : '#374151', fontSize: '13px', lineHeight: 1.5, border: msg.role === 'ai' ? '1px solid #e2e8f0' : 'none', whiteSpace: 'pre-line' }}>
              {msg.text}
            </div>
          </div>
        ))}
        {generando && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: colorAcento, animation: `kitbounce .8s ${i * .15}s infinite` }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias */}
      {historial.length === 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {SUGERENCIAS.map(s => (
            <button key={s} onClick={() => setInstruccion(s)} style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer', fontWeight: 500 }}>{s}</button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={instruccion} onChange={e => setInstruccion(e.target.value)} onKeyDown={e => e.key === 'Enter' && generar()} placeholder="¿Qué objetivo tienes esta semana?" disabled={generando}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
        <button onClick={generar} disabled={generando || !instruccion.trim()} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: instruccion.trim() && !generando ? colorAcento : '#e2e8f0', color: instruccion.trim() && !generando ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: '13px', cursor: instruccion.trim() && !generando ? 'pointer' : 'default' }}>
          {generando ? '...' : '✨ Generar'}
        </button>
      </div>
      <style>{`@keyframes kitbounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  )
}

// ── Componente principal ──
export function KitDifusionClient({ nombre, empresa, industria, slug, colorAcento, titulo, subtitulo, avatarUrl, initials }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoCanvasRef = useRef<HTMLCanvasElement>(null)
  const [generandoImg, setGenerandoImg] = useState(false)
  const [generandoVideo, setGenerandoVideo] = useState(false)
  const [descargadoImg, setDescargadoImg] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [tabActiva, setTabActiva] = useState<'historia' | 'video' | 'whatsapp' | 'instagram' | 'email' | 'estrategia'>('historia')
  const [idxCopy, setIdxCopy] = useState(0)

  // Copies — pueden ser sobreescritos por el agente
  const [copiesWa, setCopiesWa] = useState(COPIES_WA(nombre, slug, empresa))
  const [copiesIg, setCopiesIg] = useState(COPIES_IG(nombre, slug))
  const [copiesEmail, setCopiesEmail] = useState(COPIES_EMAIL(nombre, slug, empresa, titulo))
  const [estrategia, setEstrategia] = useState<{ dia: string; hora: string; formato: string; tip: string }[]>([])
  const [hashtags, setHashtags] = useState<string[]>([])

  const landingUrl = `ventas10x.co/u/${slug}`

  const handleKitIA = (kit: KitIA) => {
    if (kit.copies_wa?.length) setCopiesWa(kit.copies_wa)
    if (kit.copies_ig?.length) setCopiesIg(kit.copies_ig)
    if (kit.asunto_email && kit.cuerpo_email) {
      setCopiesEmail([{ asunto: kit.asunto_email, cuerpo: kit.cuerpo_email }, ...copiesEmail.slice(1)])
    }
    if (kit.estrategia?.length) setEstrategia(kit.estrategia)
    if (kit.hashtags?.length) setHashtags(kit.hashtags)
  }

  // ── Dibuja un frame del canvas ──
  const drawFrame = useCallback(async (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, avatarImg: HTMLImageElement | null) => {
    // Fondo
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#0b1120')
    grad.addColorStop(0.6, '#0f1c2e')
    grad.addColorStop(1, '#0b1120')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Glow animado
    const glowX = w * 0.8 + Math.sin(t * 0.02) * 80
    const radGrad = ctx.createRadialGradient(glowX, 0, 0, glowX, 0, w * 0.6)
    radGrad.addColorStop(0, `${colorAcento}25`)
    radGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = radGrad
    ctx.fillRect(0, 0, w, h)

    // Logo
    ctx.fillStyle = colorAcento
    roundRect(ctx, 40, 40, 48, 48, 12)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('V10x', 52, 70)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 22px Inter, system-ui, sans-serif'
    ctx.fillText('Ventas', 100, 70)
    ctx.fillStyle = colorAcento
    ctx.fillText('10x', 100 + ctx.measureText('Ventas').width, 70)

    // Avatar — aparece con fade-in
    const avatarAlpha = Math.min(1, t / 30)
    const cy = h * 0.38
    const r = Math.min(w * 0.14, 80)
    ctx.globalAlpha = avatarAlpha
    if (avatarImg) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(w / 2, cy, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(avatarImg, w / 2 - r, cy - r, r * 2, r * 2)
      ctx.restore()
    } else {
      drawInitialsAvatar(ctx, w / 2, cy, r, colorAcento, initials)
    }
    ctx.globalAlpha = 1

    // Ring pulsante
    const pulse = 1 + Math.sin(t * 0.08) * 0.04
    ctx.strokeStyle = colorAcento
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.7 + Math.sin(t * 0.08) * 0.3
    ctx.beginPath()
    ctx.arc(w / 2, cy, (r + 8) * pulse, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1

    // Nombre — slide up
    const nameY = h * 0.57 - Math.max(0, (30 - t) * 3)
    const nameAlpha = Math.min(1, t / 20)
    ctx.globalAlpha = nameAlpha
    ctx.fillStyle = '#f8fafc'
    ctx.font = `bold ${Math.min(w * 0.07, 42)}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(nombre, w / 2, nameY)

    if (empresa || industria) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = `${Math.min(w * 0.04, 22)}px Inter, system-ui, sans-serif`
      ctx.fillText([empresa, industria].filter(Boolean).join(' · '), w / 2, nameY + 36)
    }
    ctx.globalAlpha = 1

    // Línea separadora
    if (t > 20) {
      const lineAlpha = Math.min(1, (t - 20) / 15)
      ctx.globalAlpha = lineAlpha * 0.4
      ctx.strokeStyle = colorAcento
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(w * 0.15, h * 0.63)
      ctx.lineTo(w * 0.85, h * 0.63)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // Título
    if (t > 30) {
      const textAlpha = Math.min(1, (t - 30) / 20)
      ctx.globalAlpha = textAlpha
      ctx.fillStyle = '#f1f5f9'
      ctx.font = `bold ${Math.min(w * 0.05, 28)}px Inter, system-ui, sans-serif`
      ctx.textAlign = 'center'
      wrapText(ctx, titulo, w / 2, h * 0.68, w * 0.85, 36)
      ctx.globalAlpha = 1
    }

    // CTA animado
    if (t > 50) {
      const ctaAlpha = Math.min(1, (t - 50) / 20)
      const ctaScale = 0.9 + Math.min(0.1, (t - 50) / 100)
      ctx.globalAlpha = ctaAlpha
      ctx.save()
      ctx.translate(w / 2, h * 0.83)
      ctx.scale(ctaScale, ctaScale)
      ctx.fillStyle = colorAcento
      roundRect(ctx, -w * 0.36, -28, w * 0.72, 56, 16)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${Math.min(w * 0.045, 24)}px Inter, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('¡Visítame ahora!', 0, 0)
      ctx.textBaseline = 'alphabetic'
      ctx.restore()

      // URL parpadeante
      if (t > 60) {
        const urlAlpha = 0.5 + Math.sin(t * 0.1) * 0.2
        ctx.globalAlpha = urlAlpha * ctaAlpha
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.font = `${Math.min(w * 0.032, 18)}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(landingUrl, w / 2, h * 0.91)
      }
      ctx.globalAlpha = 1
    }

    // Badge bottom
    ctx.fillStyle = 'rgba(255,255,255,.06)'
    roundRect(ctx, w * 0.25, h * 0.94, w * 0.5, 30, 15)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.35)'
    ctx.font = `${Math.min(w * 0.028, 14)}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('Creado con Ventas10x', w / 2, h * 0.94 + 20)
  }, [nombre, empresa, industria, slug, colorAcento, titulo, landingUrl, initials])

  // ── Generar imagen estática ──
  const generarImagen = async () => {
    setGenerandoImg(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = 1080
    canvas.height = 1920
    let avatarImg: HTMLImageElement | null = null
    if (avatarUrl) {
      try { avatarImg = await loadImage(avatarUrl) } catch {}
    }
    await drawFrame(ctx, 1080, 1920, 80, avatarImg)
    setGenerandoImg(false)
    setDescargadoImg(false)
  }

  const descargarImagen = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `historia-${slug || 'ventas10x'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDescargadoImg(true)
  }

  // ── Generar video animado ──
  const generarVideo = async () => {
    setGenerandoVideo(true)
    setVideoUrl(null)

    const canvas = videoCanvasRef.current
    if (!canvas) { setGenerandoVideo(false); return }

    const W = 540
    const H = 960
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) { setGenerandoVideo(false); return }

    let avatarImg: HTMLImageElement | null = null
    if (avatarUrl) {
      try { avatarImg = await loadImage(avatarUrl) } catch {}
    }

    const stream = canvas.captureStream(30)
    const chunks: Blob[] = []
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 })

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
      setGenerandoVideo(false)
    }

    const FPS = 30
    const DURATION = 8 // segundos
    const TOTAL_FRAMES = FPS * DURATION
    let frame = 0

    recorder.start()

    const renderLoop = () => {
      if (frame >= TOTAL_FRAMES) {
        recorder.stop()
        return
      }
      drawFrame(ctx, W, H, frame, avatarImg)
      frame++
      setTimeout(renderLoop, 1000 / FPS)
    }

    renderLoop()
  }

  const descargarVideo = () => {
    if (!videoUrl) return
    const link = document.createElement('a')
    link.download = `historia-video-${slug || 'ventas10x'}.webm`
    link.href = videoUrl
    link.click()
  }

  const compartirWa = () => {
    const texto = encodeURIComponent(`🚀 ¡Ya tengo mi página profesional!\n\n👉 https://${landingUrl}`)
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  const compartirNativo = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `historia-${slug}.png`, { type: 'image/png' })
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${nombre} · ${empresa || 'Ventas10x'}`,
            text: `¡Visítame en ventas10x.co/u/${slug}!`,
          })
        } else {
          descargarImagen()
        }
      }, 'image/png')
    } catch {
      console.log('Share cancelled')
    }
  }

  const tabs = [
    { key: 'historia', label: '📸 Historia' },
    { key: 'video', label: '🎬 Video' },
    { key: 'whatsapp', label: '💬 WhatsApp' },
    { key: 'instagram', label: '📷 Instagram' },
    { key: 'email', label: '📧 Email' },
    { key: 'estrategia', label: '📅 Estrategia' },
  ]

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>🚀 Kit de Difusión</h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Genera tu historia, video, copies para redes y estrategia de publicación — todo personalizado con IA.</p>
      </div>

      {/* Agente IA */}
      <AgenteKitIA nombre={nombre} empresa={empresa} industria={industria} slug={slug} colorAcento={colorAcento} onApply={handleKitIA} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTabActiva(t.key as typeof tabActiva); setIdxCopy(0) }} style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', background: tabActiva === t.key ? DARK : '#f1f5f9', color: tabActiva === t.key ? '#fff' : '#64748b' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Historia */}
      {tabActiva === 'historia' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Preview (1080×1920)</div>
              <canvas ref={canvasRef} style={{ width: '100%', borderRadius: '12px', display: 'block', aspectRatio: '9/16', background: DARK }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={generarImagen} disabled={generandoImg} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: generandoImg ? '#e2e8f0' : colorAcento, color: generandoImg ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: generandoImg ? 'default' : 'pointer' }}>
                {generandoImg ? 'Generando...' : '✨ Generar'}
              </button>
              <button onClick={descargarImagen} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: descargadoImg ? '#f0fdf4' : DARK, color: descargadoImg ? '#16a34a' : '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                {descargadoImg ? '✓ Descargado' : '⬇️ Descargar PNG'}
              </button>
              <button onClick={compartirNativo} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#8b5cf6', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                📤 Compartir
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { titulo: '📱 Publicar en Instagram', pasos: ['Genera y descarga el PNG', 'Abre Instagram en tu celular', 'Toca "+" → Historia → sube la imagen', `Agrega sticker de link: ${landingUrl}`, '¡Publica y espera los mensajes!'], color: '#8b5cf6' },
              { titulo: '📸 Estado de WhatsApp', pasos: ['Descarga el PNG en tu celular', 'Abre WhatsApp → Estados', 'Toca el ícono de foto', 'Selecciona la imagen descargada', `Agrega el texto: ${landingUrl}`], color: '#25D366' },
            ].map(sec => (
              <div key={sec.titulo} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '18px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>{sec.titulo}</h3>
                {sec.pasos.map((paso, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${sec.color}20`, color: sec.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, paddingTop: '3px' }}>{paso}</div>
                  </div>
                ))}
              </div>
            ))}
            <button onClick={compartirWa} style={{ padding: '13px', borderRadius: '12px', background: '#25D366', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,211,102,.3)' }}>
              💬 Compartir link por WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Tab Video */}
      {tabActiva === 'video' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Video animado — 8 segundos · WebM</div>
              <canvas ref={videoCanvasRef} style={{ width: '100%', borderRadius: '12px', display: 'block', aspectRatio: '9/16', background: DARK }} />
              {videoUrl && (
                <video src={videoUrl} controls loop style={{ width: '100%', borderRadius: '12px', marginTop: '12px' }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={generarVideo} disabled={generandoVideo} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: generandoVideo ? '#e2e8f0' : colorAcento, color: generandoVideo ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: generandoVideo ? 'default' : 'pointer' }}>
                {generandoVideo ? '🎬 Grabando...' : '🎬 Generar video'}
              </button>
              {videoUrl && (
                <button onClick={descargarVideo} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: DARK, color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  ⬇️ Descargar WebM
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 18px', fontSize: '13px', color: '#92400e' }}>
              ⚠️ La generación del video toma ~10 segundos. Mantén la pestaña abierta durante el proceso.
            </div>
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '18px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>🎬 Cómo usar el video</h3>
              {['Haz clic en "Generar video" y espera', 'Descarga el archivo WebM', 'Súbelo a Instagram Reels o Stories', 'Publica en WhatsApp como estado de video', 'Comparte en cualquier plataforma que soporte WebM'].map((paso, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `${colorAcento}20`, color: colorAcento, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, paddingTop: '3px' }}>{paso}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 18px', fontSize: '13px', color: '#15803d' }}>
              💡 El video tiene 8 segundos con animaciones de entrada, avatar pulsante y CTA final. Perfecto para historias.
            </div>
          </div>
        </div>
      )}

      {/* Tab WhatsApp */}
      {tabActiva === 'whatsapp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#15803d' }}>
            💡 {hashtags.length > 0 ? `Hashtags sugeridos: ${hashtags.slice(0, 5).join(' ')}` : 'Elige el mensaje que más se adapte a tu estilo.'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {copiesWa.map((_, i) => (
              <button key={i} onClick={() => setIdxCopy(i)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: idxCopy === i ? '#25D366' : '#f1f5f9', color: idxCopy === i ? '#fff' : '#64748b' }}>
                Opción {i + 1}
              </button>
            ))}
          </div>
          <CopyBlock label="Mensaje para WhatsApp" texto={copiesWa[idxCopy]} color="#25D366" />
          <a href={`https://wa.me/?text=${encodeURIComponent(copiesWa[idxCopy])}`} target="_blank" rel="noopener noreferrer" style={{ padding: '13px', borderRadius: '12px', background: '#25D366', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', textAlign: 'center', display: 'block', boxShadow: '0 4px 14px rgba(37,211,102,.3)' }}>
            💬 Abrir en WhatsApp
          </a>
        </div>
      )}

      {/* Tab Instagram */}
      {tabActiva === 'instagram' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#7c3aed' }}>
            💡 Copia el copy y pégalo como descripción de tu historia o post.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {copiesIg.map((_, i) => (
              <button key={i} onClick={() => setIdxCopy(i)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: idxCopy === i ? '#8b5cf6' : '#f1f5f9', color: idxCopy === i ? '#fff' : '#64748b' }}>
                Opción {i + 1}
              </button>
            ))}
          </div>
          <CopyBlock label="Copy para Instagram" texto={copiesIg[idxCopy]} color="#8b5cf6" />
          {hashtags.length > 0 && <CopyBlock label="Hashtags sugeridos por IA" texto={hashtags.join(' ')} color="#8b5cf6" />}
          <CopyBlock label="Link para el bio" texto={`https://${landingUrl}`} color="#8b5cf6" />
        </div>
      )}

      {/* Tab Email */}
      {tabActiva === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: '#1d4ed8' }}>
            💡 Copia el asunto y el cuerpo y envíalo desde tu correo.
          </div>
          {copiesEmail.map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Plantilla {i + 1}</div>
              <CopyBlock label="Asunto" texto={c.asunto} color="#3b82f6" />
              <CopyBlock label="Cuerpo" texto={c.cuerpo} color="#3b82f6" />
              <a href={`mailto:?subject=${encodeURIComponent(c.asunto)}&body=${encodeURIComponent(c.cuerpo)}`} style={{ padding: '10px', borderRadius: '10px', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                📧 Abrir en mi email
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Tab Estrategia */}
      {tabActiva === 'estrategia' && (
        <div>
          {estrategia.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Sin estrategia generada aún</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Usa el agente IA arriba para generar tu estrategia de publicación personalizada.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {estrategia.map((e, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${colorAcento}15`, color: colorAcento, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, textAlign: 'center', lineHeight: 1.2 }}>
                    {e.dia.slice(0, 3).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{e.dia}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{e.hora}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: `${colorAcento}15`, color: colorAcento }}>{e.formato}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.55 }}>{e.tip}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
