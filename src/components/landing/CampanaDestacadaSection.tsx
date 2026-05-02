'use client'

type Props = {
  titulo: string | null
  subtitulo: string | null
  contenido: {
    imagen_url?: string
    video_url?: string
    badge?: string
    cta_texto?: string
    cta_url?: string
    usar_whatsapp: boolean
    mensaje_wa?: string
    vigencia?: string
    precio?: string
    precio_anterior?: string
    destacar_precio?: boolean
  }
  colorAcento: string
  whatsapp?: string
  onCtaClick: () => void
}

function extractIgCode(url: string): string {
  const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)
  return match ? match[2] : ''
}

export function CampanaDestacadaSection({ titulo, subtitulo, contenido, colorAcento, whatsapp, onCtaClick }: Props) {
  const tieneMedia = !!(contenido.imagen_url || contenido.video_url)

  const handleCta = () => {
    if (contenido.usar_whatsapp && whatsapp) {
      const msg = encodeURIComponent(contenido.mensaje_wa || `Hola, me interesa: ${titulo || 'la campaña'}`)
      window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank')
    } else if (contenido.cta_url) {
      window.open(contenido.cta_url, '_blank')
    } else {
      onCtaClick()
    }
  }

  return (
    <section style={{
      background: '#ffffff',
      padding: '4rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      borderTop: '1px solid #f0f0f0',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>

        {contenido.badge && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span style={{
              background: `${colorAcento}15`,
              color: colorAcento,
              border: `1px solid ${colorAcento}40`,
              padding: '6px 18px',
              borderRadius: '100px',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}>
              {contenido.badge}
            </span>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: tieneMedia ? '1fr 1fr' : '1fr',
          gap: '3rem',
          alignItems: 'center',
        }}>

          <div style={{
            textAlign: tieneMedia ? 'left' : 'center',
            maxWidth: tieneMedia ? 'none' : '640px',
            margin: tieneMedia ? '0' : '0 auto',
          }}>
            {titulo && (
              <h2 style={{
                fontSize: 'clamp(28px,4vw,48px)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                color: '#0f1c2e',
                marginBottom: '1rem',
                lineHeight: 1.05,
              }}>
                {titulo}
              </h2>
            )}
            {subtitulo && (
              <p style={{
                fontSize: '18px',
                color: '#4b5563',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}>
                {subtitulo}
              </p>
            )}

            {contenido.destacar_precio && contenido.precio && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 'clamp(32px,4vw,48px)',
                  fontWeight: 900,
                  color: colorAcento,
                  letterSpacing: '-0.03em',
                }}>
                  {contenido.precio}
                </span>
                {contenido.precio_anterior && (
                  <span style={{ fontSize: '18px', color: '#9ca3af', textDecoration: 'line-through' }}>
                    {contenido.precio_anterior}
                  </span>
                )}
              </div>
            )}

            {contenido.vigencia && (
              <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '1.5rem' }}>
                ⏳ {contenido.vigencia}
              </p>
            )}

            <button
              onClick={handleCta}
              style={{
                background: colorAcento,
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '16px 32px',
                fontSize: '17px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 8px 28px ${colorAcento}40`,
                letterSpacing: '-0.01em',
              }}
            >
              {contenido.cta_texto || 'Quiero este producto'} →
            </button>
          </div>

          {tieneMedia && (
            <div style={{
              aspectRatio: '4/5',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#f5f5f5',
              maxHeight: '520px',
              boxShadow: '0 16px 40px rgba(0,0,0,.08)',
              border: '1px solid #e5e7eb',
            }}>
              {contenido.video_url ? (
                <iframe
                  src={`https://www.instagram.com/p/${extractIgCode(contenido.video_url)}/embed/`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                  scrolling="no"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                />
              ) : contenido.imagen_url ? (
                <img
                  src={contenido.imagen_url}
                  alt={titulo || 'Campaña'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .campana-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}