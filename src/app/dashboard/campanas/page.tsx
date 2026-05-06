// Ruta destino: src/app/dashboard/campanas/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { VendedorCampanasClient } from '@/components/dashboard/VendedorCampanasClient'
import { getActiveOrg } from '@/lib/get-active-org'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function CampanasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const active = await getActiveOrg()
  if (!active) redirect('/onboarding')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>()
  if (!profile) redirect('/onboarding')

  const nombre = [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Usuario'
  const initials = nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()

  // Cargar productos del vendedor para el selector
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: productos } = await (supabase as any).from('productos')
    .select('id, nombre, imagen_principal, precio')
    .eq('vendedor_id', user.id)
    .eq('activo', true)
    .order('nombre')

  return (
    <DashboardLayout
      user={{ email: user.email!, name: nombre, initials, avatarUrl: user.user_metadata?.avatar_url }}
      slug={active.org.slug ?? ''}
    >
      <VendedorCampanasClient
        vendedorId={user.id}
        nombreVendedor={nombre}
        slug={active.org.slug || ''}
        productos={productos || []}
      />
    </DashboardLayout>
  )
}
