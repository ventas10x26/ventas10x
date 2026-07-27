// Ruta destino: src/app/pulse/demo/layout.tsx
//
// Metadata propia del demo. Va en un layout y no en page.tsx porque esa página es
// 'use client' (tiene filtros con estado) y un componente cliente no puede exportar
// `metadata` — mismo caso que /pulse/databridge.

import type { Metadata } from 'next'

const TITULO = 'Demo — El panel 360° de tu concesionario'
const DESCRIPCION =
  'Embudo de seis etapas, integralidad 360° y rendimiento por sede, en un panel que podés recorrer. Datos simulados: la operación de cada concesionario es suya.'

// Bajo /pulse a propósito: en pulsemotor.co el middleware reescribe a /pulse/* todo lo que
// no empiece con /pulse, así que una ruta OG en /og/... daría 404 en ese dominio.
const OG_IMAGE = 'https://pulsemotor.co/pulse/og/demo'

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  // Se sobrescriben los keywords del layout padre a propósito: ahí se listan marcas
  // (KIA, Hyundai, Renault) por SEO, y esta página debe quedar sin ninguna marca asociada.
  keywords: ['demo panel concesionario', 'embudo de ventas automotriz', 'integralidad 360', 'KPI concesionario', 'conversión por sede'],
  alternates: { canonical: 'https://pulsemotor.co/pulse/demo' },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: 'https://pulsemotor.co/pulse/demo',
    siteName: 'Pulse Motor',
    locale: 'es_CO',
    type: 'website',
    images: [{
      url: OG_IMAGE,
      width: 1200,
      height: 630,
      alt: 'Panel de demostración con el embudo de ventas y la integralidad 360° de un concesionario',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRIPCION,
    images: [OG_IMAGE],
  },
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
