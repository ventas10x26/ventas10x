// Ruta destino: src/app/admin/fenix/layout.tsx
// Envuelve todas las páginas de /admin/fenix (visitas, leads, agente de
// cobro, agente de leads) con el sidebar de navegación. Cada página sigue
// haciendo su propio gate de admin (getCurrentAdmin + redirect) -- este
// layout no duplica esa lógica, solo aporta el chrome de navegación.
import type { ReactNode } from 'react'
import { FenixSidebar } from '@/components/admin/FenixSidebar'

export default function AdminFenixLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <FenixSidebar />
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
}
