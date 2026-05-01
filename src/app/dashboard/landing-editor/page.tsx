// Ruta destino: src/app/dashboard/landing-editor/page.tsx
// FASE 4.B: filtra landing_config y testimonios por org_id (no por user.id)
// El admin invitado puede editar la landing del owner.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { LandingEditorClient } from '@/components/dashboard/LandingEditorClient'
import { getActiveOrg } from '@/lib/get-active-org'
import type { Profile } from '@/types/database'

export default async function LandingEditorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const active = await getActiveOrg()
  if (!active) redirect('/onboarding')

  // Cargar perfil del USUARIO actual (para nombre/initials del header)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>()

  if (!profile) redirect('/onboarding')

  // Cargar perfil del OWNER de la org (para industria/empresa que se muestran al editar)
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('industria, empresa, nombre, apellido')
    .eq('id', active.org.owner_id)
    .maybeSingle<Profile>()

  // Cargar landing_config y testimonios de la org activa
  const [configRes, testimoniosRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('landing_config') as any)
      .select('*')
      .eq('org_id', active.org.id)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('testimonios') as any)
      .select('*')
      .eq('org_id', active.org.id)
      .order('orden', { ascending: true }),
  ])

  // Construir configInicial con defaults seguros
  const config = configRes.data
  const configInicial = {
    titulo: config?.titulo || '',
    subtitulo: config?.subtitulo || '',
    producto: config?.producto || '',
    color_acento: config?.color_acento || '#FF6B2B',
    foto_url: config?.foto_url || '',
    whatsapp: config?.whatsapp || '',
    mensaje_wa: config?.mensaje_wa || '',
    imagen_hero: config?.imagen_hero || '',
    imagen_logo: config?.imagen_logo || '',
    imagenes_galeria: config?.imagenes_galeria || [],
    stats: config?.stats || [],
    como_funciona: config?.como_funciona || [],
    bloques_activos: config?.bloques_activos || {},
    badge_promo: config?.badge_promo || '',
    cta_principal_texto: config?.cta_principal_texto || '',
    cta_principal_microcopy: config?.cta_principal_microcopy || '',
    tema: config?.tema || 'generico',
  }

  const testimonios = testimoniosRes.data || []

  // Header del usuario actual
  const nombreUsuario =
    [profile.nombre, profile.apellido].filter(Boolean).join(' ') ||
    user.email?.split('@')[0] ||
    'Usuario'

  const initials = nombreUsuario
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  // Datos del owner para el editor (industria/empresa de la org, no del usuario)
  const nombreVendedorOwner = ownerProfile
    ? [ownerProfile.nombre, ownerProfile.apellido].filter(Boolean).join(' ') ||
      'Vendedor'
    : 'Vendedor'

  return (
    <DashboardLayout
      user={{
        email: user.email!,
        name: nombreUsuario,
        initials,
        avatarUrl: user.user_metadata?.avatar_url,
      }}
      slug={active.org.slug ?? ''}
    >
      <LandingEditorClient
        slug={active.org.slug ?? ''}
        configInicial={configInicial}
        industria={ownerProfile?.industria || ''}
        empresa={ownerProfile?.empresa || ''}
        nombreVendedor={nombreVendedorOwner}
        testimoniosIniciales={testimonios}
      />
    </DashboardLayout>
  )
}
