// Ruta destino: src/app/api/admin/fenix-leads/route.ts
// POST -- crea un lead manualmente desde el admin (botón "+ Nuevo lead").
// DELETE -- borra uno o varios leads en lote (selección múltiple en la
// vista de tabla). Mismo gate de admin que /api/admin/fenix-leads/[id].

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ETAPAS_VALIDAS = ['nuevo', 'contactado', 'diagnostico', 'propuesta', 'cliente', 'perdido']

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const empresa = String(body.empresa || '').trim()
  const nombre = String(body.nombre || '').trim()
  const telefono = String(body.telefono || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const mensaje = String(body.mensaje || '').trim()
  const etapa = ETAPAS_VALIDAS.includes(body.etapa) ? body.etapa : 'nuevo'

  if (!empresa || !nombre || !telefono) {
    return NextResponse.json({ error: 'Empresa, nombre y teléfono son obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabaseService
    .from('fenix_leads')
    .insert({
      empresa, nombre, telefono,
      email: email || null,
      mensaje: mensaje || null,
      etapa,
      fuente: 'manual_admin',
    })
    .select('*')
    .single()

  if (error) {
    console.error('[admin/fenix-leads] Error al crear:', error)
    return NextResponse.json({ error: 'No se pudo crear el lead' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, lead: data })
}

export async function DELETE(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Se necesita un arreglo "ids" con al menos un elemento' }, { status: 400 })
  }

  const { error } = await supabaseService.from('fenix_leads').delete().in('id', ids)

  if (error) {
    console.error('[admin/fenix-leads] Error al eliminar:', error)
    return NextResponse.json({ error: 'No se pudieron eliminar los leads' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, eliminados: ids.length })
}
