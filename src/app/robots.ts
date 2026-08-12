// Ruta destino: src/app/robots.ts
// Genera /robots.txt automáticamente.
//
// Consciente del dominio: este repo sirve dos productos (Ventas10x y Pulse Motor,
// bajo /pulse) desde el mismo deploy, en dos dominios custom distintos. El rewrite
// en next.config.ts para pulsemotor.co/robots.txt apuntaba a /pulse/robots.txt,
// pero Next.js NO genera un archivo de robots.txt funcional para un robots.ts
// anidado en una subcarpeta — a diferencia de sitemap.ts, que sí lo permite. Es
// una limitación conocida del App Router, no un bug de configuración: por eso
// pulsemotor.co/robots.txt devolvía 404 sin importar qué tan bien estuviera
// escrito ese archivo anidado (que ya se puede borrar, quedó sin uso).
//
// La solución es este archivo — el único robots.ts que Next.js sí sirve — leyendo
// el host de la petición para devolver las reglas de Pulse Motor cuando corresponde,
// sin tocar el comportamiento por defecto de Ventas10x en ningún otro caso.

import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { SEO_CONFIG, absoluteUrl } from '@/lib/seo-config'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host') || ''

  if (host.includes('pulsemotor.co')) {
    return {
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: [
            '/pulse/dashboard',
            '/pulse/agente',
            '/pulse/admin',
            '/pulse/onboarding',
            '/pulse/onboarding-demo',
            '/api/',
          ],
        },
      ],
      sitemap: 'https://pulsemotor.co/sitemap.xml',
      host: 'https://pulsemotor.co',
    }
  }

  // Ventas10x — comportamiento sin cambios.
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
