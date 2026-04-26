// Ruta destino: src/app/manifest.ts
// Web App Manifest para PWA + mejor SEO móvil.
// Genera /manifest.webmanifest automáticamente.

import type { MetadataRoute } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ventas10x — Vende 10x más con IA',
    short_name: 'Ventas10x',
    description: 'Plataforma de ventas con IA para asesores y equipos comerciales en Latam.',
    start_url: '/',
    display: 'standalone',
    background_color: SEO_CONFIG.backgroundColor,
    theme_color: SEO_CONFIG.themeColor,
    orientation: 'portrait',
    lang: SEO_CONFIG.defaultLanguage,
    categories: ['business', 'productivity', 'sales'],
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
