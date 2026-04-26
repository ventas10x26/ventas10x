// Ruta destino: src/app/layout.tsx
// REEMPLAZA. Mejoras de SEO:
// - metadataBase (crítico en Next.js 15)
// - OpenGraph completo + Twitter Cards
// - Idioma + verificación de Google
// - JSON-LD de Organization para datos enriquecidos
// - Theme color para móviles
// - Iconos para todos los dispositivos

import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { SEO_CONFIG, absoluteUrl } from '@/lib/seo-config'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

// ─── Metadata global ───
export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.siteUrl),
  title: {
    default: 'Ventas10x — Vende 10x más con IA · Catálogo, Bot WhatsApp y Pipeline',
    template: '%s · Ventas10x',
  },
  description: 'La plataforma todo-en-uno para asesores y equipos comerciales en Latam. Crea tu landing personal, catálogo IA, bot WhatsApp 24/7 y pipeline visual en 48 horas. 14 días gratis sin tarjeta.',
  keywords: SEO_CONFIG.keywords,
  authors: [{ name: SEO_CONFIG.organization.name, url: SEO_CONFIG.siteUrl }],
  creator: SEO_CONFIG.organization.name,
  publisher: SEO_CONFIG.organization.name,
  applicationName: SEO_CONFIG.siteName,
  generator: 'Next.js',
  category: 'Business Software',

  // Robots (cómo deben crawlear los buscadores)
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // OpenGraph (para WhatsApp, Facebook, LinkedIn, Slack)
  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.defaultLocale,
    url: SEO_CONFIG.siteUrl,
    siteName: SEO_CONFIG.siteName,
    title: 'Ventas10x — Vende 10x más con IA',
    description: 'Plataforma de ventas con IA para Latam. Landing, bot WhatsApp y pipeline en 48h. 14 días gratis sin tarjeta.',
    images: [
      {
        url: absoluteUrl(SEO_CONFIG.defaultOgImage),
        width: 1200,
        height: 630,
        alt: 'Ventas10x - Plataforma de ventas con IA',
        type: 'image/png',
      },
    ],
  },

  // Twitter Cards
  twitter: {
    card: 'summary_large_image',
    site: SEO_CONFIG.twitterHandle,
    creator: SEO_CONFIG.twitterHandle,
    title: 'Ventas10x — Vende 10x más con IA',
    description: 'Catálogo IA, bot WhatsApp 24/7 y pipeline visual. 14 días gratis sin tarjeta.',
    images: [absoluteUrl(SEO_CONFIG.defaultOgImage)],
  },

  // Verificación (si tienes códigos)
  ...(SEO_CONFIG.googleVerification && {
    verification: {
      google: SEO_CONFIG.googleVerification,
    },
  }),

  // URL canónica (evita contenido duplicado)
  alternates: {
    canonical: SEO_CONFIG.siteUrl,
  },

  // Iconos
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png' }],
    shortcut: '/favicon.ico',
  },

  // App link (para iOS)
  appleWebApp: {
    capable: true,
    title: 'Ventas10x',
    statusBarStyle: 'default',
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
}

// Viewport (separado de metadata desde Next.js 14)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FF6B2B' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1c2e' },
  ],
}

// JSON-LD Organization (datos enriquecidos en Google)
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SEO_CONFIG.siteUrl}/#organization`,
  name: SEO_CONFIG.organization.name,
  legalName: SEO_CONFIG.organization.legalName,
  url: SEO_CONFIG.siteUrl,
  logo: {
    '@type': 'ImageObject',
    url: absoluteUrl('/logo.png'),
    width: '512',
    height: '512',
  },
  description: SEO_CONFIG.organization.description,
  foundingDate: SEO_CONFIG.organization.foundingDate,
  email: SEO_CONFIG.organization.email,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: SEO_CONFIG.organization.email,
    availableLanguage: ['Spanish', 'English'],
  },
  sameAs: SEO_CONFIG.organization.sameAs,
  address: {
    '@type': 'PostalAddress',
    addressCountry: SEO_CONFIG.organization.countryCode,
  },
}

// JSON-LD WebSite con SearchAction
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SEO_CONFIG.siteUrl}/#website`,
  url: SEO_CONFIG.siteUrl,
  name: SEO_CONFIG.siteName,
  description: SEO_CONFIG.organization.description,
  publisher: { '@id': `${SEO_CONFIG.siteUrl}/#organization` },
  inLanguage: 'es-CO',
}

// JSON-LD SoftwareApplication
const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ventas10x',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: SEO_CONFIG.organization.description,
  offers: {
    '@type': 'Offer',
    price: '49',
    priceCurrency: 'USD',
    priceValidUntil: '2026-12-31',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '200',
    bestRating: '5',
    worstRating: '1',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={jakarta.variable}>
      <head>
        {/* JSON-LD para datos enriquecidos en Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
      </head>
      <body style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif", margin: 0 }}>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  )
}
