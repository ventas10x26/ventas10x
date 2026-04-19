import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { PipelineKanban } from '@/components/dashboard/PipelineKanban'
import type { Profile, Lead } from '@/types/database'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [leadsRes, profileRes] = await Promise.all([
    supabase.from('leads').select('*').eq('vendedor_id', user.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('nombre, apellido').eq('id', user.id).single(),
  ])

  const profile = profileRes.data as Pick<Profile, 'nombre' | 'apellido'> | null
  const leads = (leadsRes.data || []) as Lead[]

  const nombre = profile
    ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user.email?.split('@')[0] || ''
    : user.email?.split('@')[0] || ''

  const initials = nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()

  return (
    <DashboardLayout user={{
      email: user.email!,
      name: nombre,
      initials,
      avatarUrl: user.user_metadata?.avatar_url
    }}>
      <PipelineKanban initialLeads={leads} userId={user.id} />
    </DashboardLayout>
  )
}
