import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { LandingEditorClient } from '@/components/dashboard/LandingEditorClient'
import type { Profile, LandingConfig } from '@/types/database'

export default async function LandingEditorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, configRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('landing_config').select('*').eq('vendedor_id', user.id).maybeSingle(),
  ])

  const profile = profileRes.data as Profile | null
  const config = configRes.data as LandingConfig | null

  const nombre = profile
    ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Usuario'
    : user.email?.split('@')[0] || 'Usuario'

  const initials = nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
  const slug = profile?.slug ?? ''

  return (
    <DashboardLayout user={{
      email: user.email!,
      name: nombre,
      initials,
      avatarUrl: user.user_metadata?.avatar_url
    }}>
      <LandingEditorClient
        slug={slug}
        configInicial={{
          titulo: config?.titulo ?? '',
          subtitulo: config?.subtitulo ?? '',
          producto: config?.producto ?? '',
          color_acento: config?.color_acento ?? '#FF6B2B',
        }}
      />
    </DashboardLayout>
  )
}
