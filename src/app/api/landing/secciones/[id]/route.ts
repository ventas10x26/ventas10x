// Ruta destino: src/app/api/landing/secciones/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH: Actualiza una sección (título, contenido, activa, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()

    // Campos permitidos para actualizar
    const updates: Record<string, unknown> = {}
    if (body.titulo !== undefined) updates.titulo = body.titulo
    if (body.subtitulo !== undefined) updates.subtitulo = body.subtitulo
    if (body.activa !== undefined) updates.activa = body.activa
    if (body.contenido !== undefined) updates.contenido = body.contenido

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nada que actualizar' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('landing_secciones') as any)
      .update(updates)
      .eq('id', id)
      .eq('vendedor_id', user.id) // asegurar que es del vendedor
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Sección no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ seccion: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE: Elimina una sección
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('landing_secciones') as any)
      .delete()
      .eq('id', id)
      .eq('vendedor_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
