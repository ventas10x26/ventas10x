// Ruta destino: src/app/dashboard/landing-editor/page.tsx
// FASE 2 - Carga testimonios + todos los campos nuevos del config

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { LandingEditorClient } from '@/components/dashboard/LandingEditorClient'
import type { Profile } from '@/types/database'

export default async function LandingEditorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, configRes, testimoniosRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('landing_config').select('*').eq('vendedor_id', user.id).maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('testimonios') as any)
      .select('*')
      .eq('vendedor_id', user.id)
      .order('orden', { ascending: true }),
  ])

  const profile = profileRes.data as Profile | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = configRes.data as any
  const testimoniosIniciales = testimoniosRes.data || []

  const nombre = profile
    ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Usuario'
    : user.email?.split('@')[0] || 'Usuario'

  const initials = nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
  const slug = profile?.slug ?? ''

  return (
    <DashboardLayout
      user={{
        email: user.email!,
        name: nombre,
        initials,
        avatarUrl: user.user_metadata?.avatar_url,
      }}
      slug={slug}
    >
      <LandingEditorClient
        slug={slug}
        configInicial={{
          titulo: config?.titulo ?? '',
          subtitulo: config?.subtitulo ?? '',
          producto: config?.producto ?? '',
          color_acento: config?.color_acento ?? '#FF6B2B',
          imagen_hero: config?.imagen_hero ?? '',
          imagen_logo: config?.imagen_logo ?? '',
          imagenes_galeria: config?.imagenes_galeria ?? [],
          // Campos nuevos Fase 1+2
          stats: config?.stats ?? [],
          como_funciona: config?.como_funciona ?? [],
          bloques_activos: config?.bloques_activos ?? {
            hero: true,
            stats: true,
            productos: true,
            como_funciona: true,
            testimonios: true,
            cta_cierre: true,
          },
          badge_promo: config?.badge_promo ?? '',
          cta_principal_texto: config?.cta_principal_texto ?? 'Reservar mi cita',
          cta_principal_microcopy: config?.cta_principal_microcopy ?? 'Te respondo en 5 min por WhatsApp',
        }}
        // Datos auxiliares para autogeneración IA
        industria={profile?.industria ?? ''}
        empresa={profile?.empresa ?? ''}
        nombreVendedor={nombre}
        testimoniosIniciales={testimoniosIniciales}
      />
    </DashboardLayout>
  )
}
