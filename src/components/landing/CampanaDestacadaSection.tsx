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
        background: 'linear-gradient(135deg, #0f1c2e 0%, #1a2f4a 100%)',
        padding: '4rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle at 20% 50%, #FF6B2B 0%, transparent 50%), radial-gradient(circle at 80% 50%, #FF6B2B 0%, transparent 50%)',
        }} />
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {contenido.badge && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span style={{
              background: `${colorAcento}15`,
              color: colorAcento,
              border: `1px solid ${colorAcento}30`,
              padding: '6px 18px',
              borderRadius: '100px',
              fontSize: '13px',
              fontWeight: 700,
            }}>
              {contenido.badge}
            </span>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: tieneMedia ? '1fr 1fr' : '1fr',
          gap: '2.5rem',
          alignItems: 'center',
        }}>

          {/* Texto */}
          <div style={{ textAlign: tieneMedia ? 'left' : 'center', maxWidth: tieneMedia ? 'none' : '640px', margin: tieneMedia ? '0' : '0 auto' }}>
            {titulo && (
              <h2 style={{
                fontSize: 'clamp(26px,4vw,42px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#0a0a0a',
                marginBottom: '1rem',
                lineHeight: 1.1,
              }}>
                {titulo}
              </h2>
            )}
            {subtitulo && (
              <p style={{ fontSize: '17px', color: '#555', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {subtitulo}
              </p>
            )}

            {contenido.destacar_precio && contenido.precio && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: colorAcento, letterSpacing: '-0.03em' }}>
                  {contenido.precio}
                </span>
                {contenido.precio_anterior && (
                  <span style={{ fontSize: '18px', color: '#aaa', textDecoration: 'line-through' }}>
                    {contenido.precio_anterior}
                  </span>
                )}
              </div>
            )}

            {contenido.vigencia && (
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.25rem' }}>
                ⏳ {contenido.vigencia}
              </p>
            )}

            <button
              onClick={handleCta}
              style={{
                background: colorAcento,
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 8px 20px ${colorAcento}35`,
              }}
            >
              {contenido.cta_texto || 'Quiero este producto'} →
            </button>
          </div>

          {/* Media */}
          {tieneMedia && (
            <div style={{
              aspectRatio: '4/5',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#f5f5f5',
              maxHeight: '500px',
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