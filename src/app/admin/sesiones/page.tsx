// Ruta destino: src/app/admin/sesiones/page.tsx
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { AdminSesionesClient } from '@/components/admin/AdminSesionesClient'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminSesionesPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logs } = await (supabaseAdmin as any)
    .from('login_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  // Obtener todos los usuarios de auth para cruzar datos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: authUsers } = await (supabaseAdmin.auth.admin as any).listUsers({ perPage: 1000 })
  const userMap: Record<string, { email: string; created_at: string; last_sign_in_at: string }> = {}
  ;(authUsers?.users || []).forEach((u: { id: string; email?: string; created_at: string; last_sign_in_at: string }) => {
    userMap[u.id] = { email: u.email || '', created_at: u.created_at, last_sign_in_at: u.last_sign_in_at }
  })

  return <AdminSesionesClient logs={logs || []} userMap={userMap} />
}
