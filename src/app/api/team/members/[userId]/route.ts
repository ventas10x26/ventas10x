// Ruta destino: src/app/api/team/members/[userId]/route.ts
// FIX: con service_role.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getUserOrg, tieneRolMinimo } from '@/lib/team-helpers'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

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

    const orgInfo = await getUserOrg(null, user.id)
    if (!orgInfo) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización' },
        { status: 400 }
      )
    }

    if (!tieneRolMinimo(orgInfo.rol, 'admin')) {
      return NextResponse.json(
        { error: 'No tienes permisos para quitar miembros' },
        { status: 403 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: target } = await (supabaseAdmin.from('org_members') as any)
      .select('id, user_id, rol')
      .eq('org_id', orgInfo.org.id)
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (!target) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
    }

    if (target.rol === 'owner') {
      return NextResponse.json(
        { error: 'No puedes quitar al owner. Debe transferir ownership primero.' },
        { status: 400 }
      )
    }

    if (orgInfo.rol === 'admin' && target.rol === 'admin' && target.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Solo el owner puede quitar a otro admin' },
        { status: 403 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from('org_members') as any)
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
