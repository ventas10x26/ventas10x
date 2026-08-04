'use client'

import { useReveal } from '@/hooks/useReveal'
import {
  F_DISPLAY, F_MONO, F_BODY, SEGMENTS, TESTIMONIOS_V2,
  PulseStyles, PulseHeader, PulseFooter,
  useUsuarioLogueado, useSectionScrollSpy, usePulseTheme,
  SegIcon, SchemaPreview,
  DiferenciadoresSection, InsumosSection, EmbudoSection, PorQueSection, EcosistemaSection, ActividadEnVivoSection,
  IntegracionesSection, CumplimientoSection, TestimoniosSection, PreciosSection,
} from '../_shared/sections'
import { PulseStickyDemoWidget } from '@/components/pulse/PulseStickyDemoWidget'
import { PulsePrototipos } from '@/components/pulse/PulsePrototipos'

const NAV_ITEMS = [
  { label:'Inicio', href:'/pulse' },
  { label:'Prototipos', href:'#prototipos' },
  { label:'Ecosistema 360°', href:'#ecosistema' },
  { label:'Precios', href:'#precios' },
  { label:'Para asesor individual', href:'/pulse/asesor' },
]

const SEG = SEGMENTS.find(s => s.slug === 'concesionario')!
const TESTIMONIOS_CONCESIONARIO = TESTIMONIOS_V2.filter(t => t.seg.startsWith('Concesionario'))

export default function ConcesionarioLanding() {
  const usuarioLogueado = useUsuarioLogueado()
  const { theme, toggleTheme } = usePulseTheme()
  const activeSection = useSectionScrollSpy(NAV_ITEMS)
  const heroReveal = useReveal<HTMLDivElement>()

  return (
    <>
      <PulseStyles />
      <div className="pulse-theme-root" data-theme={theme} style={{ minHeight:'100vh', color:'var(--ink)', fontFamily:F_BODY, lineHeight:1.5 }}>
        <PulseHeader navItems={NAV_ITEMS} activeSection={activeSection} usuarioLogueado={usuarioLogueado} theme={theme} onToggleTheme={toggleTheme} />

        {/* HERO — landing dedicada del segmento Concesionario (Enterprise): expande la
            card de la home con el detalle completo de la oferta para este segmento. */}
        <section id="plataforma" style={{ maxWidth:'1280px', margin:'0 auto', padding:'64px 24px 40px' }}>
          <div ref={heroReveal.ref} className="hero-grid" style={{ display:'flex', gap:'56px', alignItems:'center' }}>
            <div style={{ flex:'1', minWidth:'320px' }}>
              <div style={{ marginBottom:'20px' }}>
                <span className="badge guard-sweep"><span className="live-dot" />{SEG.liveStat}</span>
              </div>
              <span className="seg-tag amber">{SEG.tag}</span>
              <h1 style={{ fontFamily:F_DISPLAY, fontSize:'clamp(38px,5.4vw,64px)', fontWeight:800, lineHeight:1.05, letterSpacing:'-1.2px', margin:'0 0 20px', color:'var(--ink)' }}>
                El agente que <span className="grad-blue">orquesta todo tu concesionario.</span>
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
                <a href="/pulse/databridge" className="pm-btn" style={{ display:'inline-flex', width:'auto', padding:'14px 28px', textDecoration:'none' }}>Solicitar acceso<span className="btn-arrow">→</span></a>
                <a href="#precios" className="pm-btn pm-btn-dark" style={{ display:'inline-flex', width:'auto', padding:'14px 24px', textDecoration:'none' }}>Ver planes</a>
                {/* Terciario (outline, no sólido): el demo es la acción de menor compromiso de
                    las tres — se mira antes de pedir acceso o mirar precios. Apunta a la
                    sección de prototipos de esta misma página, que ya está justo abajo:
                    mandarlo a otra pestaña antes de que vea nada es pedirle que se vaya. */}
                <a href="#prototipos" className="pm-btn-outline" style={{ display:'inline-flex', width:'auto', padding:'14px 24px', textDecoration:'none' }}>Ver el panel<span className="btn-arrow">→</span></a>
              </div>
            </div>

            <div className={`reveal${heroReveal.inView?' in':''}`} style={{ flex:'1', minWidth:'320px', maxWidth:'460px' }}>
              <div className="seg-card-icon"><SegIcon variant="amber" /></div>
              <SchemaPreview />
              <p style={{ fontSize:'12px', color:'var(--ink-dim)', fontFamily:F_MONO, lineHeight:1.6 }}>
                DataBridge detecta el esquema de tu Excel o DMS solo — sin escribir una línea de SQL.
              </p>
            </div>
          </div>
        </section>

        {/* PROTOTIPOS — inmediatamente después del hero, y antes que cualquier argumento.
            En esta landing el visitante ya se autoseleccionó como concesionario al entrar,
            así que no hace falta convencerlo de que le hablamos a él: lo que sigue es
            mostrarle el panel funcionando. En el home va más abajo, después de Segmentos,
            porque ahí esa autoselección todavía no ocurrió. */}
        <PulsePrototipos />

        <DiferenciadoresSection />
        <InsumosSection />
        <EmbudoSection />
        <PorQueSection />
        <EcosistemaSection showNuevo />
        <ActividadEnVivoSection />
        <IntegracionesSection />
        <CumplimientoSection />
        <TestimoniosSection testimonios={TESTIMONIOS_CONCESIONARIO} headline="Lo dice quien ya lo usa en su concesionario." />
        <PreciosSection initialSegment="concesionario" showToggle={false} />

        <PulseFooter />

        <PulseStickyDemoWidget />
      </div>
    </>
  )
}
