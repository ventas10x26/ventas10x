import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import type { Lead } from '@/types/database'

export default async function LeadsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona los prospectos de tu negocio.
        </p>
      </header>

      <LeadsTable initialLeads={(leads as Lead[]) ?? []} userId={user.id} />
    </div>
  )
}
