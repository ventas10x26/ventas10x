// Ruta destino: src/components/landing/HeroSection.tsx
'use client'

import { useEffect, useState } from 'react'
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
  heroVideoUrl?: string
  onCtaClick: () => void
}

function extractIgCode(url: string): string {
  const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/)
  return match ? match[2] : ''
}

// Contador animado para el badge de social proof
function AnimatedCount({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(target / 40)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(start)
    }, 30)
    return () => clearInterval(timer)
  }, [target])
  return <>{count}{suffix}</>
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
  heroVideoUrl,
  onCtaClick,
}: Props) {

  const theme = getTheme(tema)
  const tieneImagen = !!imagenHero?.trim()
  const tieneVideo = !!heroVideoUrl?.trim()

  const tituloFinal = titulo?.trim() || theme.tituloDefault
  const subtituloFinal = subtitulo?.trim() || theme.subtituloDefault
  const badgeFinal = badgePromo?.trim() || theme.badgePromoDefault
  const ctaFinal = ctaTexto?.trim() || theme.ctaTextoDefault
  const microcopyFinal = ctaMicrocopy?.trim() || theme.ctaMicrocopyDefault

  // Extraer número del badge para animarlo si aplica
  const badgeNumMatch = badgeFinal.match(/(\d+)/)
  const badgeNum = badgeNumMatch ? parseInt(badgeNumMatch[1]) : null
  const badgePrefix = badgeNumMatch ? badgeFinal.slice(0, badgeFinal.indexOf(badgeNumMatch[1])) : ''
  const badgeSuffix = badgeNumMatch ? badgeFinal.slice(badgeFinal.indexOf(badgeNumMatch[1]) + badgeNumMatch[1].length) : badgeFinal

  // Pulso de urgencia
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <section
      id="cta-principal"
      style={{
        padding: '52px 24px 48px',
        background: `linear-gradient(160deg, #0b1120 0%, #0f1c2e 55%, ${colorAcento}18 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow decorativo de fondo */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: `radial-gradient(circle, ${colorAcento}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-120px', left: '-60px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: `radial-gradient(circle, ${colorAcento}12 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
        <div className="hero-grid">

          {/* ── Columna de texto ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* Badge social proof animado */}
            {badgeFinal && (
              <div className="hero-badge" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.07)',
                border: `1px solid ${colorAcento}50`,
                backdropFilter: 'blur(8px)',
                padding: '8px 16px', borderRadius: '100px',
                marginBottom: '28px', width: 'fit-content',
              }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: pulse ? `0 0 0 4px #22c55e30` : `0 0 0 0px #22c55e30`,
                  transition: 'box-shadow 0.6s ease',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500, letterSpacing: '0.01em' }}>
                  {badgePrefix}
                  {badgeNum ? <AnimatedCount target={badgeNum} /> : null}
                  {badgeSuffix}
                </span>
              </div>
            )}

            {/* Título — tipografía máxima */}
            <h1 style={{
              fontSize: 'clamp(52px, 7vw, 88px)',
              fontWeight: 700,
              lineHeight: 1.0,
              letterSpacing: '-0.04em',
              color: '#f8fafc',
              margin: '0 0 22px',
              whiteSpace: 'pre-line',
            }}>
              {tituloFinal}
            </h1>

            {/* Subtítulo */}
            <p style={{
              fontSize: 'clamp(20px, 2.5vw, 26px)',
              lineHeight: 1.6,
              color: '#94a3b8',
              margin: '0 0 36px',
              maxWidth: '500px',
              fontWeight: 400,
            }}>
              {subtituloFinal}
            </p>

            {/* Selectores de intención (del screenshot, pero mejorados) */}
            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                ¿Qué estás buscando?
              </p>
              <div className="intent-grid">
                {['Consulta médica', 'Procedimiento', 'Medicamento', 'Solo información'].map(opt => (
                  <button
                    key={opt}
                    onClick={onCtaClick}
                    className="intent-btn"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      color: '#cbd5e1',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s ease',
                      fontFamily: 'inherit',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* CTAs principales */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <button
                onClick={onCtaClick}
                className="cta-primary"
                style={{
                  background: '#25D366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '17px 28px',
                  fontSize: '18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 32px #25D36640',
                  transition: 'all 0.18s ease',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp directo
              </button>
              <button
                onClick={onCtaClick}
                className="cta-secondary"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '14px',
                  padding: '17px 24px',
                  fontSize: '17px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.18s ease',
                  fontFamily: 'inherit',
                  backdropFilter: 'blur(8px)',
                  letterSpacing: '-0.01em',
                }}
              >
                🤖 Chatear con IA
              </button>
            </div>

            {/* Trust signals inline */}
            <div style={{
              display: 'flex', gap: '20px', flexWrap: 'wrap',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              paddingTop: '18px',
            }}>
              {[
                { icon: '✓', label: 'Sin compromisos' },
                { icon: '⚡', label: 'Respuesta en 5 min' },
                { icon: '★', label: 'Asesoría personalizada' },
              ].map(t => (
                <div key={t.label} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', color: '#fff', flexShrink: 0,
                  }}>{t.icon}</span>
                  <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 500 }}>{t.label}</span>
                </div>
              ))}
            </div>

            {microcopyFinal && (
              <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                {microcopyFinal}
              </p>
            )}
          </div>

          {/* ── Columna de media ── */}
          <div style={{
            borderRadius: '24px',
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: tieneVideo ? undefined : '4/5',
            background: tieneVideo
              ? 'transparent'
              : tieneImagen
                ? `url(${imagenHero}) center/cover`
                : `linear-gradient(135deg, ${colorAcento}20, ${colorAcento}40)`,
            maxHeight: '600px',
            boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)`,
          }}>
            {tieneVideo ? (
              <div
                className="hero-media-video"
                style={{
                  position: 'relative',
                  width: 'calc(100% + 16px)',
                  height: '616px',
                  overflow: 'hidden',
                  margin: '-8px',
                }}>
                <iframe
                  src={`https://www.instagram.com/p/${extractIgCode(heroVideoUrl!)}/embed/`}
                  allowFullScreen
                  scrolling="no"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    width: '142%', height: '142%',
                    transform: 'translate(-50%, -50%)',
                    border: 'none',
                  }}
                />
              </div>
            ) : !tieneImagen && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', color: colorAcento, opacity: 0.7,
              }}>
                <div style={{ fontSize: '64px', marginBottom: '8px' }}>{theme.emoji}</div>
                <div style={{ fontSize: '12px' }}>Sube una imagen desde tu dashboard</div>
              </div>
            )}

            {/* Overlay badge sobre imagen */}
            {tieneImagen && (
              <div style={{
                position: 'absolute', bottom: '16px', left: '16px', right: '16px',
                background: 'rgba(11,17,32,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: '14px',
                padding: '14px 16px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '2px' }}>Próxima disponibilidad</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>Hoy · Atención oportuna</div>
                </div>
                <div style={{
                  background: '#22c55e', borderRadius: '50%',
                  width: '10px', height: '10px',
                  boxShadow: '0 0 0 4px #22c55e30',
                }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .hero-badge {
          animation: fadeSlideIn 0.5s ease both;
        }
        .hero-grid h1 {
          animation: fadeSlideIn 0.5s 0.1s ease both;
        }
        .hero-grid p {
          animation: fadeSlideIn 0.5s 0.2s ease both;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .intent-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .intent-btn:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(255,255,255,0.25) !important;
          color: #f1f5f9 !important;
          transform: translateY(-1px);
        }
        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px #25D36650 !important;
        }
        .cta-secondary:hover {
          background: rgba(255,255,255,0.14) !important;
          transform: translateY(-1px);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 40px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .hero-media-video {
            height: 400px !important;
            width: calc(100% + 16px) !important;
          }
          .hero-media-video iframe {
            width: 160% !important;
            height: 160% !important;
          }
          .intent-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </section>
  )
}
