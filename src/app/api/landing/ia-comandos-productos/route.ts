// Ruta destino: src/app/api/landing/ia-comandos-productos/route.ts
// Endpoint que ejecuta comandos sobre productos detectados por la IA en el chat.
// Operaciones: crear, actualizar, eliminar, buscar imagen, agregar imagen.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const BUCKET = 'producto-imagenes'

type AccionProducto =
  | { accion: 'crear'; nombre: string; precio?: string; descripcion?: string; buscar_imagen?: string }
  | { accion: 'actualizar'; id?: string; nombre_aproximado?: string; nuevo_nombre?: string; precio?: string; descripcion?: string }
  | { accion: 'eliminar'; id?: string; nombre_aproximado?: string }
  | { accion: 'agregar_imagen'; id?: string; nombre_aproximado?: string; rol: 'principal' | 'adicional'; query_imagen: string }

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = (await req.json()) as AccionProducto

    // ── CREAR ──
    if (body.accion === 'crear') {
      // Calcular siguiente orden
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existentes } = await (supabase.from('productos') as any)
        .select('orden')
        .eq('vendedor_id', user.id)
        .order('orden', { ascending: false })
        .limit(1)

      const siguienteOrden =
        existentes && existentes.length > 0 ? existentes[0].orden + 1 : 0

      const nuevo = {
        vendedor_id: user.id,
        nombre: body.nombre.trim(),
        precio: body.precio?.trim() || null,
        descripcion: body.descripcion?.trim() || null,
        orden: siguienteOrden,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: producto, error } = await (supabase.from('productos') as any)
        .insert(nuevo)
        .select('*')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Si pidió buscar imagen, la buscamos en Unsplash
      let imagenSugerida: { url: string; autor: string } | null = null
      if (body.buscar_imagen) {
        const accessKey = process.env.UNSPLASH_ACCESS_KEY
        if (accessKey) {
          try {
            const res = await fetch(
              `https://api.unsplash.com/search/photos?query=${encodeURIComponent(body.buscar_imagen)}&orientation=landscape&per_page=1&content_filter=high`,
              { headers: { Authorization: `Client-ID ${accessKey}` } }
            )
            if (res.ok) {
              const data = await res.json()
              if (data.results?.[0]) {
                imagenSugerida = {
                  url: data.results[0].urls.regular,
                  autor: data.results[0].user.name,
                }
              }
            }
          } catch {
            // Silencioso
          }
        }
      }

      return NextResponse.json({
        ok: true,
        accion: 'crear',
        producto,
        imagenSugerida,
      })
    }

    // Helper para buscar producto por nombre aproximado
    const buscarProducto = async (id?: string, nombreAprox?: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = (supabase.from('productos') as any)
        .select('*')
        .eq('vendedor_id', user.id)

      if (id) {
        const { data } = await query.eq('id', id).single()
        return data
      }
      if (nombreAprox) {
        const { data } = await query.ilike('nombre', `%${nombreAprox}%`).limit(1).single()
        return data
      }
      return null
    }

    // ── ACTUALIZAR ──
    if (body.accion === 'actualizar') {
      const producto = await buscarProducto(body.id, body.nombre_aproximado)
      if (!producto) {
        return NextResponse.json({ error: 'No encontré ese producto' }, { status: 404 })
      }

      const updates: Record<string, unknown> = {}
      if (body.nuevo_nombre) updates.nombre = body.nuevo_nombre.trim()
      if (body.precio) updates.precio = body.precio.trim()
      if (body.descripcion) updates.descripcion = body.descripcion.trim()

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('productos') as any)
        .update(updates)
        .eq('id', producto.id)
        .eq('vendedor_id', user.id)
        .select('*')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, accion: 'actualizar', producto: data })
    }

    // ── ELIMINAR ──
    if (body.accion === 'eliminar') {
      const producto = await buscarProducto(body.id, body.nombre_aproximado)
      if (!producto) {
        return NextResponse.json({ error: 'No encontré ese producto' }, { status: 404 })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('productos') as any)
        .delete()
        .eq('id', producto.id)
        .eq('vendedor_id', user.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        accion: 'eliminar',
        nombre: producto.nombre,
      })
    }

    // ── AGREGAR IMAGEN (busca en Unsplash y la sube) ──
    if (body.accion === 'agregar_imagen') {
      const producto = await buscarProducto(body.id, body.nombre_aproximado)
      if (!producto) {
        return NextResponse.json({ error: 'No encontré ese producto' }, { status: 404 })
      }

      const accessKey = process.env.UNSPLASH_ACCESS_KEY
      if (!accessKey) {
        return NextResponse.json({ error: 'Búsqueda de imágenes no configurada' }, { status: 500 })
      }

      // Buscar varias opciones en Unsplash
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(body.query_imagen)}&orientation=landscape&per_page=6&content_filter=high`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      )
      if (!res.ok) {
        return NextResponse.json({ error: 'Error al buscar imágenes' }, { status: 500 })
      }
      const data = await res.json()
      const imagenes = (data.results || []).slice(0, 6).map((p: {
        id: string
        urls: { regular: string; thumb: string }
        alt_description: string | null
        user: { name: string }
      }) => ({
        id: p.id,
        url: p.urls.regular,
        thumb: p.urls.thumb,
        alt: p.alt_description || body.query_imagen,
        autor: p.user.name,
      }))

      return NextResponse.json({
        ok: true,
        accion: 'agregar_imagen',
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        rol: body.rol,
        imagenes,
      })
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 })
  } catch (error) {
    console.error('[ia-comandos-productos] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
