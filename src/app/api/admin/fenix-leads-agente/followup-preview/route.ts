// Ruta destino: src/app/api/admin/fenix-leads-agente/followup-preview/route.ts
// Vista previa de solo lectura: muestra quiénes aplican al follow-up o a
// marcarse como perdido en este momento, sin enviar mensajes ni tocar la
// base. Se usa antes del botón "Probar ahora" para que el admin sepa qué
// va a pasar antes de ejecutarlo de verdad.

import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { previsualizarFollowups } from '@/lib/fenix-followup'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const resultado = await previsualizarFollowups()
  return NextResponse.json({ ok: true, ...resultado })
}
