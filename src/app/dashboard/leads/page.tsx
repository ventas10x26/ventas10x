// Ruta destino: src/app/dashboard/leads/page.tsx
// FASE 4.B: filtra leads por org_id (no por user.id)

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { LeadsManager } from '@/components/dashboard/LeadsManager'
import { getActiveOrg } from '@/lib/get-active-org'
import type { Profile, Lead } from '@/types/database'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const active = await getActiveOrg()
  if (!active) redirect('/onboarding')

  const [leadsRes, profileRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .eq('org_id', active.org.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('nombre, apellido, slug')
      .eq('id', user.id)
      .single(),
  ])

  const profile = profileRes.data as Pick<Profile, 'nombre' | 'apellido' | 'slug'> | null
  const leads = (leadsRes.data || []) as Lead[]
  const nombre = profile
    ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') ||
      user.email?.split('@')[0] ||
      ''
    : user.email?.split('@')[0] || ''
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
      <LeadsManager initialLeads={leads} userId={user.id} />
    </DashboardLayout>
  )
}
