// Ruta destino: src/app/api/leads/[id]/route.ts
// Maneja actualizaciones y eliminaciones de leads (etapa, notas, etc.).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

const ETAPAS_VALIDAS = ['nuevo', 'contactado', 'interesado', 'cerrado']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cambios: Record<string, any> = {}

    if (body.etapa !== undefined) {
      if (!ETAPAS_VALIDAS.includes(body.etapa)) {
        return NextResponse.json(
          { error: `Etapa inválida. Debe ser: ${ETAPAS_VALIDAS.join(', ')}` },
          { status: 400 }
        )
      }
      cambios.etapa = body.etapa
    }

    if (body.notas !== undefined) {
      cambios.notas = body.notas?.toString().trim()?.slice(0, 2000) || null
    }

    if (body.nombre !== undefined) {
      cambios.nombre = body.nombre?.toString().trim()?.slice(0, 120) || null
    }

    if (body.whatsapp !== undefined) {
      cambios.whatsapp = body.whatsapp?.toString().trim()?.slice(0, 30) || null
    }

    if (body.producto !== undefined) {
      cambios.producto = body.producto?.toString().trim()?.slice(0, 200) || null
    }

    if (Object.keys(cambios).length === 0) {
      return NextResponse.json({ error: 'No hay cambios para guardar' }, { status: 400 })
    }

    cambios.updated_at = new Date().toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('leads') as any)
      .update(cambios)
      .eq('id', id)
      .eq('vendedor_id', (await getActiveOrg())?.org?.owner_id)
      .select('*')
      .single()

    if (error) {
      console.error('[api/leads PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error('[api/leads PATCH]', error)
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
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('leads') as any)
      .delete()
      .eq('id', id)
      .eq('vendedor_id', (await getActiveOrg())?.org?.owner_id)

    if (error) {
      console.error('[api/leads DELETE]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[api/leads DELETE]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
