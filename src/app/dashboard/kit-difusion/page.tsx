// Ruta destino: src/app/dashboard/kit-difusion/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { getActiveOrg } from '@/lib/get-active-org'
import { KitDifusionClient } from '@/components/dashboard/KitDifusionClient'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function KitDifusionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const active = await getActiveOrg()
  if (!active) redirect('/onboarding')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>()

  if (!profile) redirect('/onboarding')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: config } = await (supabase as any)
    .from('landing_config')
    .select('titulo, subtitulo, color_acento, imagen_hero, avatar_url')
    .eq('vendedor_id', active.org.owner_id)
    .maybeSingle()

  const nombre = [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Asesor'
  const initials = nombre.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const slug = active.org.slug || profile.slug || ''
  const colorAcento = config?.color_acento || '#FF6B2B'
  const empresa = profile.empresa || ''
  const industria = profile.industria || ''
  const titulo = config?.titulo || `${nombre} · Asesor profesional`
  const subtitulo = config?.subtitulo || 'Atención personalizada por WhatsApp. Te respondo rápido y sin compromiso.'
  const avatarUrl = profile.avatar_url || config?.avatar_url || null

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
      <KitDifusionClient
        nombre={nombre}
        empresa={empresa}
        industria={industria}
        slug={slug}
        colorAcento={colorAcento}
        titulo={titulo}
        subtitulo={subtitulo}
        avatarUrl={avatarUrl}
        initials={initials}
      />
    </DashboardLayout>
  )
}
