// Ruta destino: src/app/api/landing/secciones/[id]/route.ts
// FASE 4.B: usa org activa.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

export async function PATCH(
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

    const body = await req.json()
    const updates: Record<string, unknown> = {}

    if (body.titulo !== undefined) updates.titulo = body.titulo
    if (body.subtitulo !== undefined) updates.subtitulo = body.subtitulo
    if (body.activa !== undefined) updates.activa = body.activa
    if (body.contenido !== undefined) updates.contenido = body.contenido

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('landing_secciones') as any)
      .update(updates)
      .eq('id', id)
      .eq('org_id', active.org.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Sección no encontrada' }, { status: 404 })

    return NextResponse.json({ seccion: data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('landing_secciones') as any)
      .delete()
      .eq('id', id)
      .eq('org_id', active.org.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
