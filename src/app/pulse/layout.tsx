// src/app/pulse/layout.tsx
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

export const metadata: Metadata = {
  title: 'Pulse Motor — Responde a tus leads en 30 segundos',
  description: 'IA para vendedores de concesionarios automotrices. Responde al lead en 30 segundos, automatiza el seguimiento, no pierdas ventas por demora.',
  keywords: ['pulse motor','IA para vendedores de auto','CRM concesionario','speed to lead','WhatsApp vendedores','KIA','Hyundai','Renault','leads automotriz'],
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
          --amber:#F2A93B; --amber-2:#C9770B; --amber-dim:#8A6423; --green:#3ECF7E; --green-2:#0F3D2B; --red:#E5484D;
          --grad-amber: linear-gradient(135deg, var(--amber), var(--amber-2));
          --grad-green: linear-gradient(135deg, var(--green-2), var(--green));
          --ease-out-expo: cubic-bezier(.16,1,.3,1);
        }
        .pulse-root .grad-amber { background-image:var(--grad-amber); -webkit-background-clip:text; background-clip:text; color:transparent; -webkit-text-fill-color:transparent; }
        /* globals.css define h1,h2,h3 { font-family: 'Syne' } para Ventas10x.co; se
           sobreescribe acá (mayor especificidad, sin tocar el archivo compartido) para
           que ningún título de /pulse dependa de esa fuente ancha. */
        .pulse-root h1, .pulse-root h2, .pulse-root h3 { font-family: var(--font-display), sans-serif; }
      `}</style>

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
    </div>
  )
}
