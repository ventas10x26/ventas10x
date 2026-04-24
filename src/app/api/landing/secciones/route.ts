// Ruta destino: src/app/api/landing/secciones/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  TipoSeccion,
  contenidoInicial,
  SECCIONES_META,
} from '@/types/secciones'

// GET: Lista todas las secciones del vendedor autenticado
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('landing_secciones') as any)
      .select('*')
      .eq('vendedor_id', user.id)
      .order('orden', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ secciones: data || [] })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST: Crea una nueva sección
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
    const tipo = body.tipo as TipoSeccion

    if (!tipo || !(tipo in SECCIONES_META)) {
      return NextResponse.json(
        { error: 'Tipo de sección inválido' },
        { status: 400 }
      )
    }

    // Calcular siguiente orden
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existentes } = await (supabase.from('landing_secciones') as any)
      .select('orden')
      .eq('vendedor_id', user.id)
      .order('orden', { ascending: false })
      .limit(1)

    const siguienteOrden =
      existentes && existentes.length > 0 ? existentes[0].orden + 1 : 0

    // Título por defecto según tipo
    const meta = SECCIONES_META[tipo]
    const titulo = body.titulo || meta.nombre

    const nuevaSeccion = {
      vendedor_id: user.id,
      tipo,
      orden: siguienteOrden,
      activa: true,
      titulo,
      subtitulo: body.subtitulo || null,
      contenido: body.contenido || contenidoInicial(tipo),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('landing_secciones') as any)
      .insert(nuevaSeccion)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ seccion: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
