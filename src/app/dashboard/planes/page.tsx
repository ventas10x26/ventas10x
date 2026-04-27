// Ruta destino: src/app/dashboard/planes/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { PlanesClient } from '@/components/dashboard/PlanesClient'
import type { Profile } from '@/types/database'

export default async function PlanesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: suscripcion } = await (supabase.from('suscripciones') as any)
    .select('*')
    .eq('vendedor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

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
      <PlanesClient suscripcionInicial={suscripcion ?? null} />
    </DashboardLayout>
  )
}
