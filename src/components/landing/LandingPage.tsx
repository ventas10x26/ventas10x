// Ruta destino: src/components/landing/LandingPage.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import type { Profile, LandingConfig, Producto } from '@/types/database'
import { HeroSection } from './HeroSection'
import { StatsBar } from './StatsBar'
import { ProductosGrid } from './ProductosGrid'
import { ComoFuncionaSection } from './ComoFuncionaSection'
import { TestimoniosSection } from './TestimoniosSection'
import { CTACierre } from './CTACierre'
import { SeccionRenderer } from '@/components/landing-sections/SeccionRenderer'
import { StickyMobileCTA } from './StickyMobileCTA'

type Stat = { valor: string; label: string }
type Paso = { titulo: string; descripcion: string }
type Testimonio = {
  id: string
  nombre_cliente: string
  texto: string
  rating: number
  avatar_url: string | null
}

type BloquesActivos = {
  hero?: boolean
  stats?: boolean
  productos?: boolean
  como_funciona?: boolean
  testimonios?: boolean
  cta_cierre?: boolean
}

type LandingConfigExtended = LandingConfig & {
  stats?: Stat[] | null
  como_funciona?: Paso[] | null
  bloques_activos?: BloquesActivos | null
  badge_promo?: string | null
  cta_principal_texto?: string | null
  cta_principal_microcopy?: string | null
}

type Props = {
  profile: Pick<Profile, 'id' | 'nombre' | 'apellido' | 'empresa' | 'avatar_url' | 'industria' | 'whatsapp'>
  config: LandingConfigExtended | null
  productos: Producto[]
  testimonios: Testimonio[]
  slug: string
  tema?: string
  seccionesCampana?: import('@/types/secciones').LandingSeccion[]
  colorAcento?: string
}

export function LandingPage({ profile, config, productos, testimonios, slug, tema, seccionesCampana }: Props) {
  const colorAcento = config?.color_acento || '#FF6B2B'
  const bloques: BloquesActivos = config?.bloques_activos || {
    hero: true, stats: true, productos: true,
    como_funciona: true, testimonios: true, cta_cierre: true,
  }

  const nombreVendedor = [profile.nombre, profile.apellido].filter(Boolean).join(' ').trim() || 'Asesor'
  const empresa = profile.empresa?.trim() || ''
  const industria = profile.industria?.trim() || ''

  const [stats, setStats] = useState<Stat[]>(config?.stats || [])
  const [comoFunciona, setComoFunciona] = useState<Paso[]>(config?.como_funciona || [])
  const [badgePromo, setBadgePromo] = useState<string>(config?.badge_promo || '')
  const autogenIntentado = useRef(false)

  useEffect(() => {
    if (autogenIntentado.current) return
    const necesitaAutogen = stats.length === 0 || comoFunciona.length === 0 || !badgePromo
    if (!necesitaAutogen) return
    autogenIntentado.current = true

    const productoPrincipal = productos[0]?.nombre || config?.producto || ''

    fetch('/api/landing/ia-autogenerar-bloques', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industria, empresa, nombreVendedor, productoPrincipal }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          if (stats.length === 0 && data.stats) setStats(data.stats)
          if (comoFunciona.length === 0 && data.como_funciona) setComoFunciona(data.como_funciona)
          if (!badgePromo && data.badge_promo) setBadgePromo(data.badge_promo)
          fetch('/api/landing/config', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stats: stats.length === 0 ? data.stats : stats,
              como_funciona: comoFunciona.length === 0 ? data.como_funciona : comoFunciona,
              badge_promo: !badgePromo ? data.badge_promo : badgePromo,
            }),
          }).catch(() => {})
        }
      })
      .catch(() => {})
  }, [stats, comoFunciona, badgePromo, industria, empresa, nombreVendedor, productos, config])

  const [showCtaModal, setShowCtaModal] = useState(false)
  const whatsappNum = (profile.whatsapp || config?.whatsapp || '').replace(/\D/g, '')
  const msgWa = encodeURIComponent(config?.mensaje_wa || 'Hola, me interesa obtener más información')
  const scrollToCTA = () => setShowCtaModal(true)
  const ctaTexto = config?.cta_principal_texto || 'Reservar mi cita'
  const ctaMicrocopy = config?.cta_principal_microcopy || 'Te respondo en 5 min por WhatsApp'

  return (
    <div style={{
      minHeight: '100vh', background: '#fff',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: '#0a0a0a',
    }}>

      {/* ── Modal CTA ── */}
      {showCtaModal && (
        <div
          onClick={() => setShowCtaModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
            zIndex: 1000, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '1rem'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px', padding: '2rem',
              maxWidth: '380px', width: '100%', textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,.2)'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '1rem' }}>💬</div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f1c2e', marginBottom: '.5rem' }}>
              ¿Cómo prefieres continuar?
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Escríbele directo al asesor por WhatsApp o chatea con el asistente IA.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
                href={`https://wa.me/${whatsappNum}?text=${msgWa}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', padding: '14px', borderRadius: '12px',
                  background: '#25D366', color: '#fff', textDecoration: 'none',
                  fontWeight: 700, fontSize: '15px',
                }}
              >
                📱 Escribir por WhatsApp
              </a>
              <button
                onClick={() => {
                  setShowCtaModal(false)
                  const btn = document.querySelector('[data-chat-toggle]') as HTMLElement
                  if (btn) btn.click()
                }}
                style={{
                  padding: '14px', borderRadius: '12px',
                  background: '#0f1c2e', color: '#fff', border: 'none',
                  fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                }}
              >
                🤖 Chatear con el asistente IA
              </button>
              <button
                onClick={() => setShowCtaModal(false)}
                style={{
                  padding: '10px', borderRadius: '12px', background: 'transparent',
                  color: '#9ca3af', border: 'none', fontSize: '13px', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav superior ── */}
      <nav style={{
        padding: '14px 24px', borderBottom: '0.5px solid #eee',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={nombreVendedor}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 0 0 1px #eee' }}
            />
          ) : (
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: colorAcento, color: '#fff', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 500,
            }}>
              {nombreVendedor.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111', lineHeight: 1.2 }}>{nombreVendedor}</div>
            <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.2 }}>
              {[industria, empresa].filter(Boolean).join(' · ') || 'Asesor verificado'}
            </div>
          </div>
        </div>
        <button
          onClick={scrollToCTA}
          style={{
            background: '#111', color: '#fff', border: 'none',
            borderRadius: '100px', padding: '8px 16px',
            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
          }}
        >
          {ctaTexto} →
        </button>
      </nav>

      {/* ── Hero ── */}
      {bloques.hero !== false && (
        <HeroSection
          nombreVendedor={nombreVendedor}
          titulo={config?.titulo || ''}
          subtitulo={config?.subtitulo || ''}
          imagenHero={config?.imagen_hero || profile.avatar_url || ''}
          heroVideoUrl={config?.hero_video_url || ''}
          badgePromo={badgePromo}
          colorAcento={colorAcento}
          ctaTexto={ctaTexto}
          ctaMicrocopy={ctaMicrocopy}
          industria={industria}
          tema={tema}
          onCtaClick={scrollToCTA}
        />
      )}

      {/* ── Stats ── */}
      {bloques.stats !== false && stats.length > 0 && (
        <StatsBar stats={stats} />
      )}

      {/* ── Campaña destacada ── */}
      {seccionesCampana && seccionesCampana.length > 0 && seccionesCampana.map(s => (
        <SeccionRenderer
          key={s.id}
          seccion={s}
          colorAcento={colorAcento}
          whatsappVendedor={profile.whatsapp || config?.whatsapp || null}
        />
      ))}

      {/* ── Productos ── */}
      {bloques.productos !== false && productos.length > 0 && (
        <ProductosGrid
          productos={productos}
          colorAcento={colorAcento}
          whatsapp={profile.whatsapp || config?.whatsapp || ''}
        />
      )}

      {/* ── Cómo funciona ── */}
      {bloques.como_funciona !== false && comoFunciona.length > 0 && (
        <ComoFuncionaSection pasos={comoFunciona} colorAcento={colorAcento} />
      )}

      {/* ── Testimonios ── */}
      {bloques.testimonios !== false && testimonios.length > 0 && (
        <TestimoniosSection testimonios={testimonios} />
      )}

      {/* ── CTA cierre ── */}
      {bloques.cta_cierre !== false && (
        <CTACierre
          colorAcento={colorAcento}
          ctaTexto={ctaTexto}
          ctaMicrocopy={ctaMicrocopy}
          whatsapp={profile.whatsapp || config?.whatsapp || ''}
          mensajeWa={config?.mensaje_wa || ''}
          slug={slug}
        />
      )}

      {/* ── Sticky CTA mobile ── */}
      <StickyMobileCTA
        colorAcento={colorAcento}
        ctaTexto={ctaTexto}
        whatsapp={profile.whatsapp || config?.whatsapp || ''}
        mensajeWa={config?.mensaje_wa || ''}
      />
    </div>
  )
}