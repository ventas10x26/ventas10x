// Ruta destino: src/app/api/testimonios/[id]/route.ts
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cambios: Record<string, any> = {}

    if (body.nombre_cliente !== undefined) {
      cambios.nombre_cliente = body.nombre_cliente?.toString().trim() || null
    }
    if (body.texto !== undefined) {
      cambios.texto = body.texto?.toString().trim() || null
    }
    if (body.rating !== undefined) {
      const r = parseInt(body.rating) || 5
      cambios.rating = Math.max(1, Math.min(5, r))
    }
    if (body.avatar_url !== undefined) {
      cambios.avatar_url = body.avatar_url?.toString().trim() || null
    }
    if (body.orden !== undefined) {
      cambios.orden = parseInt(body.orden) || 0
    }

    if (Object.keys(cambios).length === 0) {
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('testimonios') as any)
      .update(cambios)
      .eq('id', id)
      .eq('org_id', active.org.id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ testimonio: data })
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
    const { error } = await (supabase.from('testimonios') as any)
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
