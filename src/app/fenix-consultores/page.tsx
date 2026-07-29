// Ruta destino: src/app/fenix-consultores/page.tsx
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { Space_Grotesk } from 'next/font/google'
import { FenixNav } from '@/components/fenix/FenixNav'
import { FenixGlowCard } from '@/components/fenix/FenixGlowCard'
import { FenixLeadForm } from '@/components/fenix/FenixLeadForm'
import { FenixStickyProspecting } from '@/components/fenix/FenixStickyProspecting'
import { FenixVideoShort } from '@/components/fenix/FenixVideoShort'
import { FenixPhotoCarousel } from '@/components/fenix/FenixPhotoCarousel'
import { FenixReveal } from '@/components/fenix/FenixReveal'
import { FenixScrollPanel } from '@/components/fenix/FenixScrollPanel'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
})

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'

const OG_TITLE = 'FÉNIX Recovery Intelligence® | Recuperación estratégica de cartera'
const OG_DESC = 'El dinero de su empresa no está perdido. Recuperamos activos empresariales con Inteligencia Artificial, plataforma de gestión de cartera y respaldo jurídico especializado.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: OG_TITLE,
  description: OG_DESC,
  alternates: { canonical: '/fenix-consultores' },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/fenix-consultores`,
    siteName: 'Fenix Consultores Empresariales S.A.S.',
    title: OG_TITLE,
    description: OG_DESC,
    locale: 'es_CO',
    images: [{
      url: `${SITE_URL}/og/fenix`,
      width: 1200,
      height: 630,
      alt: 'FÉNIX Recovery Intelligence® — Recuperación estratégica de activos empresariales',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: OG_TITLE,
    description: OG_DESC,
    images: [`${SITE_URL}/og/fenix`],
  },
}

// ─── Paleta cálida (dark suavizado + escala crema→coral) ───
const DARK = '#16110d'      // base cálida, ya no negro puro
const DARK_2 = '#1f1813'    // superficie elevada
const CREAM = '#faf5ef'     // crema
const SAND = '#e8e0d7'      // arena
const PEACH = '#ffc9a6'     // durazno
const ACCENT = '#F5821F'    // coral / naranja de marca
const INK = '#17120e'       // texto sobre superficies claras
const LIGHT = '#f7f5f2'     // fondo claro de secciones (hero, contacto)

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

function IconPlaySmall() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
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

// Botón secundario para superficies claras (el PILL_OUTLINE es para fondo oscuro)
const PILL_OUTLINE_LIGHT: CSSProperties = {
  background: '#fff', color: INK,
  padding: '16px 30px', borderRadius: '999px', fontSize: '14px',
  fontWeight: 600, textDecoration: 'none', display: 'inline-flex',
  alignItems: 'center', gap: '8px',
  border: '1px solid rgba(23,18,14,.15)',
}

const EYEBROW: CSSProperties = {
  fontSize: '12px', fontWeight: 700, color: ACCENT,
  letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px',
}

// Sin `margin` shorthand: los usos hacen override con marginBottom/marginLeft,
// y mezclar shorthand + longhand dispara un warning de React.
const H2: CSSProperties = {
  fontSize: 'clamp(28px, 3.6vw, 50px)', fontWeight: 400,
  letterSpacing: '-.02em', lineHeight: 1.08,
  marginTop: 0, marginBottom: 0,
}

// ─── Datos ───
// Solo los teléfonos verificados de Fenix. No se inventan email ni dirección.
const LINEAS = [
  { label: 'Línea principal', numero: '+57 321 5036414', href: 'tel:+573215036414' },
  { label: 'Línea secundaria', numero: '310 4159173', href: 'tel:3104159173' },
]

// Fotos del hero. Son imagenes de banco (licencia Unsplash, uso comercial
// libre) usadas como contexto visual, NO como fotos del equipo ni de
// clientes de Fenix. Reemplazables por fotos propias en /public/fenix/.
const FOTOS = [
  { src: '/fenix/acuerdo.jpg', alt: 'Dos profesionales celebrando un acuerdo cerrado en una oficina' },
  { src: '/fenix/asesoria.jpg', alt: 'Reunion de asesoria entre dos profesionales' },
  { src: '/fenix/analisis.jpg', alt: 'Analisis de documentos y cifras sobre un escritorio' },
]

// Contenido del panel del hero. Es una representación ilustrativa de la
// plataforma (así se marca en la UI), no cifras reales de ningún cliente.
const AGING = [
  { rango: '0-30', h: 34 },
  { rango: '31-60', h: 52 },
  { rango: '61-90', h: 45 },
  { rango: '91-180', h: 71 },
  { rango: '+180', h: 92 },
]

const ETAPAS = [
  { nombre: 'Prejurídico', estado: 'Gestión activa' },
  { nombre: 'Jurídico', estado: 'En proceso' },
  { nombre: 'Acuerdos', estado: 'En seguimiento' },
]

const GESTIONES = [
  { texto: 'Acuerdo de pago registrado', cuando: 'hoy' },
  { texto: 'Notificación de cobro enviada', cuando: 'hoy' },
  { texto: 'Proceso ejecutivo radicado', cuando: 'ayer' },
]

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

// Orden narrativo: primero cómo opera el modelo, después el costo de no aplicarlo.
const VIDEOS = [
  {
    id: 'YdQoqCQNUFY',
    eyebrow: 'Cómo funciona',
    duracion: 'Video corto',
    titulo: 'Así se ve la recuperación',
    destacado: 'en tiempo real',
    desc: 'Cada gestión queda registrada, medida y disponible para la dirección financiera. Vea cómo se traduce en trazabilidad, indicadores y decisiones más rápidas sobre su cartera.',
    cta: 'Quiero ver mi cartera así',
    label: 'Ver: así se ve la recuperación en tiempo real',
  },
  {
    id: 'nulz93G54W4',
    eyebrow: 'El costo de esperar',
    duracion: 'Video corto',
    titulo: 'Por qué su cartera',
    destacado: 'pierde valor cada día',
    desc: 'El tiempo es la variable que más destruye el valor de una obligación. Vea cómo opera ese deterioro y qué se puede recuperar cuando se interviene con estrategia, tecnología y respaldo jurídico.',
    cta: 'Solicitar Diagnóstico Ejecutivo Gratuito',
    label: 'Ver: por qué su cartera pierde valor cada día',
  },
]

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

      {/* ── HERO (claro, split: mensaje + panel de recuperación) ── */}
      <section id="inicio" style={{
        background: LIGHT, color: INK,
        padding: '5.5rem 1.5rem 5rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-320px', right: '-180px',
          width: '760px', height: '760px', borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 68%)`,
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: MAXW, margin: '0 auto', position: 'relative',
          display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1.05fr)',
          gap: '4rem', alignItems: 'center',
        }} className="fenix-hero-grid">

          {/* Columna de mensaje */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: `${ACCENT}18`, border: `1px solid ${ACCENT}45`,
              borderRadius: '999px', padding: '7px 16px', marginBottom: '1.75rem',
              fontSize: '11px', fontWeight: 800, letterSpacing: '.09em',
              textTransform: 'uppercase', color: '#b85c07',
            }}>
              <span className="fenix-live-dot" />
              Recuperación de cartera empresarial
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 4.6vw, 68px)', fontWeight: 700,
              lineHeight: 1.04, letterSpacing: '-.03em', marginTop: 0, marginBottom: '1.5rem',
              color: INK,
            }}>
              El dinero de su empresa<br />
              <span style={{ color: ACCENT }}>no está perdido.</span>
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 1.5vw, 19px)', color: 'rgba(23,18,14,.68)',
              lineHeight: 1.6, marginBottom: '1.25rem', maxWidth: '540px',
            }}>
              Está inmovilizado en una cartera vencida que necesita gestión de cobro,
              respaldo jurídico y trazabilidad.
            </p>

            <p style={{
              fontSize: '15px', color: 'rgba(23,18,14,.5)',
              lineHeight: 1.75, marginBottom: '2.25rem', maxWidth: '540px',
            }}>
              Recuperamos cartera del sector Real y de entidades del sector Salud
              con cobro prejurídico y jurídico, gestión multicanal y seguimiento
              permanente de cada obligación.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '2.25rem' }}>
              <a href="#contacto" style={PILL_SOLID}>
                Solicitar Diagnóstico de Cartera <IconArrow />
              </a>
              <a href="#modelo" style={PILL_OUTLINE_LIGHT}>
                Conocer el Modelo UREA<sup style={{ fontSize: '9px' }}>®</sup>
              </a>
            </div>

            {/* Señales de especialización en recaudo */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[
                ['+12 años', 'recuperando cartera'],
                ['Prejurídico + Jurídico', 'ruta completa de cobro'],
                ['Real y Salud', 'sectores especializados'],
              ].map(([v, l]) => (
                <div key={l} style={{ maxWidth: '190px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: INK, lineHeight: 1.2 }}>{v}</div>
                  <div style={{ fontSize: '12.5px', color: 'rgba(23,18,14,.45)', marginTop: '4px' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna visual: fotos reales + panel de cartera superpuesto */}
          <div style={{ position: 'relative' }}>
            <FenixPhotoCarousel fotos={FOTOS} />

            {/* Panel de cartera, superpuesto sobre la foto */}
            <div className="fenix-hero-panel" style={{
              position: 'absolute', right: '-18px', bottom: '-42px',
              width: 'min(330px, 82%)',
              background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(8px)',
              borderRadius: '22px', padding: '20px',
              boxShadow: '0 26px 60px rgba(23,18,14,.28)',
              border: '1px solid rgba(23,18,14,.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: INK }}>Edad de cartera</div>
                <span style={{
                  fontSize: '9.5px', fontWeight: 700, color: 'rgba(23,18,14,.42)',
                  background: '#f2efeb', borderRadius: '999px', padding: '4px 9px',
                  letterSpacing: '.04em', textTransform: 'uppercase',
                }}>
                  Ilustrativa
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '7px', height: '74px', marginBottom: '7px' }}>
                {AGING.map((a, i) => (
                  <div key={a.rango} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                    <div style={{
                      height: `${a.h}%`, borderRadius: '5px 5px 3px 3px',
                      background: i === AGING.length - 1
                        ? `linear-gradient(180deg, ${ACCENT}, #d96e0c)`
                        : `${ACCENT}30`,
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '7px', marginBottom: '16px' }}>
                {AGING.map(a => (
                  <div key={a.rango} style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: 'rgba(23,18,14,.45)', fontWeight: 600 }}>
                    {a.rango}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', paddingTop: '14px', borderTop: '1px solid rgba(23,18,14,.08)' }}>
                {GESTIONES.slice(0, 2).map(g => (
                  <div key={g.texto} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: ACCENT, flexShrink: 0 }} />
                    <span style={{ fontSize: '11.5px', color: 'rgba(23,18,14,.72)', flex: 1 }}>{g.texto}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(23,18,14,.38)' }}>{g.cuando}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BARRA DE CREDIBILIDAD (continúa la superficie clara del hero) ── */}
      <section style={{ background: LIGHT, borderTop: '1px solid rgba(23,18,14,.07)', padding: '2.75rem 1.5rem 3.5rem' }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
          <p style={{ fontSize: '13px', color: 'rgba(23,18,14,.5)', textAlign: 'center', marginBottom: '1.75rem' }}>
            Una solución diseñada para empresas que requieren control, trazabilidad y resultados.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {CREDIBILIDAD.map(c => (
              <span key={c} style={{
                background: '#fff', border: '1px solid rgba(23,18,14,.1)', borderRadius: '999px',
                padding: '9px 18px', fontSize: '12.5px', fontWeight: 600,
                color: 'rgba(23,18,14,.7)',
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

      {/* ── VIDEOS: bloque narrativo (solución → costo de no actuar) ── */}
      <section id="videos" style={{ padding: '0 1.5rem 6rem' }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
          {/* Cabecera compartida: da contexto y anticipa la duración */}
          <FenixReveal>
          <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
            <div style={{ ...EYEBROW, marginBottom: '16px' }}>Véalo usted mismo</div>
            <h2 style={{ ...H2, maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1rem' }}>
              Dos minutos para entender <span style={{ color: ACCENT }}>qué cambia con FÉNIX</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.45)', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>
              Primero cómo opera el modelo. Después, qué está costando no aplicarlo.
            </p>
          </div>
          </FenixReveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {VIDEOS.map((v, i) => {
              const destacado = i === 0
              return (
                <div
                  key={v.id}
                  className={`fenix-video-band${i % 2 === 1 ? ' fenix-video-band-rev' : ''}`}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    background: destacado ? CREAM : DARK_2,
                    color: destacado ? INK : '#fff',
                    border: destacado ? '1px solid rgba(23,18,14,.08)' : '1px solid rgba(255,255,255,.08)',
                    borderRadius: '40px', padding: '3rem',
                    display: 'grid',
                    gridTemplateColumns: i % 2 === 1
                      ? 'minmax(220px, 300px) 1fr'
                      : '1fr minmax(220px, 300px)',
                    gap: '3rem', alignItems: 'center',
                  }}
                >
                  {!destacado && <CornerGlow />}

                  {/* Texto */}
                  <div style={{ position: 'relative', order: i % 2 === 1 ? 2 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      {/* Paso numerado: comunica secuencia y cuántos videos hay */}
                      <span style={{
                        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700,
                        background: destacado ? ACCENT : 'transparent',
                        color: destacado ? INK : ACCENT,
                        border: destacado ? 'none' : `1px solid ${ACCENT}70`,
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ ...EYEBROW, marginBottom: 0, color: destacado ? '#b85c07' : ACCENT }}>{v.eyebrow}</span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        border: destacado ? '1px solid rgba(23,18,14,.18)' : '1px solid rgba(255,255,255,.16)',
                        borderRadius: '999px',
                        padding: '4px 11px', fontSize: '11px', fontWeight: 600,
                        color: destacado ? 'rgba(23,18,14,.55)' : 'rgba(255,255,255,.5)',
                      }}>
                        <IconPlaySmall /> {v.duracion}
                      </span>
                    </div>

                    <h3 style={{ ...H2, fontSize: 'clamp(24px, 2.8vw, 38px)', marginBottom: '1.1rem' }}>
                      {v.titulo} <span style={{ color: ACCENT }}>{v.destacado}</span>
                    </h3>
                    <p style={{ fontSize: '15px', color: destacado ? 'rgba(23,18,14,.6)' : 'rgba(255,255,255,.55)', lineHeight: 1.8, marginBottom: '2rem', maxWidth: '520px' }}>
                      {v.desc}
                    </p>
                    <a href="#contacto" style={destacado ? { ...PILL_SOLID, color: '#fff' } : { ...PILL_OUTLINE, borderColor: `${ACCENT}70`, color: ACCENT }}>
                      {v.cta} <IconArrow />
                    </a>
                  </div>

                  {/* Video */}
                  <div className="fenix-video-media" style={{
                    position: 'relative', width: '100%', display: 'flex', justifyContent: 'center',
                    order: i % 2 === 1 ? 1 : 2,
                  }}>
                    <FenixVideoShort videoId={v.id} label={v.label} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: DIFERENCIALES (fila graduada) ── */}
      <section id="modelo" style={{ padding: '5rem 1.5rem 6rem', position: 'relative' }}>
        <div style={{ maxWidth: MAXW, margin: '0 auto' }}>
          <FenixReveal>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ ...EYEBROW, marginBottom: '18px' }}>El diferencial</div>
            <h2 style={{ ...H2, maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1rem' }}>
              No solo recuperamos cartera. Diseñamos un <span style={{ color: ACCENT }}>ecosistema inteligente</span> de recuperación.
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.45)', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>
              Nuestra metodología integra simultáneamente tecnología, analítica y respaldo
              jurídico especializado.
            </p>
          </div>
          </FenixReveal>

          <FenixReveal delay={120}>
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
          </FenixReveal>
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
          <h2 style={{ ...H2, maxWidth: '780px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1rem' }}>
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
          <h2 style={{ ...H2, color: INK, maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1.75rem' }}>
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

      {/* ── CTA FINAL / CONTACTO (panel dividido: info oscura + formulario claro) ── */}
      <section id="contacto" style={{ background: LIGHT, padding: '5rem 1.5rem 6rem' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <FenixReveal>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ ...EYEBROW, color: '#b85c07', marginBottom: '16px' }}>Diagnóstico ejecutivo</div>
            <h2 style={{ ...H2, color: INK, maxWidth: '780px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1rem' }}>
              Conozca el verdadero <span style={{ color: ACCENT }}>potencial de recuperación</span> de su cartera
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(23,18,14,.55)', lineHeight: 1.75, maxWidth: '620px', marginLeft: 'auto', marginRight: 'auto' }}>
              Descubra cómo una estrategia respaldada por tecnología, inteligencia artificial y un
              equipo jurídico especializado puede fortalecer la liquidez de su empresa.
            </p>
          </div>
          </FenixReveal>

          <div className="fenix-contact-split" style={{
            display: 'grid', gridTemplateColumns: 'minmax(280px, .82fr) minmax(320px, 1.18fr)',
            borderRadius: '28px', overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(23,18,14,.14)',
            border: '1px solid rgba(23,18,14,.07)',
          }}>
            {/* Panel oscuro: datos de contacto */}
            <div style={{
              background: INK, color: '#fff', padding: '3rem 2.5rem',
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <div className="fenix-contacto-glow" style={{
                position: 'absolute', top: '-140px', left: '-80px',
                width: '360px', height: '360px', borderRadius: '50%',
                background: `radial-gradient(circle, ${ACCENT}30 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative' }}>
                <h3 style={{ fontSize: 'clamp(24px, 2.4vw, 32px)', fontWeight: 700, letterSpacing: '-.02em', marginTop: 0, marginBottom: '1rem' }}>
                  Contáctenos hoy
                </h3>
                <p style={{ fontSize: '14.5px', color: 'rgba(255,255,255,.55)', lineHeight: 1.7, marginBottom: '2.25rem' }}>
                  Inicie su proceso de recuperación con una asesoría personalizada. Un
                  especialista le contactará en menos de 24 horas.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {LINEAS.map(l => (
                    <a key={l.numero} href={l.href} className="fenix-contact-row">
                      <span className="fenix-contact-ico"><IconPhone /></span>
                      <span>
                        <span style={{ display: 'block', fontSize: '11.5px', color: 'rgba(255,255,255,.45)', marginBottom: '3px' }}>{l.label}</span>
                        <span style={{ display: 'block', fontSize: '16px', fontWeight: 700 }}>{l.numero}</span>
                      </span>
                    </a>
                  ))}
                </div>

                <div style={{
                  marginTop: '2.25rem', paddingTop: '1.5rem',
                  borderTop: '1px solid rgba(255,255,255,.1)',
                  display: 'flex', flexWrap: 'wrap', gap: '8px',
                }}>
                  {['Confidencialidad', 'Gestión documentada', 'Reportes ejecutivos'].map(t => (
                    <span key={t} style={{
                      border: '1px solid rgba(255,255,255,.16)', borderRadius: '999px',
                      padding: '6px 13px', fontSize: '11.5px', color: 'rgba(255,255,255,.6)',
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel claro: formulario (se acerca/aleja segun el scroll) */}
            <div style={{ background: '#fff', padding: '3rem 2.75rem' }}>
              <FenixScrollPanel>
                <FenixLeadForm theme="light" />
              </FenixScrollPanel>
            </div>
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
        /* Cards de video: estado inicial calmado, sobresalen al hover */
        .fenix-video-band {
          transition: transform .45s cubic-bezier(.22,.61,.36,1),
                      box-shadow .45s ease-out,
                      border-color .35s ease-out;
        }
        .fenix-video-band:hover {
          transform: translateY(-10px);
          border-color: ${ACCENT} !important;
          box-shadow: 0 34px 70px rgba(0,0,0,.45);
        }
        @media (prefers-reduced-motion: reduce) {
          .fenix-video-band:hover { transform: none; }
        }
        /* Revelado por scroll */
        .fenix-reveal-hidden {
          opacity: 0;
          transform: translateY(34px);
        }
        .fenix-reveal-in {
          opacity: 1;
          transform: none;
          transition: opacity .75s cubic-bezier(.22,.61,.36,1), transform .75s cubic-bezier(.22,.61,.36,1);
        }
        @media (prefers-reduced-motion: reduce) {
          .fenix-reveal-hidden { opacity: 1; transform: none; }
          .fenix-reveal-in { transition: none; }
        }
        .fenix-contact-row {
          display: flex; align-items: center; gap: 14px;
          text-decoration: none; color: #fff;
          transition: opacity .2s ease, transform .2s ease;
        }
        .fenix-contact-row:hover { opacity: .85; transform: translateX(3px); }
        .fenix-contact-ico {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: rgba(255,255,255,.08); color: ${ACCENT};
          display: flex; align-items: center; justify-content: center;
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
        @media (max-width: 980px) {
          .fenix-hero-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
          .fenix-hero-float { position: static !important; margin-top: 1.25rem; max-width: none !important; }
          .fenix-contact-split { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .fenix-bento { grid-template-columns: 1fr !important; }
          .fenix-video-band {
            grid-template-columns: 1fr !important;
            padding: 2.5rem 1.75rem !important;
            text-align: center;
          }
          /* En una sola columna el video siempre va primero.
             Lleva !important porque el order va en estilo inline (alterna por índice). */
          .fenix-video-band .fenix-video-media { order: -1 !important; }
          .fenix-video-band h2, .fenix-video-band p { margin-left: auto; margin-right: auto; }
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
