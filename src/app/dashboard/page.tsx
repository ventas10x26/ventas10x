// Ruta destino: src/app/dashboard/page.tsx
// FIX: 
// 1. Usa .maybeSingle() en suscripciones (puede haber múltiples, queremos la última)
// 2. Captura errores de cada query independiente
// 3. Solo redirige a onboarding si REALMENTE no hay profile

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import type { Profile, Suscripcion } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Query independientes para que un fallo no rompa los demás
  const profileRes = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // ⚠️ Si no existe profile en BD, ahí sí redirige al onboarding
  const profile = profileRes.data as Profile | null
  if (!profile) redirect('/onboarding')

  // Solo redirige a onboarding si falta TODO (perfil prácticamente vacío)
  const profileVacio = !profile.nombre && !profile.empresa && !profile.slug
  if (profileVacio) redirect('/onboarding')

  // Suscripción más reciente (puede haber múltiples por migraciones, tomamos la activa o la última)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: susData } = await (supabase.from('suscripciones') as any)
    .select('*')
    .eq('vendedor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sus = susData as Suscripcion | null

  // Leads y bots en paralelo (no son críticos)
  const [leadsRes, botsRes] = await Promise.all([
    supabase.from('leads').select('id').eq('vendedor_id', user.id),
    supabase.from('bots').select('id, nombre, industria, activo').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const nombre = [profile.nombre, profile.apellido].filter(Boolean).join(' ')
    || user.email?.split('@')[0]
    || 'Usuario'

  const initials = nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()

  return (
    <DashboardLayout
      user={{
        email: user.email!,
        name: nombre,
        initials,
        avatarUrl: user.user_metadata?.avatar_url
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
