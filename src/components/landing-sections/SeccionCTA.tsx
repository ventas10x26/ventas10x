// Ruta destino: src/components/landing-sections/SeccionCTA.tsx

import { ContenidoCTA } from '@/types/secciones'

type Props = {
  titulo?: string | null
  subtitulo?: string | null
  contenido: ContenidoCTA
  colorAcento?: string
  whatsappVendedor?: string | null
}

export function SeccionCTA({
  titulo,
  subtitulo,
  contenido,
  colorAcento = '#FF6B2B',
  whatsappVendedor,
}: Props) {
  // Construir URL del botón
  let href = contenido.boton_url || '#'

  if (contenido.usar_whatsapp && whatsappVendedor) {
    const numero = whatsappVendedor.replace(/\D/g, '')
    const mensaje = encodeURIComponent(contenido.mensaje_wa || 'Hola, me interesa saber más')
    href = `https://wa.me/${numero}?text=${mensaje}`
  }

  return (
    <section style={{
      padding: '4rem 1.5rem',
      background: `linear-gradient(135deg, ${colorAcento} 0%, ${darken(colorAcento, 20)} 100%)`,
      color: '#fff',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        {titulo && (
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 800,
            marginBottom: subtitulo ? '0.75rem' : '1.5rem',
            lineHeight: 1.2,
          }}>
            {titulo}
          </h2>
        )}
        {subtitulo && (
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            marginBottom: '2rem',
            opacity: 0.95,
            lineHeight: 1.5,
          }}>
            {subtitulo}
          </p>
        )}

        {contenido.descripcion && (
          <p style={{
            fontSize: '1rem',
            marginBottom: '2rem',
            opacity: 0.9,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            {contenido.descripcion}
          </p>
        )}

        <a
          href={href}
          target={contenido.usar_whatsapp ? '_blank' : undefined}
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '1rem 2.5rem',
            background: '#fff',
            color: colorAcento,
            borderRadius: '12px',
            fontSize: '1.05rem',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,.2)',
            transition: 'transform .15s',
          }}
        >
          {contenido.usar_whatsapp && '💬 '}
          {contenido.boton_texto}
        </a>
      </div>
    </section>
  )
}

// Utilidad para oscurecer un color hex
function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) - amt
  const G = ((num >> 8) & 0x00ff) - amt
  const B = (num & 0x0000ff) - amt
  return (
    '#' +
    (
      0x1000000 +
      (R < 0 ? 0 : R) * 0x10000 +
      (G < 0 ? 0 : G) * 0x100 +
      (B < 0 ? 0 : B)
    )
      .toString(16)
      .slice(1)
  )
}
