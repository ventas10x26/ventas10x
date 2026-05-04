// Ruta destino: src/app/explore/page.tsx
import type { Metadata } from 'next'
import { ExploreClient } from '@/components/explore/ExploreClient'

export const metadata: Metadata = {
  title: 'Explorar vendedores · Ventas10x',
  description: 'Descubre asesores, productos y oportunidades de negocio en toda Latinoamérica.',
}

export default function ExplorePage() {
  return <ExploreClient />
}
