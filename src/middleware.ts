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

  const isFenix =
    hostname.includes('app.consultoresfenix.com') ||
    hostname.includes('fenix.localhost')

  // ─── Pulse Motor ──────────────────────────────────────────
  if (isPulseMotor) {
    if (pathname === '/sitemap.xml') {
      url.pathname = '/pulse/sitemap.xml'
      return NextResponse.rewrite(url)
    }
    if (pathname === '/robots.txt') {
      url.pathname = '/pulse/robots.txt'
      return NextResponse.rewrite(url)
    }
    if (pathname.startsWith('/pulse')) {
      return NextResponse.next()
    }
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
    url.pathname = `/pulse${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  // ─── Fénix Consultores ────────────────────────────────────
  if (isFenix) {
    if (pathname.startsWith('/fenix-consultores')) {
      return NextResponse.next()
    }
    // /admin y /auth son transversales: no son parte de la landing de
    // Fenix, pero deben abrirse igual desde este dominio para que el
    // equipo pueda iniciar sesión y llegar al panel de leads sin pasar
    // por ventas10x.co. Van por updateSession (no solo next()) porque
    // necesitan leer y refrescar la cookie de sesión de Supabase, que
    // aquí queda scoped a app.consultoresfenix.com -- una sesión iniciada
    // en ventas10x.co no la comparte, son dominios raíz distintos.
    if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) {
      return await updateSession(request)
    }
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/og/') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')
    ) {
      return NextResponse.next()
    }
    url.pathname = `/fenix-consultores${pathname === '/' ? '' : pathname}`
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
