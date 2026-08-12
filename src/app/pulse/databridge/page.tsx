// src/app/pulse/databridge/page.tsx
// Componente de servidor — ver el mismo patron y motivo en
// src/app/pulse/concesionario/page.tsx. Este archivo se genero copiando
// page.tsx a DataBridgeClient.tsx sin cambios (ver patch_databridge_metadata.py).

import type { Metadata } from 'next'
import DataBridgeClient from './DataBridgeClient'

export const metadata: Metadata = {
  title: 'DataBridge 360\u00b0: conect\u00e1 tus datos sin escribir SQL',
  description: 'Sub\u00ed tu Excel, CRM o DMS y DataBridge arma el modelo de datos con sus relaciones autom\u00e1ticamente. Probalo gratis, sin tarjeta.',
  alternates: { canonical: 'https://pulsemotor.co/pulse/databridge' },
  openGraph: {
    title: 'DataBridge 360\u00b0: conect\u00e1 tus datos sin escribir SQL | Pulse Motor',
    description: 'Sub\u00ed tu Excel, CRM o DMS y DataBridge arma el modelo de datos con sus relaciones autom\u00e1ticamente.',
    url: 'https://pulsemotor.co/pulse/databridge',
    siteName: 'Pulse Motor',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DataBridge 360\u00b0: conect\u00e1 tus datos sin escribir SQL | Pulse Motor',
    description: 'Sub\u00ed tu Excel, CRM o DMS y DataBridge arma el modelo de datos con sus relaciones autom\u00e1ticamente.',
  },
}

export default function DataBridgePage() {
  return <DataBridgeClient />
}
