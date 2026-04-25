// Ruta destino: src/app/dashboard/productos/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ProductosManagerClient } from '@/components/dashboard/ProductosManagerClient'
import type { Profile } from '@/types/database'

export default async function ProductosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileRes } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileRes as Profile | null

  const nombre = profile
    ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Usuario'
    : user.email?.split('@')[0] || 'Usuario'
  const initials = nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()

  return (
    <DashboardLayout user={{
      email: user.email!,
      name: nombre,
      initials,
      avatarUrl: user.user_metadata?.avatar_url
    }}>
      <ProductosManagerClient />
    </DashboardLayout>
  )
}
