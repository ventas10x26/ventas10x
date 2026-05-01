// Ruta destino: src/app/api/productos/route.ts
// FASE 4.B: usa org activa.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

// GET: Lista todos los productos de la org activa
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('productos') as any)
      .select('*')
      .eq('org_id', active.org.id)
      .order('orden', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ productos: data || [] })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST: Crea un nuevo producto en la org activa
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 400 })

    const body = await req.json()

    if (!body.nombre || typeof body.nombre !== 'string') {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    // Calcular siguiente orden
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existentes } = await (supabase.from('productos') as any)
      .select('orden')
      .eq('org_id', active.org.id)
      .order('orden', { ascending: false })
      .limit(1)

    const siguienteOrden =
      existentes && existentes.length > 0 ? existentes[0].orden + 1 : 0

    const nuevo = {
      // vendedor_id mantiene al owner para retrocompatibilidad
      vendedor_id: active.org.owner_id,
      org_id: active.org.id,
      nombre: body.nombre.trim(),
      precio: body.precio?.trim() || null,
      descripcion: body.descripcion?.trim() || null,
      orden: siguienteOrden,
      imagen_principal: body.imagen_principal || null,
      imagenes_adicionales: body.imagenes_adicionales || [],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('productos') as any)
      .insert(nuevo)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ producto: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
