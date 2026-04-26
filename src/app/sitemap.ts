// Ruta destino: src/app/sitemap.ts
// FIX: usar created_at en vez de updated_at (la columna no existe).

import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SEO_CONFIG, absoluteUrl } from '@/lib/seo-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // ← service role para bypass RLS
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

  // Landings de vendedores
  let landingPages: MetadataRoute.Sitemap = []
  try {
    const { data: vendedores, error } = await supabase
      .from('profiles')
      .select('slug, created_at')
      .not('slug', 'is', null)
      .neq('slug', '')

    if (error) {
      console.error('[sitemap] Error en query:', error)
    } else if (vendedores) {
      console.log(`[sitemap] Encontrados ${vendedores.length} vendedores`)
      landingPages = vendedores.map((v: { slug: string; created_at: string | null }) => ({
        url: absoluteUrl(`/u/${v.slug}`),
        lastModified: v.created_at ? new Date(v.created_at) : ahora,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (e) {
    console.error('[sitemap] Error inesperado:', e)
  }

  return [...staticPages, ...landingPages]
}
