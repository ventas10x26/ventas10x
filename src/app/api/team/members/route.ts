// Ruta destino: src/app/api/team/members/route.ts
// FIX: usa service_role internamente vía helpers.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserOrg, listarMiembrosOrg, listarInvitacionesOrg } from '@/lib/team-helpers'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Pasamos null porque ya no se usa, pero dejamos compat
    const orgInfo = await getUserOrg(null, user.id)
    if (!orgInfo) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización' },
        { status: 400 }
      )
    }

    const miembros = await listarMiembrosOrg(null, orgInfo.org.id)
    const invitaciones = await listarInvitacionesOrg(orgInfo.org.id)

    return NextResponse.json({
      ok: true,
      org: orgInfo.org,
      miRol: orgInfo.rol,
      miembros,
      invitaciones,
    })
  } catch (error) {
    console.error('[team/members]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
