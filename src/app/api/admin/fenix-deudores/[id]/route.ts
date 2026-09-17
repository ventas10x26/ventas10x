// Ruta destino: src/app/api/admin/fenix-deudores/[id]/route.ts
// PATCH: cambia estado_aprobacion, estado_gestion o notas de un deudor.
// No toca agente_activo -- eso solo lo cambia .../iniciar-agente porque
// implica mandar un mensaje real, no un simple update de estado.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CAMPOS_EDITABLES = ['estado_aprobacion', 'estado_gestion', 'notas'] as const

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {}
  for (const campo of CAMPOS_EDITABLES) {
    if (body[campo] !== undefined) update[campo] = body[campo]
  }
  if (update.estado_aprobacion && !['pendiente', 'aprobado', 'rechazado'].includes(update.estado_aprobacion)) {
    return NextResponse.json({ error: 'estado_aprobacion inválido' }, { status: 400 })
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }
  update.updated_at = new Date().toISOString()

  const { data, error } = await supabaseService
    .from('fenix_deudores')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[admin/fenix-deudores/:id PATCH] error:', error)
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, deudor: data })
}
