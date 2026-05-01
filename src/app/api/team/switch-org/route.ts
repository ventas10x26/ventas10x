// Ruta destino: src/app/api/team/switch-org/route.ts
// POST: cambia la org activa del usuario (vía cookie).

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

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
    const orgId = body.org_id?.toString().trim()
    if (!orgId) {
      return NextResponse.json({ error: 'org_id requerido' }, { status: 400 })
    }

    // Verificar que el usuario sea miembro de esa org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: member } = await (supabaseAdmin.from('org_members') as any)
      .select('id, rol')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) {
      return NextResponse.json(
        { error: 'No eres miembro de esa organización' },
        { status: 403 }
      )
    }

    // Setear cookie
    const cookieStore = await cookies()
    cookieStore.set('org_activa_id', orgId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 año
    })

    return NextResponse.json({ ok: true, org_id: orgId, rol: member.rol })
  } catch (error) {
    console.error('[switch-org]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
