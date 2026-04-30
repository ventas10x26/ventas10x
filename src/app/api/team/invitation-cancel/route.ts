// Ruta destino: src/app/api/team/invitation-cancel/route.ts
// POST: cancela una invitación pendiente. Solo admin/owner pueden cancelar.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserOrg, tieneRolMinimo } from '@/lib/team-helpers'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const id = body.id?.toString().trim()
    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    }

    const orgInfo = await getUserOrg(supabase, user.id)
    if (!orgInfo) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización' }, { status: 400 })
    }
    if (!tieneRolMinimo(orgInfo.rol, 'admin')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Marcar como usada (efectivamente cancelada)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('org_invitations') as any)
      .update({ used_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgInfo.org.id)

    if (error) {
      console.error('[team/invitation-cancel]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[team/invitation-cancel]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
