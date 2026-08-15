// Ruta destino: src/app/api/admin/fenix-leads/costos/route.ts
// GET/PUT del costo mensual estimado de las automatizaciones de Fenix
// (Railway, APIs de IA, WhatsApp/otros). No hay integración con la
// facturación real de estos servicios -- es un valor que Ricardo actualiza
// manualmente cuando revisa las facturas. Fila única (id=true).

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabaseService
    .from('fenix_costos')
    .select('*')
    .eq('id', true)
    .single()

  if (error) {
    console.error('[admin/fenix-leads/costos] Error al leer:', error)
    return NextResponse.json({ error: 'No se pudo leer el costo' }, { status: 500 })
  }

  return NextResponse.json({ costos: data })
}

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const update: Record<string, number | string | null> = {}

  if (body.costo_railway_usd !== undefined) update.costo_railway_usd = Number(body.costo_railway_usd) || 0
  if (body.costo_ia_usd !== undefined) update.costo_ia_usd = Number(body.costo_ia_usd) || 0
  if (body.costo_otros_usd !== undefined) update.costo_otros_usd = Number(body.costo_otros_usd) || 0
  if (body.notas !== undefined) update.notas = String(body.notas).trim() || null
  update.actualizado_at = new Date().toISOString()

  const { data, error } = await supabaseService
    .from('fenix_costos')
    .update(update)
    .eq('id', true)
    .select('*')
    .single()

  if (error) {
    console.error('[admin/fenix-leads/costos] Error al actualizar:', error)
    return NextResponse.json({ error: 'No se pudo guardar el costo' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, costos: data })
}
