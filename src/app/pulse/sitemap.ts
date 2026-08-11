// src/app/pulse/sitemap.ts
// Genera pulsemotor.co/sitemap.xml via rewrite en next.config.ts
//
// Antes listaba /pulse/dashboard y /pulse/agente (paginas detras de login: Google
// solo ve una redireccion o un estado vacio, es presupuesto de rastreo desperdiciado)
// y NO listaba concesionario, asesor, demo ni databridge -- las paginas publicas de
// mayor contenido real del sitio, exactamente las que un concesionario buscando
// software encontraria. Corregido para reflejar lo que de verdad conviene indexar.

import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://pulsemotor.co'
  const now  = new Date()

  return [
    {
      url:             base + '/pulse',
      lastModified:    now,
      changeFrequency: 'weekly',
      priority:        1.0,
    },
    // Landings de segmento: el contenido mas denso y especifico del sitio, el que
    // mejor responde busquedas de intencion real ("software para concesionarios",
    // "CRM para asesor automotriz"). Antes no estaban en el sitemap.
    {
      url:             base + '/pulse/concesionario',
      lastModified:    now,
      changeFrequency: 'weekly',
      priority:        0.95,
    },
    {
      url:             base + '/pulse/asesor',
      lastModified:    now,
      changeFrequency: 'weekly',
      priority:        0.9,
    },
    // El panel de demo: navegable sin login, con contenido real (no un login wall).
    {
      url:             base + '/pulse/demo',
      lastModified:    now,
      changeFrequency: 'weekly',
      priority:        0.85,
    },
    {
      url:             base + '/pulse/databridge',
      lastModified:    now,
      changeFrequency: 'monthly',
      priority:        0.7,
    },
    {
      url:             base + '/pulse/pricing',
      lastModified:    now,
      changeFrequency: 'monthly',
      priority:        0.8,
    },
    {
      url:             base + '/pulse/signup',
      lastModified:    now,
      changeFrequency: 'yearly',
      priority:        0.6,
    },
    {
      url:             base + '/pulse/login',
      lastModified:    now,
      changeFrequency: 'yearly',
      priority:        0.3,
    },
    // /pulse/dashboard y /pulse/agente quedan afuera a proposito: son area de
    // producto detras de autenticacion, no contenido publico indexable.
  ]
}
