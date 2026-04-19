import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ventas10x — Tu proceso de ventas, automatizado.',
  description: 'Plataforma de automatización de ventas para Latam. Landing page, catálogo IA, WhatsApp automático y pipeline visual.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body style={{ fontFamily: "var(--font-jakarta,'Plus Jakarta Sans',system-ui,sans-serif)" }}>
        {children}
      </body>
    </html>
  )
}
