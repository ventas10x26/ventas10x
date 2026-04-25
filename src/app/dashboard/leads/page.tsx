// Ruta destino: src/app/dashboard/leads/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import type { Profile, Lead } from '@/types/database'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, leadsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('leads')
      .select('*')
      .eq('vendedor_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const profile = profileRes.data as Profile | null
  const leads = (leadsRes.data as Lead[] | null) ?? []

  const nombre = profile
    ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Usuario'
    : user.email?.split('@')[0] || 'Usuario'

  const initials = nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()

  return (
    <DashboardLayout
      user={{
        email: user.email!,
        name: nombre,
        initials,
        avatarUrl: user.user_metadata?.avatar_url
      }}
      slug={profile?.slug ?? ''}
    >
      <div className="px-6 py-8 md:px-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-brand-navy">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los prospectos de tu negocio.
          </p>
        </header>

        <LeadsTable initialLeads={leads} userId={user.id} />
      </div>
    </DashboardLayout>
  )
}
