// Ruta destino: src/app/admin/fenix/visitas/page.tsx
// Visitas de la landing (GA4) + métricas de Clarity, separado del pipeline
// de leads (/admin/fenix) para que cada sección tenga su propio espacio en
// el sidebar. Mismo gate de admin que el resto de /admin/fenix.

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { FenixVisitasChart } from '@/components/admin/FenixVisitasChart'
import { FenixClarityCard } from '@/components/admin/FenixClarityCard'
import { obtenerVisitasDiariasFenix } from '@/lib/ga4'
import { obtenerMetricasClarity } from '@/lib/clarity'

const ACCENT = '#F5821F'

export const dynamic = 'force-dynamic'

export default async function AdminFenixVisitasPage() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    const host = (await headers()).get('host') || ''
    const esFenix = host.includes('app.consultoresfenix.com') || host.includes('fenix.localhost')
    redirect(esFenix ? '/auth/login' : '/dashboard')
  }

  // Dos fuentes independientes de la de Supabase que usa /admin/fenix -- si
  // GA4 o Clarity no están configuradas o Google rechaza la solicitud, la
  // página debe seguir funcionando igual, solo mostrando el estado vacío
  // que ya manejan estas tarjetas.
  const [visitas, clarity] = await Promise.all([
    obtenerVisitasDiariasFenix(30).catch(err => {
      console.error('[admin/fenix/visitas] GA4 no disponible:', err instanceof Error ? err.message : err)
      return null
    }),
    obtenerMetricasClarity().catch(err => {
      console.error('[admin/fenix/visitas] Clarity no disponible:', err instanceof Error ? err.message : err)
      return null
    }),
  ])

  return (
    <div style={{ minHeight: '100vh', background: '#f7f6f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ padding: '24px clamp(16px, 4vw, 32px)', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: ACCENT, marginBottom: '4px' }}>
            Fénix Consultores
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Visitas de la landing</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>
            Tráfico y comportamiento de ventas10x.co/fenix-consultores y app.consultoresfenix.com
          </p>
        </div>

        <FenixVisitasChart dias={visitas} />
        <FenixClarityCard metricas={clarity ?? null} projectId={process.env.NEXT_PUBLIC_CLARITY_ID} />
      </div>
    </div>
  )
}
