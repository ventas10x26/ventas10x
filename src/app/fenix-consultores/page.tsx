// Ruta destino: src/app/fenix-consultores/page.tsx
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { Space_Grotesk } from 'next/font/google'
import { FenixNav } from '@/components/fenix/FenixNav'
import { FenixGlowCard } from '@/components/fenix/FenixGlowCard'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Fenix Consultores Empresariales S.A.S. | Bufete de abogados especializados',
  description: 'Empresa dedicada a la defensa legal, con especialistas en consultoría empresarial, recaudo y saneamiento de cartera. Más de 12 años de experiencia.',
}

const DARK = '#000000'
const ACCENT = '#F5821F'

// Icono pequeño de brújula/objetivo para Misión
function IconTarget() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="0.6" fill={ACCENT} />
    </svg>
  )
}

// Icono pequeño de ojo para Visión
function IconEye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12c2.5-4.2 6-6.5 10-6.5s7.5 2.3 10 6.5c-2.5 4.2-6 6.5-10 6.5S4.5 16.2 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Icono pequeño de personas para Recurso Humano
function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M15.5 14.2c2.5.4 4.5 2.7 4.5 5.8" />
    </svg>
  )
}

// Iconos grandes de línea para las cards de servicios, estilo Liquitty (Outcourt/Incourt/NPLS)
function IconRadar() {
  return (
    <svg width="70" height="70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.1">
      <circle cx="32" cy="32" r="19" />
      <line x1="32" y1="4" x2="32" y2="13" />
      <line x1="32" y1="51" x2="32" y2="60" />
      <line x1="4" y1="32" x2="13" y2="32" />
      <line x1="51" y1="32" x2="60" y2="32" />
      <line x1="11.7" y1="11.7" x2="18" y2="18" />
      <line x1="46" y1="46" x2="52.3" y2="52.3" />
      <line x1="52.3" y1="11.7" x2="46" y2="18" />
      <line x1="18" y1="46" x2="11.7" y2="52.3" />
    </svg>
  )
}

function IconCubeOutline() {
  return (
    <svg width="70" height="70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.1">
      <path d="M32 7 L55 20 V44 L32 57 L9 44 V20 Z" />
      <path d="M9 20 L32 33 L55 20" />
      <path d="M32 33 V57" />
    </svg>
  )
}

function IconTriangleUp() {
  return (
    <svg width="70" height="70" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.1">
      <path d="M32 8 L57 52 H7 Z" />
    </svg>
  )
}

// Pequeño retículo decorativo, estilo Liquitty
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

// Glow decorativo de esquina reutilizado en todas las cards con borde
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

const CARD_STYLE: CSSProperties = {
  position: 'relative', overflow: 'hidden',
  background: 'rgba(255,255,255,.012)',
  border: `1px solid ${ACCENT}38`,
  borderRadius: '18px',
}

const PILL_SOLID: CSSProperties = {
  background: ACCENT, color: '#050505',
  padding: '15px 32px', borderRadius: '999px',
  fontSize: '14px', fontWeight: 700, textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  boxShadow: `0 0 0 1px ${ACCENT}, 0 8px 30px ${ACCENT}55`,
}

const PILL_OUTLINE: CSSProperties = {
  background: 'transparent', color: '#fff',
  padding: '15px 28px', borderRadius: '999px', fontSize: '14px',
  fontWeight: 600, textDecoration: 'none', display: 'inline-flex',
  alignItems: 'center', gap: '8px',
  border: '1px solid rgba(255,255,255,.22)',
}

const SERVICIOS = [
  {
    Icono: IconRadar,
    titulo: 'Derecho Preventivo',
    desc: 'Consultoría jurídica, contable y administrativa para racionalizar recursos y agilizar diligencias antes de que se conviertan en litigios.',
  },
  {
    Icono: IconCubeOutline,
    titulo: 'Recaudo y Saneamiento de Cartera',
    desc: 'Gestión del cobro de cartera del sector Real y de entidades del sector Salud, con procesos jurídicos ordenados y eficientes.',
  },
  {
    Icono: IconTriangleUp,
    titulo: 'Consultoría Empresarial',
    desc: 'Acompañamiento permanente a empresas y particulares con herramientas técnicas, jurídicas y tecnológicas para una defensa legal integral.',
  },
]

const STATS = [
  { num: '200+', label: 'Clientes satisfechos' },
  { num: '12+', label: 'Años de experiencia' },
  { num: '330+', label: 'Casos de éxito' },
]

const SECTORES = ['Sector Salud', 'Sector Real', 'Sector Asegurador', 'Sector Financiero', 'Sector Corporativo']

const VALORES = ['Integridad', 'Excelencia', 'Calidad', 'Liderazgo', 'Confidencialidad', 'Responsabilidad']

const PILARES = [
  {
    titulo: 'Gestión Judicial',
    desc: 'Ecosistema para la gestión judicial eficiente y digitalizada de los procesos de cartera.',
  },
  {
    titulo: 'Outsourcing de Cobranza',
    desc: 'Soluciones inteligentes para la recuperación de cartera, con seguimiento oportuno y resultados medibles.',
  },
]

const RESUMEN = [
  {
    Icono: IconTarget,
    titulo: 'Misión',
    desc: 'Lograr que nuestros clientes sientan el acompañamiento de un grupo de profesionales del derecho 24 horas al día, con soluciones convenientes y oportunas a sus requerimientos jurídicos, contables y administrativos, utilizando nuestras herramientas legales, operativas, tecnológicas y de talento humano calificado.',
  },
  {
    Icono: IconEye,
    titulo: 'Visión',
    desc: 'Ser el outsourcing jurídico, contable, administrativo y de cobranzas más reconocido en el sur occidente colombiano, brindando soluciones rápidas y efectivas a las empresas afiliadas.',
  },
  {
    Icono: IconUsers,
    titulo: 'Recurso Humano',
    desc: 'Un equipo de profesionales y especialistas en Administración de Empresas, Contaduría, Finanzas y Derecho que garantiza a nuestros clientes productos y servicios sólidos y confiables.',
  },
]

const BLOG = [
  {
    titulo: 'Autogestión como estrategia de recuperación de cartera',
    resumen: 'Cuando el contacto tiene límites, la recuperación depende de algo más importante: que tan bien diseñado está el cierre digital.',
    grad: `radial-gradient(circle at 30% 30%, #3b6fd6 0%, transparent 45%), radial-gradient(circle at 75% 70%, #7b3bd6 0%, transparent 50%), linear-gradient(160deg, #0d1420, #050708)`,
  },
  {
    titulo: 'Recaudo de cartera en tiempos de IA: el riesgo del dato',
    resumen: 'Usar IA en recaudo de cartera puede mejorar la precisión y consistencia, siempre que no haya zonas grises alrededor del dato.',
    grad: `radial-gradient(circle at 60% 40%, ${ACCENT}80 0%, transparent 50%), radial-gradient(circle at 30% 70%, #d6463b 0%, transparent 45%), linear-gradient(160deg, #1a0d05, #050302)`,
  },
  {
    titulo: 'Trazabilidad jurídica: la base de la confianza',
    resumen: 'Cada proceso auditable es una promesa cumplida. Cómo la trazabilidad se volvió el estándar mínimo esperado por el cliente.',
    grad: `radial-gradient(circle at 50% 50%, ${ACCENT}90 0%, transparent 35%), radial-gradient(circle at 50% 50%, transparent 40%, ${ACCENT}30 42%, transparent 46%), linear-gradient(160deg, #140a03, #050302)`,
  },
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

      {/* ── HERO ── */}
      <section id="inicio" style={{ padding: '7rem 1.5rem 4rem', position: 'relative', overflow: 'hidden' }}>
        {/* Glow neón central */}
        <div style={{
          position: 'absolute', top: '-260px', left: '50%', transform: 'translateX(-50%)',
          width: '1000px', height: '1000px', borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT}60 0%, ${ACCENT}28 45%, transparent 70%)`,
          filter: 'blur(10px)',
          pointerEvents: 'none',
        }} />
        {/* Tubo de neón (anillo grueso difuminado) */}
        <div className="fenix-hero-tube" style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '540px', height: '540px', borderRadius: '50%',
          background: `radial-gradient(circle, transparent 60%, ${ACCENT}90 66%, ${ACCENT}ff 70%, ${ACCENT}90 74%, transparent 80%)`,
          filter: 'blur(6px)',
          pointerEvents: 'none',
        }} />
        {/* Chispas dispersas */}
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
          opacity: 0.8,
          pointerEvents: 'none',
        }} />
        {/* Anillos concéntricos */}
        <div className="fenix-hero-ring" style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '520px', height: '520px', borderRadius: '50%',
          border: `1px solid ${ACCENT}70`,
          boxShadow: `0 0 40px ${ACCENT}45, inset 0 0 40px ${ACCENT}25`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)',
          width: '340px', height: '340px', borderRadius: '50%',
          border: `1px solid ${ACCENT}35`,
          pointerEvents: 'none',
        }} />
        {/* Piso con perspectiva */}
        <div style={{
          position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%) perspective(300px) rotateX(65deg)',
          width: '900px', height: '260px',
          backgroundImage: `repeating-linear-gradient(90deg, ${ACCENT}22 0px, ${ACCENT}22 1px, transparent 1px, transparent 60px)`,
          maskImage: 'linear-gradient(to top, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(30px, 4.6vw, 62px)', fontWeight: 300,
            lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '1.5rem',
          }}>
            Fenix Consultores<br />Empresariales S.A.S.<br />
            <span style={{ color: ACCENT }}>defensa legal y recaudo de cartera.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 1.6vw, 19px)', color: 'rgba(255,255,255,.55)',
            lineHeight: 1.8, maxWidth: '560px', margin: '0 auto 2.5rem',
          }}>
            Empresa dedicada a la defensa legal, con especialistas en consultoría
            empresarial, recaudo y saneamiento de cartera.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <a href="#contacto" style={PILL_SOLID}>
              Conocer Más <IconArrow />
            </a>
            <a href="tel:+573215036414" aria-label="Llamar ahora" style={{
              width: '46px', height: '46px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.35)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}>
              <IconPhone />
            </a>
          </div>

          {/* Tarjeta de líneas */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            display: 'inline-flex', flexDirection: 'column', gap: '4px',
            background: 'rgba(255,255,255,.03)',
            border: `1px solid ${ACCENT}55`,
            boxShadow: `0 0 30px ${ACCENT}25`,
            borderRadius: '18px', padding: '18px 36px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: ACCENT }}>
              Nuestras líneas
            </span>
            <span style={{ fontSize: '20px', fontWeight: 800 }}>+57 321 5036414</span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,.7)' }}>310 4159173</span>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '2.5rem 1.5rem' }}>
        <div style={{
          maxWidth: '860px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem',
        }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(30px, 3.4vw, 44px)', fontWeight: 800, color: ACCENT, lineHeight: 1, letterSpacing: '-.02em' }}>{s.num}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)', marginTop: '8px', letterSpacing: '.03em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTORES ── */}
      <section style={{ padding: '2.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem 2.5rem',
        }}>
          {SECTORES.map(s => (
            <span key={s} style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,.35)', letterSpacing: '.03em', whiteSpace: 'nowrap' }}>
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section id="servicios" style={{ padding: '6rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Glow ambiental superior-central, se filtra a través de las cards */}
        <div style={{
          position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: '1100px', height: '620px', borderRadius: '50%',
          background: `radial-gradient(ellipse, ${ACCENT}3a 0%, ${ACCENT}14 40%, transparent 70%)`,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '1340px', margin: '0 auto', position: 'relative' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem', position: 'relative',
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Servicios
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 42px)', fontWeight: 700, letterSpacing: '-.015em', lineHeight: 1.15, margin: 0, maxWidth: '440px' }}>
              Soluciones <span style={{ color: ACCENT }}>legales</span> integrales
            </h2>
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.45)', lineHeight: 1.7, maxWidth: '360px', margin: 0 }}>
            Herramientas técnicas, jurídicas y tecnológicas que respaldan la salud
            financiera y legal de su empresa.
          </p>
        </div>

        <div className="fenix-services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', position: 'relative' }}>
          {SERVICIOS.map(({ Icono, titulo, desc }) => (
            <FenixGlowCard key={titulo} className="fenix-service-card" style={{
              position: 'relative', overflow: 'hidden',
              border: `3px solid ${ACCENT}`, borderRadius: '15px',
              padding: '20px', minHeight: '400px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <ReticleDot />
              <div className="fenix-card-text" style={{ position: 'relative', color: 'rgba(255,255,255,.85)' }}>
                <Icono />
              </div>
              <div style={{ position: 'relative' }}>
                <div className="fenix-card-text" style={{ fontSize: 'clamp(34px, 3.6vw, 50px)', fontWeight: 400, lineHeight: 1, marginBottom: '14px', fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{titulo}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px' }}>
                  <div className="fenix-card-text" style={{ fontSize: '18px', fontWeight: 400, color: 'rgba(255,255,255,.4)', lineHeight: 1.55, maxWidth: '78%' }}>{desc}</div>
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

      {/* ── QUIÉNES SOMOS ── */}
      <section id="empresa" style={{ padding: '6rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(280px, 1.15fr) minmax(240px, 1fr)', gap: '3.5rem', alignItems: 'center' }} className="fenix-grid-2">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Nosotros
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 42px)', fontWeight: 700, letterSpacing: '-.015em', lineHeight: 1.15, marginBottom: '1.5rem' }}>
              <span style={{ color: ACCENT }}>Más de una década</span> defendiendo sus intereses
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.85, marginBottom: '1.1rem' }}>
              Fénix Consultores Empresariales S.A.S., fue creada en febrero de 2010, y nace del
              deseo de fundar una empresa dedicada a la defensa legal de los intereses de las
              empresas y de particulares, utilizando las herramientas técnicas, jurídicas y
              tecnológicas que permiten realizar esta labor de una manera eficiente y ordenada.
            </p>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.85 }}>
              Compuesta por un grupo de profesionales dispuestos a satisfacer las necesidades
              jurídicas de nuestros clientes, especializándonos en Derecho Preventivo y en el
              cobro de cartera del sector Real y de entidades del sector Salud.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '2.5rem', columnGap: '1.5rem' }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 'clamp(30px, 3.6vw, 46px)', fontWeight: 800, color: ACCENT, lineHeight: 1, letterSpacing: '-.02em' }}>{s.num}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)', marginTop: '8px' }}>{s.label}</div>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', fontSize: '13px', color: 'rgba(255,255,255,.4)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: '1.25rem' }}>
              Tecnología avanzada y estrategias personalizadas para cada cliente.
            </div>
          </div>
        </div>
      </section>

      {/* ── VALORES CORPORATIVOS ── */}
      <section style={{ padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Valores corporativos
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 42px)', fontWeight: 700, letterSpacing: '-.015em', lineHeight: 1.15, marginBottom: '2.5rem', maxWidth: '560px' }}>
            Los principios que guían <span style={{ color: ACCENT }}>cada proceso jurídico</span>
          </h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '3rem' }}>
            {VALORES.map(v => (
              <div key={v} style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,.18)',
                borderRadius: '999px', padding: '9px 20px',
                fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,.75)',
              }}>
                {v}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            {PILARES.map(p => (
              <FenixGlowCard key={p.titulo} className="fenix-tech-card" style={{ ...CARD_STYLE, padding: '30px' }}>
                <div className="fenix-card-text" style={{ position: 'relative', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>{p.titulo}</div>
                <div className="fenix-card-text" style={{ position: 'relative', fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>{p.desc}</div>
              </FenixGlowCard>
            ))}
            <a href="#contacto" style={{
              background: ACCENT, borderRadius: '18px', padding: '30px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
              gap: '10px', textDecoration: 'none', color: '#050505',
              boxShadow: `0 8px 32px ${ACCENT}45`,
            }}>
              <div style={{ fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>Conoce más <IconArrow /></div>
              <div style={{ fontSize: '13px', opacity: 0.75, fontWeight: 500 }}>Hable con un especialista de Fenix Consultores.</div>
            </a>
          </div>
        </div>
      </section>

      {/* ── PROPUESTA DE VALOR ── */}
      <section id="cartera" style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', position: 'relative', overflow: 'hidden',
          border: `1px solid ${ACCENT}45`, borderRadius: '24px', padding: '3rem',
          boxShadow: `0 0 60px ${ACCENT}15`,
          display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(260px, 1.3fr)', gap: '2.5rem', alignItems: 'center',
        }} className="fenix-grid-2">
          <div style={{
            position: 'absolute', top: '-100px', left: '-100px',
            width: '320px', height: '320px', borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'relative', aspectRatio: '4 / 3', borderRadius: '18px', overflow: 'hidden',
            background: `radial-gradient(circle at 50% 32%, ${ACCENT}45 0%, transparent 55%), linear-gradient(180deg, #0d0805, #050302)`,
            border: `1px solid ${ACCENT}35`,
          }}>
            {/* Piso/túnel con perspectiva */}
            <div style={{
              position: 'absolute', bottom: '-30%', left: '50%', transform: 'translateX(-50%) perspective(260px) rotateX(62deg)',
              width: '160%', height: '90%',
              backgroundImage: `repeating-linear-gradient(90deg, ${ACCENT}30 0px, ${ACCENT}30 1px, transparent 1px, transparent 26px)`,
              maskImage: 'linear-gradient(to top, black, transparent 75%)',
              WebkitMaskImage: 'linear-gradient(to top, black, transparent 75%)',
            }} />
            {/* Silueta caminando */}
            <div style={{
              position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)',
              width: '18px', height: '46px',
            }}>
              <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#050302', margin: '0 auto 2px' }} />
              <div style={{ width: '18px', height: '30px', borderRadius: '9px 9px 3px 3px', background: '#050302' }} />
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Gestión de Cartera
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 700, letterSpacing: '-.015em', lineHeight: 1.2, marginBottom: '1.1rem' }}>
              Propuesta de <span style={{ color: ACCENT }}>valor única</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.8, marginBottom: '1rem' }}>
              En Fenix Consultores, transformamos la recuperación de cartera del sector Real y
              de entidades del sector Salud a través de un equipo jurídico especializado y un
              enfoque centrado en el cliente.
            </p>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.5)', lineHeight: 1.8, marginBottom: '1.75rem' }}>
              Nuestra experiencia de más de 12 años en el sector nos permite ofrecer soluciones
              efectivas y personalizadas para cada empresa afiliada.
            </p>
            <a href="#contacto" style={PILL_SOLID}>
              Conocer Más <IconArrow />
            </a>
          </div>
        </div>
      </section>

      {/* ── MISIÓN / VISIÓN / RECURSO HUMANO ── */}
      <section style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Nuestro compromiso
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 38px)', fontWeight: 700, letterSpacing: '-.015em', lineHeight: 1.2, margin: 0 }}>
              Los números que nos respaldan
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {RESUMEN.map(({ Icono, titulo, desc }) => (
              <div key={titulo} style={{ ...CARD_STYLE, padding: '30px' }}>
                <CornerGlow />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Icono />
                  <div style={{ fontSize: '17px', fontWeight: 700, color: ACCENT }}>{titulo}</div>
                </div>
                <div style={{ position: 'relative', fontSize: '14px', color: 'rgba(255,255,255,.5)', lineHeight: 1.75 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG ── */}
      <section style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: ACCENT, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
                Blog
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 38px)', fontWeight: 700, letterSpacing: '-.015em', lineHeight: 1.2, margin: 0 }}>
                Novedades en <span style={{ color: ACCENT }}>Recuperación</span>
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.45)', lineHeight: 1.7, maxWidth: '340px', margin: 0 }}>
              Explora nuestras últimas publicaciones sobre recuperación de cartera.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {BLOG.map(b => (
              <div key={b.titulo} style={{ ...CARD_STYLE, padding: 0 }}>
                <div style={{ position: 'relative', aspectRatio: '16 / 10', background: b.grad }}>
                  <span style={{
                    position: 'absolute', top: '14px', left: '14px',
                    background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
                    borderRadius: '999px', padding: '5px 12px',
                    fontSize: '10px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff',
                  }}>
                    Destacado
                  </span>
                  <span style={{
                    position: 'absolute', top: '14px', right: '14px',
                    background: ACCENT, borderRadius: '999px', padding: '5px 12px',
                    fontSize: '10px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#050302',
                  }}>
                    Artículo
                  </span>
                </div>
                <div style={{ padding: '22px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.4, marginBottom: '8px' }}>{b.titulo}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>{b.resumen}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / CONTACTO ── */}
      <section id="contacto" style={{ padding: '1rem 1.5rem 6rem' }}>
        <div style={{
          maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative', overflow: 'hidden',
          border: `1px solid ${ACCENT}45`, borderRadius: '24px', padding: '3.5rem 2rem',
        }}>
          <div style={{
            position: 'absolute', top: '-140px', left: '50%', transform: 'translateX(-50%)',
            width: '420px', height: '420px', borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT}25 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          <h2 style={{ position: 'relative', fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 700, letterSpacing: '-.015em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
            ¿Necesita asesoría <span style={{ color: ACCENT }}>jurídica especializada?</span>
          </h2>
          <p style={{ position: 'relative', fontSize: '16px', color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Hable con nuestro equipo. Atención 24 horas para nuestros clientes afiliados.
          </p>
          <div style={{ position: 'relative', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+573215036414" style={PILL_SOLID}>
              +57 321 5036414
            </a>
            <a href="tel:3104159173" style={PILL_OUTLINE}>
              310 4159173
            </a>
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
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', lineHeight: 1.7, maxWidth: '340px' }}>
              Bufete de abogados especializado en defensa legal, consultoría empresarial
              y recaudo de cartera desde 2010.
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
        @media (prefers-reduced-motion: reduce) {
          .fenix-hero-tube, .fenix-hero-ring { animation: none; }
        }
        @media (max-width: 760px) {
          .fenix-grid-2 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .fenix-services-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
