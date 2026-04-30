// Ruta destino: src/app/u/[slug]/page.tsx
// FASE 1 - Carga de testimonios + landing_config extendida

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { LandingPage } from '@/components/landing/LandingPage'
import type { Metadata } from 'next'
import type { Profile, LandingConfig, Producto } from '@/types/database'
import ChatBotWidget from '@/components/landing/ChatBotWidget'
import { SeccionRenderer } from '@/components/landing-sections/SeccionRenderer'
import type { LandingSeccion } from '@/types/secciones'
import { SEO_CONFIG, absoluteUrl } from '@/lib/seo-config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const [profileRes, configRes, productosRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('nombre, apellido, empresa, industria, avatar_url, whatsapp')
      .eq('slug', slug)
      .single(),
    supabase
      .from('landing_config')
      .select('titulo, subtitulo, producto, imagen_hero, color_acento')
      .eq('vendedor_id', (await supabase.from('profiles').select('id').eq('slug', slug).single()).data?.id ?? '')
      .single(),
    supabase
      .from('productos')
      .select('nombre')
      .eq('vendedor_id', (await supabase.from('profiles').select('id').eq('slug', slug).single()).data?.id ?? '')
      .order('orden')
      .limit(5),
  ])

  const profile = profileRes.data as Pick<
    Profile,
    'nombre' | 'apellido' | 'empresa' | 'industria' | 'avatar_url' | 'whatsapp'
  > | null

  if (!profile) {
    return {
      title: 'Asesor no encontrado · Ventas10x',
      robots: { index: false, follow: false },
    }
  }

  const config = configRes.data as Pick<
    LandingConfig,
    'titulo' | 'subtitulo' | 'producto' | 'imagen_hero' | 'color_acento'
  > | null

  const productos = (productosRes.data || []) as Pick<Producto, 'nombre'>[]

  const nombreVendedor = [profile.nombre, profile.apellido].filter(Boolean).join(' ').trim() || 'Asesor'
  const empresa = profile.empresa?.trim() || ''
  const industria = profile.industria?.trim() || ''
  const titulo = config?.titulo?.trim() || ''
  const subtitulo = config?.subtitulo?.trim() || ''
  const productoPrincipal = config?.producto?.trim() || ''

  const partesTitulo = [nombreVendedor]
  if (empresa) partesTitulo.push(empresa)
  if (productoPrincipal) partesTitulo.push(productoPrincipal)
  const titleSeo = partesTitulo.join(' · ')

  let description = ''
  if (titulo) description = titulo
  if (subtitulo) description += description ? '. ' + subtitulo : subtitulo
  if (productos.length > 0 && description.length < 100) {
    const productosNombres = productos.slice(0, 3).map(p => p.nombre).join(', ')
    description += description
      ? ` Productos: ${productosNombres}.`
      : `${nombreVendedor} ofrece: ${productosNombres}.`
  }
  if (!description) {
    description = `Solicita tu cotización con ${nombreVendedor}${empresa ? ` de ${empresa}` : ''}. Atención personalizada por WhatsApp.`
  }
  if (description.length > 160) {
    description = description.substring(0, 157) + '...'
  }

  // OG image dinámica generada en /og/[slug] (1200x630 optimizada para social)
  const ogImage = absoluteUrl(`/og/${slug}`)
  const canonicalUrl = absoluteUrl(`/u/${slug}`)

  return {
    title: titleSeo,
    description,
    keywords: [
      nombreVendedor,
      empresa,
      industria,
      productoPrincipal,
      ...productos.slice(0, 3).map(p => p.nombre),
      'cotización',
      'WhatsApp',
      'Latam',
    ].filter(Boolean) as string[],
    authors: [{ name: nombreVendedor }],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'profile',
      url: canonicalUrl,
      siteName: SEO_CONFIG.siteName,
      title: `${nombreVendedor}${empresa ? ' · ' + empresa : ''}`,
      description,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: `Landing de ${nombreVendedor}` }]
        : undefined,
      locale: SEO_CONFIG.defaultLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nombreVendedor}${empresa ? ' · ' + empresa : ''}`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function VendedorLandingPage({ params }: Props) {
  const { slug } = await params

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, empresa, avatar_url, industria, whatsapp')
    .eq('slug', slug)
    .single()

  const profile = profileData as Pick<
    Profile,
    'id' | 'nombre' | 'apellido' | 'empresa' | 'avatar_url' | 'industria' | 'whatsapp'
  > | null

  if (!profile) notFound()

  const [configRes, productosRes, seccionesRes, botRes, testimoniosRes] = await Promise.all([
    supabase.from('landing_config').select('*').eq('vendedor_id', profile.id).single(),
    supabase.from('productos').select('*').eq('vendedor_id', profile.id).order('orden'),
    supabase
      .from('landing_secciones')
      .select('*')
      .eq('vendedor_id', profile.id)
      .eq('activa', true)
      .order('orden', { ascending: true }),
    supabase
      .from('bots')
      .select('nombre, industria, bienvenida, activo')
      .eq('user_id', profile.id)
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('testimonios')
      .select('id, nombre_cliente, texto, rating, avatar_url')
      .eq('vendedor_id', profile.id)
      .order('orden', { ascending: true })
      .limit(6),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = configRes.data as any
  const productos = (productosRes.data || []) as Producto[]
  const secciones = (seccionesRes.data || []) as LandingSeccion[]
  const testimonios = testimoniosRes.data || []
  const bot = botRes.data as {
    nombre: string | null
    industria: string | null
    bienvenida: string | null
    activo: boolean | null
  } | null

  const nombreFromProfile = [profile.nombre, profile.apellido]
    .filter(Boolean)
    .join(' ')
    .trim()

  const nombreBot = bot?.nombre?.trim() || nombreFromProfile || 'Asistente'
  const industriaBot = bot?.industria?.trim() || profile.industria || 'default'
  const bienvenidaBot = bot?.bienvenida?.trim() || null

  const colorAcento = config?.color_acento ?? '#FF6B2B'
  const canonicalUrl = absoluteUrl(`/u/${slug}`)

  // ─── JSON-LD ───

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${canonicalUrl}#person`,
    name: nombreFromProfile || 'Asesor',
    url: canonicalUrl,
    image: profile.avatar_url || undefined,
    jobTitle: profile.industria ? `Asesor comercial en ${profile.industria}` : 'Asesor comercial',
    worksFor: profile.empresa
      ? { '@type': 'Organization', name: profile.empresa }
      : undefined,
    contactPoint: profile.whatsapp
      ? {
          '@type': 'ContactPoint',
          contactType: 'sales',
          telephone: profile.whatsapp,
          availableLanguage: ['Spanish'],
        }
      : undefined,
  }

  const businessJsonLd = profile.empresa
    ? {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        '@id': `${canonicalUrl}#business`,
        name: profile.empresa,
        description: config?.titulo || `${nombreFromProfile} ofrece atención personalizada`,
        url: canonicalUrl,
        image: config?.imagen_hero || profile.avatar_url || undefined,
        telephone: profile.whatsapp || undefined,
        priceRange: '$$',
        areaServed: { '@type': 'Country', name: 'Colombia' },
        provider: { '@id': `${canonicalUrl}#person` },
      }
    : null

  const productListJsonLd =
    productos.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: productos.slice(0, 10).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Product',
              name: p.nombre,
              description: p.descripcion || undefined,
              image: p.imagen_principal || undefined,
              offers: p.precio
                ? {
                    '@type': 'Offer',
                    price: p.precio.replace(/[^\d]/g, '') || '0',
                    priceCurrency: 'COP',
                    availability: 'https://schema.org/InStock',
                  }
                : undefined,
            },
          })),
        }
      : null

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SEO_CONFIG.siteUrl },
      { '@type': 'ListItem', position: 2, name: nombreFromProfile, item: canonicalUrl },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      {businessJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
      )}
      {productListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productListJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

<LandingPage
        profile={profile}
        config={config}
        productos={productos}
        testimonios={testimonios}
        slug={slug}
        tema={config?.tema ?? undefined}
      />

      {secciones.length > 0 && (
        <div>
          {secciones.map((seccion) => (
            <SeccionRenderer
              key={seccion.id}
              seccion={seccion}
              colorAcento={colorAcento}
              whatsappVendedor={config?.whatsapp ?? null}
            />
          ))}
        </div>
      )}

      <ChatBotWidget
        slug={slug}
        nombreAsesor={nombreBot}
        colorAcento={colorAcento}
        industria={industriaBot}
        bienvenida={bienvenidaBot}
      />
    </>
  )
}
