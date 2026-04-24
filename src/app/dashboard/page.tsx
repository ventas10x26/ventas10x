import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import type { Profile, Suscripcion } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, susRes, leadsRes, botsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('suscripciones').select('*').eq('vendedor_id', user.id).single(),
    supabase.from('leads').select('id').eq('vendedor_id', user.id),
    supabase.from('bots').select('id, nombre, industria, activo').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const profile = profileRes.data as Profile | null

  // Redirigir al onboarding si no tiene empresa configurada
  if (!profile?.empresa) redirect('/onboarding')

  const sus = susRes.data as Suscripcion | null
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
      <DashboardHome
        nombre={nombre}
        slug={profile?.slug || ''}
        sus={sus}
        totalLeads={leadsRes.data?.length || 0}
        userId={user.id}
        bots={botsRes.data || []}
      />
    </DashboardLayout>
  )
}
