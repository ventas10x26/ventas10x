// src/app/pulse/concesionario/page.tsx
//
// Componente de servidor. Todo el contenido y la interactividad viven en
// ConcesionarioClient.tsx (movido ahí sin cambios) — este archivo existe
// unicamente para poder declarar metadata propia de esta pagina, algo que un
// componente de cliente no puede hacer en Next.js. Antes esta pagina entera
// era 'use client' y por eso heredaba el titulo y la descripcion genericos
// del layout de /pulse (los mismos que la home), sin nada especifico para
// "concesionario" — la palabra que mas le importa a quien busca esto.

import type { Metadata } from 'next'
import ConcesionarioClient from './ConcesionarioClient'

export const metadata: Metadata = {
  title: 'CRM con IA para concesionarios automotrices',
  description: 'Conectá tu CRM, DMS y financiación en un solo panel. Medí cuánto de cada venta se cae —financiación, seguro, accesorios, retoma— por sede y por asesor.',
  alternates: { canonical: 'https://pulsemotor.co/pulse/concesionario' },
  openGraph: {
    title: 'CRM con IA para concesionarios automotrices | Pulse Motor',
    description: 'Conectá tu CRM, DMS y financiación en un solo panel. Medí cuánto de cada venta se cae, por sede y por asesor.',
    url: 'https://pulsemotor.co/pulse/concesionario',
    siteName: 'Pulse Motor',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRM con IA para concesionarios automotrices | Pulse Motor',
    description: 'Conectá tu CRM, DMS y financiación en un solo panel. Medí cuánto de cada venta se cae, por sede y por asesor.',
  },
}

export default function ConcesionarioPage() {
  return <ConcesionarioClient />
}
