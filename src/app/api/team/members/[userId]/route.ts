// Ruta destino: src/app/api/team/members/[userId]/route.ts
// DELETE: quita un miembro de la org. Solo owner/admin pueden hacerlo.
// El owner NO se puede quitar a sí mismo.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserOrg, tieneRolMinimo } from '@/lib/team-helpers'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const orgInfo = await getUserOrg(supabase, user.id)
    if (!orgInfo) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización' },
        { status: 400 }
      )
    }

    // Verificar permisos del usuario actual
    if (!tieneRolMinimo(orgInfo.rol, 'admin')) {
      return NextResponse.json(
        { error: 'No tienes permisos para quitar miembros' },
        { status: 403 }
      )
    }

    // Buscar el miembro a quitar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: target } = await (supabase.from('org_members') as any)
      .select('id, user_id, rol')
      .eq('org_id', orgInfo.org.id)
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (!target) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
    }

    // No se puede quitar al owner
    if (target.rol === 'owner') {
      return NextResponse.json(
        { error: 'No puedes quitar al owner. Debe transferir ownership primero.' },
        { status: 400 }
      )
    }

    // Si soy admin, no puedo quitar a otro admin (solo el owner puede)
    if (orgInfo.rol === 'admin' && target.rol === 'admin' && target.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Solo el owner puede quitar a otro admin' },
        { status: 403 }
      )
    }

    // Eliminar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('org_members') as any)
      .delete()
      .eq('id', target.id)

    if (error) {
      console.error('[team/members DELETE]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[team/members DELETE]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
