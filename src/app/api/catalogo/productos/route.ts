import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ProductoInput = {
  nombre: string
  precio: string | null
  descripcion: string
}

// POST /api/catalogo/productos → crear uno o varios productos
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { productos } = body as { productos: ProductoInput[] }

    if (!Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de productos' },
        { status: 400 }
      )
    }

    const productosValidos = productos.filter(
      (p) => p.nombre && typeof p.nombre === 'string' && p.nombre.trim().length > 0
    )

    if (productosValidos.length === 0) {
      return NextResponse.json(
        { error: 'Ningún producto tiene nombre válido' },
        { status: 400 }
      )
    }

    const { data: maxOrdenRow } = await supabase
      .from('productos')
      .select('orden')
      .eq('vendedor_id', user.id)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()

    const ordenInicial = (maxOrdenRow?.orden ?? -1) + 1

    const filas = productosValidos.map((p, i) => ({
      vendedor_id: user.id,
      nombre: p.nombre.trim(),
      precio: p.precio?.trim() || null,
      descripcion: p.descripcion?.trim() || '',
      orden: ordenInicial + i,
    }))

    const { data, error } = await supabase
      .from('productos')
      .insert(filas)
      .select('*')

    if (error) {
      console.error('[api/catalogo/productos POST] Error Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ productos: data })
  } catch (error) {
    console.error('[api/catalogo/productos POST] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/catalogo/productos?id=xxx → eliminar un producto
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)
      .eq('vendedor_id', user.id)

    if (error) {
      console.error('[api/catalogo/productos DELETE] Error Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[api/catalogo/productos DELETE] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}