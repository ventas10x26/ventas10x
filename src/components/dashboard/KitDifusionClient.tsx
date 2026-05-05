// Ruta destino: src/components/dashboard/KitDifusionClient.tsx
'use client'
import { useRef, useState } from 'react'

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

const COPIES_WA = (nombre: string, slug: string, empresa: string) => [
  `Hola 👋 Soy ${nombre}${empresa ? ` de ${empresa}` : ''} y quería compartirte mi nuevo espacio digital donde puedes ver mis productos, cotizar y escribirme directo:\n\n🔗 ventas10x.co/u/${slug}\n\nTe respondo en minutos. ¡Escríbeme cuando quieras!`,
  `✨ Ya tengo mi página de ventas profesional lista.\n\nPuedes ver mi catálogo, conocer mis servicios y contactarme por WhatsApp desde aquí:\n👉 ventas10x.co/u/${slug}\n\n¿Te interesa algo? Con gusto te asesoro 🙌`,
  `📱 Comparto contigo mi link directo donde puedes ver todo lo que ofrezco y contactarme fácilmente:\n\nventas10x.co/u/${slug}\n\n${nombre} · Atención personalizada garantizada ✅`,
]

const COPIES_IG = (nombre: string, slug: string) => [
  `🚀 ¡Ya tengo mi espacio digital!\nEncuentra mis productos y escríbeme directo:\nventas10x.co/u/${slug}\n\n#ventas #emprendimiento #colombia`,
  `✨ Nueva forma de conectar contigo.\nVe mi catálogo y cotiza en segundos:\nventas10x.co/u/${slug}\n\n#asesor #negocio #latam`,
  `💼 Tu asesor de confianza ahora tiene página propia.\nVisítame y escríbeme:\nventas10x.co/u/${slug}\n\n#ventas10x #emprendedor`,
]

const COPIES_EMAIL = (nombre: string, slug: string, empresa: string, titulo: string) => [
  {
    asunto: `${nombre} tiene algo especial para ti`,
    cuerpo: `Hola,\n\nQuería compartirte mi nueva página de ventas donde puedes ver todo lo que ofrezco y contactarme directamente por WhatsApp.\n\n${titulo}\n\n👉 ventas10x.co/u/${slug}\n\nEn mi página encuentras:\n• Mi catálogo completo de productos\n• Opción de cotización rápida\n• Chat directo conmigo\n\n¡Escríbeme cuando quieras!\n\n${nombre}${empresa ? `\n${empresa}` : ''}`,
  },
  {
    asunto: `Mi espacio digital ya está listo — ${nombre}`,
    cuerpo: `Hola,\n\nAcabo de lanzar mi página profesional de ventas y quería que fueras de los primeros en conocerla.\n\nPuedes ver mis servicios, revisar el catálogo y contactarme todo desde un solo lugar:\n\n🔗 ventas10x.co/u/${slug}\n\nTe respondo en minutos. ¡Espero verte pronto!\n\n${nombre}${empresa ? `\n${empresa}` : ''}`,
  },
]

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

export function KitDifusionClient({ nombre, empresa, industria, slug, colorAcento, titulo, subtitulo, avatarUrl, initials }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generando, setGenerando] = useState(false)
  const [descargado, setDescargado] = useState(false)
  const [tabActiva, setTabActiva] = useState<'historia' | 'whatsapp' | 'instagram' | 'email'>('historia')
  const [idxCopy, setIdxCopy] = useState(0)

  const landingUrl = `ventas10x.co/u/${slug}`
  const copiesWa = COPIES_WA(nombre, slug, empresa)
  const copiesIg = COPIES_IG(nombre, slug)
  const copiesEmail = COPIES_EMAIL(nombre, slug, empresa, titulo)

  const generarImagen = async () => {
    setGenerando(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1080
    canvas.height = 1920

    // Fondo degradado oscuro
    const grad = ctx.createLinearGradient(0, 0, 0, 1920)
    grad.addColorStop(0, '#0b1120')
    grad.addColorStop(0.6, '#0f1c2e')
    grad.addColorStop(1, '#0b1120')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1080, 1920)

    // Glow superior
    const radGrad = ctx.createRadialGradient(1080, 0, 0, 1080, 0, 600)
    radGrad.addColorStop(0, `${colorAcento}30`)
    radGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = radGrad
    ctx.fillRect(0, 0, 1080, 1920)

    // Glow inferior
    const radGrad2 = ctx.createRadialGradient(0, 1920, 0, 0, 1920, 500)
    radGrad2.addColorStop(0, `${colorAcento}20`)
    radGrad2.addColorStop(1, 'transparent')
    ctx.fillStyle = radGrad2
    ctx.fillRect(0, 0, 1080, 1920)

    // Logo Ventas10x arriba
    ctx.fillStyle = colorAcento
    roundRect(ctx, 80, 80, 72, 72, 18)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 28px Inter, system-ui, sans-serif'
    ctx.fillText('V10x', 95, 125)

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 36px Inter, system-ui, sans-serif'
    ctx.fillText('Ventas', 170, 120)
    ctx.fillStyle = colorAcento
    ctx.fillText('10x', 170 + ctx.measureText('Ventas').width, 120)

    // Avatar del vendedor (círculo)
    const cx = 540
    const cy = 560
    const r = 140

    // Si tiene avatar URL, intentamos cargar la imagen
    if (avatarUrl) {
      try {
        const img = await loadImage(avatarUrl)
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2)
        ctx.restore()
      } catch {
        drawInitialsAvatar(ctx, cx, cy, r, colorAcento, initials)
      }
    } else {
      drawInitialsAvatar(ctx, cx, cy, r, colorAcento, initials)
    }

    // Ring alrededor del avatar
    ctx.strokeStyle = colorAcento
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(cx, cy, r + 12, 0, Math.PI * 2)
    ctx.stroke()

    // Nombre
    ctx.fillStyle = '#f8fafc'
    ctx.font = 'bold 64px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(nombre, 540, 780)

    // Empresa / industria
    if (empresa || industria) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.font = '36px Inter, system-ui, sans-serif'
      ctx.fillText([empresa, industria].filter(Boolean).join(' · '), 540, 840)
    }

    // Línea decorativa
    ctx.strokeStyle = `${colorAcento}60`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(200, 900)
    ctx.lineTo(880, 900)
    ctx.stroke()

    // Título de la landing
    ctx.fillStyle = '#f1f5f9'
    ctx.font = 'bold 52px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    wrapText(ctx, titulo, 540, 990, 900, 68)

    // Subtítulo
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '34px Inter, system-ui, sans-serif'
    wrapText(ctx, subtitulo, 540, 1180, 860, 50)

    // CTA box
    ctx.fillStyle = colorAcento
    roundRect(ctx, 140, 1380, 800, 100, 24)
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 40px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('¡Visítame ahora!', 540, 1442)

    // URL
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '32px Inter, system-ui, sans-serif'
    ctx.fillText(landingUrl, 540, 1570)

    // Badge Ventas10x abajo
    ctx.fillStyle = 'rgba(255,255,255,.08)'
    roundRect(ctx, 340, 1740, 400, 60, 30)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.5)'
    ctx.font = '24px Inter, system-ui, sans-serif'
    ctx.fillText('Creado con Ventas10x', 540, 1778)

    setGenerando(false)
    setDescargado(false)
  }

  const descargar = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `historia-${slug || 'ventas10x'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDescargado(true)
  }

  const compartirWa = () => {
    const texto = encodeURIComponent(`🚀 ¡Ya tengo mi página profesional de ventas!\n\n👉 ${landingUrl}\n\nContáctame directo por aquí.`)
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  const tabs = [
    { key: 'historia', label: '📸 Historia' },
    { key: 'whatsapp', label: '💬 WhatsApp' },
    { key: 'instagram', label: '📷 Instagram' },
    { key: 'email', label: '📧 Email' },
  ]

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>🚀 Kit de Difusión</h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Genera tu historia para Instagram, copies para WhatsApp y email — todo listo para compartir en un clic.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTabActiva(t.key as typeof tabActiva)} style={{ padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', background: tabActiva === t.key ? DARK : '#f1f5f9', color: tabActiva === t.key ? '#fff' : '#64748b' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Historia */}
      {tabActiva === 'historia' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Preview */}
          <div>
            <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Preview de la historia (1080×1920)</div>
              <canvas ref={canvasRef} style={{ width: '100%', borderRadius: '12px', display: 'block', aspectRatio: '9/16', background: DARK }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={generarImagen} disabled={generando} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: generando ? '#e2e8f0' : colorAcento, color: generando ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: generando ? 'default' : 'pointer' }}>
                {generando ? 'Generando...' : '✨ Generar historia'}
              </button>
              <button onClick={descargar} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: descargado ? '#f0fdf4' : DARK, color: descargado ? '#16a34a' : '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                {descargado ? '✓ Descargado' : '⬇️ Descargar PNG'}
              </button>
            </div>
          </div>

          {/* Instrucciones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>📱 Cómo publicar en Instagram</h3>
              {[
                'Haz clic en "Generar historia" y luego "Descargar PNG"',
                'Abre Instagram en tu celular',
                'Toca el "+" → Historia → sube la imagen descargada',
                'Agrega el sticker de link con tu URL: ' + landingUrl,
                '¡Publica y espera los mensajes!',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${colorAcento}20`, color: colorAcento, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, paddingTop: '3px' }}>{step}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>📸 Cómo publicar como estado de WhatsApp</h3>
              {[
                'Descarga el PNG en tu celular',
                'Abre WhatsApp → Estados → ícono de foto',
                'Selecciona la imagen descargada',
                'Agrega tu link como texto: ' + landingUrl,
                '¡Tus contactos verán tu página!',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(37,211,102,.15)', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, paddingTop: '3px' }}>{step}</div>
                </div>
              ))}
            </div>

            <button onClick={compartirWa} style={{ padding: '14px', borderRadius: '12px', background: '#25D366', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              💬 Compartir por WhatsApp ahora
            </button>
          </div>
        </div>
      )}

      {/* Tab WhatsApp */}
      {tabActiva === 'whatsapp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 18px', fontSize: '13px', color: '#15803d' }}>
            💡 Elige el mensaje que más se adapte a tu estilo y cópialo. Pégalo en WhatsApp y envíalo a tus contactos o grupos.
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
            {copiesWa.map((_, i) => (
              <button key={i} onClick={() => setIdxCopy(i)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: idxCopy === i ? '#25D366' : '#f1f5f9', color: idxCopy === i ? '#fff' : '#64748b' }}>
                Opción {i + 1}
              </button>
            ))}
          </div>
          <CopyBlock label="Mensaje para WhatsApp" texto={copiesWa[idxCopy]} color="#25D366" />
          <a href={`https://wa.me/?text=${encodeURIComponent(copiesWa[idxCopy])}`} target="_blank" rel="noopener noreferrer" style={{ padding: '14px', borderRadius: '12px', background: '#25D366', color: '#fff', fontWeight: 700, fontSize: '14px', textDecoration: 'none', textAlign: 'center', display: 'block', boxShadow: '0 4px 14px rgba(37,211,102,.35)' }}>
            💬 Abrir en WhatsApp
          </a>
        </div>
      )}

      {/* Tab Instagram */}
      {tabActiva === 'instagram' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '14px 18px', fontSize: '13px', color: '#7c3aed' }}>
            💡 Copia el copy y pégalo como descripción de tu publicación o historia de Instagram.
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
            {copiesIg.map((_, i) => (
              <button key={i} onClick={() => setIdxCopy(i)} style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', background: idxCopy === i ? '#8b5cf6' : '#f1f5f9', color: idxCopy === i ? '#fff' : '#64748b' }}>
                Opción {i + 1}
              </button>
            ))}
          </div>
          <CopyBlock label="Copy para Instagram" texto={copiesIg[idxCopy]} color="#8b5cf6" />
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>🔗 Tu link para el bio de Instagram</div>
            <CopyBlock label="Link directo" texto={`https://${landingUrl}`} color="#8b5cf6" />
          </div>
        </div>
      )}

      {/* Tab Email */}
      {tabActiva === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 18px', fontSize: '13px', color: '#1d4ed8' }}>
            💡 Elige una plantilla, copia el asunto y el cuerpo, y envíalo desde tu correo a tus contactos o lista de clientes.
          </div>
          {copiesEmail.map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Plantilla {i + 1}</div>
              <CopyBlock label="Asunto del email" texto={c.asunto} color="#3b82f6" />
              <CopyBlock label="Cuerpo del email" texto={c.cuerpo} color="#3b82f6" />
              <a href={`mailto:?subject=${encodeURIComponent(c.asunto)}&body=${encodeURIComponent(c.cuerpo)}`} style={{ padding: '11px', borderRadius: '10px', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '13px', textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                📧 Abrir en mi cliente de email
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Helpers Canvas ──

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
