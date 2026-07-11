// src/app/pulse/layout.tsx
import type { Metadata } from 'next'
import Script from 'next/script'

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
    <div className="pulse-root">
      {/* Google Fonts — Syne + DM Sans (resto de /pulse) y Oswald + IBM Plex Mono + Inter (home, sistema turno/guardia) */}
      <Script id="pulse-fonts" strategy="beforeInteractive">{`
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Oswald:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap';
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
