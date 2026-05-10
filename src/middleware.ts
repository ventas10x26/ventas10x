// Ruta destino: src/middleware.ts
//
// MERGED: combina tu middleware actual (updateSession Supabase)
// + nueva detección de dominio para Pulse Motor.
//
// Comportamiento:
// - pulsemotor.co/*   → reescribe a /pulse/*  (sin updateSession, es público)
// - ventas10x.co/*    → updateSession normal (auth Supabase como antes)
// - Cualquier otro    → updateSession normal

import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // Detectar si es dominio de Pulse Motor
  const isPulseMotor =
    hostname.includes('pulsemotor.co') ||
    hostname.includes('pulsemotor.vercel.app')

  // ─── Ruta Pulse Motor ─────────────────────────────────────
  if (isPulseMotor) {
    // Si ya está en /pulse, dejar pasar
    if (pathname.startsWith('/pulse')) {
      return NextResponse.next()
    }

    // Excluir rutas de API y assets
    if (
      pathname.startsWith('/api/pulse') ||
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

  // ─── Ruta Ventas10x (comportamiento original sin cambios) ───
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
