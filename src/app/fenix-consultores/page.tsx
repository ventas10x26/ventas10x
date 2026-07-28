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

// ─── Paleta cálida (dark suavizado + escala crema→coral) ───
const DARK = '#16110d'      // base cálida, ya no negro puro
const DARK_2 = '#1f1813'    // superficie elevada
const CREAM = '#faf5ef'     // crema
const SAND = '#e8e0d7'      // arena
const PEACH = '#ffc9a6'     // durazno
const ACCENT = '#F5821F'    // coral / naranja de marca
const INK = '#17120e'       // texto sobre superficies claras

const MAXW = '1340px'

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

// Ilustraciones de línea para la fila de cards graduadas
function ArtBrain({ tint }: { tint: string }) {
  return (
    <svg width="100%" height="140" viewBox="0 0 200 140" fill="none" stroke={tint} strokeWidth="1.2">
      <circle cx="100" cy="70" r="18" />
      <circle cx="45" cy="38" r="9" />
      <circle cx="155" cy="38" r="9" />
      <circle cx="45" cy="102" r="9" />
      <circle cx="155" cy="102" r="9" />
      <path d="M53 43 84 61M147 43 116 61M53 97 84 79M147 97 116 79" strokeDasharray="3 4" />
    </svg>
  )
}

function ArtDashboard({ tint }: { tint: string }) {
  return (
    <svg width="100%" height="140" viewBox="0 0 200 140" fill="none" stroke={tint} strokeWidth="1.2">
      <rect x="34" y="20" width="132" height="100" rx="8" />
      <path d="M34 44h132" />
      <path d="M56 104V78M84 104V60M112 104V88M140 104V68" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function ArtAutomation({ tint }: { tint: string }) {
  return (
    <svg width="100%" height="140" viewBox="0 0 200 140" fill="none" stroke={tint} strokeWidth="1.2">
      <rect x="30" y="34" width="54" height="30" rx="6" />
      <rect x="116" y="34" width="54" height="30" rx="6" />
      <rect x="73" y="86" width="54" height="30" rx="6" />
      <path d="M84 49h32M57 64v10q0 12 12 12h4M143 64v10q0 12-12 12h-4" strokeDasharray="3 4" />
    </svg>
  )
}

function ArtShield({ tint }: { tint: string }) {
  return (
    <svg width="100%" height="140" viewBox="0 0 200 140" fill="none" stroke={tint} strokeWidth="1.2">
      <path d="M100 18l42 16v34c0 28-19 45-42 54-23-9-42-26-42-54V34z" />
      <path d="M84 70l12 12 24-24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CornerGlow() {
  return (
    <div style={{
      position: 'absolute', top: '-40px', left: '-40px',
      width: '160px', height: '160px', borderRadius: '50%',
      background: `radial-gradient(circle, ${ACCENT}30 0%, transparent 70%)`,
      filter: 'blur(6px)', pointerEvents: 'none',
    }} />
  )
}

// ─── Estilos base ───
const CARD_DARK: CSSProperties = {
  position: 'relative', overflow: 'hidden',
  background: DARK_2,
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: '28px',
}

const PILL_SOLID: CSSProperties = {
  background: ACCENT, color: INK,
  padding: '16px 34px', borderRadius: '999px',
  fontSize: '14px', fontWeight: 700, textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  boxShadow: `0 8px 30px ${ACCENT}45`,
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
  fontSize: 'clamp(28px, 3.6vw, 50px)', fontWeight: 400,
  letterSpacing: '-.02em', lineHeight: 1.08, margin: 0,
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

// Fila graduada crema → arena → durazno → coral
const DIFERENCIALES = [
  {
    label: 'Inteligencia Artificial',
    titulo: 'Decida con datos, no con intuición.',
    desc: 'Modelos inteligentes que optimizan la priorización de cartera, automatizan procesos y permiten decisiones más rápidas y eficientes.',
    bg: CREAM, fg: INK, Art: ArtBrain,
  },
  {
    label: 'Plataforma Tecnológica',
    titulo: 'Toda su cartera en un solo lugar.',
    desc: 'Estado de cada obligación, historial de gestiones, compromisos de pago, documentación, indicadores y reportes ejecutivos. Todo centralizado.',
    bg: SAND, fg: INK, Art: ArtDashboard,
  },
  {
    label: 'Automatización de Cobranza',
    titulo: 'Gestión que nunca se detiene.',
    desc: 'Notificaciones automáticas, recordatorios inteligentes, seguimiento permanente y gestión multicanal.',
    bg: PEACH, fg: INK, Art: ArtAutomation,
  },
  {
    label: 'Equipo Jurídico Especializado',
    titulo: 'Respaldo legal cuando hace falta.',
    desc: 'Abogados con experiencia en recuperación empresarial: negociación estratégica, procesos ejecutivos, medidas cautelares y recuperación judicial.',
    bg: ACCENT, fg: INK, Art: ArtShield,
  },
]

const PILARES = [
  { num: '01', titulo: 'Diagnóstico Estratégico', desc: 'Analizamos jurídicamente cada obligación antes de actuar.' },
  { num: '02', titulo: 'Gestión Inteligente', desc: 'La IA identifica prioridades, optimiza tiempos y fortalece la toma de decisiones.' },
  { num: '03', titulo: 'Ejecución Especializada', desc: 'Cada deudor recibe una estrategia diferente. Porque ninguna cartera es igual.' },
  { num: '04', titulo: 'Información en Tiempo Real', desc: 'Usted conoce permanentemente qué ocurre con cada obligación. Sin llamadas. Sin solicitar informes.' },
]

const PLATAFORMA_ITEMS = [
  'Total recuperado', 'Cartera activa', 'Cartera crítica',
  'Compromisos de pago', 'Procesos jurídicos', 'Historial completo',
  'Indicadores por gestor', 'Reportes descargables', 'Seguimiento por expediente',
]

const TECNOLOGIA = [
  'Inteligencia Artificial', 'Automatización', 'Plataforma Web', 'Analítica de Datos',
  'Gestión Documental', 'Comunicación Digital', 'WhatsApp Empresarial',
  'Correo Electrónico Automatizado', 'Llamadas Estratégicas', 'SMS', 'Gestión Jurídica',
]

const BENEFICIOS = [
  'Mayor control', 'Mayor trazabilidad', 'Mayor transparencia',
  'Mayor velocidad', 'Mayor probabilidad de recuperación', 'Menor riesgo jurídico',
]

const INDICADORES = [
  'Tiempo promedio de recuperación', 'Edad de cartera', 'Compromisos cumplidos',
  'Compromisos incumplidos', 'Productividad por gestor', 'Procesos judiciales activos',
  'Recuperación mensual', 'Proyección de recaudo',
]

const PERFILES = ['Presidentes', 'Propietarios', 'Socios', 'Gerentes Generales', 'CFO', 'Directores Financieros']
const SECTORES_OBJETIVO = ['Empresas B2B', 'Sector Salud', 'Industria', 'Construcción', 'Tecnología', 'Distribución', 'Cooperativas', 'Instituciones financieras']

const CONFIANZA = [
  'Gestión documentada', 'Seguimiento permanente', 'Reportes ejecutivos',
  'Plataforma segura', 'Atención personalizada', 'Comunicación transparente',
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
      <section id="inicio" style={{ padding: '7rem 1.5rem 5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-260px', left: '50%', transform: 'translateX(-50%)',
          width: '1100px', height: '1000px', borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT}55 0%, ${ACCENT}22 45%, transparent 70%)`,
          filter: 'blur(10px)', pointerEvents: 'none',
        }} />
        <div className="fenix-hero-tube" style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '560px', height: '560px', borderRadius: '50%',
          background: `radial-gradient(circle, transparent 60%, ${ACCENT}80 66%, ${ACCENT}f0 70%, ${ACCENT}80 74%, transparent 80%)`,
          filter: 'blur(7px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '-260px', left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '700px',
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 15% 30%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 82% 22%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 68% 55%, ${PEACH}, transparent),
            radial-gradient(1.5px 1.5px at 30% 68%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 90% 60%, ${PEACH}, transparent),
            radial-gradient(1.5px 1.5px at 45% 15%, #fff, transparent)
          `,
          opacity: 0.75, pointerEvents: 'none',
        }} />
        <div className="fenix-hero-ring" style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '540px', height: '540px', borderRadius: '50%',
          border: `1px solid ${ACCENT}60`,
          boxShadow: `0 0 40px ${ACCENT}35, inset 0 0 40px ${ACCENT}20`,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', textAlign: 'center' }}>
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
            fontSize: 'clamp(34px, 6vw, 82px)', fontWeight: 300,
            lineHeight: 1.02, letterSpacing: '-.035em', marginBottom: '1.75rem',
          }}>
            El dinero de su empresa<br />
            <span style={{ color: ACCENT }}>no está perdido.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(17px, 1.8vw, 22px)', color: 'rgba(255,255,255,.72)',
            lineHeight: 1.55, maxWidth: '720px', margin: '0 auto 1.5rem',
          }}>
            Está inmovilizado en una cartera que necesita estrategia, tecnología
            y ejecución especializada.
          </p>

          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,.45)',
            lineHeight: 1.8, maxWidth: '660px', margin: '0 auto 2.5rem',
          }}>
            Recuperamos activos empresariales combinando Inteligencia Artificial, software de
            gestión de cartera, analítica financiera, automatización de cobro y respaldo
            jurídico especializado. Recuperar cartera hoy ya no depende de insistir: depende
            de <strong style={{ color: '#fff', fontWeight: 600 }}>información, tecnología y decisiones estratégicas</strong>.
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
        <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
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

      {/* ── SECCIÓN 2: EL COSTO DE ESPERAR (bento orgánico) ── */}
      <section style={{ padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
          <div className="fenix-bento" style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '20px' }}>
            {/* Card grande durazno con forma orgánica */}
            <div style={{
              background: PEACH, color: INK,
              borderRadius: '260px 32px 32px 260px', padding: '3.5rem 3rem 3.5rem 4.5rem',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              minHeight: '380px',
            }} className="fenix-bento-organic">
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .6, marginBottom: '14px' }}>
                El costo de esperar
              </div>
              <h2 style={{ ...H2, color: INK, marginBottom: '1.25rem', maxWidth: '460px' }}>
                Mientras su empresa vende, sus utilidades siguen detenidas.
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.7, opacity: .75, maxWidth: '440px' }}>
                La cartera vencida afecta mucho más que el flujo de caja. Cada día sin una
                estrategia adecuada incrementa el riesgo de pérdida del activo.
              </p>
            </div>

            {/* Card oscura con los impactos */}
            <div style={{ ...CARD_DARK, padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <CornerGlow />
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', marginBottom: '1.5rem' }}>
                  También compromete:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {IMPACTOS.map(i => (
                    <div key={i} style={{
                      border: `1px solid ${ACCENT}30`, borderRadius: '14px',
                      padding: '16px 14px', fontSize: '14px', fontWeight: 600,
                      color: 'rgba(255,255,255,.85)', background: 'rgba(255,255,255,.02)',
                    }}>
                      {i}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: DIFERENCIALES (fila graduada) ── */}
      <section id="modelo" style={{ padding: '5rem 1.5rem 6rem', position: 'relative' }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ ...EYEBROW, marginBottom: '18px' }}>El diferencial</div>
            <h2 style={{ ...H2, maxWidth: '820px', margin: '0 auto 1rem' }}>
              No solo recuperamos cartera. Diseñamos un <span style={{ color: ACCENT }}>ecosistema inteligente</span> de recuperación.
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.45)', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>
              Nuestra metodología integra simultáneamente tecnología, analítica y respaldo
              jurídico especializado.
            </p>
          </div>

          <div className="fenix-grad-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {DIFERENCIALES.map(({ label, titulo, desc, bg, fg, Art }) => (
              <div key={label} className="fenix-grad-card" style={{
                background: bg, color: fg, borderRadius: '26px',
                padding: '30px 26px', display: 'flex', flexDirection: 'column',
                minHeight: '520px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, opacity: .65, marginBottom: '10px' }}>
                  {label}
                </div>
                <h3 style={{
                  fontSize: 'clamp(22px, 1.9vw, 27px)', fontWeight: 400, lineHeight: 1.15,
                  letterSpacing: '-.02em', margin: '0 0 auto', color: fg,
                }}>
                  {titulo}
                </h3>
                <div style={{ margin: '2rem 0', opacity: .75 }}>
                  <Art tint={fg} />
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.6, opacity: .7, margin: 0 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: MODELO UREA ── */}
      <section style={{ padding: '6rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', maxWidth: '760px' }}>
            <div style={EYEBROW}>Modelo Integral UREA®</div>
            <h2 style={{ ...H2, marginBottom: '1rem' }}>
              Tecnología + Inteligencia Jurídica = <span style={{ color: ACCENT }}>Mayor Recuperación</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.8 }}>
              La Unidad de Recuperación Estratégica de Activos opera bajo cuatro pilares.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '18px' }}>
            {PILARES.map(p => (
              <FenixGlowCard key={p.num} className="fenix-tech-card" style={{ ...CARD_DARK, padding: '30px' }}>
                <div className="fenix-card-text" style={{ position: 'relative', fontSize: '13px', fontWeight: 700, color: ACCENT, marginBottom: '20px', letterSpacing: '.08em' }}>{p.num}</div>
                <div className="fenix-card-text" style={{ position: 'relative', fontSize: '21px', fontWeight: 500, marginBottom: '10px', lineHeight: 1.2 }}>{p.titulo}</div>
                <div className="fenix-card-text" style={{ position: 'relative', fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>{p.desc}</div>
              </FenixGlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 5: PLATAFORMA (bento coral orgánico) ── */}
      <section id="plataforma" style={{ padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
          <div className="fenix-bento" style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '20px' }}>
            <div style={{
              background: ACCENT, color: INK,
              borderRadius: '32px 260px 260px 32px', padding: '3.5rem 4.5rem 3.5rem 3rem',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '420px',
            }} className="fenix-bento-organic-right">
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .6, marginBottom: '14px' }}>
                Recovery Intelligence®
              </div>
              <h2 style={{ ...H2, color: INK, marginBottom: '1.25rem', maxWidth: '420px' }}>
                Visualice su cartera como nunca antes.
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.7, opacity: .78, marginBottom: '2rem', maxWidth: '400px' }}>
                Plataforma Empresarial de Gestión de Recuperación. Ingrese desde cualquier lugar
                y vea toda la operación de su cartera en tiempo real.
              </p>
              <a href="#contacto" style={{
                background: INK, color: '#fff', padding: '15px 30px', borderRadius: '999px',
                fontSize: '14px', fontWeight: 700, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start',
              }}>
                Ver la plataforma <IconArrow />
              </a>
            </div>

            <div style={{ ...CARD_DARK, padding: '2.5rem' }}>
              <CornerGlow />
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {PLATAFORMA_ITEMS.map(item => (
                  <div key={item} style={{
                    border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px',
                    padding: '16px 14px', fontSize: '13px', fontWeight: 600,
                    color: 'rgba(255,255,255,.78)', background: 'rgba(255,255,255,.02)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <span style={{ color: ACCENT, flexShrink: 0 }}>▸</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 6: STACK TECNOLÓGICO ── */}
      <section id="tecnologia" style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ ...EYEBROW, marginBottom: '18px' }}>Stack tecnológico</div>
          <h2 style={{ ...H2, maxWidth: '780px', margin: '0 auto 1rem' }}>
            Recuperar cartera dejó de ser manual. <span style={{ color: ACCENT }}>Hoy requiere tecnología.</span>
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.45)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Todo coordinado bajo una única estrategia.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {TECNOLOGIA.map(t => (
              <div key={t} style={{
                border: `1px solid ${ACCENT}35`, borderRadius: '999px',
                padding: '12px 24px', fontSize: '13.5px', fontWeight: 600,
                color: 'rgba(255,255,255,.85)', background: `${ACCENT}0d`,
              }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 7 + 8: BENEFICIOS E INDICADORES ── */}
      <section style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1.15fr)', gap: '20px' }} className="fenix-grid-2">
          <div style={{ background: SAND, color: INK, borderRadius: '28px', padding: '3rem 2.75rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .55, marginBottom: '14px' }}>
              Lo que obtiene su empresa
            </div>
            <h2 style={{ ...H2, fontSize: 'clamp(24px, 2.4vw, 34px)', color: INK, marginBottom: '1rem' }}>
              No solo recuperamos dinero.
            </h2>
            <p style={{ fontSize: '14.5px', lineHeight: 1.7, opacity: .7, marginBottom: '2rem' }}>
              Entregamos información estratégica para la toma de decisiones.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {BENEFICIOS.map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 500 }}>
                  <span style={{ color: ACCENT, fontWeight: 700 }}>✓</span> {b}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...CARD_DARK, padding: '3rem 2.75rem' }}>
            <CornerGlow />
            <div style={{ position: 'relative' }}>
              <div style={EYEBROW}>Indicadores</div>
              <h2 style={{ ...H2, fontSize: 'clamp(24px, 2.4vw, 34px)', marginBottom: '1rem' }}>
                ¿Por qué sus clientes toman <span style={{ color: ACCENT }}>mejores decisiones?</span>
              </h2>
              <p style={{ fontSize: '14.5px', color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: '2rem' }}>
                Porque tienen información. Todo disponible para la dirección financiera.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {INDICADORES.map(i => (
                  <div key={i} style={{
                    border: '1px solid rgba(255,255,255,.1)', borderRadius: '12px',
                    padding: '13px 14px', fontSize: '12.5px', fontWeight: 600,
                    color: 'rgba(255,255,255,.72)', lineHeight: 1.4,
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
        <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem', maxWidth: '760px' }}>
            <div style={EYEBROW}>Para quién</div>
            <h2 style={H2}>
              Diseñado para empresas que necesitan <span style={{ color: ACCENT }}>mucho más que una empresa de cobranza.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ ...CARD_DARK, padding: '2.5rem' }}>
              <CornerGlow />
              <div style={{ position: 'relative', fontSize: '15px', fontWeight: 700, color: ACCENT, marginBottom: '18px' }}>Decisores</div>
              <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PERFILES.map(p => (
                  <span key={p} style={{
                    border: '1px solid rgba(255,255,255,.15)', borderRadius: '999px',
                    padding: '8px 16px', fontSize: '13px', color: 'rgba(255,255,255,.78)',
                  }}>{p}</span>
                ))}
              </div>
            </div>

            <div style={{ ...CARD_DARK, padding: '2.5rem' }}>
              <CornerGlow />
              <div style={{ position: 'relative', fontSize: '15px', fontWeight: 700, color: ACCENT, marginBottom: '18px' }}>Sectores</div>
              <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SECTORES_OBJETIVO.map(s => (
                  <span key={s} style={{
                    border: '1px solid rgba(255,255,255,.15)', borderRadius: '999px',
                    padding: '8px 16px', fontSize: '13px', color: 'rgba(255,255,255,.78)',
                  }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 10: URGENCIA (bloque crema, alto contraste) ── */}
      <section style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{
          maxWidth: MAXW, margin: '0 auto', background: CREAM, color: INK,
          borderRadius: '40px', padding: '4.5rem 3rem', textAlign: 'center',
        }}>
          <h2 style={{ ...H2, color: INK, marginBottom: '1.75rem', maxWidth: '820px', margin: '0 auto 1.75rem' }}>
            Cada día que una obligación permanece <span style={{ color: ACCENT }}>sin estrategia…</span>
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '2rem' }}>
            {['Disminuye su valor', 'Aumenta el riesgo', 'Se reducen las posibilidades jurídicas'].map(t => (
              <span key={t} style={{
                border: `1px solid ${INK}25`, borderRadius: '999px',
                padding: '10px 20px', fontSize: '13.5px', fontWeight: 600, opacity: .8,
              }}>{t}</span>
            ))}
          </div>
          <p style={{ fontSize: '15px', lineHeight: 1.8, opacity: .6, marginBottom: '1.75rem' }}>
            Y su empresa continúa financiando involuntariamente a sus deudores.
          </p>
          <p style={{ fontSize: 'clamp(20px, 2.6vw, 32px)', lineHeight: 1.35, fontWeight: 400, letterSpacing: '-.02em' }}>
            La pregunta ya no es cuánto le deben.<br />
            <strong style={{ color: ACCENT, fontWeight: 500 }}>La pregunta es cuánto seguirá perdiendo si no actúa hoy.</strong>
          </p>
        </div>
      </section>

      {/* ── TESTIMONIO + GARANTÍA ── */}
      <section style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(260px, 1.05fr) minmax(260px, 1fr)', gap: '20px' }} className="fenix-grid-2">
          <div style={{ ...CARD_DARK, padding: '3rem 2.75rem' }}>
            <CornerGlow />
            <div style={{ position: 'relative' }}>
              <div style={EYEBROW}>La diferencia</div>
              <p style={{ fontSize: 'clamp(19px, 2.1vw, 26px)', color: '#fff', lineHeight: 1.35, fontWeight: 400, letterSpacing: '-.02em', marginBottom: '1.5rem' }}>
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

          <div style={{ ...CARD_DARK, padding: '3rem 2.75rem' }}>
            <CornerGlow />
            <div style={{ position: 'relative' }}>
              <div style={EYEBROW}>Garantía de confianza</div>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: '1.75rem' }}>
                Su información está protegida bajo estrictos protocolos de confidencialidad.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {CONFIANZA.map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14.5px', color: 'rgba(255,255,255,.8)' }}>
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
          maxWidth: MAXW, margin: '0 auto', position: 'relative', overflow: 'hidden',
          background: DARK_2, border: `1px solid ${ACCENT}40`,
          borderRadius: '40px', padding: '3.5rem 3rem',
          boxShadow: `0 40px 100px rgba(0,0,0,.45)`,
          display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(320px, 1fr)', gap: '3rem',
          alignItems: 'start',
        }} className="fenix-grid-2">
          <div className="fenix-contacto-glow" style={{
            position: 'absolute', top: '-160px', left: '5%',
            width: '520px', height: '520px', borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT}28 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div className="fenix-contacto-sparks" style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              radial-gradient(1.5px 1.5px at 20% 20%, #fff, transparent),
              radial-gradient(1.5px 1.5px at 80% 15%, ${PEACH}, transparent),
              radial-gradient(1.5px 1.5px at 60% 75%, #fff, transparent),
              radial-gradient(1.5px 1.5px at 12% 70%, ${PEACH}, transparent)
            `,
            opacity: 0.6, pointerEvents: 'none',
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
            <h2 style={{ ...H2, marginBottom: '1.25rem' }}>
              Conozca el verdadero <span style={{ color: ACCENT }}>potencial de recuperación</span> de su cartera
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.8, marginBottom: '2rem' }}>
              Solicite un Diagnóstico Ejecutivo Gratuito y descubra cómo una estrategia
              respaldada por tecnología, inteligencia artificial y un equipo jurídico
              especializado puede fortalecer la liquidez de su empresa y convertir su
              cartera en un activo nuevamente productivo.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
            background: 'rgba(255,255,255,.03)',
            border: `1px solid ${ACCENT}30`, borderRadius: '28px', padding: '30px',
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
          maxWidth: MAXW, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'minmax(240px, 1.3fr) minmax(160px, 1fr)', gap: '2.5rem',
          alignItems: 'start', marginBottom: '2.5rem',
        }} className="fenix-grid-2">
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px' }}>
              Fenix <span style={{ color: ACCENT }}>Consultores</span>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', lineHeight: 1.7, maxWidth: '420px' }}>
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
          maxWidth: MAXW, margin: '0 auto', paddingTop: '1.5rem',
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
        /* Cards graduadas (superficies claras): elevación suave, sin fill naranja */
        .fenix-grad-card {
          transition: transform .4s ease-out, box-shadow .4s ease-out;
        }
        .fenix-grad-card:hover {
          transform: translateY(-14px);
          box-shadow: 0 30px 60px rgba(0,0,0,.45);
        }
        /* Cards oscuras: conservan el fill de acento */
        .fenix-tech-card {
          background: ${DARK_2};
          transition: background .3s, border-color .3s, box-shadow .3s, transform .4s ease-out;
        }
        .fenix-tech-card * { transition: color .3s ease-out; }
        .fenix-tech-card:hover, .fenix-tech-card.is-active {
          background: linear-gradient(0deg, ${ACCENT} 0%, rgba(0,0,0,0) 100%);
          border-color: ${ACCENT};
          transform: translateY(-16px);
          box-shadow: 0 30px 50px rgba(0,0,0,.5);
        }
        .fenix-tech-card:hover .fenix-card-text, .fenix-tech-card.is-active .fenix-card-text {
          color: #fff !important;
        }
        .fenix-hero-tube { animation: fenix-tube-pulse 3.5s ease-in-out infinite; }
        .fenix-hero-ring { animation: fenix-pulse 4s ease-in-out infinite; }
        @keyframes fenix-tube-pulse {
          0%, 100% { opacity: 0.85; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.03); }
        }
        @keyframes fenix-pulse {
          0%, 100% { box-shadow: 0 0 40px ${ACCENT}35, inset 0 0 40px ${ACCENT}20; }
          50% { box-shadow: 0 0 60px ${ACCENT}55, inset 0 0 55px ${ACCENT}35; }
        }
        .fenix-contacto-glow { animation: fenix-contacto-pulse 5s ease-in-out infinite; }
        .fenix-contacto-sparks { animation: fenix-twinkle 3s ease-in-out infinite; }
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
          border-radius: 16px; padding: 13px 18px;
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
          .fenix-hero-tube, .fenix-hero-ring, .fenix-contacto-glow,
          .fenix-contacto-sparks, .fenix-live-dot { animation: none; }
          .fenix-phone-pill:hover, .fenix-grad-card:hover, .fenix-tech-card:hover { transform: none; }
        }
        @media (max-width: 1100px) {
          .fenix-grad-row { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .fenix-bento { grid-template-columns: 1fr !important; }
          .fenix-bento-organic { border-radius: 200px 200px 32px 32px !important; padding: 3rem 2.5rem !important; }
          .fenix-bento-organic-right { border-radius: 200px 200px 32px 32px !important; padding: 3rem 2.5rem !important; }
        }
        @media (max-width: 760px) {
          .fenix-grid-2 { grid-template-columns: 1fr !important; }
          .fenix-contacto-form-panel { position: static !important; }
          .fenix-grad-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
