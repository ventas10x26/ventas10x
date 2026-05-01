// Ruta destino: src/app/api/productos/[id]/imagen/route.ts
// FASE 4.B: usa org activa.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

const BUCKET = 'producto-imagenes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getProducto(supabase: any, id: string, orgId: string) {
  const { data, error } = await supabase
    .from('productos')
    .select('id, vendedor_id, org_id, imagen_principal, imagenes_adicionales')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()
  if (error || !data) return null
  return data
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 400 })

    const producto = await getProducto(supabase, id, active.org.id)
    if (!producto) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

    const contentType = req.headers.get('content-type') || ''
    let urlFinal: string
    let rol: 'principal' | 'adicional'

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      const rolRaw = formData.get('rol') as string | null

      if (!file) return NextResponse.json({ error: 'Falta archivo' }, { status: 400 })
      if (rolRaw !== 'principal' && rolRaw !== 'adicional') {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
      }
      rol = rolRaw

      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      // Path usa el owner_id de la org para mantener consistencia
      const path = `${active.org.owner_id}/${id}/${Date.now()}.${ext}`

      const { error: upError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        })

      if (upError) {
        return NextResponse.json({ error: upError.message }, { status: 500 })
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      urlFinal = pub.publicUrl
    } else {
      const body = await req.json()
      if (!body.url || typeof body.url !== 'string') {
        return NextResponse.json({ error: 'Falta URL de la imagen' }, { status: 400 })
      }
      if (body.rol !== 'principal' && body.rol !== 'adicional') {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
      }
      urlFinal = body.url
      rol = body.rol
    }

    const cambios: Record<string, unknown> = {}
    if (rol === 'principal') {
      cambios.imagen_principal = urlFinal
    } else {
      const galeria = (producto.imagenes_adicionales as string[] | null) || []
      cambios.imagenes_adicionales = [...galeria, urlFinal]
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updError } = await (supabase.from('productos') as any)
      .update(cambios)
      .eq('id', id)
      .eq('org_id', active.org.id)

    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 })

    return NextResponse.json({ ok: true, url: urlFinal, rol })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 400 })

    const producto = await getProducto(supabase, id, active.org.id)
    if (!producto) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

    const body = await req.json()
    const url: string | undefined = body.url
    const rol: 'principal' | 'adicional' = body.rol

    if (!url || (rol !== 'principal' && rol !== 'adicional')) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const cambios: Record<string, unknown> = {}
    if (rol === 'principal') {
      cambios.imagen_principal = null
    } else {
      const galeria = (producto.imagenes_adicionales as string[] | null) || []
      cambios.imagenes_adicionales = galeria.filter((u) => u !== url)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updError } = await (supabase.from('productos') as any)
      .update(cambios)
      .eq('id', id)
      .eq('org_id', active.org.id)

    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 })

    if (url.includes(`/storage/v1/object/public/${BUCKET}/`)) {
      const path = url.split(`/${BUCKET}/`)[1]
      if (path) {
        await supabase.storage.from(BUCKET).remove([path])
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
