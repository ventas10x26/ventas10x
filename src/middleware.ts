// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url      = request.nextUrl.clone()
  const pathname = url.pathname

  const isPulseMotor =
    hostname.includes('pulsemotor.co') ||
    hostname.includes('pulsemotor.vercel.app') ||
    hostname.includes('pulsemotor.localhost')

  // ─── Pulse Motor ──────────────────────────────────────────
  if (isPulseMotor) {

    // sitemap.xml → reescribir al sitemap de /pulse
    if (pathname === '/sitemap.xml') {
      url.pathname = '/pulse/sitemap.xml'
      return NextResponse.rewrite(url)
    }

    // robots.txt → reescribir al robots de /pulse
    if (pathname === '/robots.txt') {
      url.pathname = '/pulse/robots.txt'
      return NextResponse.rewrite(url)
    }

    // Si ya está en /pulse, dejar pasar
    if (pathname.startsWith('/pulse')) {
      return NextResponse.next()
    }

    // Excluir rutas de API y assets
    if (
      pathname.startsWith('/api/pulse') ||
      pathname.startsWith('/api/bot') ||
      pathname.startsWith('/api/bot-lead') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')
    ) {
      return NextResponse.next()
    }

    // Reescribir cualquier ruta de pulsemotor.co a /pulse/*
    url.pathname = `/pulse${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  // ─── Rutas API de Pulse que deben pasar sin auth ──────────
  if (
    pathname.startsWith('/api/pulse') ||
    pathname.startsWith('/api/bot') ||
    pathname.startsWith('/api/bot-lead') ||
    pathname.startsWith('/api/cron')
  ) {
    return NextResponse.next()
  }

  // ─── Ventas10x (comportamiento original) ──────────────────
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
