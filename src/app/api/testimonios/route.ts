// Ruta destino: src/app/api/testimonios/route.ts
// FASE 4.B: usa org activa. El admin invitado puede gestionar testimonios.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

// GET: lista los testimonios de la org activa
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('testimonios') as any)
      .select('*')
      .eq('org_id', active.org.id)
      .order('orden', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ testimonios: data || [] })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST: crea un nuevo testimonio en la org activa
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 400 })

    const body = await req.json()
    const nombre_cliente = body.nombre_cliente?.toString().trim()
    const texto = body.texto?.toString().trim()
    const rating = parseInt(body.rating) || 5
    const avatar_url = body.avatar_url?.toString().trim() || null

    if (!nombre_cliente || !texto) {
      return NextResponse.json(
        { error: 'Nombre y texto son requeridos' },
        { status: 400 }
      )
    }

    // Calcular siguiente orden
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existentes } = await (supabase.from('testimonios') as any)
      .select('orden')
      .eq('org_id', active.org.id)
      .order('orden', { ascending: false })
      .limit(1)

    const siguienteOrden =
      existentes && existentes.length > 0 ? (existentes[0].orden || 0) + 1 : 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('testimonios') as any)
      .insert({
        // vendedor_id mantiene al owner (es el "dueño" del registro)
        vendedor_id: active.org.owner_id,
        org_id: active.org.id,
        nombre_cliente,
        texto,
        rating: Math.max(1, Math.min(5, rating)),
        avatar_url,
        orden: siguienteOrden,
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ testimonio: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
