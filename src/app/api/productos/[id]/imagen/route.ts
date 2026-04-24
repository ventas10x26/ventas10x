// Ruta destino: src/app/api/productos/[id]/imagen/route.ts
// Sube una imagen (archivo o URL externa Unsplash) al bucket producto-imagenes
// y la asigna como principal o adicional al producto.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const BUCKET = 'producto-imagenes'

type Rol = 'principal' | 'adicional'

// POST: subir nueva imagen al producto
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productoId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el producto existe y es del vendedor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: producto } = await (supabase.from('productos') as any)
      .select('id, imagen_principal, imagenes_adicionales')
      .eq('id', productoId)
      .eq('vendedor_id', user.id)
      .single()

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const contentType = req.headers.get('content-type') || ''

    let rol: Rol
    let fileBuffer: ArrayBuffer
    let filename: string
    let mimeType: string

    // Caso 1: multipart/form-data (archivo)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      rol = (formData.get('rol') as Rol) || 'principal'

      if (!file) {
        return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
      }

      fileBuffer = await file.arrayBuffer()
      filename = file.name
      mimeType = file.type || 'image/jpeg'
    }
    // Caso 2: JSON con URL externa
    else {
      const body = await req.json()
      rol = body.rol || 'principal'
      const url = body.url as string

      if (!url) {
        return NextResponse.json({ error: 'Falta la URL' }, { status: 400 })
      }

      const r = await fetch(url)
      if (!r.ok) {
        return NextResponse.json(
          { error: `No se pudo descargar la imagen (${r.status})` },
          { status: 500 }
        )
      }

      fileBuffer = await r.arrayBuffer()
      mimeType = r.headers.get('content-type') || 'image/jpeg'
      const ext = mimeType.split('/')[1] || 'jpg'
      filename = `external-${Date.now()}.${ext}`
    }

    // Validaciones
    if (!['principal', 'adicional'].includes(rol)) {
      return NextResponse.json(
        { error: 'rol debe ser "principal" o "adicional"' },
        { status: 400 }
      )
    }
    if (!mimeType.startsWith('image/')) {
      return NextResponse.json({ error: 'No es una imagen' }, { status: 400 })
    }
    if (fileBuffer.byteLength > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagen mayor a 5MB' }, { status: 400 })
    }

    // Si es adicional, validar que no supere 5
    if (rol === 'adicional') {
      const actuales = producto.imagenes_adicionales || []
      if (actuales.length >= 5) {
        return NextResponse.json(
          { error: 'Máximo 5 imágenes adicionales por producto' },
          { status: 400 }
        )
      }
    }

    // Ruta en el bucket: vendedor_id/producto_id/rol-timestamp.ext
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const path = `${user.id}/${productoId}/${rol}-${timestamp}.${ext}`

    // Subir
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('[producto-imagen] Storage error:', uploadError)
      return NextResponse.json(
        { error: `Error al subir: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path)

    const publicUrl = publicData.publicUrl

    // Actualizar producto
    const updates: Record<string, unknown> = {}
    if (rol === 'principal') {
      updates.imagen_principal = publicUrl
    } else {
      updates.imagenes_adicionales = [...(producto.imagenes_adicionales || []), publicUrl]
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: actualizado, error: updateError } = await (supabase.from('productos') as any)
      .update(updates)
      .eq('id', productoId)
      .eq('vendedor_id', user.id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: `Error al actualizar DB: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      producto: actualizado,
    })
  } catch (error) {
    console.error('[producto-imagen] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE: eliminar una imagen del producto
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productoId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const urlEliminar = body.url as string
    const rol = body.rol as Rol

    if (!urlEliminar || !rol) {
      return NextResponse.json(
        { error: 'Faltan parámetros url y rol' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: producto } = await (supabase.from('productos') as any)
      .select('imagen_principal, imagenes_adicionales')
      .eq('id', productoId)
      .eq('vendedor_id', user.id)
      .single()

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}
    if (rol === 'principal') {
      updates.imagen_principal = null
    } else {
      updates.imagenes_adicionales = (producto.imagenes_adicionales || []).filter(
        (u: string) => u !== urlEliminar
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('productos') as any)
      .update(updates)
      .eq('id', productoId)
      .eq('vendedor_id', user.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Intentar eliminar el archivo del Storage (best effort)
    try {
      const pathMatch = urlEliminar.match(/producto-imagenes\/(.+)$/)
      if (pathMatch) {
        await supabaseAdmin.storage.from(BUCKET).remove([pathMatch[1]])
      }
    } catch {
      // Silencioso: si falla, al menos la DB ya no lo referencia
    }

    return NextResponse.json({ ok: true, producto: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
