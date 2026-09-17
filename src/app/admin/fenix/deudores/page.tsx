// Ruta destino: src/app/admin/fenix/deudores/page.tsx
// Cartera de deudores importados por CSV para autogestión de cobro.
// Mismo gate de admin que el resto de /admin/fenix.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { FenixDeudoresClient } from '@/components/admin/FenixDeudoresClient'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export default async function AdminFenixDeudoresPage() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    const host = (await headers()).get('host') || ''
    const esFenix = host.includes('app.consultoresfenix.com') || host.includes('fenix.localhost')
    redirect(esFenix ? '/auth/login' : '/dashboard')
  }

  const { data: deudores } = await supabaseService
    .from('fenix_deudores')
    .select('*')
    .order('created_at', { ascending: false })

  return <FenixDeudoresClient initialDeudores={deudores || []} />
}
