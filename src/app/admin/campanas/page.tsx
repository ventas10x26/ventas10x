// Ruta destino: src/app/admin/campanas/page.tsx
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { AdminCampanasClient } from '@/components/admin/AdminCampanasClient'

export const dynamic = 'force-dynamic'

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminCampanasPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/dashboard')

  // Cargar vendedores para el selector
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: perfiles } = await (supabaseService as any)
    .from('profiles')
    .select('id, nombre, apellido, empresa, slug, industria, whatsapp')
    .order('nombre', { ascending: true })

  // Cargar campañas existentes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campanas } = await (supabaseService as any)
    .from('campanas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  // Obtener emails de auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: authUsers } = await (supabaseService.auth.admin as any).listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  ;(authUsers?.users || []).forEach((u: { id: string; email?: string }) => {
    if (u.email) emailMap[u.id] = u.email
  })

  const vendedores = (perfiles || []).map((p: {
    id: string; nombre: string | null; apellido: string | null
    empresa: string | null; slug: string | null; industria: string | null; whatsapp: string | null
  }) => ({
    ...p,
    email: emailMap[p.id] || null,
  }))

  return (
    <AdminCampanasClient
      vendedores={vendedores}
      campanasIniciales={campanas || []}
    />
  )
}
