// Ruta destino: src/lib/seo-config.ts
// Configuración SEO central reutilizable.
// Cambia aquí los valores y se reflejan en toda la app.

export const SEO_CONFIG = {
  siteName: 'Ventas10x',
  siteUrl: 'https://ventas10x.co',
  defaultLocale: 'es_CO',
  defaultLanguage: 'es',
  twitterHandle: '@ventas10x', // ← cambia si tu cuenta es diferente
  themeColor: '#FF6B2B',
  backgroundColor: '#0f1c2e',

  // Imagen Open Graph por defecto (1200x630px)
  // ⚠️ Crea esta imagen y súbela a public/og-image.png
  defaultOgImage: '/og-image.png',

  // Verificación de Google Search Console
  // Si ya verificaste con DNS o archivo HTML, deja vacío.
  // Si quieres agregar verificación adicional vía meta tag, pega el código aquí.
  googleVerification: '', // ej: 'abc123xyz...'

  organization: {
    name: 'Ventas10x',
    legalName: 'Ventas10x',
    description: 'Plataforma de automatización de ventas con IA para asesores y equipos comerciales en Latinoamérica.',
    foundingDate: '2025',
    email: 'hola@ventas10x.co', // ← cambia por tu email real
    countryCode: 'CO',
    sameAs: [
      // Redes sociales (descomenta y agrega las que tengas)
      // 'https://twitter.com/ventas10x',
      // 'https://instagram.com/ventas10x',
      // 'https://linkedin.com/company/ventas10x',
      // 'https://facebook.com/ventas10x',
    ],
  },

  // Keywords principales (no son tan importantes hoy pero ayudan)
  keywords: [
    'ventas automatizadas',
    'CRM para vendedores',
    'chatbot WhatsApp ventas',
    'landing page vendedor',
    'pipeline de ventas',
    'catálogo digital',
    'automatización ventas Latam',
    'IA para vendedores',
    'bot WhatsApp inmobiliaria',
    'bot WhatsApp automotriz',
    'CRM Colombia',
    'herramientas para asesores comerciales',
  ],
}

/** Construye URL absoluta para canonical o OG */
export function absoluteUrl(path: string = ''): string {
  const base = SEO_CONFIG.siteUrl.replace(/\/$/, '')
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${base}${clean === '/' ? '' : clean}`
}
