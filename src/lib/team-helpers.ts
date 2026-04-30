// Ruta destino: src/lib/team-helpers.ts
// Funciones reusables para queries de organización y permisos.

import { SupabaseClient } from '@supabase/supabase-js'

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

/**
 * Devuelve la primera organización activa del usuario.
 * (En esta fase asumimos 1 usuario = 1 org. En el futuro podríamos soportar multi-org.)
 */
export async function getUserOrg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  userId: string
): Promise<{ org: Organizacion; rol: RolMiembro } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member } = await (supabase.from('org_members') as any)
    .select('org_id, rol')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!member) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase.from('organizaciones') as any)
    .select('*')
    .eq('id', member.org_id)
    .maybeSingle()

  if (!org) return null

  return { org, rol: member.rol }
}

/**
 * Verifica si un usuario tiene cierto rol (o superior) en una org.
 * owner > admin > viewer
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
 */
export async function listarMiembrosOrg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  orgId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabase.from('org_members') as any)
    .select('id, user_id, rol, joined_at')
    .eq('org_id', orgId)
    .order('joined_at', { ascending: true })

  if (!members || members.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userIds = members.map((m: any) => m.user_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabase.from('profiles') as any)
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
