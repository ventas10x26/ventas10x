// Ruta destino: src/app/api/admin/fenix-agente/route.ts
// Lee y actualiza la configuración (única fila) del agente IA de cobro de
// cartera de Fénix Consultores. Gate por admin (misma tabla `admins` que
// /admin/fenix), sin concepto de org_id -- Fenix no es un tenant de
// Ventas10x. A diferencia de /api/pulse/agente, acá no hay email por
// usuario: es una sola configuración para todo el equipo de Fenix.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CAMPOS_EDITABLES = [
  'nombre', 'estilo_cobro', 'tono', 'saludo_tipo', 'manejo_objeciones',
  'respuestas_tipo', 'escalamiento_juridico', 'primer_mensaje',
  'mensaje_recordatorio', 'mensaje_acuerdo_pago', 'whatsapp',
  'bot_activo', 'system_prompt',
] as const

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabaseService
    .from('fenix_agente')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[admin/fenix-agente] Error al cargar:', error)
    return NextResponse.json({ error: 'No se pudo cargar el agente' }, { status: 500 })
  }

  return NextResponse.json({ agente: data })
}

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {}
  for (const campo of CAMPOS_EDITABLES) {
    if (body[campo] !== undefined) update[campo] = body[campo]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }
  update.updated_at = new Date().toISOString()

  // Fila única: se toma el id existente en vez de asumir uno fijo, por si
  // la tabla se re-sembró en algún momento con un id distinto al original.
  const { data: fila } = await supabaseService
    .from('fenix_agente')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!fila) {
    return NextResponse.json({ error: 'No existe configuración de agente para actualizar' }, { status: 404 })
  }

  const { data, error } = await supabaseService
    .from('fenix_agente')
    .update(update)
    .eq('id', fila.id)
    .select('*')
    .single()

  if (error) {
    console.error('[admin/fenix-agente] Error al guardar:', error)
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, agente: data })
}
