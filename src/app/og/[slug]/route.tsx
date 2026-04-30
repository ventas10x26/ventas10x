// Ruta destino: src/app/og/[slug]/route.tsx
// Genera dinámicamente la imagen Open Graph 1200x630 para cada landing.
// Se cachea automáticamente por Vercel/CDN.

import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'
import { getTheme, detectThemeFromIndustria } from '@/lib/sector-themes'

export const runtime = 'edge'

const SIZE = { width: 1200, height: 630 }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // ── Cargar datos del usuario ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, empresa, industria, avatar_url')
      .eq('slug', slug)
      .single()

    if (!profile) {
      return new Response('Not found', { status: 404 })
    }

    const { data: configRaw } = await supabase
      .from('landing_config')
      .select('*')
      .eq('vendedor_id', profile.id)
      .maybeSingle()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = configRaw as any

    // ── Resolver tema ──
    const temaKey = config?.tema || detectThemeFromIndustria(profile.industria)
    const theme = getTheme(temaKey)

    // ── Resolver textos (con fallback al tema) ──
    const nombreCompleto = [profile.nombre, profile.apellido].filter(Boolean).join(' ').trim() || 'Asesor'
    const empresa = profile.empresa?.trim() || ''
    const industria = theme.nombre
    const titulo = (config?.titulo?.trim() || theme.tituloDefault).replace(/\n/g, ' ')
    const subtituloFull = config?.subtitulo?.trim() || theme.subtituloDefault
    // Truncar subtítulo si es muy largo (cabe ~120 chars)
    const subtitulo = subtituloFull.length > 120 ? subtituloFull.slice(0, 117) + '…' : subtituloFull
    const badge = config?.badge_promo?.trim() || theme.badgePromoDefault
    const ctaTexto = config?.cta_principal_texto?.trim() || theme.ctaTextoDefault
    const colorAcento = config?.color_acento || theme.colorSecundario || '#FF6B2B'

    // ── Truncar título si es muy largo (cabe ~60 chars en 2 líneas) ──
    const tituloFinal = titulo.length > 65 ? titulo.slice(0, 62) + '…' : titulo

    // ── Iniciales para el avatar ──
    const iniciales = nombreCompleto
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

    // ── Imagen del hero (foto del lado derecho) ──
    const imagenHero = config?.imagen_hero?.trim() || profile.avatar_url?.trim() || ''

    // ── Componer la imagen ──
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            background: `linear-gradient(135deg, #ffffff 0%, ${colorAcento}10 100%)`,
            fontFamily: 'sans-serif',
          }}
        >
          {/* ── Lado izquierdo: contenido ── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '60px 60px',
            }}
          >
            {/* Badge */}
            {badge && (
              <div
                style={{
                  display: 'flex',
                  alignSelf: 'flex-start',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  border: `1px solid ${colorAcento}40`,
                  padding: '8px 18px',
                  borderRadius: '100px',
                  marginBottom: '28px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#1d9e75',
                  }}
                />
                <div
                  style={{
                    fontSize: '18px',
                    color: colorAcento,
                    fontWeight: 500,
                  }}
                >
                  {badge}
                </div>
              </div>
            )}

            {/* Título */}
            <div
              style={{
                fontSize: '58px',
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                color: '#0a0a0a',
                marginBottom: '20px',
                display: 'flex',
              }}
            >
              {tituloFinal}
            </div>

            {/* Subtítulo */}
            <div
              style={{
                fontSize: '24px',
                color: '#555555',
                lineHeight: 1.4,
                marginBottom: '32px',
                display: 'flex',
              }}
            >
              {subtitulo}
            </div>

            {/* CTA + footer del autor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: colorAcento,
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '14px 24px',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                {ctaTexto} →
              </div>
            </div>

            {/* Autor */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginTop: '32px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: colorAcento,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              >
                {iniciales}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#111',
                    lineHeight: 1.2,
                  }}
                >
                  {nombreCompleto}
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    color: '#888',
                    lineHeight: 1.2,
                    marginTop: '4px',
                  }}
                >
                  {[industria, empresa].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          </div>

          {/* ── Lado derecho: foto / placeholder ── */}
          <div
            style={{
              width: '38%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              background: imagenHero
                ? '#f4ebe1'
                : `linear-gradient(135deg, ${colorAcento}30, ${colorAcento}60)`,
              overflow: 'hidden',
            }}
          >
            {imagenHero ? (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
              <img
                src={imagenHero}
                width={456}
                height={630}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: '160px',
                  display: 'flex',
                  opacity: 0.6,
                }}
              >
                {theme.emoji}
              </div>
            )}
          </div>

          {/* ── Watermark ── */}
          <div
            style={{
              position: 'absolute',
              bottom: '18px',
              right: '24px',
              fontSize: '14px',
              color: '#aaa',
              letterSpacing: '0.05em',
              display: 'flex',
            }}
          >
            ventas10x.co
          </div>
        </div>
      ),
      {
        ...SIZE,
        // Cache 1 día en CDN, 5 min en cliente
        headers: {
          'cache-control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    )
  } catch (e) {
    console.error('[og]', e)
    return new Response('Error generating image', { status: 500 })
  }
}
