// Ruta destino: src/app/api/productos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH: Actualiza un producto
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

    // Campos permitidos
    const updates: Record<string, unknown> = {}
    if (body.nombre !== undefined) updates.nombre = body.nombre.trim()
    if (body.precio !== undefined) updates.precio = body.precio?.trim() || null
    if (body.descripcion !== undefined) updates.descripcion = body.descripcion?.trim() || null
    if (body.imagen_principal !== undefined) updates.imagen_principal = body.imagen_principal
    if (body.imagenes_adicionales !== undefined) {
      if (!Array.isArray(body.imagenes_adicionales)) {
        return NextResponse.json(
          { error: 'imagenes_adicionales debe ser un array' },
          { status: 400 }
        )
      }
      if (body.imagenes_adicionales.length > 5) {
        return NextResponse.json(
          { error: 'Máximo 5 imágenes adicionales' },
          { status: 400 }
        )
      }
      updates.imagenes_adicionales = body.imagenes_adicionales
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('productos') as any)
      .update(updates)
      .eq('id', id)
      .eq('vendedor_id', user.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ producto: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE: Elimina un producto
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
    const { error } = await (supabase.from('productos') as any)
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
