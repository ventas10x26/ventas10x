// Ruta destino: src/app/admin/fenix/page.tsx
// Panel de leads y pipeline de Fenix Consultores. Fenix no es un tenant de
// Ventas10x (no tiene org_id ni vendedor_id) -- por eso vive bajo /admin,
// igual que /admin/pagos, y no bajo /dashboard, que filtra por org activa.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { FenixLeadsClient } from '@/components/admin/FenixLeadsClient'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export default async function AdminFenixPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/dashboard')

  const { data: leads } = await supabaseService
    .from('fenix_leads')
    .select('*')
    .order('created_at', { ascending: false })

  return <FenixLeadsClient initialLeads={leads || []} />
}
