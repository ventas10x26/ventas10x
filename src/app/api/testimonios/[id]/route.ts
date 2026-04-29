// Ruta destino: src/app/api/testimonios/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cambios: Record<string, any> = {}

    if (body.nombre_cliente !== undefined) {
      cambios.nombre_cliente = body.nombre_cliente?.trim().slice(0, 60) || null
    }
    if (body.texto !== undefined) {
      cambios.texto = body.texto?.trim().slice(0, 400) || null
    }
    if (body.rating !== undefined) {
      const r = Number(body.rating)
      if (Number.isInteger(r) && r >= 1 && r <= 5) cambios.rating = r
    }
    if (body.avatar_url !== undefined) {
      cambios.avatar_url = body.avatar_url?.trim() || null
    }
    if (body.orden !== undefined) {
      const o = Number(body.orden)
      if (Number.isInteger(o) && o >= 0) cambios.orden = o
    }

    if (Object.keys(cambios).length === 0) {
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('testimonios') as any)
      .update(cambios)
      .eq('id', id)
      .eq('vendedor_id', user.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Testimonio no encontrado' }, { status: 404 })

    return NextResponse.json({ testimonio: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('testimonios') as any)
      .delete()
      .eq('id', id)
      .eq('vendedor_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
