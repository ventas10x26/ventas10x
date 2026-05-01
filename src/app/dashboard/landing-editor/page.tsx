// Ruta destino: src/app/dashboard/landing-editor/page.tsx
// FASE 4.B: filtra landing_config y testimonios por org_id (no por user.id)
// El admin invitado puede editar la landing del owner.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { LandingEditorClient } from '@/components/dashboard/LandingEditorClient'
import { getActiveOrg } from '@/lib/get-active-org'
import type { Profile } from '@/types/database'

export default async function LandingEditorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const active = await getActiveOrg()
  if (!active) redirect('/onboarding')

  const [profileRes, configRes, testimoniosRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('landing_config') as any)
      .select('*')
      .eq('org_id', active.org.id)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('testimonios') as any)
      .select('*')
      .eq('org_id', active.org.id)
      .order('orden', { ascending: true }),
  ])

  const profile = profileRes.data
  if (!profile) redirect('/onboarding')

  const config = configRes.data || null
  const testimonios = testimoniosRes.data || []

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
      <LandingEditorClient
        profile={profile}
        config={config}
        testimonios={testimonios}
      />
    </DashboardLayout>
  )
}
