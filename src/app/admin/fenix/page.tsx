// Ruta destino: src/app/admin/fenix/page.tsx
// Panel de leads y pipeline de Fenix Consultores. Fenix no es un tenant de
// Ventas10x (no tiene org_id ni vendedor_id) -- por eso vive bajo /admin,
// igual que /admin/pagos, y no bajo /dashboard, que filtra por org activa.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { FenixLeadsClient } from '@/components/admin/FenixLeadsClient'
import { FenixVisitasChart } from '@/components/admin/FenixVisitasChart'
import { obtenerVisitasDiariasFenix } from '@/lib/ga4'
import { obtenerMetricasClarity } from '@/lib/clarity'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export default async function AdminFenixPage() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    // /dashboard no existe bajo el dominio de Fenix (el middleware lo
    // reescribiría a algo inexistente): sin sesión ahí, lo correcto es
    // pedir login, no mandarlo a una ruta de otro producto.
    const host = (await headers()).get('host') || ''
    const esFenix = host.includes('app.consultoresfenix.com') || host.includes('fenix.localhost')
    redirect(esFenix ? '/auth/login' : '/dashboard')
  }

  // Los leads viven en Supabase y las visitas en GA4: son dos fuentes
  // independientes. Si GA4 no está configurada todavía o Google rechaza la
  // solicitud, el panel de leads debe seguir funcionando igual -- por eso
  // el error se atrapa aquí y no se deja subir.
  const [leadsRes, visitas, clarity] = await Promise.all([
    supabaseService.from('fenix_leads').select('*').order('created_at', { ascending: false }),
    obtenerVisitasDiariasFenix(30).catch(err => {
      console.error('[admin/fenix] GA4 no disponible:', err instanceof Error ? err.message : err)
      return null
    }),
    obtenerMetricasClarity().catch(err => {
      console.error('[admin/fenix] Clarity no disponible:', err instanceof Error ? err.message : err)
      return null
    }),
  ])

  return (
    <FenixLeadsClient
      initialLeads={leadsRes.data || []}
      visitas={visitas}
      clarity={clarity}
      clarityProjectId={process.env.NEXT_PUBLIC_CLARITY_ID}
    />
  )
}
