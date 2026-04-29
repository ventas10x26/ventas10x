// Ruta destino: src/app/api/testimonios/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: lista los testimonios del usuario autenticado
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('testimonios') as any)
      .select('*')
      .eq('vendedor_id', user.id)
      .order('orden', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ testimonios: data || [] })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST: crea un nuevo testimonio
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()

    if (!body.nombre_cliente?.trim() || !body.texto?.trim()) {
      return NextResponse.json(
        { error: 'nombre_cliente y texto son obligatorios' },
        { status: 400 }
      )
    }

    const rating = Number.isInteger(body.rating) && body.rating >= 1 && body.rating <= 5
      ? body.rating
      : 5

    // Calcular siguiente orden
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existentes } = await (supabase.from('testimonios') as any)
      .select('orden')
      .eq('vendedor_id', user.id)
      .order('orden', { ascending: false })
      .limit(1)

    const siguienteOrden =
      existentes && existentes.length > 0 ? (existentes[0].orden ?? 0) + 1 : 0

    const nuevo = {
      vendedor_id: user.id,
      nombre_cliente: body.nombre_cliente.trim().slice(0, 60),
      texto: body.texto.trim().slice(0, 400),
      rating,
      avatar_url: body.avatar_url?.trim() || null,
      orden: siguienteOrden,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('testimonios') as any)
      .insert(nuevo)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ testimonio: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
