// src/app/pulse/layout.tsx
import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Pulse Motor — Responde a tus leads en 30 segundos',
  description:
    'IA para vendedores de concesionarios automotrices. Responde al lead en 30 segundos, automatiza el seguimiento, no pierdas ventas por demora.',
  keywords: [
    'pulse motor',
    'IA para vendedores de auto',
    'CRM concesionario',
    'speed to lead',
    'WhatsApp vendedores',
    'KIA', 'Hyundai', 'Renault',
    'leads automotriz',
  ],
  openGraph: {
    title: 'Pulse Motor — Responde a tus leads en 30 segundos',
    description: 'El primer asistente IA para vendedores de concesionarios automotrices.',
    url: 'https://pulsemotor.co',
    siteName: 'Pulse Motor',
    locale: 'es_CO',
    type: 'website',
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
      {/* Google Analytics — Pulse Motor */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${PULSE_GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="pulse-google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${PULSE_GA_ID}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
      {children}
    </div>
  )
}
