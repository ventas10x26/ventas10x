'use client'

import { useReveal } from '@/hooks/useReveal'
import {
  F_DISPLAY, F_MONO, F_BODY, SEGMENTS, TESTIMONIOS_V2,
  PulseStyles, PulseHeader, PulseFooter,
  useUsuarioLogueado, useSectionScrollSpy, usePulseTheme,
  SegIcon, WhatsAppMiniPreview,
  DiferenciadoresSection, PorQueSection, EcosistemaSection, ActividadEnVivoSection,
  IntegracionesSection, CumplimientoSection, TestimoniosSection, PreciosSection,
} from '../_shared/sections'
import { PulseStickyDemoWidget } from '@/components/pulse/PulseStickyDemoWidget'

const NAV_ITEMS = [
  { label:'Inicio', href:'/pulse' },
  { label:'Ecosistema 360°', href:'#ecosistema' },
  { label:'Precios', href:'#precios' },
  { label:'Para concesionarios', href:'/pulse/concesionario' },
]

const SEG = SEGMENTS.find(s => s.slug === 'asesor')!
const TESTIMONIOS_ASESOR = TESTIMONIOS_V2.filter(t => t.seg.startsWith('Vendedor individual'))

// Contenido identico al que antes vivia en page.tsx, movido sin cambios — ver
// el mismo patron y motivo en ConcesionarioClient.tsx.
export default function AsesorClient() {
  const usuarioLogueado = useUsuarioLogueado()
  const { theme, toggleTheme } = usePulseTheme()
  const activeSection = useSectionScrollSpy(NAV_ITEMS)
  const heroReveal = useReveal<HTMLDivElement>()

  return (
    <>
      <PulseStyles />
      <div className="pulse-theme-root" data-theme={theme} style={{ minHeight:'100vh', color:'var(--ink)', fontFamily:F_BODY, lineHeight:1.5 }}>
        <PulseHeader navItems={NAV_ITEMS} activeSection={activeSection} usuarioLogueado={usuarioLogueado} theme={theme} onToggleTheme={toggleTheme} />

        {/* HERO — landing dedicada del segmento Vendedor individual (Pro): expande la
            card de la home con el detalle completo de la oferta para este segmento. */}
        <section id="plataforma" style={{ maxWidth:'1280px', margin:'0 auto', padding:'64px 24px 40px' }}>
          <div ref={heroReveal.ref} className="hero-grid" style={{ display:'flex', gap:'56px', alignItems:'center' }}>
            <div style={{ flex:'1', minWidth:'320px' }}>
              <div style={{ marginBottom:'20px' }}>
                <span className="badge"><span className="live-dot" />{SEG.liveStat}</span>
              </div>
              <span className="seg-tag green">{SEG.tag}</span>
              <h1 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(38px,5.4vw,64px)', fontWeight:800, lineHeight:1.05, letterSpacing:'-1.2px', margin:'0 0 20px', color:'var(--ink)' }}>
                Tu copiloto <span className="grad-blue">para cerrar solo, sin depender de nadie.</span>
              </h1>
              <p style={{ fontSize:'clamp(16px,1.6vw,18px)', color:'var(--ink-dim)', maxWidth:'520px', margin:'0 0 24px', lineHeight:1.65 }}>
                {SEG.desc}
              </p>
              <div style={{ marginBottom:'26px' }}>
                {SEG.bullets.map(b => (
                  <div key={b} className={`seg-check reveal${heroReveal.inView?' in':''}`}><span className="mark seg-check-mark">✓</span><span>{b}</span></div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                <a href="/pulse/signup" className="pm-btn" style={{ display:'inline-flex', width:'auto', padding:'14px 28px', textDecoration:'none' }}>Empezar gratis 14 días<span className="btn-arrow">→</span></a>
                <a href="#precios" className="pm-btn pm-btn-dark" style={{ display:'inline-flex', width:'auto', padding:'14px 24px', textDecoration:'none' }}>Ver planes</a>
              </div>
            </div>

            <div className={`reveal${heroReveal.inView?' in':''}`} style={{ flex:'1', minWidth:'320px', maxWidth:'460px' }}>
              <div className="seg-card-icon"><SegIcon variant="green" /></div>
              <WhatsAppMiniPreview active={heroReveal.inView} />
              <p style={{ fontSize:'12px', color:'var(--ink-dim)', fontFamily:F_MONO, lineHeight:1.6 }}>
                Corre dentro de tu WhatsApp Business de siempre — sin número nuevo, sin app aparte.
              </p>
            </div>
          </div>
        </section>

        <DiferenciadoresSection />
        <PorQueSection />
        <EcosistemaSection />
        <ActividadEnVivoSection />
        <IntegracionesSection />
        <CumplimientoSection />
        <TestimoniosSection testimonios={TESTIMONIOS_ASESOR} headline="Lo dice quien ya lo usa como asesor independiente." />
        <PreciosSection initialSegment="individual" showToggle={false} />

        <PulseFooter />

        <PulseStickyDemoWidget />
      </div>
    </>
  )
}
