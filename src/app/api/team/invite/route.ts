// Ruta destino: src/app/api/team/invite/route.ts
// FIX: queries internas con service_role para bypass RLS.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { getUserOrg, tieneRolMinimo } from '@/lib/team-helpers'
import { emailInvitacionEquipo } from '@/lib/email-templates/invitation'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

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

    const orgInfo = await getUserOrg(null, user.id)
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

    // Verificar invitación pendiente (con admin)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitePendiente } = await (supabaseAdmin.from('org_invitations') as any)
      .select('id, expires_at, token')
      .eq('org_id', orgInfo.org.id)
      .eq('email', email)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle()

    let invitation = invitePendiente
    if (!invitation) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: nueva, error: errInvite } = await (supabaseAdmin.from('org_invitations') as any)
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
    const { data: inviterProfile } = await (supabaseAdmin.from('profiles') as any)
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
