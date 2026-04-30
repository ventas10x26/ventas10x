// Ruta destino: src/app/api/team/accept-invite/route.ts
// POST: el usuario autenticado acepta una invitación con un token.

import { NextRequest, NextResponse } from 'next/server'
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
      return NextResponse.json(
        { error: 'Debes iniciar sesión para aceptar la invitación' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const token = body.token?.toString().trim()

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    // Buscar invitación
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitation } = await (supabaseAdmin.from('org_invitations') as any)
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }

    if (invitation.used_at) {
      return NextResponse.json(
        { error: 'Esta invitación ya fue utilizada' },
        { status: 410 }
      )
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Esta invitación ha expirado' },
        { status: 410 }
      )
    }

    // Verificar que el email coincida con el del usuario autenticado
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: `Esta invitación es para ${invitation.email}. Inicia sesión con esa cuenta para aceptarla.`,
        },
        { status: 403 }
      )
    }

    // Verificar si ya es miembro de la org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: yaMember } = await (supabaseAdmin.from('org_members') as any)
      .select('id')
      .eq('org_id', invitation.org_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (yaMember) {
      // Marcar invitación como usada de todos modos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from('org_invitations') as any)
        .update({ used_at: new Date().toISOString() })
        .eq('id', invitation.id)

      return NextResponse.json({
        ok: true,
        ya_miembro: true,
        org_id: invitation.org_id,
      })
    }

    // Agregar al usuario como miembro
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: errInsert } = await (supabaseAdmin.from('org_members') as any)
      .insert({
        org_id: invitation.org_id,
        user_id: user.id,
        rol: invitation.rol,
        invited_by: invitation.invited_by,
      })

    if (errInsert) {
      console.error('[team/accept-invite]', errInsert)
      return NextResponse.json({ error: errInsert.message }, { status: 500 })
    }

    // Marcar invitación como usada
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('org_invitations') as any)
      .update({ used_at: new Date().toISOString() })
      .eq('id', invitation.id)

    return NextResponse.json({
      ok: true,
      org_id: invitation.org_id,
      rol: invitation.rol,
    })
  } catch (error) {
    console.error('[team/accept-invite]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
