// Ruta destino: src/lib/team-helpers.ts
// FIX: usar service_role admin para queries internas (bypass RLS).
// La autenticación del usuario se valida ANTES de usar este helper.

import { createClient } from '@supabase/supabase-js'

export type RolMiembro = 'owner' | 'admin' | 'viewer'

export type OrgMember = {
  id: string
  org_id: string
  user_id: string
  rol: RolMiembro
  joined_at: string
}

export type Organizacion = {
  id: string
  nombre: string
  slug: string | null
  owner_id: string
  created_at: string
}

// Cliente admin (service_role) - bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

/**
 * Devuelve la primera organización activa del usuario.
 * Usa service_role para evitar problemas con RLS.
 */
export async function getUserOrg(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  _supabase: any, // ya no se usa, dejado por compatibilidad
  userId: string
): Promise<{ org: Organizacion; rol: RolMiembro } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member, error: errMember } = await (supabaseAdmin.from('org_members') as any)
    .select('org_id, rol')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (errMember) {
    console.error('[getUserOrg] Error en org_members:', errMember)
    return null
  }
  if (!member) {
    console.warn('[getUserOrg] Usuario sin org:', userId)
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org, error: errOrg } = await (supabaseAdmin.from('organizaciones') as any)
    .select('*')
    .eq('id', member.org_id)
    .maybeSingle()

  if (errOrg || !org) {
    console.error('[getUserOrg] Org no encontrada:', member.org_id)
    return null
  }

  return { org, rol: member.rol }
}

/**
 * Verifica si un usuario tiene cierto rol (o superior) en una org.
 */
export function tieneRolMinimo(rolActual: RolMiembro, rolMinimo: RolMiembro): boolean {
  const jerarquia: Record<RolMiembro, number> = {
    viewer: 1,
    admin: 2,
    owner: 3,
  }
  return jerarquia[rolActual] >= jerarquia[rolMinimo]
}

/**
 * Devuelve la lista de miembros de una org con su info de profile.
 * Usa service_role para bypass RLS.
 */
export async function listarMiembrosOrg(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  _supabase: any, // ya no se usa, dejado por compatibilidad
  orgId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabaseAdmin.from('org_members') as any)
    .select('id, user_id, rol, joined_at')
    .eq('org_id', orgId)
    .order('joined_at', { ascending: true })

  if (!members || members.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userIds = members.map((m: any) => m.user_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabaseAdmin.from('profiles') as any)
    .select('id, nombre, apellido, slug, avatar_url')
    .in('id', userIds)

  return members.map((m: { user_id: string; rol: RolMiembro; id: string; joined_at: string }) => {
    const profile = profiles?.find((p: { id: string }) => p.id === m.user_id)
    return {
      ...m,
      profile: profile || null,
    }
  })
}

/**
 * Lista invitaciones pendientes de una org.
 */
export async function listarInvitacionesOrg(orgId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin.from('org_invitations') as any)
    .select('id, email, rol, expires_at, created_at, invited_by')
    .eq('org_id', orgId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return data || []
}
