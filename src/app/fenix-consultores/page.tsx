// Ruta destino: src/app/fenix-consultores/page.tsx
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { Space_Grotesk } from 'next/font/google'
import { FenixNav } from '@/components/fenix/FenixNav'
import { FenixGlowCard } from '@/components/fenix/FenixGlowCard'
import { FenixLeadForm } from '@/components/fenix/FenixLeadForm'
import { FenixStickyProspecting } from '@/components/fenix/FenixStickyProspecting'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'FÉNIX Recovery Intelligence® | Recuperación estratégica de activos empresariales',
  description: 'Recuperamos activos empresariales mediante un modelo integral que combina Inteligencia Artificial, software de gestión de cartera, analítica financiera, automatización de cobro y respaldo jurídico especializado.',
}

const DARK = '#000000'
const ACCENT = '#F5821F'

// ─── Iconos ───
function IconArrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function IconBrain() {
  return (
    <svg width="70" height="70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.1">
      <circle cx="32" cy="32" r="6" />
      <circle cx="14" cy="18" r="4" />
      <circle cx="50" cy="18" r="4" />
      <circle cx="14" cy="46" r="4" />
      <circle cx="50" cy="46" r="4" />
      <path d="M17.5 20.5 27 28M46.5 20.5 37 28M17.5 43.5 27 36M46.5 43.5 37 36M18 18h28M18 46h28" />
    </svg>
  )
}

function IconDashboard() {
  return (
    <svg width="70" height="70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.1">
      <rect x="7" y="11" width="50" height="42" rx="3" />
      <path d="M7 22h50" />
      <path d="M16 44v-9M27 44V30M38 44v-6M49 44V27" />
    </svg>
  )
}

function IconAutomation() {
  return (
    <svg width="70" height="70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.1">
      <circle cx="32" cy="32" r="9" />
      <path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M49 15l-6 6M21 43l-6 6" />
    </svg>
  )
}

function IconGavel() {
  return (
    <svg width="70" height="70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.1">
      <path d="M36 10l18 18M18 30l18-18 12 12-18 18z" />
      <path d="M8 56l18-18M40 40l16 16M6 58h24" />
    </svg>
  )
}

// Glow decorativo de esquina
function CornerGlow() {
  return (
    <div style={{
      position: 'absolute', top: '-40px', left: '-40px',
      width: '140px', height: '140px', borderRadius: '50%',
      background: `radial-gradient(circle, ${ACCENT}35 0%, transparent 70%)`,
      filter: 'blur(6px)', pointerEvents: 'none',
    }} />
  )
}

function ReticleDot() {
  return (
    <div style={{
      position: 'absolute', top: '46%', right: '44px',
      width: '26px', height: '26px', borderRadius: '50%',
      border: '1px solid rgba(255,255,255,.32)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,.6)' }} />
    </div>
  )
}

const CARD_STYLE: CSSProperties = {
  position: 'relative', overflow: 'hidden',
  background: 'rgba(255,255,255,.012)',
  border: `1px solid ${ACCENT}38`,
  borderRadius: '18px',
}

const PILL_SOLID: CSSProperties = {
  background: ACCENT, color: '#050505',
  padding: '16px 34px', borderRadius: '999px',
  fontSize: '14px', fontWeight: 700, textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  boxShadow: `0 0 0 1px ${ACCENT}, 0 8px 30px ${ACCENT}55`,
}

const PILL_OUTLINE: CSSProperties = {
  background: 'transparent', color: '#fff',
  padding: '16px 30px', borderRadius: '999px', fontSize: '14px',
  fontWeight: 600, textDecoration: 'none', display: 'inline-flex',
  alignItems: 'center', gap: '8px',
  border: '1px solid rgba(255,255,255,.25)',
}

const EYEBROW: CSSProperties = {
  fontSize: '12px', fontWeight: 700, color: ACCENT,
  letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px',
}

const H2: CSSProperties = {
  fontSize: 'clamp(26px, 3.2vw, 42px)', fontWeight: 700,
  letterSpacing: '-.015em', lineHeight: 1.15, margin: 0,
}

// ─── Datos ───
const CREDIBILIDAD = [
  'Plataforma tecnológica de seguimiento',
  'Inteligencia Artificial aplicada a la recuperación',
  'Cobro Prejurídico',
  'Cobro Judicial',
  'Reportes Ejecutivos en tiempo real',
  'Trazabilidad completa de cada gestión',
  'Atención personalizada',
]

const IMPACTOS = ['Liquidez', 'Rentabilidad', 'Capacidad de inversión', 'Crecimiento', 'Planeación financiera', 'Valor patrimonial']

const DIFERENCIALES = [
  {
    Icono: IconBrain,
    titulo: 'Inteligencia Artificial',
    desc: 'Modelos inteligentes que optimizan la priorización de cartera, automatizan procesos y permiten decisiones más rápidas y eficientes.',
  },
  {
    Icono: IconDashboard,
    titulo: 'Plataforma Tecnológica',
    desc: 'Estado de cada obligación, historial completo de gestiones, compromisos de pago, documentación, indicadores de recuperación y reportes ejecutivos. Todo centralizado.',
  },
  {
    Icono: IconAutomation,
    titulo: 'Automatización de Cobranza',
    desc: 'Notificaciones automáticas, recordatorios inteligentes, seguimiento permanente y gestión multicanal.',
  },
  {
    Icono: IconGavel,
    titulo: 'Equipo Jurídico Especializado',
    desc: 'Abogados con experiencia en recuperación empresarial: negociación estratégica, procesos ejecutivos, medidas cautelares y recuperación judicial.',
  },
]

const PILARES = [
  {
    num: '01',
    titulo: 'Diagnóstico Estratégico',
    desc: 'Analizamos jurídicamente cada obligación antes de actuar.',
  },
  {
    num: '02',
    titulo: 'Gestión Inteligente',
    desc: 'La IA identifica prioridades, optimiza tiempos y fortalece la toma de decisiones.',
  },
  {
    num: '03',
    titulo: 'Ejecución Especializada',
    desc: 'Cada deudor recibe una estrategia diferente. Porque ninguna cartera es igual.',
  },
  {
    num: '04',
    titulo: 'Información en Tiempo Real',
    desc: 'Usted conoce permanentemente qué ocurre con cada obligación. Sin llamadas. Sin solicitar informes.',
  },
]

const PLATAFORMA_ITEMS = [
  'Total recuperado',
  'Cartera activa',
  'Cartera crítica',
  'Compromisos de pago',
  'Procesos jurídicos',
  'Historial completo',
  'Indicadores por gestor',
  'Reportes descargables',
  'Seguimiento individual de cada expediente',
]

const TECNOLOGIA = [
  'Inteligencia Artificial',
  'Automatización',
  'Plataforma Web',
  'Analítica de Datos',
  'Gestión Documental',
  'Comunicación Digital',
  'WhatsApp Empresarial',
  'Correo Electrónico Automatizado',
  'Llamadas Estratégicas',
  'SMS',
  'Gestión Jurídica',
]

const BENEFICIOS = [
  'Mayor control',
  'Mayor trazabilidad',
  'Mayor transparencia',
  'Mayor velocidad',
  'Mayor probabilidad de recuperación',
  'Menor riesgo jurídico',
]

const INDICADORES = [
  'Tiempo promedio de recuperación',
  'Edad de cartera',
  'Compromisos cumplidos',
  'Compromisos incumplidos',
  'Productividad por gestor',
  'Procesos judiciales activos',
  'Recuperación mensual',
  'Proyección de recaudo',
]

const PERFILES = ['Presidentes', 'Propietarios', 'Socios', 'Gerentes Generales', 'CFO', 'Directores Financieros']
const SECTORES_OBJETIVO = ['Empresas B2B', 'Sector Salud', 'Industria', 'Construcción', 'Tecnología', 'Distribución', 'Cooperativas', 'Instituciones financieras']

const CONFIANZA = [
  'Gestión documentada',
  'Seguimiento permanente',
  'Reportes ejecutivos',
  'Plataforma segura',
  'Atención personalizada',
  'Comunicación transparente',
]

export default function FenixConsultoresPage() {
  return (
    <div className={`fenix-root ${spaceGrotesk.variable}`} style={{
      fontFamily: "var(--font-jakarta,'Plus Jakarta Sans'), sans-serif",
      background: DARK,
      minHeight: '100vh',
      color: '#fff',
    }}>
      <FenixNav />
      <FenixStickyProspecting />

      {/* ── HERO ── */}
      <section id="inicio" style={{ padding: '7rem 1.5rem 4rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-260px', left: '50%', transform: 'translateX(-50%)',
          width: '1000px', height: '1000px', borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT}60 0%, ${ACCENT}28 45%, transparent 70%)`,
          filter: 'blur(10px)', pointerEvents: 'none',
        }} />
        <div className="fenix-hero-tube" style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '540px', height: '540px', borderRadius: '50%',
          background: `radial-gradient(circle, transparent 60%, ${ACCENT}90 66%, ${ACCENT}ff 70%, ${ACCENT}90 74%, transparent 80%)`,
          filter: 'blur(6px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '-260px', left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '700px',
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 15% 30%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 82% 22%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 68% 55%, ${ACCENT}, transparent),
            radial-gradient(1.5px 1.5px at 30% 68%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 90% 60%, ${ACCENT}, transparent),
            radial-gradient(1.5px 1.5px at 45% 15%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 8% 55%, ${ACCENT}, transparent),
            radial-gradient(1.5px 1.5px at 60% 80%, #fff, transparent)
          `,
          opacity: 0.8, pointerEvents: 'none',
        }} />
        <div className="fenix-hero-ring" style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '520px', height: '520px', borderRadius: '50%',
          border: `1px solid ${ACCENT}70`,
          boxShadow: `0 0 40px ${ACCENT}45, inset 0 0 40px ${ACCENT}25`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%) perspective(300px) rotateX(65deg)',
          width: '900px', height: '260px',
          backgroundImage: `repeating-linear-gradient(90deg, ${ACCENT}22 0px, ${ACCENT}22 1px, transparent 1px, transparent 60px)`,
          maskImage: 'linear-gradient(to top, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            border: `1px solid ${ACCENT}55`, borderRadius: '999px',
            padding: '7px 16px', marginBottom: '2rem',
            fontSize: '11px', fontWeight: 700, letterSpacing: '.08em',
            textTransform: 'uppercase', color: ACCENT,
          }}>
            <span className="fenix-live-dot" />
            FÉNIX Recovery Intelligence<sup style={{ fontSize: '8px' }}>®</sup>
          </div>

          <h1 style={{
            fontSize: 'clamp(30px, 4.6vw, 62px)', fontWeight: 300,
            lineHeight: 1.08, letterSpacing: '-2px', marginBottom: '1.5rem',
          }}>
            El dinero de su empresa<br />
            <span style={{ color: ACCENT }}>no está perdido.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(17px, 1.8vw, 21px)', color: 'rgba(255,255,255,.7)',
            lineHeight: 1.6, maxWidth: '680px', margin: '0 auto 1.5rem',
          }}>
            Está inmovilizado en una cartera que necesita estrategia, tecnología
            y ejecución especializada.
          </p>

          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,.45)',
            lineHeight: 1.8, maxWidth: '640px', margin: '0 auto 1.25rem',
          }}>
            Recuperamos activos empresariales mediante un modelo integral que combina
            Inteligencia Artificial, software de gestión de cartera, analítica financiera,
            automatización de cobro y respaldo jurídico especializado.
          </p>

          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,.55)',
            lineHeight: 1.8, maxWidth: '620px', margin: '0 auto 2.5rem',
          }}>
            Porque recuperar cartera hoy ya no depende únicamente de insistir.
            Depende de contar con <strong style={{ color: '#fff', fontWeight: 600 }}>información, tecnología y decisiones estratégicas</strong>.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#contacto" style={PILL_SOLID}>
              Solicitar Diagnóstico Ejecutivo Gratuito <IconArrow />
            </a>
            <a href="#modelo" style={PILL_OUTLINE}>
              Conocer el Modelo Integral UREA<sup style={{ fontSize: '9px' }}>®</sup>
            </a>
          </div>
        </div>
      </section>

      {/* ── BARRA DE CREDIBILIDAD ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)', textAlign: 'center', marginBottom: '1.75rem' }}>
            Una solución diseñada para empresas que requieren control, trazabilidad y resultados.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {CREDIBILIDAD.map(c => (
              <span key={c} style={{
                border: '1px solid rgba(255,255,255,.15)', borderRadius: '999px',
                padding: '8px 18px', fontSize: '12.5px', fontWeight: 600,
                color: 'rgba(255,255,255,.7)',
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: EL COSTO DE NO ACTUAR ── */}
      <section style={{ padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(280px, 1.1fr) minmax(260px, 1fr)', gap: '3.5rem', alignItems: 'center' }} className="fenix-grid-2">
          <div>
            <div style={EYEBROW}>El costo de esperar</div>
            <h2 style={{ ...H2, marginBottom: '1.25rem' }}>
              Mientras su empresa continúa vendiendo… <span style={{ color: ACCENT }}>parte importante de sus utilidades permanece detenida.</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.85, marginBottom: '1.5rem' }}>
              La cartera vencida afecta mucho más que el flujo de caja. También compromete
              variables críticas del negocio.
            </p>
            <p style={{ fontSize: '15px', color: '#fff', lineHeight: 1.7, fontWeight: 600 }}>
              Cada día sin una estrategia adecuada incrementa el riesgo de pérdida del activo.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {IMPACTOS.map(i => (
              <div key={i} style={{
                border: `1px solid ${ACCENT}30`, borderRadius: '12px',
                padding: '18px 16px', fontSize: '14px', fontWeight: 600,
                color: 'rgba(255,255,255,.8)', background: 'rgba(255,255,255,.012)',
              }}>
                {i}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: QUÉ HACE DIFERENTE A FÉNIX ── */}
      <section id="modelo" style={{ padding: '6rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: '1100px', height: '620px', borderRadius: '50%',
          background: `radial-gradient(ellipse, ${ACCENT}3a 0%, ${ACCENT}14 40%, transparent 70%)`,
          filter: 'blur(20px)', pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '1340px', margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem',
          }}>
            <div>
              <div style={EYEBROW}>El diferencial</div>
              <h2 style={{ ...H2, maxWidth: '520px' }}>
                No solo recuperamos cartera. Diseñamos un <span style={{ color: ACCENT }}>ecosistema inteligente</span> de recuperación empresarial.
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.45)', lineHeight: 1.7, maxWidth: '340px', margin: 0 }}>
              Nuestra metodología integra simultáneamente tecnología, analítica y respaldo
              jurídico especializado.
            </p>
          </div>

          <div className="fenix-services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            {DIFERENCIALES.map(({ Icono, titulo, desc }) => (
              <FenixGlowCard key={titulo} className="fenix-service-card" style={{
                position: 'relative', overflow: 'hidden',
                border: `3px solid ${ACCENT}`, borderRadius: '15px',
                padding: '20px', minHeight: '360px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <ReticleDot />
                <div className="fenix-card-text" style={{ position: 'relative', color: 'rgba(255,255,255,.85)' }}>
                  <Icono />
                </div>
                <div style={{ position: 'relative' }}>
                  <div className="fenix-card-text" style={{ fontSize: 'clamp(28px, 2.8vw, 40px)', fontWeight: 400, lineHeight: 1.05, marginBottom: '14px', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{titulo}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px' }}>
                    <div className="fenix-card-text" style={{ fontSize: '16px', fontWeight: 400, color: 'rgba(255,255,255,.4)', lineHeight: 1.55, maxWidth: '82%' }}>{desc}</div>
                    <div className="fenix-card-arrow" style={{
                      flexShrink: 0, width: '52px', height: '52px', borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,.9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ display: 'inline-flex', transform: 'rotate(-45deg)' }}><IconArrow /></span>
                    </div>
                  </div>
                </div>
              </FenixGlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: LOS 4 PILARES (UREA) ── */}
      <section style={{ padding: '6rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', maxWidth: '680px' }}>
            <div style={EYEBROW}>Modelo Integral UREA®</div>
            <h2 style={{ ...H2, marginBottom: '1rem' }}>
              Tecnología + Inteligencia Jurídica = <span style={{ color: ACCENT }}>Mayor Recuperación</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.8 }}>
              La Unidad de Recuperación Estratégica de Activos opera bajo cuatro pilares.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            {PILARES.map(p => (
              <FenixGlowCard key={p.num} className="fenix-tech-card" style={{ ...CARD_STYLE, padding: '28px' }}>
                <div className="fenix-card-text" style={{ position: 'relative', fontSize: '13px', fontWeight: 700, color: ACCENT, marginBottom: '18px', letterSpacing: '.08em' }}>{p.num}</div>
                <div className="fenix-card-text" style={{ position: 'relative', fontSize: '19px', fontWeight: 700, marginBottom: '10px', lineHeight: 1.25 }}>{p.titulo}</div>
                <div className="fenix-card-text" style={{ position: 'relative', fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>{p.desc}</div>
              </FenixGlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 5: PLATAFORMA ── */}
      <section id="plataforma" style={{ padding: '6rem 1.5rem' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', position: 'relative', overflow: 'hidden',
          border: `1px solid ${ACCENT}45`, borderRadius: '24px', padding: '3rem',
          boxShadow: `0 0 60px ${ACCENT}15`,
          display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(280px, 1.15fr)', gap: '2.5rem', alignItems: 'center',
        }} className="fenix-grid-2">
          <div style={{
            position: 'absolute', top: '-100px', left: '-100px',
            width: '320px', height: '320px', borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={EYEBROW}>Recovery Intelligence®</div>
            <h2 style={{ ...H2, marginBottom: '1.1rem' }}>
              Visualice su cartera <span style={{ color: ACCENT }}>como nunca antes</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Plataforma Empresarial de Gestión de Recuperación. Ingrese desde cualquier lugar
              y visualice inmediatamente toda la operación de su cartera en tiempo real.
            </p>
            <a href="#contacto" style={PILL_SOLID}>
              Ver la plataforma <IconArrow />
            </a>
          </div>

          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {PLATAFORMA_ITEMS.map(item => (
              <div key={item} style={{
                border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px',
                padding: '14px', fontSize: '13px', fontWeight: 600,
                color: 'rgba(255,255,255,.75)', background: 'rgba(255,255,255,.02)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ color: ACCENT, flexShrink: 0 }}>▸</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 6: STACK TECNOLÓGICO ── */}
      <section id="tecnologia" style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', maxWidth: '640px' }}>
            <div style={EYEBROW}>Stack tecnológico</div>
            <h2 style={{ ...H2, marginBottom: '1rem' }}>
              Recuperar cartera dejó de ser una actividad manual. <span style={{ color: ACCENT }}>Hoy requiere tecnología.</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.8 }}>
              Todo coordinado bajo una única estrategia.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {TECNOLOGIA.map(t => (
              <div key={t} style={{
                border: `1px solid ${ACCENT}35`, borderRadius: '999px',
                padding: '11px 22px', fontSize: '13.5px', fontWeight: 600,
                color: 'rgba(255,255,255,.8)', background: `${ACCENT}08`,
              }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 7 + 8: BENEFICIOS E INDICADORES ── */}
      <section style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1fr)', gap: '2rem' }} className="fenix-grid-2">
          <div style={{ ...CARD_STYLE, padding: '36px' }}>
            <CornerGlow />
            <div style={{ position: 'relative' }}>
              <div style={EYEBROW}>Lo que obtiene su empresa</div>
              <h2 style={{ ...H2, fontSize: 'clamp(22px, 2.4vw, 30px)', marginBottom: '1rem' }}>
                No solo recuperamos dinero.
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: 1.75, marginBottom: '1.75rem' }}>
                Entregamos información estratégica para la toma de decisiones.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {BENEFICIOS.map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,.8)' }}>
                    <span style={{ color: ACCENT }}>✓</span> {b}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ ...CARD_STYLE, padding: '36px' }}>
            <CornerGlow />
            <div style={{ position: 'relative' }}>
              <div style={EYEBROW}>Indicadores</div>
              <h2 style={{ ...H2, fontSize: 'clamp(22px, 2.4vw, 30px)', marginBottom: '1rem' }}>
                ¿Por qué nuestros clientes toman <span style={{ color: ACCENT }}>mejores decisiones?</span>
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: 1.75, marginBottom: '1.75rem' }}>
                Porque tienen información. Todo disponible para la dirección financiera.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {INDICADORES.map(i => (
                  <div key={i} style={{
                    border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px',
                    padding: '11px 12px', fontSize: '12px', fontWeight: 600,
                    color: 'rgba(255,255,255,.7)', lineHeight: 1.4,
                  }}>
                    {i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 9: PARA QUIÉN ── */}
      <section style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', maxWidth: '660px' }}>
            <div style={EYEBROW}>Para quién</div>
            <h2 style={H2}>
              Diseñado para empresas que necesitan <span style={{ color: ACCENT }}>mucho más que una empresa de cobranza.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ ...CARD_STYLE, padding: '30px' }}>
              <CornerGlow />
              <div style={{ position: 'relative', fontSize: '15px', fontWeight: 700, color: ACCENT, marginBottom: '16px' }}>Decisores</div>
              <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PERFILES.map(p => (
                  <span key={p} style={{
                    border: '1px solid rgba(255,255,255,.15)', borderRadius: '999px',
                    padding: '7px 15px', fontSize: '12.5px', color: 'rgba(255,255,255,.75)',
                  }}>{p}</span>
                ))}
              </div>
            </div>

            <div style={{ ...CARD_STYLE, padding: '30px' }}>
              <CornerGlow />
              <div style={{ position: 'relative', fontSize: '15px', fontWeight: 700, color: ACCENT, marginBottom: '16px' }}>Sectores</div>
              <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SECTORES_OBJETIVO.map(s => (
                  <span key={s} style={{
                    border: '1px solid rgba(255,255,255,.15)', borderRadius: '999px',
                    padding: '7px 15px', fontSize: '12.5px', color: 'rgba(255,255,255,.75)',
                  }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 10: URGENCIA ── */}
      <section style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
          border: `1px solid ${ACCENT}45`, borderRadius: '24px', padding: '3.5rem 2.5rem',
        }}>
          <div className="fenix-contacto-glow" style={{
            position: 'absolute', top: '-160px', left: '50%', transform: 'translateX(-50%)',
            width: '520px', height: '520px', borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT}25 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ ...H2, marginBottom: '1.5rem' }}>
              Cada día que una obligación permanece <span style={{ color: ACCENT }}>sin estrategia…</span>
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '2rem' }}>
              {['Disminuye su valor', 'Aumenta el riesgo', 'Se reducen las posibilidades jurídicas'].map(t => (
                <span key={t} style={{
                  border: '1px solid rgba(255,255,255,.15)', borderRadius: '999px',
                  padding: '9px 18px', fontSize: '13px', color: 'rgba(255,255,255,.75)',
                }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Y su empresa continúa financiando involuntariamente a sus deudores.
            </p>
            <p style={{ fontSize: 'clamp(17px, 2vw, 22px)', color: '#fff', lineHeight: 1.5, fontWeight: 600 }}>
              La pregunta ya no es cuánto le deben.<br />
              <span style={{ color: ACCENT }}>La pregunta es cuánto seguirá perdiendo si no actúa hoy.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIO VISUAL + GARANTÍA ── */}
      <section style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(260px, 1.05fr) minmax(260px, 1fr)', gap: '2rem' }} className="fenix-grid-2">
          <div style={{ ...CARD_STYLE, padding: '36px' }}>
            <CornerGlow />
            <div style={{ position: 'relative' }}>
              <div style={EYEBROW}>La diferencia</div>
              <p style={{ fontSize: 'clamp(17px, 1.9vw, 22px)', color: '#fff', lineHeight: 1.5, fontWeight: 600, marginBottom: '1.25rem' }}>
                Las empresas exitosas no esperan a que la cartera se convierta en pérdida.
              </p>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.8, marginBottom: '1rem' }}>
                Implementan modelos inteligentes de recuperación que combinan tecnología,
                análisis y estrategia jurídica.
              </p>
              <p style={{ fontSize: '15px', color: ACCENT, lineHeight: 1.7, fontWeight: 600 }}>
                Eso es exactamente lo que hacemos en FÉNIX.
              </p>
            </div>
          </div>

          <div style={{ ...CARD_STYLE, padding: '36px' }}>
            <CornerGlow />
            <div style={{ position: 'relative' }}>
              <div style={EYEBROW}>Garantía de confianza</div>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                Su información está protegida bajo estrictos protocolos de confidencialidad.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {CONFIANZA.map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,.8)' }}>
                    <span style={{ color: ACCENT }}>✓</span> {c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL / CONTACTO ── */}
      <section id="contacto" style={{ padding: '1rem 1.5rem 8rem' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', position: 'relative', overflow: 'hidden',
          border: `1px solid ${ACCENT}45`, borderRadius: '24px', padding: '3rem',
          boxShadow: `0 40px 100px rgba(0,0,0,.45)`,
          display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(300px, 1.1fr)', gap: '2.5rem',
          alignItems: 'start',
        }} className="fenix-grid-2">
          <div className="fenix-contacto-glow" style={{
            position: 'absolute', top: '-160px', left: '5%',
            width: '520px', height: '520px', borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT}30 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div className="fenix-contacto-sparks" style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              radial-gradient(1.5px 1.5px at 20% 20%, #fff, transparent),
              radial-gradient(1.5px 1.5px at 80% 15%, ${ACCENT}, transparent),
              radial-gradient(1.5px 1.5px at 60% 75%, #fff, transparent),
              radial-gradient(1.5px 1.5px at 12% 70%, ${ACCENT}, transparent)
            `,
            opacity: 0.7, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
            backgroundImage: `linear-gradient(${ACCENT}0a 1px, transparent 1px), linear-gradient(90deg, ${ACCENT}0a 1px, transparent 1px)`,
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(circle at 15% 20%, black, transparent 65%)',
            WebkitMaskImage: 'radial-gradient(circle at 15% 20%, black, transparent 65%)',
          }} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ ...EYEBROW, marginBottom: 0 }}>Diagnóstico ejecutivo</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                border: '1px solid rgba(255,255,255,.18)', borderRadius: '999px',
                padding: '4px 11px 4px 9px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,.6)',
              }}>
                <span className="fenix-live-dot" />
                Especialistas disponibles ahora
              </div>
            </div>
            <h2 style={{ ...H2, marginBottom: '1.1rem' }}>
              Conozca el verdadero <span style={{ color: ACCENT }}>potencial de recuperación</span> de su cartera
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.8, marginBottom: '2rem' }}>
              Solicite un Diagnóstico Ejecutivo Gratuito y descubra cómo una estrategia
              respaldada por tecnología, inteligencia artificial y un equipo jurídico
              especializado puede fortalecer la liquidez de su empresa y convertir su
              cartera en un activo nuevamente productivo.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.75rem' }}>
              <a href="tel:+573215036414" className="fenix-phone-pill">
                <span className="fenix-phone-icon"><IconPhone /></span>
                <span>
                  <span className="fenix-phone-label">Línea principal</span>
                  <span className="fenix-phone-number">+57 321 5036414</span>
                </span>
              </a>
              <a href="tel:3104159173" className="fenix-phone-pill">
                <span className="fenix-phone-icon"><IconPhone /></span>
                <span>
                  <span className="fenix-phone-label">Línea secundaria</span>
                  <span className="fenix-phone-number">310 4159173</span>
                </span>
              </a>
            </div>
          </div>

          <div className="fenix-contacto-form-panel" style={{
            position: 'sticky', top: '96px', alignSelf: 'start',
            background: 'rgba(255,255,255,.02)',
            border: `1px solid ${ACCENT}30`, borderRadius: '18px', padding: '28px',
            boxShadow: `0 0 40px ${ACCENT}12`,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '18px',
              border: `1px solid ${ACCENT}40`, borderRadius: '999px', padding: '5px 12px',
              fontSize: '11px', fontWeight: 700, color: ACCENT, letterSpacing: '.04em',
            }}>
              ⏱ Agende su diagnóstico estratégico
            </div>
            <FenixLeadForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '3.5rem 1.5rem 2.5rem' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'minmax(240px, 1.3fr) minmax(160px, 1fr)', gap: '2.5rem',
          alignItems: 'start', marginBottom: '2.5rem',
        }} className="fenix-grid-2">
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px' }}>
              Fenix <span style={{ color: ACCENT }}>Consultores</span>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', lineHeight: 1.7, maxWidth: '380px' }}>
              FÉNIX Recovery Intelligence®: plataforma inteligente para la recuperación
              estratégica de activos empresariales. Bufete especializado en defensa legal,
              consultoría empresarial y recaudo de cartera desde 2010.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
              Síguenos
            </div>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{
              width: '36px', height: '36px', borderRadius: '50%', background: ACCENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconFacebook />
            </a>
          </div>
        </div>

        <div style={{
          maxWidth: '1100px', margin: '0 auto', paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,.07)',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.35)' }}>
            © 2026 Fenix Consultores Empresariales S.A.S. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      <style>{`
        .fenix-root h1, .fenix-root h2, .fenix-root h3 {
          font-family: var(--font-space-grotesk), sans-serif;
        }
        .fenix-service-card, .fenix-tech-card {
          background: rgba(255,255,255,.012);
          transition: background .3s, border-color .3s, box-shadow .3s, transform .4s ease-out;
        }
        .fenix-service-card * , .fenix-tech-card * {
          transition: color .3s ease-out;
        }
        .fenix-service-card:hover, .fenix-service-card.is-active,
        .fenix-tech-card:hover, .fenix-tech-card.is-active {
          background: linear-gradient(0deg, ${ACCENT} 0%, rgba(0,0,0,0) 100%);
          border-color: ${ACCENT};
          transform: translateY(-20px);
          box-shadow: 0 30px 50px rgba(0,0,0,.55);
        }
        .fenix-service-card:hover .fenix-card-text, .fenix-service-card.is-active .fenix-card-text,
        .fenix-tech-card:hover .fenix-card-text, .fenix-tech-card.is-active .fenix-card-text {
          color: #fff !important;
        }
        .fenix-service-card:hover .fenix-card-arrow, .fenix-service-card.is-active .fenix-card-arrow {
          border-color: #fff !important;
          color: #fff;
        }
        .fenix-hero-tube {
          animation: fenix-tube-pulse 3.5s ease-in-out infinite;
        }
        .fenix-hero-ring {
          animation: fenix-pulse 4s ease-in-out infinite;
        }
        @keyframes fenix-tube-pulse {
          0%, 100% { opacity: 0.85; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.03); }
        }
        @keyframes fenix-pulse {
          0%, 100% { box-shadow: 0 0 40px ${ACCENT}45, inset 0 0 40px ${ACCENT}25; }
          50% { box-shadow: 0 0 60px ${ACCENT}65, inset 0 0 55px ${ACCENT}40; }
        }
        .fenix-contacto-glow {
          animation: fenix-contacto-pulse 5s ease-in-out infinite;
        }
        .fenix-contacto-sparks {
          animation: fenix-twinkle 3s ease-in-out infinite;
        }
        @keyframes fenix-contacto-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes fenix-twinkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        .fenix-live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #3ecf7e; flex-shrink: 0;
          box-shadow: 0 0 0 0 rgba(62,207,126,.6);
          animation: fenix-live-pulse 2s ease infinite;
        }
        @keyframes fenix-live-pulse {
          0% { box-shadow: 0 0 0 0 rgba(62,207,126,.55); }
          70% { box-shadow: 0 0 0 6px rgba(62,207,126,0); }
          100% { box-shadow: 0 0 0 0 rgba(62,207,126,0); }
        }
        .fenix-phone-pill {
          display: flex; align-items: center; gap: 14px;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 14px; padding: 12px 18px;
          text-decoration: none; color: #fff;
          transition: border-color .2s ease, background-color .2s ease, transform .2s ease;
        }
        .fenix-phone-pill:hover {
          border-color: ${ACCENT}70;
          background: ${ACCENT}0f;
          transform: translateY(-2px);
        }
        .fenix-phone-icon {
          width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
          background: ${ACCENT}18; color: ${ACCENT};
          display: flex; align-items: center; justify-content: center;
        }
        .fenix-phone-label {
          display: block; font-size: 11px; color: rgba(255,255,255,.4);
          text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px;
        }
        .fenix-phone-number { display: block; font-size: 16px; font-weight: 700; }
        @media (prefers-reduced-motion: reduce) {
          .fenix-hero-tube, .fenix-hero-ring, .fenix-contacto-glow, .fenix-contacto-sparks, .fenix-live-dot { animation: none; }
          .fenix-phone-pill:hover { transform: none; }
        }
        @media (max-width: 760px) {
          .fenix-grid-2 { grid-template-columns: 1fr !important; }
          .fenix-contacto-form-panel { position: static !important; }
        }
        @media (max-width: 900px) {
          .fenix-services-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
