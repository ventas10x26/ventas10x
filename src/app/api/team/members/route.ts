// Ruta destino: src/app/api/team/members/route.ts
// GET: lista miembros de la org del usuario autenticado + invitaciones pendientes.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserOrg, listarMiembrosOrg } from '@/lib/team-helpers'

export async function GET() {
  try {
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

    // Miembros activos
    const miembros = await listarMiembrosOrg(supabase, orgInfo.org.id)

    // Invitaciones pendientes (no usadas, no expiradas)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitaciones } = await (supabase.from('org_invitations') as any)
      .select('id, email, rol, expires_at, created_at, invited_by')
      .eq('org_id', orgInfo.org.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    return NextResponse.json({
      ok: true,
      org: orgInfo.org,
      miRol: orgInfo.rol,
      miembros,
      invitaciones: invitaciones || [],
    })
  } catch (error) {
    console.error('[team/members]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
