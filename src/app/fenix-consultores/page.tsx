// Ruta destino: src/app/fenix-consultores/page.tsx
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { Space_Grotesk } from 'next/font/google'
import { FenixNav } from '@/components/fenix/FenixNav'
import { FenixLeadForm } from '@/components/fenix/FenixLeadForm'
import { FenixStickyProspecting } from '@/components/fenix/FenixStickyProspecting'
import { FenixVideoShort } from '@/components/fenix/FenixVideoShort'
import { FenixPhotoCarousel } from '@/components/fenix/FenixPhotoCarousel'
import { FenixReveal } from '@/components/fenix/FenixReveal'
import { FenixScrollPanel } from '@/components/fenix/FenixScrollPanel'
import { FenixDashboard } from '@/components/fenix/FenixDashboard'
import { FenixHeroSlider } from '@/components/fenix/FenixHeroSlider'
import { FenixLogo } from '@/components/fenix/FenixLogo'
import { FenixFocoAuto } from '@/components/fenix/FenixFocoAuto'

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
  // Iconos propios de Fenix. Van declarados aquí y no como `icon.tsx` de
  // segmento porque el layout raíz ya declara `icons` de Ventas10x y esa
  // configuración explícita gana sobre la convención de archivo del hijo.
  icons: {
    icon: [{ url: '/og/fenix-logo?size=64', type: 'image/png' }],
    apple: [{ url: '/og/fenix-logo?size=180&fondo=claro', type: 'image/png' }],
  },
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

// ─── Datos ───
const LINEAS = [
  { label: 'Línea principal', numero: '+57 321 5036414', href: 'tel:+573215036414' },
  { label: 'Línea secundaria', numero: '310 4159173', href: 'tel:3104159173' },
]

const CAPACIDADES = [
  'Plataforma de seguimiento',
  'IA aplicada a la recuperación',
  'Cobro prejurídico',
  'Cobro judicial',
  'Reportes ejecutivos',
  'Trazabilidad completa',
]

const IMPACTOS = [
  { t: 'Liquidez', icono: 'billetera', d: 'El efectivo que financia su operación se queda en manos de terceros.' },
  { t: 'Rentabilidad', icono: 'tendencia', d: 'La utilidad ya causada nunca llega al estado de resultados.' },
  { t: 'Capacidad de inversión', icono: 'peso', d: 'Los proyectos se aplazan por falta de caja disponible.' },
  { t: 'Valor patrimonial', icono: 'escudo', d: 'La cartera envejecida deteriora el valor real de la compañía.' },
]

const VIDEO = {
  id: 'nulz93G54W4',
  eyebrow: 'El costo de esperar',
  titulo: 'Por qué su cartera',
  destacado: 'pierde valor cada día',
  desc: 'El tiempo es la variable que más destruye el valor de una obligación. Vea cómo opera ese deterioro y qué se puede recuperar interviniendo a tiempo.',
  cta: 'Solicitar diagnóstico',
  label: 'Ver: por qué su cartera pierde valor cada día',
}

const PILARES_IA = [
  {
    icono: 'ia',
    titulo: 'Inteligencia Artificial',
    desc: 'Modelos que priorizan la cartera, automatizan procesos y aceleran las decisiones sobre cada obligación.',
    bullets: ['Priorización automática', 'Scoring de recuperabilidad', 'Decisiones asistidas'],
  },
  {
    icono: 'panel',
    titulo: 'Plataforma tecnológica',
    desc: 'Estado de cada obligación, historial, compromisos, documentación e indicadores en un solo lugar.',
    bullets: ['Trazabilidad total', 'Reportes ejecutivos', 'Acceso permanente'],
  },
  {
    icono: 'flujo',
    titulo: 'Automatización de cobranza',
    desc: 'Notificaciones, recordatorios y seguimiento multicanal que operan sin depender de la insistencia manual.',
    bullets: ['WhatsApp y correo', 'Recordatorios inteligentes', 'Gestión multicanal'],
  },
  {
    icono: 'escudo',
    titulo: 'Equipo jurídico especializado',
    desc: 'Abogados con experiencia en recuperación empresarial para escalar cuando la negociación no basta.',
    bullets: ['Negociación estratégica', 'Procesos ejecutivos', 'Medidas cautelares'],
  },
]

const UREA = [
  { n: '01', t: 'Diagnóstico estratégico', d: 'Analizamos jurídicamente cada obligación antes de actuar.' },
  { n: '02', t: 'Gestión inteligente', d: 'La IA identifica prioridades y optimiza los tiempos de gestión.' },
  { n: '03', t: 'Ejecución especializada', d: 'Cada deudor recibe una estrategia distinta. Ninguna cartera es igual.' },
  { n: '04', t: 'Información en tiempo real', d: 'Usted conoce el estado de cada obligación sin pedir informes.' },
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

const BENEFICIOS = [
  { t: 'Mayor control', d: 'Toda la operación de cobro bajo un mismo tablero.' },
  { t: 'Mayor trazabilidad', d: 'Cada gestión queda documentada y es auditable.' },
  { t: 'Mayor velocidad', d: 'Menos tiempo entre el vencimiento y la acción.' },
  { t: 'Menor riesgo jurídico', d: 'Procesos conducidos por abogados especializados.' },
]

const PERFILES = ['Presidentes', 'Propietarios', 'Socios', 'Gerentes Generales', 'CFO', 'Directores Financieros']
const SECTORES = ['Sector Salud', 'Sector Real', 'Industria', 'Construcción', 'Tecnología', 'Distribución', 'Cooperativas', 'Instituciones financieras']

const CONFIANZA = [
  { t: 'Confidencialidad', d: 'Protocolos estrictos sobre la información de su cartera.' },
  { t: 'Gestión documentada', d: 'Respaldo verificable de cada actuación realizada.' },
  { t: 'Comunicación transparente', d: 'Reportes ejecutivos y seguimiento permanente.' },
]

const FOTOS = [
  { src: '/fenix/asesoria.jpg', alt: 'Asesoría jurídica empresarial de Fenix Consultores' },
  { src: '/fenix/analisis.jpg', alt: 'Análisis de indicadores de recuperación de cartera' },
  { src: '/fenix/acuerdo.jpg', alt: 'Acuerdo de pago con un cliente empresarial' },
]

// Slider del hero: el producto primero, después las personas que lo operan.
const SLIDES_HERO = [
  {
    src: '/fenix/asesoria.jpg',
    alt: 'Equipo jurídico de Fenix Consultores en asesoría empresarial',
    titulo: 'Equipo jurídico',
    pie: 'Abogados especializados en recuperación empresarial detrás de cada obligación.',
  },
  {
    src: '/fenix/analisis.jpg',
    alt: 'Dirección financiera revisando indicadores de recuperación de cartera',
    titulo: 'Dirección financiera',
    pie: 'La dirección conoce el estado de su cartera sin tener que pedir informes.',
  },
  {
    src: '/fenix/acuerdo.jpg',
    alt: 'Acuerdo de pago cerrado con un cliente empresarial',
    titulo: 'Acuerdos que se cumplen',
    pie: 'Negociación estratégica con cada deudor, documentada y con seguimiento.',
  },
]

// ─── Iconografía de línea ───
function Icono({ tipo }: { tipo: string }) {
  const p = {
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.5,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  if (tipo === 'ia') return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <circle cx="12" cy="12" r="3.2" /><circle cx="5" cy="6" r="1.8" /><circle cx="19" cy="6" r="1.8" />
      <circle cx="5" cy="18" r="1.8" /><circle cx="19" cy="18" r="1.8" />
      <path d="M6.4 7.2 9.6 10M17.6 7.2 14.4 10M6.4 16.8 9.6 14M17.6 16.8 14.4 14" />
    </svg>
  )
  if (tipo === 'panel') return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M3 9h18" />
      <path d="M7.5 16v-3M12 16v-5M16.5 16v-2" />
    </svg>
  )
  if (tipo === 'billetera') return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path d="M3 7.5h18v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />
      <path d="M3 7.5 6.4 4h11.2L21 7.5" />
      <path d="M12 11v6M9.6 12.4h4.8M9.6 15.6h4.8" />
    </svg>
  )
  if (tipo === 'tendencia') return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path d="M3 19h18" /><path d="M4 15.5 9.5 10l3.5 3.2L20 6" /><path d="M15.4 6H20v4.6" />
    </svg>
  )
  if (tipo === 'peso') return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path d="M12 3v18" />
      <path d="M16.5 7.2c-.6-1.5-2.3-2.4-4.5-2.4-2.6 0-4.4 1.2-4.4 3.1 0 1.9 1.6 2.8 4.4 3.4 3 .7 4.8 1.6 4.8 3.7 0 2.1-2 3.4-4.8 3.4-2.5 0-4.3-1-4.9-2.7" />
    </svg>
  )
  if (tipo === 'flujo') return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <rect x="2.5" y="4" width="7" height="5.5" rx="1.5" /><rect x="14.5" y="4" width="7" height="5.5" rx="1.5" />
      <rect x="8.5" y="15" width="7" height="5.5" rx="1.5" />
      <path d="M9.5 6.75h5M6 9.5v2.5q0 3 3 3h.5M18 9.5v2.5q0 3-3 3h-.5" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...p}>
      <path d="M12 3l7.5 2.8v6c0 4.9-3.3 7.9-7.5 9.2-4.2-1.3-7.5-4.3-7.5-9.2v-6z" />
      <path d="M9 12l2.2 2.2L15.2 10" />
    </svg>
  )
}

function Flecha() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function IconoTel() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default function FenixConsultoresPage() {
  return (
    <div className={`fx ${spaceGrotesk.variable}`}>
      <FenixNav />
      <FenixStickyProspecting />

      {/* ═══ HERO ═══ */}
      <section id="inicio" className="fx-hero">
        <div className="fx-hero-glow" aria-hidden="true" />
        <div className="fx-container fx-hero-grid">
          <div>
            <span className="fx-badge">
              <span className="fx-dot" />
              Recuperación de cartera empresarial
            </span>

            <h1 className="fx-display">
              El dinero de su empresa<br />
              <span className="fx-accent">no está perdido.</span>
            </h1>

            <p className="fx-lead">
              Está inmovilizado en una cartera vencida. Lo recuperamos combinando
              inteligencia artificial, una plataforma de gestión trazable y un
              equipo jurídico especializado.
            </p>

            <div className="fx-hero-ctas">
              <a href="#contacto" className="fx-btn fx-btn-primary">
                Solicitar diagnóstico gratuito <Flecha />
              </a>
              <a href="#modelo" className="fx-btn fx-btn-ghost">Conocer el modelo</a>
            </div>

            <div className="fx-hero-proof">
              {[
                ['+12', 'años recuperando cartera empresarial'],
                ['Real y Salud', 'sectores especializados'],
                ['24 h', 'para contactarle'],
              ].map(([v, l]) => (
                <div key={l} className="fx-proof">
                  <div className="fx-proof-v">{v}</div>
                  <div className="fx-proof-l">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="fx-hero-visual">
            <FenixHeroSlider software={<FenixDashboard />} fotos={SLIDES_HERO} />
          </div>
        </div>
      </section>

      {/* ═══ CAPACIDADES ═══ */}
      <section className="fx-sec fx-sec-tight fx-bg-white fx-bordered">
        <div className="fx-container">
          <p className="fx-cap-intro">
            Una solución diseñada para empresas que requieren{' '}
            <span className="fx-accent">control, trazabilidad y resultados.</span>
          </p>
          <div className="fx-cap-row">
            {CAPACIDADES.map((c, i) => (
              <span key={c} className="fx-cap" style={{ '--i': i } as CSSProperties}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ EL COSTO DE ESPERAR ═══ */}
      <section className="fx-sec fx-bg-cream">
        <div className="fx-container">
          <FenixReveal>
            <header className="fx-head">
              <span className="fx-label">El costo de esperar</span>
              <h2 className="fx-h2">
                Mientras su empresa vende,<br />
                sus utilidades <span className="fx-accent">siguen detenidas.</span>
              </h2>
              <p className="fx-body fx-head-desc">
                La cartera vencida afecta mucho más que el flujo de caja. Cada día sin una
                estrategia adecuada incrementa el riesgo de pérdida del activo.
              </p>
            </header>
          </FenixReveal>

          <FenixReveal delay={80}>
            <FenixFocoAuto className="fx-grid-4" ciclo={2600}>
              {IMPACTOS.map(i => (
                <article key={i.t} className="fx-card fx-card-lift fx-card-impacto">
                  <span className="fx-icon"><Icono tipo={i.icono} /></span>
                  <div className="fx-card-pie">
                    <h3 className="fx-card-t">{i.t}</h3>
                    <p className="fx-card-d">{i.d}</p>
                  </div>
                  <span className="fx-foco-barra" aria-hidden="true" />
                </article>
              ))}
            </FenixFocoAuto>
          </FenixReveal>
        </div>
      </section>

      {/* ═══ VIDEOS ═══ */}
      <section id="videos" className="fx-sec fx-bg-white">
        <div className="fx-container">
          <FenixReveal>
            <header className="fx-head fx-head-center">
              <span className="fx-label">Véalo usted mismo</span>
              <h2 className="fx-h2">
                Un minuto para entender <span className="fx-accent">qué le cuesta esperar</span>
              </h2>
            </header>
          </FenixReveal>

          <FenixReveal delay={80}>
            <article className="fx-video-card fx-video-card-alt">
              <div className="fx-video-copy">
                <span className="fx-label">{VIDEO.eyebrow}</span>
                <h3 className="fx-h3">
                  {VIDEO.titulo} <span className="fx-accent">{VIDEO.destacado}</span>
                </h3>
                <p className="fx-body fx-video-desc">{VIDEO.desc}</p>
                <a href="#contacto" className="fx-btn fx-btn-primary">
                  {VIDEO.cta} <Flecha />
                </a>
              </div>
              <div className="fx-video-media">
                <FenixVideoShort videoId={VIDEO.id} label={VIDEO.label} />
              </div>
            </article>
          </FenixReveal>
        </div>
      </section>

      {/* ═══ DIFERENCIAL ═══ */}
      <section id="modelo" className="fx-sec fx-bg-warm">
        <div className="fx-container">
          <FenixReveal>
            <header className="fx-head fx-head-center">
              <span className="fx-label">El diferencial</span>
              <h2 className="fx-h2">
                No solo recuperamos cartera.<br />
                Diseñamos un <span className="fx-accent">ecosistema inteligente.</span>
              </h2>
              <p className="fx-body fx-head-desc">
                Cuatro capacidades que operan de forma simultánea sobre cada obligación.
              </p>
            </header>
          </FenixReveal>

          <FenixReveal delay={80}>
            <FenixFocoAuto className="fx-grid-4" ciclo={3400}>
              {PILARES_IA.map(p => (
                <article key={p.titulo} className="fx-card fx-card-lift fx-card-pilar">
                  <span className="fx-icon"><Icono tipo={p.icono} /></span>
                  <h3 className="fx-card-t">{p.titulo}</h3>
                  <p className="fx-card-d">{p.desc}</p>
                  <ul className="fx-list fx-list-pie">
                    {p.bullets.map(b => (
                      <li key={b}><span className="fx-tick"><Check /></span>{b}</li>
                    ))}
                  </ul>
                  <span className="fx-foco-barra" aria-hidden="true" />
                </article>
              ))}
            </FenixFocoAuto>
          </FenixReveal>
        </div>
      </section>

      {/* ═══ MODELO UREA — oscuro estratégico ═══ */}
      <section className="fx-sec fx-bg-graphite">
        <div className="fx-container">
          <FenixReveal>
            <header className="fx-head">
              <span className="fx-label fx-label-dark">Modelo Integral UREA®</span>
              <h2 className="fx-h2 fx-h2-dark">
                Tecnología + inteligencia jurídica<br />
                <span className="fx-accent-on-dark">= mayor recuperación</span>
              </h2>
              <p className="fx-body fx-body-dark fx-head-desc">
                La Unidad de Recuperación Estratégica de Activos opera bajo cuatro pilares.
              </p>
            </header>
          </FenixReveal>

          <FenixReveal delay={80}>
            <div className="fx-grid-4">
              {UREA.map(u => (
                <article key={u.n} className="fx-card fx-card-dark">
                  <span className="fx-step fx-step-dark">{u.n}</span>
                  <h3 className="fx-card-t fx-card-t-dark">{u.t}</h3>
                  <p className="fx-card-d fx-card-d-dark">{u.d}</p>
                </article>
              ))}
            </div>
          </FenixReveal>
        </div>
      </section>

      {/* ═══ PLATAFORMA ═══ */}
      <section id="plataforma" className="fx-sec fx-bg-white">
        <div className="fx-container fx-split">
          <FenixReveal>
            <div>
              <span className="fx-label">Recovery Intelligence®</span>
              <h2 className="fx-h2">
                Visualice su cartera<br />
                <span className="fx-accent">como nunca antes.</span>
              </h2>
              <p className="fx-body fx-head-desc">
                Plataforma empresarial de gestión de recuperación. Ingrese desde cualquier
                lugar y vea toda la operación de su cartera, sin pedir informes ni esperar
                al cierre de mes.
              </p>
              <ul className="fx-list fx-list-lg">
                {['Estado de cada obligación', 'Compromisos de pago y cumplimiento', 'Procesos jurídicos activos', 'Reportes ejecutivos descargables'].map(t => (
                  <li key={t}><span className="fx-tick"><Check /></span>{t}</li>
                ))}
              </ul>
              <a href="#contacto" className="fx-btn fx-btn-primary">
                Ver la plataforma <Flecha />
              </a>
            </div>
          </FenixReveal>

          <FenixReveal delay={90}>
            <div className="fx-metrics">
              {INDICADORES.map((i, idx) => (
                <div key={i} className="fx-metric">
                  <span className="fx-metric-n">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="fx-metric-t">{i}</span>
                </div>
              ))}
            </div>
          </FenixReveal>
        </div>
      </section>

      {/* ═══ BENEFICIOS ═══ */}
      <section className="fx-sec fx-bg-cream">
        <div className="fx-container">
          <FenixReveal>
            <header className="fx-head fx-head-center">
              <span className="fx-label">Lo que obtiene su empresa</span>
              <h2 className="fx-h2">
                No solo recuperamos dinero.<br />
                Entregamos <span className="fx-accent">información para decidir.</span>
              </h2>
            </header>
          </FenixReveal>

          <FenixReveal delay={80}>
            <div className="fx-grid-4">
              {BENEFICIOS.map(b => (
                <article key={b.t} className="fx-card fx-card-lift">
                  <span className="fx-icon fx-icon-soft"><Check /></span>
                  <h3 className="fx-card-t">{b.t}</h3>
                  <p className="fx-card-d">{b.d}</p>
                </article>
              ))}
            </div>
          </FenixReveal>
        </div>
      </section>

      {/* ═══ PARA QUIÉN (con fotografía de respaldo humano) ═══ */}
      <section id="tecnologia" className="fx-sec fx-bg-white">
        <div className="fx-container fx-split">
          <FenixReveal>
            <div className="fx-foto-wrap">
              <FenixPhotoCarousel fotos={FOTOS} />
            </div>
          </FenixReveal>

          <FenixReveal delay={90}>
            <div>
              <span className="fx-label">Para quién</span>
              <h2 className="fx-h2">
                Para empresas que necesitan<br />
                <span className="fx-accent">más que una firma de cobranza.</span>
              </h2>
              <p className="fx-body fx-head-desc">
                Detrás de la plataforma hay un equipo jurídico que negocia, documenta y
                escala cada caso cuando la gestión automatizada no basta.
              </p>

              <div className="fx-quien">
                <div>
                  <div className="fx-quien-h">Decisores</div>
                  <div className="fx-chips">
                    {PERFILES.map(p => <span key={p} className="fx-chip">{p}</span>)}
                  </div>
                </div>
                <div>
                  <div className="fx-quien-h">Sectores</div>
                  <div className="fx-chips">
                    {SECTORES.map(p => <span key={p} className="fx-chip">{p}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </FenixReveal>
        </div>
      </section>

      {/* ═══ URGENCIA — oscuro estratégico ═══ */}
      <section className="fx-sec fx-bg-graphite">
        <div className="fx-container fx-narrow fx-center">
          <FenixReveal>
            <span className="fx-label fx-label-dark">La decisión</span>
            <h2 className="fx-h2 fx-h2-dark">
              La pregunta ya no es cuánto le deben.<br />
              <span className="fx-accent-on-dark">Es cuánto seguirá perdiendo si no actúa.</span>
            </h2>
            <p className="fx-body fx-body-dark fx-head-desc fx-center-body">
              Cada día que una obligación permanece sin estrategia disminuye su valor, aumenta
              el riesgo y reduce las posibilidades jurídicas. Mientras tanto, su empresa
              continúa financiando involuntariamente a sus deudores.
            </p>
            <div className="fx-trust-row">
              {CONFIANZA.map(c => (
                <div key={c.t} className="fx-trust">
                  <div className="fx-trust-t">{c.t}</div>
                  <div className="fx-trust-d">{c.d}</div>
                </div>
              ))}
            </div>
          </FenixReveal>
        </div>
      </section>

      {/* ═══ CONTACTO ═══ */}
      <section id="contacto" className="fx-sec fx-bg-cream">
        <div className="fx-container">
          <FenixReveal>
            <header className="fx-head fx-head-center">
              <span className="fx-label">Diagnóstico ejecutivo</span>
              <h2 className="fx-h2">
                Conozca el <span className="fx-accent">potencial de recuperación</span><br />
                de su cartera
              </h2>
              <p className="fx-body fx-head-desc">
                Sin costo y sin compromiso. Un especialista le contactará en menos de 24 horas.
              </p>
            </header>
          </FenixReveal>

          <FenixScrollPanel>
            <div className="fx-contact">
              <aside className="fx-contact-side">
                <h3 className="fx-contact-t">Contáctenos hoy</h3>
                <p className="fx-contact-d">
                  Inicie su proceso de recuperación con una asesoría personalizada
                  sobre la cartera real de su empresa.
                </p>
                <div className="fx-lineas">
                  {LINEAS.map(l => (
                    <a key={l.numero} href={l.href} className="fx-linea">
                      <span className="fx-linea-ico"><IconoTel /></span>
                      <span>
                        <span className="fx-linea-l">{l.label}</span>
                        <span className="fx-linea-n">{l.numero}</span>
                      </span>
                    </a>
                  ))}
                </div>
                <div className="fx-contact-foot">
                  <span className="fx-dot" /> Especialistas disponibles
                </div>
              </aside>

              <div className="fx-contact-form">
                <FenixLeadForm theme="light" />
              </div>
            </div>
          </FenixScrollPanel>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="fx-footer">
        <div className="fx-container fx-footer-grid">
          <div>
            <div className="fx-footer-brand">
              <FenixLogo uid="foot" size={44} theme="dark" claim />
            </div>
            <p className="fx-footer-d">
              FÉNIX Recovery Intelligence®. Recuperación estratégica de activos
              empresariales con tecnología y respaldo jurídico especializado desde 2010.
            </p>
          </div>
          <div className="fx-footer-links">
            <span className="fx-footer-h">Contacto</span>
            {LINEAS.map(l => <a key={l.numero} href={l.href}>{l.numero}</a>)}
          </div>
        </div>
        <div className="fx-container fx-footer-legal">
          © 2026 Fenix Consultores Empresariales S.A.S. Todos los derechos reservados.
        </div>
      </footer>

      <style>{`
        /* ═══════════ SISTEMA DE DISEÑO ═══════════ */
        .fx {
          --accent: #F5821F;
          --accent-text: #B0570A;   /* naranja legible sobre fondo claro */
          --ink: #14100C;
          --ink-2: rgba(20,16,12,.66);
          --ink-3: rgba(20,16,12,.46);
          --line: rgba(20,16,12,.09);
          --white: #FFFFFF;
          --cream: #FBF9F6;
          --warm: #F5F1EA;
          --graphite: #14100C;
          --r-card: 20px;
          --r-lg: 28px;
          --sh-sm: 0 1px 2px rgba(20,16,12,.04);
          --sh-md: 0 1px 2px rgba(20,16,12,.04), 0 10px 30px rgba(20,16,12,.07);
          --sh-lg: 0 1px 2px rgba(20,16,12,.04), 0 24px 60px rgba(20,16,12,.10);

          background: var(--white);
          color: var(--ink);
          font-family: var(--font-jakarta, 'Plus Jakarta Sans'), system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .fx h1, .fx h2, .fx h3 {
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
        }
        /* El reset de margenes va dentro de :where() para que pese cero en
           especificidad. Sin eso, el selector .fx p (0,1,1) le ganaba a
           cualquier clase de una sola palabra y anulaba los margenes de
           .fx-head-desc y .fx-cap-intro: por eso los titulares salian
           pegados al texto que va debajo. */
        :where(.fx h1, .fx h2, .fx h3, .fx p) { margin: 0; }

        .fx-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; width: 100%; }
        .fx-narrow { max-width: 840px; }
        .fx-center { text-align: center; }
        .fx-center-body { margin-left: auto; margin-right: auto; }

        /* Ritmo vertical */
        .fx-sec { padding: clamp(76px, 9vw, 132px) 0; }
        .fx-sec-tight { padding: clamp(36px, 4vw, 54px) 0; }
        .fx-bg-white { background: var(--white); }
        .fx-bg-cream { background: var(--cream); }
        .fx-bg-warm { background: var(--warm); }
        .fx-bg-graphite { background: var(--graphite); }
        .fx-bordered { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }

        /* ── Tipografía ── */
        .fx-display {
          font-size: clamp(42px, 6.2vw, 82px);
          font-weight: 700; line-height: 1.01; letter-spacing: -.035em;
          margin-bottom: 26px;
        }
        .fx-h2 { font-size: clamp(30px, 3.9vw, 52px); font-weight: 700; line-height: 1.08; letter-spacing: -.028em; }
        .fx-h2-dark { color: #fff; }
        .fx-h3 { font-size: clamp(22px, 2.3vw, 31px); font-weight: 700; line-height: 1.15; letter-spacing: -.02em; margin-bottom: 16px; }
        .fx-lead {
          font-size: clamp(17px, 1.35vw, 20px); line-height: 1.62;
          color: var(--ink-2); max-width: 33rem; margin-bottom: 38px;
        }
        .fx-body { font-size: 16px; line-height: 1.75; color: var(--ink-2); max-width: 40rem; }
        .fx-body-dark { color: rgba(255,255,255,.66); }
        .fx-accent { color: var(--accent-text); }
        .fx-accent-on-dark { color: var(--accent); }

        .fx-label {
          display: inline-block; font-size: 12px; font-weight: 700;
          letter-spacing: .13em; text-transform: uppercase;
          color: var(--accent-text); margin-bottom: 18px;
        }
        .fx-label-dark { color: var(--accent); }

        /* Todos los encabezados de ancho completo van centrados: los que
           quedaban a la izquierda rompian el eje con las rejillas de tarjetas
           que llevan debajo. Los bloques a dos columnas usan .fx-split y no
           pasan por aqui. */
        .fx-head { margin-bottom: clamp(48px, 5.5vw, 72px); text-align: center; }
        .fx-head .fx-body { margin-left: auto; margin-right: auto; }
        .fx-head-desc { margin-top: 28px; }
        /* En .fx-split el texto sigue alineado a la izquierda. */
        .fx-split .fx-head-desc { margin-top: 22px; }

        /* ── Botones ── */
        .fx-btn {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 15px 26px; border-radius: 999px;
          font-size: 14.5px; font-weight: 700; text-decoration: none;
          font-family: inherit; border: 1px solid transparent; cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease, border-color .18s ease;
        }
        .fx-btn-primary {
          background: var(--accent); color: #fff;
          box-shadow: 0 1px 2px rgba(20,16,12,.08), 0 8px 22px rgba(245,130,31,.30);
        }
        .fx-btn-primary:hover { background: #E0740F; transform: translateY(-2px); box-shadow: 0 1px 2px rgba(20,16,12,.08), 0 14px 32px rgba(245,130,31,.4); }
        .fx-btn-ghost { background: var(--white); color: var(--ink); border-color: var(--line); box-shadow: var(--sh-sm); }
        .fx-btn-ghost:hover { border-color: rgba(20,16,12,.22); transform: translateY(-2px); }
        .fx-btn-outline { background: transparent; color: var(--accent); border-color: rgba(245,130,31,.5); }
        .fx-btn-outline:hover { background: rgba(245,130,31,.1); transform: translateY(-2px); }

        /* ── Hero ── */
        .fx-hero {
          position: relative; overflow: hidden;
          padding: clamp(56px, 7vw, 100px) 0 clamp(76px, 9vw, 124px);
          background: linear-gradient(180deg, #FFFFFF 0%, #FDFBF8 55%, var(--cream) 100%);
        }
        .fx-hero-glow {
          position: absolute; top: -420px; right: -280px;
          width: 900px; height: 900px; border-radius: 50%;
          background: radial-gradient(circle, rgba(245,130,31,.16) 0%, rgba(245,130,31,0) 68%);
          pointer-events: none;
        }
        .fx-hero-grid {
          position: relative; display: grid;
          grid-template-columns: minmax(0,1fr) minmax(0,1.02fr);
          gap: clamp(48px, 5vw, 84px); align-items: center;
        }
        .fx-badge {
          display: inline-flex; align-items: center; gap: 9px;
          background: rgba(245,130,31,.09); border: 1px solid rgba(245,130,31,.24);
          border-radius: 999px; padding: 8px 16px; margin-bottom: 28px;
          font-size: 11.5px; font-weight: 700; letter-spacing: .07em;
          text-transform: uppercase; color: var(--accent-text);
        }
        .fx-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #3ECF7E; flex-shrink: 0;
          box-shadow: 0 0 0 0 rgba(62,207,126,.55);
          animation: fx-pulse 2.4s ease infinite;
        }
        @keyframes fx-pulse {
          0% { box-shadow: 0 0 0 0 rgba(62,207,126,.5); }
          70% { box-shadow: 0 0 0 7px rgba(62,207,126,0); }
          100% { box-shadow: 0 0 0 0 rgba(62,207,126,0); }
        }
        .fx-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 46px; }
        .fx-hero-proof { display: flex; gap: 40px; flex-wrap: wrap; padding-top: 30px; border-top: 1px solid var(--line); }
        .fx-proof { max-width: 190px; }
        .fx-proof-v { font-size: 21px; font-weight: 700; letter-spacing: -.02em; line-height: 1.1; }
        .fx-proof-l { font-size: 12.5px; color: var(--ink-3); margin-top: 6px; line-height: 1.45; }

        /* ── Capacidades ── */
        .fx-cap-intro {
          text-align: center;
          font-size: clamp(24px, 3.1vw, 40px);
          font-weight: 700; letter-spacing: -.025em; line-height: 1.2;
          color: var(--ink);
          max-width: 22ch; margin-left: auto; margin-right: auto;
          margin-top: 0; margin-bottom: clamp(28px, 3.5vw, 44px);
        }
        .fx-cap-row { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
        .fx-cap {
          background: var(--white); border: 1px solid var(--line); border-radius: 999px;
          padding: 14px 26px; font-size: 15.5px; font-weight: 600; color: var(--ink-2);
          box-shadow: var(--sh-sm); cursor: default;
          /* La entrada escalonada corre al montar y no al entrar en viewport:
             la sección va pegada al hero, así que se ve sin depender de que
             un observador dispare. El modo "both" deja el estado inicial
             aplicado durante el retardo, si no habría un parpadeo. */
          animation: fx-cap-in .6s cubic-bezier(.22,.61,.36,1) both;
          animation-delay: calc(var(--i) * 80ms);
          transition: transform .3s cubic-bezier(.22,.61,.36,1),
                      box-shadow .3s ease-out,
                      border-color .3s ease-out,
                      color .3s ease-out;
        }
        .fx-cap:hover {
          transform: translateY(-5px);
          border-color: var(--accent);
          color: var(--ink);
          box-shadow: 0 10px 26px rgba(245,130,31,.22);
        }
        @keyframes fx-cap-in {
          from { opacity: 0; transform: translateY(14px) scale(.96); }
          to   { opacity: 1; transform: none; }
        }

        /* ── Cards ── */
        .fx-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .fx-card {
          background: var(--white); border: 1px solid var(--line);
          border-radius: 26px; padding: 38px 34px; box-shadow: var(--sh-sm);
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }
        /* Hover de tarjeta: el color sube desde la base y la tarjeta se
           levanta. El degradado va en un ::before y no en la propiedad
           background, para poder animar su opacidad — los degradados no
           interpolan. El contenido sube a z-index 1 para no quedar debajo. */
        .fx-card-lift {
          position: relative; overflow: hidden;
          min-height: 300px;
          display: flex; flex-direction: column;
          transition: transform .45s cubic-bezier(.22,.61,.36,1),
                      box-shadow .45s ease-out,
                      border-color .35s ease-out;
        }
        .fx-card-lift::before {
          content: ''; position: absolute; inset: 0; z-index: 0;
          background: linear-gradient(0deg,
            rgba(245,130,31,.95) 0%,
            rgba(245,130,31,.30) 52%,
            rgba(245,130,31,0) 100%);
          opacity: 0; transition: opacity .45s ease-out;
        }
        /* .fx-foco es el mismo estado, puesto por el recorrido automatico. */
        .fx-card-lift:hover::before,
        .fx-card-lift.fx-foco::before { opacity: 1; }
        .fx-card-lift > * { position: relative; z-index: 1; }
        .fx-card-lift:hover,
        .fx-card-lift.fx-foco {
          transform: translateY(-18px);
          border-color: var(--accent);
          box-shadow: 0 34px 68px rgba(245,130,31,.34);
        }
        /* Sobre el naranja el texto atenuado pierde contraste: se satura. */
        .fx-card-lift:hover .fx-card-d,
        .fx-card-lift:hover .fx-list li,
        .fx-card-lift.fx-foco .fx-card-d,
        .fx-card-lift.fx-foco .fx-list li { color: rgba(20,16,12,.92); }
        .fx-card-lift:hover .fx-tick,
        .fx-card-lift.fx-foco .fx-tick { color: var(--ink); }
        .fx-card-lift:hover .fx-icon,
        .fx-card-lift.fx-foco .fx-icon {
          background: #fff; border-color: #fff; color: var(--accent-text);
        }

        /* Barra de relevo: hace legible cuando la tarjeta cede el turno. */
        .fx-foco-barra {
          position: absolute; left: 0; right: 0; bottom: 0; height: 3px;
          background: rgba(20,16,12,.07);
          transform: scaleX(0); transform-origin: left;
        }
        .fx-card-lift.fx-foco .fx-foco-barra { background: rgba(20,16,12,.28); }
        .fx-card-lift.fx-foco .fx-foco-barra.fx-foco-corre {
          animation: fx-relevo var(--fx-ciclo, 2600ms) linear forwards;
        }
        @keyframes fx-relevo { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        /* Tamanos por grupo: los beneficios siguen compactos. */
        .fx-card-impacto { min-height: 420px; padding: 48px 40px; }
        .fx-card-impacto .fx-card-t { font-size: 27px; margin-bottom: 14px; }
        .fx-card-impacto .fx-card-d { font-size: 16.5px; line-height: 1.65; }
        .fx-card-pie { margin-top: auto; padding-top: 32px; }

        .fx-card-pilar { min-height: 470px; padding: 44px 38px; }
        .fx-card-pilar .fx-card-t { font-size: 24px; margin-top: 26px; }
        .fx-card-pilar .fx-card-d { font-size: 16px; }
        /* Con dos clases gana a .fx-list, que se define mas abajo con su
           propio margen y si no lo anularia. */
        .fx-card-pilar .fx-list { margin-top: auto; padding-top: 26px; }
        .fx-card-t { font-size: 21px; font-weight: 700; letter-spacing: -.015em; margin-bottom: 12px; }
        .fx-card-d { font-size: 15.5px; line-height: 1.7; color: var(--ink-2); }
        .fx-card-dark { background: rgba(255,255,255,.035); border-color: rgba(255,255,255,.1); box-shadow: none; }
        .fx-card-t-dark { color: #fff; }
        .fx-card-d-dark { color: rgba(255,255,255,.6); }

        .fx-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 46px; height: 46px; border-radius: 13px; margin-bottom: 22px;
          background: rgba(245,130,31,.1); color: var(--accent-text);
          border: 1px solid rgba(245,130,31,.2);
        }
        .fx-icon-soft { background: rgba(20,16,12,.05); border-color: var(--line); }

        .fx-step {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 32px; height: 32px; padding: 0 9px; border-radius: 999px;
          background: var(--accent); color: #fff; font-size: 12.5px; font-weight: 700; flex-shrink: 0;
        }
        .fx-step-dark { background: rgba(245,130,31,.16); color: var(--accent); margin-bottom: 20px; }

        .fx-list { list-style: none; padding: 0; margin: 18px 0 0; display: flex; flex-direction: column; gap: 9px; }
        .fx-list li { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; color: var(--ink-2); line-height: 1.5; }
        .fx-list-lg { margin: 26px 0 32px; gap: 12px; }
        .fx-list-lg li { font-size: 15px; }
        .fx-tick { color: var(--accent-text); flex-shrink: 0; margin-top: 2px; display: inline-flex; }

        .fx-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .fx-chip {
          background: var(--cream); border: 1px solid var(--line); border-radius: 999px;
          padding: 8px 15px; font-size: 13px; color: var(--ink-2);
        }
        .fx-quien { display: flex; flex-direction: column; gap: 26px; margin-top: 34px; }
        .fx-quien-h { font-size: 12.5px; font-weight: 700; color: var(--ink); margin-bottom: 12px; }

        /* ── Videos ── */
        .fx-videos { display: flex; flex-direction: column; gap: 20px; }
        .fx-video-card {
          display: grid; grid-template-columns: 1fr minmax(0, 300px);
          gap: clamp(28px, 4vw, 56px); align-items: center;
          background: var(--cream); border: 1px solid var(--line);
          border-radius: var(--r-lg); padding: clamp(28px, 3.4vw, 48px);
          transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
        }
        .fx-video-card-alt { background: var(--graphite); border-color: rgba(255,255,255,.1); }
        .fx-video-card-alt .fx-h3 { color: #fff; }
        .fx-video-card-alt .fx-body { color: rgba(255,255,255,.62); }
        .fx-video-card-alt .fx-label { color: var(--accent); }
        .fx-video-card-alt .fx-accent { color: var(--accent); }
        .fx-video-card:hover { transform: translateY(-5px); box-shadow: var(--sh-md); border-color: rgba(245,130,31,.35); }
        .fx-video-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .fx-video-desc { margin-bottom: 30px; }
        .fx-video-media { display: flex; justify-content: center; }

        /* ── Split ── */
        .fx-split {
          display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr);
          gap: clamp(40px, 5vw, 80px); align-items: center;
        }
        .fx-metrics {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
          background: var(--line); border: 1px solid var(--line);
          border-radius: var(--r-lg); overflow: hidden; box-shadow: var(--sh-sm);
        }
        .fx-metric { background: var(--white); padding: 24px 20px; display: flex; flex-direction: column; gap: 10px; }
        .fx-metric-n { font-size: 11px; font-weight: 700; color: var(--accent-text); letter-spacing: .08em; }
        .fx-metric-t { font-size: 13.5px; font-weight: 600; color: var(--ink); line-height: 1.4; }

        .fx-foto-wrap {
          border-radius: var(--r-lg); overflow: hidden;
          box-shadow: var(--sh-lg); border: 1px solid var(--line);
          aspect-ratio: 4 / 3;
        }

        /* ── Confianza ── */
        .fx-trust-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 52px; text-align: left; }
        .fx-trust { padding: 24px; border: 1px solid rgba(255,255,255,.1); border-radius: var(--r-card); background: rgba(255,255,255,.035); }
        .fx-trust-t { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 7px; }
        .fx-trust-d { font-size: 13.5px; color: rgba(255,255,255,.58); line-height: 1.6; }

        /* ── Contacto ── */
        .fx-contact {
          display: grid; grid-template-columns: minmax(0,.85fr) minmax(0,1.15fr);
          background: var(--white); border: 1px solid var(--line);
          border-radius: var(--r-lg); overflow: hidden; box-shadow: var(--sh-lg);
        }
        .fx-contact-side {
          background: var(--graphite); color: #fff;
          padding: clamp(32px, 3.5vw, 48px);
          display: flex; flex-direction: column; justify-content: center;
        }
        .fx-contact-t { font-size: clamp(24px, 2.4vw, 32px); font-weight: 700; letter-spacing: -.02em; margin-bottom: 14px; }
        .fx-contact-d { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,.62); margin-bottom: 32px; }
        .fx-lineas { display: flex; flex-direction: column; gap: 12px; }
        .fx-linea {
          display: flex; align-items: center; gap: 14px;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px; padding: 13px 16px; text-decoration: none;
          transition: background-color .2s ease, transform .2s ease;
        }
        .fx-linea:hover { background: rgba(255,255,255,.1); transform: translateX(3px); }
        .fx-linea-ico {
          width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
          background: rgba(245,130,31,.16); color: var(--accent);
          display: flex; align-items: center; justify-content: center;
        }
        .fx-linea-l { display: block; font-size: 11.5px; color: rgba(255,255,255,.45); margin-bottom: 2px; }
        .fx-linea-n { display: block; font-size: 16px; font-weight: 700; color: #fff; }
        .fx-contact-foot {
          display: flex; align-items: center; gap: 9px;
          margin-top: 32px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.1);
          font-size: 12.5px; color: rgba(255,255,255,.55);
        }
        .fx-contact-form { padding: clamp(32px, 3.5vw, 48px); background: var(--white); }

        /* ── Footer ── */
        .fx-footer { background: var(--graphite); color: #fff; padding: clamp(56px, 6vw, 84px) 0 32px; }
        .fx-footer-grid { display: grid; grid-template-columns: minmax(0,1.6fr) minmax(0,1fr); gap: 40px; padding-bottom: 40px; }
        .fx-footer-brand { margin-bottom: 20px; }
        .fx-footer-d { font-size: 13.5px; line-height: 1.75; color: rgba(255,255,255,.5); max-width: 34rem; }
        .fx-footer-links { display: flex; flex-direction: column; gap: 10px; }
        .fx-footer-h { font-size: 11.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; }
        .fx-footer-links a { color: rgba(255,255,255,.72); text-decoration: none; font-size: 14.5px; font-weight: 600; }
        .fx-footer-links a:hover { color: #fff; }
        .fx-footer-legal { padding-top: 28px; border-top: 1px solid rgba(255,255,255,.1); font-size: 12.5px; color: rgba(255,255,255,.36); }

        /* ═══ Responsive ═══ */
        @media (max-width: 1080px) {
          .fx-hero-grid { grid-template-columns: 1fr; gap: 60px; }
          .fx-grid-4 { grid-template-columns: repeat(2, 1fr); }
          .fx-split { grid-template-columns: 1fr; }
          .fx-video-card { grid-template-columns: 1fr; }
          .fx-video-media { order: -1; }
          .fx-contact { grid-template-columns: 1fr; }
          .fx-foto-wrap { aspect-ratio: 16 / 10; }
        }
        @media (max-width: 760px) {
          .fx-container { padding: 0 20px; }
          .fx-grid-4, .fx-trust-row, .fx-metrics { grid-template-columns: 1fr; }
          .fx-hero-proof { gap: 22px; }
          .fx-proof { max-width: none; flex: 1 1 100%; }
          .fx-footer-grid { grid-template-columns: 1fr; gap: 32px; }
          /* Apiladas a una columna el alto minimo solo deja hueco vacio, y el
             contenido anclado al pie ya no tiene contra que anclarse. */
          .fx-card { padding: 28px; }
          .fx-card-lift, .fx-card-impacto, .fx-card-pilar { min-height: 0; }
          .fx-card-impacto, .fx-card-pilar { padding: 30px 26px; }
          .fx-card-pie { margin-top: 26px; padding-top: 0; }
          .fx-card-pilar .fx-list { margin-top: 22px; padding-top: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fx-btn:hover, .fx-card-lift:hover, .fx-card-lift.fx-foco,
          .fx-video-card:hover, .fx-linea:hover, .fx-cap:hover { transform: none; }
          /* El recorrido sigue avanzando: se quita el movimiento, no el cambio
             de fondo, que es el que comunica cual tarjeta esta activa. */
          .fx-card-lift.fx-foco .fx-foco-barra.fx-foco-corre {
            animation: none; transform: scaleX(1);
          }
          .fx-dot { animation: none; }
          /* Se conserva el cambio de fondo (no es movimiento) y se quita el
             desplazamiento de entrada de los chips. */
          .fx-cap { animation: none; }
        }
      `}</style>
    </div>
  )
}
