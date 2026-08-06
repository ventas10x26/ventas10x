// Ruta destino: src/app/api/admin/fenix-leads/[id]/route.ts
// Actualiza la etapa del pipeline o las notas internas de un lead de Fenix.
// Gate por admin (misma tabla `admins` que usa /admin/pagos), no por org_id
// -- Fenix no es un tenant de Ventas10x, no tiene ese concepto.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ETAPAS_VALIDAS = ['nuevo', 'contactado', 'diagnostico', 'propuesta', 'cliente', 'perdido']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {}

  if (body.etapa !== undefined) {
    if (!ETAPAS_VALIDAS.includes(body.etapa)) {
      return NextResponse.json({ error: 'Etapa inválida' }, { status: 400 })
    }
    update.etapa = body.etapa
  }
  if (body.notas !== undefined) {
    update.notas = String(body.notas).trim() || null
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseService.from('fenix_leads') as any)
    .update(update)
    .eq('id', id)

  if (error) {
    console.error('[admin/fenix-leads] Error actualizando:', error)
    return NextResponse.json({ error: 'No se pudo actualizar el lead' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
