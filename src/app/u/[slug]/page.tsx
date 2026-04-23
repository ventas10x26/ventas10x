import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { LandingPage } from '@/components/landing/LandingPage'
import type { Metadata } from 'next'
import type { Profile, LandingConfig, Producto } from '@/types/database'
import ChatBotWidget from '@/components/landing/ChatBotWidget'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('nombre, apellido, empresa')
    .eq('slug', slug)
    .single()

  const profile = data as Pick<Profile, 'nombre' | 'apellido' | 'empresa'> | null
  if (!profile) return { title: 'Ventas10x' }

  const nombre = [profile.nombre, profile.apellido].filter(Boolean).join(' ')
  return {
    title: `${nombre} — Ventas10x`,
    description: `Solicita tu cotización con ${nombre} de ${profile.empresa || 'Ventas10x'}`,
  }
}

export default async function VendedorLandingPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, empresa, avatar_url')
    .eq('slug', slug)
    .single()

  const profile = profileData as Pick<
    Profile,
    'id' | 'nombre' | 'apellido' | 'empresa' | 'avatar_url'
  > | null

  if (!profile) notFound()

  const [configRes, productosRes] = await Promise.all([
    supabase.from('landing_config').select('*').eq('vendedor_id', profile.id).single(),
    supabase.from('productos').select('*').eq('vendedor_id', profile.id).order('orden'),
  ])

  const config = configRes.data as LandingConfig | null
  const productos = (productosRes.data || []) as Producto[]

  const nombreAsesor = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(' ')
    .trim()

  return (
    <>
      <LandingPage
        profile={profile}
        config={config}
        productos={productos}
        slug={slug}
      />

      <ChatBotWidget
        slug={slug}
        nombreAsesor={nombreAsesor}
        colorAcento={config?.color_acento ?? '#FF6B2B'}
      />
    </>
  )
}
