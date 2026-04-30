// Ruta destino: src/components/landing/HeroSection.tsx
// FASE 3 - Aplica el tema del sector. Mantiene compatibilidad: si no recibe tema, usa default.

'use client'

import type { SectorKey } from '@/lib/sector-themes'
import { getTheme } from '@/lib/sector-themes'

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
  tema?: SectorKey | string
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
  tema,
  onCtaClick,
}: Props) {

  const theme = getTheme(tema)
  const tieneImagen = !!imagenHero?.trim()

  // Si los textos están vacíos, usar defaults del tema
  const tituloFinal = titulo?.trim() || theme.tituloDefault
  const subtituloFinal = subtitulo?.trim() || theme.subtituloDefault
  const badgeFinal = badgePromo?.trim() || theme.badgePromoDefault
  const ctaFinal = ctaTexto?.trim() || theme.ctaTextoDefault
  const microcopyFinal = ctaMicrocopy?.trim() || theme.ctaMicrocopyDefault

  // Background suave según el tema
  const bgGradient = `linear-gradient(180deg, #fff 0%, ${colorAcento}08 100%)`

  return (
    <section
      id="cta-principal"
      style={{
        padding: '40px 24px 32px',
        background: bgGradient,
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div className="hero-grid">

          <div>
            {badgeFinal && (
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
                  {badgeFinal}
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
              fontFamily: theme.fontHero,
              whiteSpace: 'pre-line',
            }}>
              {tituloFinal}
            </h1>

            <p style={{
              fontSize: 'clamp(17px, 1.8vw, 19px)',
              lineHeight: 1.55,
              color: '#555',
              margin: '0 0 26px',
              maxWidth: '520px',
            }}>
              {subtituloFinal}
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
                  padding: '15px 26px',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: `0 8px 20px ${colorAcento}3a`,
                  fontFamily: 'inherit',
                }}
              >
                {ctaFinal} →
              </button>
              <button
                onClick={onCtaClick}
                style={{
                  background: '#fff',
                  color: '#111',
                  border: '0.5px solid #ddd',
                  borderRadius: '12px',
                  padding: '15px 22px',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Ver más
              </button>
            </div>

            <div style={{ fontSize: '14px', color: '#888' }}>
              {microcopyFinal}
            </div>
          </div>

          <div style={{
            aspectRatio: '4/5',
            background: tieneImagen
              ? `url(${imagenHero}) center/cover`
              : `linear-gradient(135deg, ${colorAcento}20, ${colorAcento}40)`,
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
                flexDirection: 'column',
                color: colorAcento,
                opacity: 0.7,
              }}>
                <div style={{ fontSize: '64px', marginBottom: '8px' }}>{theme.emoji}</div>
                <div style={{ fontSize: '12px' }}>Sube una imagen desde tu dashboard</div>
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
