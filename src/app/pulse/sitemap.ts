// src/app/pulse/sitemap.ts
// Genera pulsemotor.co/sitemap.xml via rewrite en next.config.ts

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
    {
      url:             base + '/pulse/pricing',
      lastModified:    now,
      changeFrequency: 'monthly',
      priority:        0.9,
    },
    {
      url:             base + '/pulse/login',
      lastModified:    now,
      changeFrequency: 'yearly',
      priority:        0.5,
    },
    {
      url:             base + '/pulse/signup',
      lastModified:    now,
      changeFrequency: 'yearly',
      priority:        0.6,
    },
    {
      url:             base + '/pulse/agente',
      lastModified:    now,
      changeFrequency: 'monthly',
      priority:        0.7,
    },
    {
      url:             base + '/pulse/dashboard',
      lastModified:    now,
      changeFrequency: 'monthly',
      priority:        0.7,
    },
  ]
}
