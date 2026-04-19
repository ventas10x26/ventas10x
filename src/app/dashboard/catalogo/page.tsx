import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import type { Profile } from '@/types/database'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profileData } = await supabase.from('profiles').select('nombre, apellido').eq('id', user.id).single()
  const profile = profileData as Pick<Profile, 'nombre' | 'apellido'> | null
  const nombre = profile ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user.email?.split('@')[0] || '' : user.email?.split('@')[0] || ''
  const initials = nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()

  return (
    <DashboardLayout user={{ email: user.email!, name: nombre, initials, avatarUrl: user.user_metadata?.avatar_url }}>
      <div style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '1rem', fontFamily: 'Syne, sans-serif' }}>Catálogo IA</h2>
        <p style={{ color: '#888780', fontSize: '14px' }}>Esta sección está en construcción. Pronto estará disponible.</p>
      </div>
    </DashboardLayout>
  )
}
