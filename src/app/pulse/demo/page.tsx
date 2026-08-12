// src/app/pulse/demo/page.tsx
// Componente de servidor — ver el mismo patron y motivo en
// src/app/pulse/concesionario/page.tsx. Este archivo se genero copiando
// page.tsx a DemoClient.tsx sin cambios (ver patch_demo_metadata.py).

import type { Metadata } from 'next'
import DemoClient from './DemoClient'

export const metadata: Metadata = {
  title: 'Demo del panel 360\u00b0 para concesionarios',
  description: 'Mir\u00e1 en vivo c\u00f3mo se ve el embudo, la integralidad y las matr\u00edculas de tu concesionario en un solo panel. Dejaste tus datos y entr\u00e1 con datos de muestra.',
  alternates: { canonical: 'https://pulsemotor.co/pulse/demo' },
  openGraph: {
    title: 'Demo del panel 360\u00b0 para concesionarios | Pulse Motor',
    description: 'Mir\u00e1 en vivo c\u00f3mo se ve el embudo, la integralidad y las matr\u00edculas de tu concesionario en un solo panel.',
    url: 'https://pulsemotor.co/pulse/demo',
    siteName: 'Pulse Motor',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Demo del panel 360\u00b0 para concesionarios | Pulse Motor',
    description: 'Mir\u00e1 en vivo c\u00f3mo se ve el embudo, la integralidad y las matr\u00edculas de tu concesionario en un solo panel.',
  },
}

export default function DemoPage() {
  return <DemoClient />
}
