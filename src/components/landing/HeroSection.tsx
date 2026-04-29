// Ruta destino: src/components/landing/HeroSection.tsx

'use client'

type Props = {
  nombreVendedor: string
  titulo: string
  subtitulo: string
  imagenHero: string
  badgePromo: string
  colorAcento: string
  ctaTexto: string
  ctaMicrocopy: string
  industria: string
  onCtaClick: () => void
}

export function HeroSection({
  titulo,
  subtitulo,
  imagenHero,
  badgePromo,
  colorAcento,
  ctaTexto,
  ctaMicrocopy,
  onCtaClick,
}: Props) {

  const tieneImagen = !!imagenHero?.trim()

  return (
    <section
      id="cta-principal"
      style={{
        padding: '40px 24px 32px',
        background: 'linear-gradient(180deg, #fff 0%, #fdf9f5 100%)',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div className="hero-grid">

          <div>
            {badgePromo && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fff',
                border: `0.5px solid ${colorAcento}40`,
                padding: '6px 14px',
                borderRadius: '100px',
                marginBottom: '20px',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#1d9e75',
                }} />
                <span style={{
                  fontSize: '12px',
                  color: colorAcento,
                  fontWeight: 500,
                }}>
                  {badgePromo}
                </span>
              </div>
            )}

            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 500,
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              color: '#0a0a0a',
              margin: '0 0 16px',
            }}>
              {titulo || 'Tu próximo cliente está a un mensaje de distancia'}
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 1.6vw, 17px)',
              lineHeight: 1.55,
              color: '#555',
              margin: '0 0 26px',
              maxWidth: '520px',
            }}>
              {subtitulo || 'Atención personalizada por WhatsApp. Te respondo rápido y sin compromiso.'}
            </p>

            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '14px',
            }}>
              <button
                onClick={onCtaClick}
                style={{
                  background: colorAcento,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: `0 8px 20px ${colorAcento}3a`,
                  fontFamily: 'inherit',
                }}
              >
                {ctaTexto} →
              </button>
              <button
                onClick={onCtaClick}
                style={{
                  background: '#fff',
                  color: '#111',
                  border: '0.5px solid #ddd',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Ver más
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#888' }}>
              ⚡ {ctaMicrocopy}
            </div>
          </div>

          <div style={{
            aspectRatio: '4/5',
            background: tieneImagen
              ? `url(${imagenHero}) center/cover`
              : 'linear-gradient(135deg, #f4ebe1, #d8c5b0)',
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden',
            maxHeight: '520px',
          }}>
            {!tieneImagen && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b6f4d',
                fontSize: '12px',
              }}>
                Sube una imagen desde tu dashboard
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 32px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </section>
  )
}
