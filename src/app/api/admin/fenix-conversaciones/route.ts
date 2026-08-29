// Ruta destino: src/app/api/admin/fenix-conversaciones/route.ts
import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { obtenerConversacionesFenix } from '@/lib/fenix-conversaciones-list'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const conversaciones = await obtenerConversacionesFenix()
  return NextResponse.json({ conversaciones })
}
