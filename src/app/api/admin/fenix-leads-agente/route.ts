// Ruta destino: src/app/api/admin/fenix-leads-agente/route.ts
// Lee y actualiza la configuración (única fila) del agente informativo que
// le escribe a los leads comerciales por WhatsApp (distinto del agente de
// cobro de src/app/api/admin/fenix-agente/route.ts). Mismo gate de admin,
// mismo patrón de fila única sin org_id.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CAMPOS_TEXTO = [
  'activo', 'mensaje_bienvenida', 'nombre_archivo_entregable', 'pregunta_cierre', 'mensaje_followup', 'system_prompt',
] as const
const CAMPOS_NUMERICOS = ['horas_followup', 'horas_perdido'] as const

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabaseService
    .from('fenix_leads_agente')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[admin/fenix-leads-agente] Error al cargar:', error)
    return NextResponse.json({ error: 'No se pudo cargar el agente de leads' }, { status: 500 })
  }

  return NextResponse.json({ agente: data })
}

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {}
  for (const campo of CAMPOS_TEXTO) {
    if (body[campo] !== undefined) update[campo] = body[campo]
  }
  for (const campo of CAMPOS_NUMERICOS) {
    if (body[campo] !== undefined) {
      const n = Number(body[campo])
      if (!Number.isFinite(n) || n < 1) {
        return NextResponse.json({ error: `${campo} debe ser un número mayor a 0` }, { status: 400 })
      }
      update[campo] = Math.round(n)
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }
  update.updated_at = new Date().toISOString()

  // Fila única: se toma el id existente en vez de asumir uno fijo, por si
  // la tabla se re-sembró en algún momento con un id distinto al original.
  const { data: fila } = await supabaseService
    .from('fenix_leads_agente')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!fila) {
    return NextResponse.json({ error: 'No existe configuración de agente de leads para actualizar' }, { status: 404 })
  }

  const { data, error } = await supabaseService
    .from('fenix_leads_agente')
    .update(update)
    .eq('id', fila.id)
    .select('*')
    .single()

  if (error) {
    console.error('[admin/fenix-leads-agente] Error al guardar:', error)
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, agente: data })
}
