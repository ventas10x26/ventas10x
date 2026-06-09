import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async rewrites() {
    return [
      // pulsemotor.co/sitemap.xml → el sitemap de /pulse
      {
        source:   '/sitemap.xml',
        destination: '/pulse/sitemap.xml',
        has: [{ type: 'host', value: 'pulsemotor.co' }],
      },
      // pulsemotor.co/robots.txt → robots específico de pulse
      {
        source:   '/robots.txt',
        destination: '/pulse/robots.txt',
        has: [{ type: 'host', value: 'pulsemotor.co' }],
      },
    ]
  },
}

export default nextConfig
