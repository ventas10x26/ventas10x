// Ruta destino: src/app/api/banco-imagenes/[id]/route.ts
// PATCH: cambiar visibilidad (pública/privada)
// DELETE: eliminar imagen del banco

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const BUCKET = 'banco-imagenes'

export async function PATCH(
  req: Request,
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
    const updates: Record<string, unknown> = {}

    if (typeof body.publica === 'boolean') {
      updates.publica = body.publica
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    // Verificar que la imagen está aprobada antes de hacerla pública
    if (updates.publica === true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: imagen } = await (supabase.from('banco_imagenes') as any)
        .select('aprobada, motivo_rechazo')
        .eq('id', id)
        .eq('vendedor_id', user.id)
        .single()

      if (!imagen) {
        return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 })
      }

      if (!imagen.aprobada) {
        return NextResponse.json(
          {
            error: 'Esta imagen no fue aprobada por la moderación IA',
            motivo: imagen.motivo_rechazo,
          },
          { status: 403 }
        )
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('banco_imagenes') as any)
      .update(updates)
      .eq('id', id)
      .eq('vendedor_id', user.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, imagen: data })
  } catch (error) {
    console.error('[banco-imagenes PATCH] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
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

    // Buscar la imagen para obtener el storage_path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: imagen } = await (supabase.from('banco_imagenes') as any)
      .select('storage_path')
      .eq('id', id)
      .eq('vendedor_id', user.id)
      .single()

    if (!imagen) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 })
    }

    // Eliminar de Storage
    if (imagen.storage_path) {
      await supabaseAdmin.storage.from(BUCKET).remove([imagen.storage_path])
    }

    // Eliminar de la BD
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('banco_imagenes') as any)
      .delete()
      .eq('id', id)
      .eq('vendedor_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[banco-imagenes DELETE] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
