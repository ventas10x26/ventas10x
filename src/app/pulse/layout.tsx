// src/app/pulse/layout.tsx
import { PulseEbookGate } from '@/components/pulse/PulseEbookGate'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Oswald, IBM_Plex_Mono, Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'

// Fuentes del sistema turno/guardia (home) — next/font las autohospeda en build time,
// evita depender de un <link> a Google Fonts en runtime (frágil: no garantiza carga en producción).
const oswald = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-oswald', display: 'swap' })
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' })
// Display geométrica de terminales redondeados (misma familia visual que las tarjetas de
// referencia tipo Outcourt/Incourt) para h1/h2/h3 — Inter se mantiene para texto de cuerpo.
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-display', display: 'swap' })

// pulsemotor.co URL real. Antes esto no existia en ningun lado de /pulse, asi que
// alternates.canonical de TODO el sitio caia al fallback del layout raiz compartido
// con Ventas10x (: https://ventas10x.co — la etiqueta canonical mas fuerte que existe
// le estaba diciendo a Google "la version de referencia de esto vive en otro dominio".
const PULSE_URL = 'https://pulsemotor.co'

export const metadata: Metadata = {
  title: 'Pulse Motor — Responde a tus leads en 30 segundos',
  description: 'IA para vendedores de concesionarios automotrices. Responde al lead en 30 segundos, automatiza el seguimiento, no pierdas ventas por demora.',
  // Antes incluia "KIA, Hyundai, Renault" — contradice la regla de marca-agnostica del
  // proyecto y ademas reforzaba la asociacion automotriz-generica que ya juega en contra
  // con la confusion "Pulse Motor" / "Fiat Pulse" en resultados de busqueda. Reemplazado
  // por terminos de intencion real, ligados a lo que el producto efectivamente resuelve.
  keywords: [
    'software para concesionarios',
    'CRM concesionario automotriz',
    'integralidad de venta automotriz',
    'agente IA WhatsApp concesionario',
    'gestión de leads automotriz',
    'financiación seguros accesorios retomas',
    'panel 360 concesionario',
    'speed to lead automotriz',
    'CRM y DMS conectados',
    'DataBridge concesionario',
  ],
  alternates: { canonical: PULSE_URL },
  openGraph: {
    title: 'Pulse Motor — Responde a tus leads en 30 segundos',
    description: 'El primer asistente IA para vendedores de concesionarios automotrices.',
    url: 'https://pulsemotor.co', siteName: 'Pulse Motor', locale: 'es_CO', type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulse Motor — Responde a tus leads en 30 segundos',
    description: 'El primer asistente IA para vendedores de concesionarios automotrices.',
  },
  robots: { index: true, follow: true },
}

const PULSE_GA_ID = 'G-M0KS0D3G5D'

// Datos estructurados propios de Pulse Motor. El layout raiz (compartido con Ventas10x,
// el otro producto del repo) ya emite su propio Organization/WebSite/SoftwareApplication
// en cada pagina del sitio, incluidas las de /pulse — y ese bloque describe a "Ventas10x",
// no a Pulse Motor, con una calificacion de 4.9/200 reseñas que no existen. Este bloque
// no reemplaza al del layout raiz (no se puede desde acá sin tocar codigo compartido con
// Ventas10x) pero suma una entidad propia y honesta, con su propio @id, para que Google
// tenga una señal real de que "Pulse Motor" es su propia cosa. Sin aggregateRating: no
// hay reseñas reales todavia, y una calificacion inventada es exactamente lo que se evita
// en toda la marca — mejor ausente que falsa.
const pulseOrgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${PULSE_URL}/#organization`,
  name: 'Pulse Motor',
  url: PULSE_URL,
  logo: { '@type': 'ImageObject', url: `${PULSE_URL}/pulse/icon.png` },
  description: 'Agente de IA que responde leads de concesionarios automotrices por WhatsApp en segundos, y panel que mide la integralidad de cada venta — vehículo, financiación, seguro, accesorios y retoma — en un solo lugar.',
  areaServed: ['CO', 'MX', 'CL', 'PE', 'AR'],
}

const pulseWebsiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${PULSE_URL}/#website`,
  url: PULSE_URL,
  name: 'Pulse Motor',
  publisher: { '@id': `${PULSE_URL}/#organization` },
  inLanguage: 'es',
}

const pulseSoftwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Pulse Motor',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Automotive Dealership Software',
  operatingSystem: 'Web',
  description: 'Agente de IA para concesionarios y asesores automotrices: responde leads por WhatsApp, cotiza financiación y pólizas, y mide la integralidad de cada venta.',
  // Precio real, tal como aparece hoy en la pagina del segmento asesor individual — no
  // se inventa un numero para el plan Enterprise, que es a cotizacion.
  offers: {
    '@type': 'Offer',
    price: '49',
    priceCurrency: 'USD',
    description: 'Plan para asesor individual, desde. El plan Enterprise para concesionarios es a cotización.',
  },
}

export default function PulseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`pulse-root ${oswald.variable} ${ibmPlexMono.variable} ${inter.variable} ${plusJakarta.variable} ${GeistSans.variable}`}>
      {/* Tokens de color del sistema de diseño (ver .claude/skills/pulsemotor-design) — scoped a
          .pulse-root para que cualquier página o componente bajo /pulse pueda consumirlos sin
          redefinirlos. El home (src/app/pulse/page.tsx) los declara también de forma local por
          herencia histórica; los valores deben mantenerse en sync con tokens.md. */}
      <style>{`
        .pulse-root {
          --bg-0:#0B0D0C; --bg-1:#14120F; --bg-2:#1B1815; --bg-3:#241F1A; --bg-4:#2D2721; --line:#2A2620;
          --ink:#F3EFE7; --ink-dim:#9B958A;
          --blue:#2563EB; --blue-2:#1D4ED8; --blue-dim:#3D5A99; --red:#E5484D;
          --grad-blue: linear-gradient(135deg, var(--blue), var(--blue-2));
          --grad-blue-deep: linear-gradient(135deg, #0B1E4D, var(--blue));
          --ease-out-expo: cubic-bezier(.16,1,.3,1);
        }
        .pulse-root .grad-blue { background-image:var(--grad-blue); -webkit-background-clip:text; background-clip:text; color:transparent; -webkit-text-fill-color:transparent; }
        /* globals.css define h1,h2,h3 { font-family: 'Syne' } para Ventas10x.co; se
           sobreescribe acá (mayor especificidad, sin tocar el archivo compartido) para
           que ningún título de /pulse dependa de esa fuente ancha. */
        .pulse-root h1, .pulse-root h2, .pulse-root h3 { font-family: var(--font-display), sans-serif; }
      `}</style>

      {/* Datos estructurados propios de Pulse Motor — ver comentario arriba de cada
          constante. Van en el body (no en head, que ya cerró el layout raíz), pero
          Google los lee igual en cualquier parte del documento. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pulseOrgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pulseWebsiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pulseSoftwareJsonLd) }} />

      {/* Google Fonts — DM Sans, usada como texto de cuerpo en componentes aún no migrados a next/font */}
      <Script id="pulse-fonts" strategy="beforeInteractive">{`
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap';
        document.head.appendChild(l);
      `}</Script>

      {/* Google Analytics */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${PULSE_GA_ID}`} strategy="afterInteractive" />
      <Script id="pulse-google-analytics" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${PULSE_GA_ID}', { page_title: document.title, page_location: window.location.href });
      `}</Script>

      {children}

      {/* El modal decide solo en que rutas mostrarse y con que disparador. */}
      <PulseEbookGate />
    </div>
  )
}
