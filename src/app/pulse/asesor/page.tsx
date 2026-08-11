// src/app/pulse/asesor/page.tsx
// Componente de servidor — ver el mismo patron y motivo en
// src/app/pulse/concesionario/page.tsx.

import type { Metadata } from 'next'
import AsesorClient from './AsesorClient'

export const metadata: Metadata = {
  title: 'Copiloto de IA por WhatsApp para asesores automotrices',
  description: 'Cotizá financiación y seguro dentro de tu WhatsApp Business de siempre. Cerrá sin depender del área de crédito. Empezá gratis 14 días, desde $49 USD/mes.',
  alternates: { canonical: 'https://pulsemotor.co/pulse/asesor' },
  openGraph: {
    title: 'Copiloto de IA por WhatsApp para asesores automotrices | Pulse Motor',
    description: 'Cotizá financiación y seguro dentro de tu WhatsApp Business de siempre. Cerrá sin depender del área de crédito.',
    url: 'https://pulsemotor.co/pulse/asesor',
    siteName: 'Pulse Motor',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Copiloto de IA por WhatsApp para asesores automotrices | Pulse Motor',
    description: 'Cotizá financiación y seguro dentro de tu WhatsApp Business de siempre. Cerrá sin depender del área de crédito.',
  },
}

export default function AsesorPage() {
  return <AsesorClient />
}
