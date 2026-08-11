// src/app/pulse/robots.ts
// Genera pulsemotor.co/robots.txt via rewrite en next.config.ts.
//
// Este archivo faltaba por completo: el rewrite en next.config.ts ya esperaba
// /pulse/robots.txt (misma logica que /pulse/sitemap.xml), pero como no existia,
// pulsemotor.co/robots.txt devolvia 404 en silencio. Sin robots.txt, Google igual
// puede rastrear el sitio, pero no tiene la referencia directa al sitemap ni las
// reglas explicitas de que no vale la pena indexar (dashboard, api) — ambas cosas
// ayudan a que el presupuesto de rastreo se gaste en las paginas que importan.

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
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
