// Ruta destino: src/app/admin/fenix/leads-agente/page.tsx
// Configuración del agente IA informativo que le escribe a los leads
// comerciales de Fénix Consultores por WhatsApp (distinto del agente de
// cobro de cartera en /admin/fenix/agente). Mismo gate de admin.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { FenixLeadsAgenteClient } from '@/components/admin/FenixLeadsAgenteClient'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export default async function AdminFenixLeadsAgentePage() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    const host = (await headers()).get('host') || ''
    const esFenix = host.includes('app.consultoresfenix.com') || host.includes('fenix.localhost')
    redirect(esFenix ? '/auth/login' : '/dashboard')
  }

  const { data: agente } = await supabaseService
    .from('fenix_leads_agente')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return <FenixLeadsAgenteClient initialAgente={agente} />
}
