import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import type { Profile, Suscripcion } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 🔍 Obtener perfil correctamente (con manejo de error)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>()

  if (profileError) {
    console.error('❌ PROFILE ERROR:', profileError)
  }

  // ❗ Si NO existe perfil → onboarding
  if (!profile) {
    console.log('🚨 NO PROFILE FOUND FOR:', user.id)
    redirect('/onboarding')
  }

  // ⚠️ Validación más realista (NO usar slug aquí)
  const profileVacio = !profile.nombre && !profile.empresa
  if (profileVacio) {
    console.log('⚠️ PROFILE INCOMPLETO:', profile)
    redirect('/onboarding')
  }

  // 📦 Suscripción más reciente
  const { data: sus } = await supabase
    .from('suscripciones')
    .select('*')
    .eq('vendedor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<Suscripcion>()

  // ⚡ Queries en paralelo
  const [leadsRes, botsRes] = await Promise.all([
    supabase.from('leads').select('id').eq('vendedor_id', user.id),
    supabase
      .from('bots')
      .select('id, nombre, industria, activo')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  // 👤 Nombre del usuario
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
      slug={profile.slug ?? ''}
    >
      <DashboardHome
        nombre={nombre}
        slug={profile.slug || ''}
        sus={sus}
        totalLeads={leadsRes.data?.length || 0}
        userId={user.id}
        bots={botsRes.data || []}
      />
    </DashboardLayout>
  )
}