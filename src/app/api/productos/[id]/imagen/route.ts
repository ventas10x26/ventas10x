import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Lista todos los productos del usuario autenticado
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('user_id', user.id)
      .order('orden', { ascending: true })

    if (error) {
      console.error('❌ ERROR GET PRODUCTOS:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ productos: data || [] })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('💥 ERROR SERVER GET PRODUCTOS:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST: Crea un nuevo producto
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

    if (!body.nombre || typeof body.nombre !== 'string') {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    // Obtener el último orden del usuario
    const { data: existentes, error: ordenError } = await supabase
      .from('productos')
      .select('orden')
      .eq('user_id', user.id)
      .order('orden', { ascending: false })
      .limit(1)

    if (ordenError) {
      console.error('❌ ERROR ORDEN:', ordenError)
      return NextResponse.json(
        { error: ordenError.message },
        { status: 500 }
      )
    }

    const siguienteOrden =
    existentes && existentes.length > 0 ? (existentes[0] as { orden: number }).orden + 1 : 0

    const nuevo = {
      user_id: user.id, // 🔥 CLAVE: relación correcta con el usuario
      nombre: body.nombre.trim(),
      precio: body.precio?.trim() || null,
      descripcion: body.descripcion?.trim() || null,
      orden: siguienteOrden,
      imagen_principal: body.imagen_principal || null,
      imagenes_adicionales: body.imagenes_adicionales || [],
    }

    const { data, error } = await (supabase as any)
    .from('productos')
    .insert(nuevo)
    .select('*')
    .single()

    if (error) {
      console.error('❌ ERROR INSERT PRODUCTO:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ producto: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('💥 ERROR SERVER POST PRODUCTO:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}