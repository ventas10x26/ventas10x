// Ruta destino: src/app/sitemap.ts
// Sitemap dinámico que incluye todas las landings de vendedores activos.
// Next.js lo expone automáticamente en /sitemap.xml

import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SEO_CONFIG, absoluteUrl } from '@/lib/seo-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date()

  // Páginas estáticas principales
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SEO_CONFIG.siteUrl,
      lastModified: ahora,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: absoluteUrl('/auth/register'),
      lastModified: ahora,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/auth/login'),
      lastModified: ahora,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Landings de vendedores (todas las que tienen slug)
  let landingPages: MetadataRoute.Sitemap = []
  try {
    const { data: vendedores } = await supabase
      .from('profiles')
      .select('slug, updated_at')
      .not('slug', 'is', null)
      .neq('slug', '')

    if (vendedores) {
      landingPages = vendedores.map((v: { slug: string; updated_at: string | null }) => ({
        url: absoluteUrl(`/u/${v.slug}`),
        lastModified: v.updated_at ? new Date(v.updated_at) : ahora,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (e) {
    console.error('[sitemap] Error cargando vendedores:', e)
  }

  return [...staticPages, ...landingPages]
}
