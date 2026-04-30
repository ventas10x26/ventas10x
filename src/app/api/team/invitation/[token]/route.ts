// Ruta destino: src/app/api/team/invitation/[token]/route.ts
// GET público: devuelve info de la invitación para mostrar en pantalla de aceptación.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token || token.length < 16) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitation } = await (supabaseAdmin.from('org_invitations') as any)
      .select('id, email, rol, expires_at, used_at, org_id, invited_by, created_at')
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

    // Datos de la org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabaseAdmin.from('organizaciones') as any)
      .select('nombre')
      .eq('id', invitation.org_id)
      .maybeSingle()

    // Datos del inviter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inviter } = await (supabaseAdmin.from('profiles') as any)
      .select('nombre, apellido')
      .eq('id', invitation.invited_by)
      .maybeSingle()

    const inviterNombre = inviter
      ? [inviter.nombre, inviter.apellido].filter(Boolean).join(' ').trim() || 'Un compañero'
      : 'Un compañero'

    return NextResponse.json({
      ok: true,
      invitation: {
        email: invitation.email,
        rol: invitation.rol,
        org_nombre: org?.nombre || 'Equipo',
        inviter_nombre: inviterNombre,
        expires_at: invitation.expires_at,
      },
    })
  } catch (error) {
    console.error('[team/invitation/token]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
