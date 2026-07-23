// src/app/api/pulse/databridge/proyectos/route.ts
//
// POST: persiste un proyecto de DataBridge (tablas + relaciones) para el usuario logueado —
// hasta acá todo el flujo vivía solo en memoria del navegador y se perdía al refrescar.
// GET:  lista los proyectos guardados del usuario (para "Tus paneles desplegados").

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILAS_POR_TABLA = 1000

interface SheetInput { name: string; rows: Record<string, unknown>[] }
interface FieldMatchInput { fieldA: string; fieldB: string; label: string; score: number }
interface TableRelationInput { a: string; b: string; matches: FieldMatchInput[] }

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { nombre, sheets, relations } = await req.json() as {
      nombre?: string
      sheets: SheetInput[]
      relations: TableRelationInput[]
    }

    if (!Array.isArray(sheets) || sheets.length === 0) {
      return NextResponse.json({ error: 'Se necesita al menos una hoja con datos' }, { status: 400 })
    }

    const tablas = sheets.map(s => ({ name: s.name, rows: s.rows.slice(0, MAX_FILAS_POR_TABLA) }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('pulse_databridge_proyectos') as any)
      .insert({
        user_id: user.id,
        nombre: nombre?.trim() || 'Proyecto sin título',
        tablas,
        relaciones: relations || [],
      })
      .select('id')
      .single()

    if (error) {
      console.error('[pulse/databridge/proyectos POST] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data.id })
  } catch (e) {
    console.error('[pulse/databridge/proyectos POST]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('pulse_databridge_proyectos') as any)
      .select('id, nombre, tablas, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[pulse/databridge/proyectos GET] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proyectos = (data || []).map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      created_at: p.created_at,
      tablas: Array.isArray(p.tablas) ? p.tablas.length : 0,
    }))

    return NextResponse.json({ ok: true, proyectos })
  } catch (e) {
    console.error('[pulse/databridge/proyectos GET]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
