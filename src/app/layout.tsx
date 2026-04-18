import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ventas10x — Tu proceso de ventas, automatizado.',
  description: 'Plataforma de automatización de ventas para Latam. Landing page, catálogo IA, WhatsApp automático y pipeline visual.',
  keywords: ['ventas', 'automatización', 'leads', 'CRM', 'Colombia', 'Latam'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
