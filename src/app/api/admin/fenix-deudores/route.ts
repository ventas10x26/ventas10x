// Ruta destino: src/app/api/admin/fenix-deudores/route.ts
//
// GET: lista los casos ya guardados.
// POST: guarda en bloque los registros que el admin confirmó en el preview
// (vengan de texto analizado por IA o de un Excel/CSV parseado en el
// cliente). Si viene conversacion_id (el caso se creó desde una
// conversación puntual en /admin/fenix/conversaciones), también reclasifica
// esa conversación a tipo='deudor' -- así el webhook empieza a usar la
// personalidad de cobro en ese hilo desde el siguiente mensaje.
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { obtenerClientesDeuda, type RegistroDeuda } from '@/lib/fenix-deudores'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const registros = await obtenerClientesDeuda()
  return NextResponse.json({ registros })
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const registros: RegistroDeuda[] = Array.isArray(body.registros) ? body.registros : []
  const origen: string = typeof body.origen === 'string' ? body.origen : 'manual'
  const conversacionId: string | null = typeof body.conversacion_id === 'string' ? body.conversacion_id : null

  if (registros.length === 0) {
    return NextResponse.json({ error: 'No hay registros para guardar' }, { status: 400 })
  }

  const filas = registros.map((r) => ({
    nombre_deudor: r.nombre_deudor || null,
    telefono: r.telefono ? String(r.telefono).replace(/\D/g, '') || null : null,
    documento_identidad: r.documento_identidad || null,
    empresa_deudora: r.empresa_deudora || null,
    cliente_encarga: r.cliente_encarga || null,
    monto: typeof r.monto === 'number' ? r.monto : null,
    notas: r.notas || null,
    origen,
    conversacion_id: conversacionId,
  }))

  const { data, error } = await supabaseService.from('fenix_clientes_deuda').insert(filas).select('id')
  if (error) {
    console.error('[admin/fenix-deudores] Error al insertar:', error)
    return NextResponse.json({ error: 'No se pudieron guardar los registros' }, { status: 500 })
  }

  if (conversacionId) {
    const { error: convError } = await supabaseService
      .from('fenix_conversaciones')
      .update({ tipo: 'deudor', updated_at: new Date().toISOString() })
      .eq('id', conversacionId)
    if (convError) console.error('[admin/fenix-deudores] Error al reclasificar conversación:', convError)
  }

  return NextResponse.json({ ok: true, insertados: data?.length || 0 })
}
