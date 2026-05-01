// Ruta destino: src/app/api/productos/reordenar/route.ts
// FASE 4.B: usa org activa.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 400 })

    const body = await req.json()
    const ids: string[] = body.ids

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids debe ser un array no vacío' }, { status: 400 })
    }

    const updates = ids.map((id, index) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('productos') as any)
        .update({ orden: index })
        .eq('id', id)
        .eq('org_id', active.org.id)
    )

    const results = await Promise.all(updates)
    const errores = results.filter((r) => r.error)

    if (errores.length > 0) {
      return NextResponse.json(
        { error: errores[0].error?.message || 'Error al reordenar' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
