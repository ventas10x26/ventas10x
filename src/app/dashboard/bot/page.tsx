import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { BotList } from '@/components/dashboard/BotList'
import type { Profile } from '@/types/database'

export default async function BotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  console.log('user.id:', user.id)

  const [profileRes, botsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bots').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  console.log('bots data:', botsRes.data)
  console.log('bots error:', botsRes.error)

  const profile = profileRes.data as Profile | null
  const nombre = profile
    ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Usuario'
    : user.email?.split('@')[0] || 'Usuario'
  const initials = nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()

  return (
    <DashboardLayout user={{ email: user.email!, name: nombre, initials, avatarUrl: user.user_metadata?.avatar_url }}>
      <BotList bots={botsRes.data || []} userId={user.id} />
    </DashboardLayout>
  )
}
