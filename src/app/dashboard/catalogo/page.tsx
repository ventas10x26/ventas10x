// Ruta destino: src/app/dashboard/catalogo/page.tsx
// FASE 4.B: filtra productos por org_id (no por user.id)

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { CatalogoClient } from '@/components/dashboard/CatalogoClient'
import { getActiveOrg } from '@/lib/get-active-org'
import type { Profile } from '@/types/database'

export type Producto = {
  id: string
  nombre: string
  precio: string | null
  descripcion: string | null
  orden: number
  created_at: string
  imagen_principal: string | null
  imagenes_adicionales: string[] | null
}

export default async function CatalogoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const active = await getActiveOrg()
  if (!active) redirect('/onboarding')

  const [profileRes, productosRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('productos')
      .select('id, nombre, precio, descripcion, orden, created_at, imagen_principal, imagenes_adicionales')
      .eq('org_id', active.org.id)
      .order('orden', { ascending: true }),
  ])

  const profile = profileRes.data as Profile | null
  if (!profile) redirect('/onboarding')

  const productos = (productosRes.data || []) as Producto[]

  const nombre =
    [profile.nombre, profile.apellido].filter(Boolean).join(' ') ||
    user.email?.split('@')[0] ||
    'Usuario'

  const initials = nombre
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <DashboardLayout
      user={{
        email: user.email!,
        name: nombre,
        initials,
        avatarUrl: user.user_metadata?.avatar_url,
      }}
      slug={active.org.slug ?? ''}
    >
      <CatalogoClient productosIniciales={productos} />
    </DashboardLayout>
  )
}
