// Ruta destino: src/lib/get-active-org.ts
// Resuelve la org activa del usuario actual.
// Lee la cookie 'org_activa_id', valida que el usuario sea miembro,
// y devuelve org+rol. Si no hay cookie o no es válida, devuelve la primera org.

import { cookies } from 'next/headers'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export type ActiveOrg = {
  org: {
    id: string
    nombre: string
    slug: string | null
    owner_id: string
  }
  rol: 'owner' | 'admin' | 'viewer'
  user_id: string
  user_email: string
}

/**
 * Devuelve la org activa del usuario autenticado.
 * - Lee cookie 'org_activa_id'
 * - Valida que el usuario sea miembro de esa org
 * - Si no hay cookie válida, devuelve la primera org del usuario
 * - Si el usuario no tiene ninguna org, devuelve null
 *
 * Internamente usa service_role para bypass RLS.
 */
export async function getActiveOrg(): Promise<ActiveOrg | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Leer cookie
  const cookieStore = await cookies()
  const activaCookie = cookieStore.get('org_activa_id')?.value

  // Buscar todas las membresías del usuario
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabaseAdmin.from('org_members') as any)
    .select('org_id, rol')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })

  if (!members || members.length === 0) {
    return null
  }

  // Decidir qué org es la activa
  let orgId: string
  let rol: 'owner' | 'admin' | 'viewer'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const desdeCookie = activaCookie && members.find((m: any) => m.org_id === activaCookie)

  if (desdeCookie) {
    orgId = desdeCookie.org_id
    rol = desdeCookie.rol
  } else {
    // No hay cookie válida → primera org
    orgId = members[0].org_id
    rol = members[0].rol
  }

  // Cargar datos de la org + slug del owner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabaseAdmin.from('organizaciones') as any)
    .select('id, nombre, owner_id')
    .eq('id', orgId)
    .maybeSingle()

  if (!org) return null

  // Obtener slug del owner para mostrar en la URL pública
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ownerProfile } = await (supabaseAdmin.from('profiles') as any)
    .select('slug')
    .eq('id', org.owner_id)
    .maybeSingle()

  return {
    org: {
      id: org.id,
      nombre: org.nombre,
      slug: ownerProfile?.slug || null,
      owner_id: org.owner_id,
    },
    rol,
    user_id: user.id,
    user_email: user.email || '',
  }
}

/**
 * Variante que retorna directamente el org_id, útil para queries simples.
 * Devuelve null si no hay org activa.
 */
export async function getActiveOrgId(): Promise<string | null> {
  const active = await getActiveOrg()
  return active?.org.id || null
}
