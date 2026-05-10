// Ruta destino: src/app/pulse/layout.tsx
//
// Layout específico para Pulse Motor.
// Permite branding y SEO independiente de Ventas10x.

import type { Metadata } from 'next'

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
    'KIA',
    'Hyundai',
    'Renault',
    'leads automotriz',
  ],
  openGraph: {
    title: 'Pulse Motor — Responde a tus leads en 30 segundos',
    description:
      'El primer asistente IA para vendedores de concesionarios automotrices. Próximamente.',
    url: 'https://pulsemotor.co',
    siteName: 'Pulse Motor',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulse Motor — Responde a tus leads en 30 segundos',
    description:
      'El primer asistente IA para vendedores de concesionarios automotrices.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PulseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="pulse-root">{children}</div>
}
