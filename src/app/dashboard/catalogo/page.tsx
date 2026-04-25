// Ruta destino: src/app/dashboard/catalogo/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { CatalogoClient } from '@/components/dashboard/CatalogoClient'
import type { Profile } from '@/types/database'

export type Producto = {
  id: string
  nombre: string
  precio: string | null
  descripcion: string | null
  orden: number
  created_at: string
}

export default async function CatalogoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, productosRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('productos')
      .select('*')
      .eq('vendedor_id', user.id)
      .order('orden', { ascending: true }),
  ])

  const profile = profileRes.data as Profile | null
  const productos = (productosRes.data as Producto[] | null) ?? []

  const nombre = profile
    ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Usuario'
    : user.email?.split('@')[0] || 'Usuario'

  const initials = nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()

  return (
    <DashboardLayout
      user={{
        email: user.email!,
        name: nombre,
        initials,
        avatarUrl: user.user_metadata?.avatar_url
      }}
      slug={profile?.slug ?? ''}
    >
      <CatalogoClient productosIniciales={productos} />
    </DashboardLayout>
  )
}
