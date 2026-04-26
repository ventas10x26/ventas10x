// Ruta destino: src/app/dashboard/perfil/page.tsx
// REEMPLAZA. Cambios:
// - Pasa los campos callmebot_* desde el profile al PerfilClient

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { PerfilClient } from '@/components/dashboard/PerfilClient'
import type { Profile } from '@/types/database'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  const nombre = profile
    ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Usuario'
    : user.email?.split('@')[0] || 'Usuario'

  const initials = nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()

  // Lectura "tolerante" de los campos CallMeBot
  // (en caso de que el tipo Profile aún no los tenga definidos)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any

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
      <PerfilClient
        email={user.email!}
        avatarUrl={user.user_metadata?.avatar_url ?? null}
        initials={initials}
        profileInicial={{
          nombre: profile?.nombre ?? '',
          apellido: profile?.apellido ?? '',
          empresa: profile?.empresa ?? '',
          whatsapp: profile?.whatsapp ?? '',
          slug: profile?.slug ?? '',
        }}
        callmebotInicial={{
          apikey: p?.callmebot_apikey ?? '',
          telefono: p?.callmebot_telefono ?? '',
          activa: p?.notif_whatsapp_activa ?? false,
        }}
      />
    </DashboardLayout>
  )
}
