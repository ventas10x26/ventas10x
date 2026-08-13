// Ruta destino: src/app/admin/fenix/agente/page.tsx
// Configuración del agente IA de cobro de cartera de Fénix Consultores.
// Mismo gate de admin que /admin/fenix (tabla `admins`, sin org_id) y
// mismo motivo para vivir bajo /admin en vez de /dashboard: Fenix no es
// un tenant de Ventas10x.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { FenixAgenteClient } from '@/components/admin/FenixAgenteClient'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export default async function AdminFenixAgentePage() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    const host = (await headers()).get('host') || ''
    const esFenix = host.includes('app.consultoresfenix.com') || host.includes('fenix.localhost')
    redirect(esFenix ? '/auth/login' : '/dashboard')
  }

  const { data: agente } = await supabaseService
    .from('fenix_agente')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return <FenixAgenteClient initialAgente={agente} />
}
