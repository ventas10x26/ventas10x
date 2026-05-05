// Ruta destino: src/app/dashboard/page.tsx
// FASE 4.B: usa getActiveOrg() en vez de filtrar por user.id
// - Si el usuario no tiene perfil → onboarding
// - Si no tiene org activa → onboarding (caso edge)
// - Filtra leads, suscripcion, bots por org_id
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { getActiveOrg } from '@/lib/get-active-org'
import { headers } from 'next/headers'
import type { Profile, Suscripcion } from '@/types/database'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 🔍 Obtener perfil del USUARIO (siempre del usuario logueado, no de la org)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>()
  if (profileError) {
    console.error('❌ PROFILE ERROR:', profileError)
  }
  if (!profile) {
    console.log('🚨 NO PROFILE FOUND FOR:', user.id)
    redirect('/onboarding')
  }
  const profileVacio = !profile.nombre && !profile.empresa
  if (profileVacio) {
    console.log('⚠️ PROFILE INCOMPLETO:', profile)
    redirect('/onboarding')
  }

  // 🏢 Obtener ORG ACTIVA del usuario
  const active = await getActiveOrg()
  if (!active) {
    console.log('⚠️ Sin org activa, redirigiendo a onboarding')
    redirect('/onboarding')
  }

  // 📊 Log de login — directo a BD con service role
  try {
    const h = await headers()
    const xfwd = h.get('x-forwarded-for') || ''
    const ua = h.get('user-agent') || ''
    const dispositivo = /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop'
    const ip = xfwd.split(',')[0]?.trim() || 'desconocida'
    const nombre_log = [profile.nombre, profile.apellido].filter(Boolean).join(' ') || null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(supabaseAdmin as any).from('login_logs').insert({
      user_id: user.id,
      email: user.email,
      nombre: nombre_log,
      ip,
      user_agent: ua.slice(0, 300),
      dispositivo,
      exitoso: true,
    }).then(() => {}).catch(() => {})
  } catch {}

  // 📦 Suscripción: SIEMPRE del owner de la org (es quien paga)
  const { data: sus } = await supabase
    .from('suscripciones')
    .select('*')
    .eq('vendedor_id', active.org.owner_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<Suscripcion>()

  // ⚡ Queries en paralelo, filtradas por ORG_ID (no por user_id)
  const [leadsRes, botsRes] = await Promise.all([
    supabase.from('leads').select('id').eq('org_id', active.org.id),
    supabase
      .from('bots')
      .select('id, nombre, industria, activo')
      .eq('org_id', active.org.id)
      .order('created_at', { ascending: false }),
  ])

  // 👤 Nombre del usuario actual (para el header)
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
      <DashboardHome
        nombre={nombre}
        slug={active.org.slug || ''}
        sus={sus}
        totalLeads={leadsRes.data?.length || 0}
        userId={user.id}
        bots={botsRes.data || []}
      />
    </DashboardLayout>
  )
}
