// Ruta destino: src/app/pulse/databridge/layout.tsx
//
// La metadata de esta ruta vive acá y no en page.tsx porque esa página es 'use client' y
// un componente cliente no puede exportar `metadata`. Sin este layout, DataBridge heredaba
// el OG genérico de /pulse (y encima sin imagen: el openGraph de ahí no declara `images`),
// así que al compartir el enlace por WhatsApp salía "Responde a tus leads en 30 segundos"
// y ninguna imagen.

import type { Metadata } from 'next'

const TITULO = 'DataBridge 360 — Tus planillas sueltas, un modelo de datos'
const DESCRIPCION =
  'Subí tu Excel, CSV o JSON. Detectamos cada hoja, sus campos y las relaciones entre tablas — y te dejamos el panel andando.'

// Absoluta y bajo /pulse: WhatsApp exige una URL completa, y en pulsemotor.co el middleware
// reescribe a /pulse/* todo lo que no empiece con /pulse (una ruta en /og/... daría 404 ahí).
const OG_IMAGE = 'https://pulsemotor.co/pulse/og/databridge'

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: 'https://pulsemotor.co/pulse/databridge' },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: 'https://pulsemotor.co/pulse/databridge',
    siteName: 'Pulse Motor',
    locale: 'es_CO',
    type: 'website',
    // width/height explícitos: sin ellos WhatsApp suele caer al preview chico de miniatura
    // en vez de mostrar la imagen grande.
    images: [{
      url: OG_IMAGE,
      width: 1200,
      height: 630,
      alt: 'DataBridge 360 — inventario, financiación, pólizas y retomas conectados en un modelo de datos',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRIPCION,
    images: [OG_IMAGE],
  },
}

export default function DataBridgeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
