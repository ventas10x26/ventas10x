// Ruta destino: src/app/robots.ts
// Genera /robots.txt automáticamente.

import type { MetadataRoute } from 'next'
import { SEO_CONFIG, absoluteUrl } from '@/lib/seo-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/u/', '/auth/'],
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/callback',
        ],
      },
      // Permitir explícitamente bots de buscadores principales
      {
        userAgent: 'Googlebot',
        allow: ['/', '/u/', '/auth/register', '/auth/login'],
        disallow: ['/dashboard/', '/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/u/', '/auth/register'],
        disallow: ['/dashboard/', '/api/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SEO_CONFIG.siteUrl,
  }
}
