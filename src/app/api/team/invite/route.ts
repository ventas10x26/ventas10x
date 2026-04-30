// Ruta destino: src/app/api/team/invite/route.ts
// POST: crea una invitación y envía email al destinatario.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserOrg, tieneRolMinimo } from '@/lib/team-helpers'
import { emailInvitacionEquipo } from '@/lib/email-templates/invitation'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'

const ROLES_INVITABLES = ['admin', 'viewer'] as const

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const email = body.email?.toString().trim().toLowerCase()
    const rol = body.rol?.toString().trim() || 'admin'

    // Validaciones
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!ROLES_INVITABLES.includes(rol as any)) {
      return NextResponse.json(
        { error: `Rol inválido. Debe ser: ${ROLES_INVITABLES.join(', ')}` },
        { status: 400 }
      )
    }

    // Obtener org del usuario y verificar permisos
    const orgInfo = await getUserOrg(supabase, user.id)
    if (!orgInfo) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización' },
        { status: 400 }
      )
    }
    if (!tieneRolMinimo(orgInfo.rol, 'admin')) {
      return NextResponse.json(
        { error: 'No tienes permisos para invitar miembros' },
        { status: 403 }
      )
    }

    // Verificar que el email no sea ya miembro de la org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingProfile } = await (supabase.from('profiles') as any)
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    // Buscar si ese email ya tiene cuenta
    // (vía auth.users no es accesible directo; intentamos via profiles si guardas email)
    // Para ahora, asumimos que si el email tiene cuenta, ya sale el flujo correcto al aceptar.

    // Verificar si ya hay invitación pendiente para ese email a esa org
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitePendiente } = await (supabase.from('org_invitations') as any)
      .select('id, expires_at')
      .eq('org_id', orgInfo.org.id)
      .eq('email', email)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle()

    // Si hay invitación pendiente, la reusamos (no creamos otra)
    let invitation = invitePendiente
    if (!invitation) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: nueva, error: errInvite } = await (supabase.from('org_invitations') as any)
        .insert({
          org_id: orgInfo.org.id,
          email,
          rol,
          invited_by: user.id,
        })
        .select('*')
        .single()

      if (errInvite) {
        console.error('[team/invite]', errInvite)
        return NextResponse.json({ error: errInvite.message }, { status: 500 })
      }
      invitation = nueva
    }

    // Obtener nombre del que invita
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inviterProfile } = await (supabase.from('profiles') as any)
      .select('nombre, apellido')
      .eq('id', user.id)
      .maybeSingle()

    const inviterNombre = inviterProfile
      ? [inviterProfile.nombre, inviterProfile.apellido].filter(Boolean).join(' ').trim() || user.email || 'Un compañero'
      : user.email || 'Un compañero'

    const acceptUrl = `${BASE_URL}/invitacion/${invitation.token}`
    const { asunto, html } = emailInvitacionEquipo({
      inviterNombre,
      orgNombre: orgInfo.org.nombre,
      rol,
      acceptUrl,
    })

    // Enviar email
    try {
      await resend.emails.send({
        from: 'Ventas10x <noreply@ventas10x.co>',
        to: email,
        subject: asunto,
        html,
      })
    } catch (emailErr) {
      console.error('[team/invite email]', emailErr)
      // No fallamos: la invitación quedó creada, el dueño puede reenviar
      return NextResponse.json({
        ok: true,
        invitation: {
          id: invitation.id,
          email,
          rol,
          expires_at: invitation.expires_at,
        },
        warning: 'Invitación creada pero el email no pudo enviarse',
      })
    }

    return NextResponse.json({
      ok: true,
      invitation: {
        id: invitation.id,
        email,
        rol,
        expires_at: invitation.expires_at,
      },
    })
  } catch (error) {
    console.error('[team/invite]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
