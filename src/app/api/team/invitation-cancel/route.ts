// Ruta destino: src/app/api/team/invitation-cancel/route.ts
// FIX: con service_role para bypass RLS.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getUserOrg, tieneRolMinimo } from '@/lib/team-helpers'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

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

    const orgInfo = await getUserOrg(null, user.id)
    if (!orgInfo) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización' }, { status: 400 })
    }
    if (!tieneRolMinimo(orgInfo.rol, 'admin')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.from('org_invitations') as any)
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
