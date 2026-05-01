// Ruta destino: src/app/api/team/orgs-mias/route.ts
// GET: lista todas las orgs del usuario autenticado.

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Membresías del usuario
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await (supabaseAdmin.from('org_members') as any)
      .select('org_id, rol, joined_at')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true })

    if (!members || members.length === 0) {
      return NextResponse.json({ ok: true, orgs: [], orgActivaId: null })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgIds = members.map((m: any) => m.org_id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orgs } = await (supabaseAdmin.from('organizaciones') as any)
      .select('id, nombre, owner_id')
      .in('id', orgIds)

    // Obtener slug de cada owner para mostrar la URL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ownerIds = orgs?.map((o: any) => o.owner_id) || []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ownerProfiles } = await (supabaseAdmin.from('profiles') as any)
      .select('id, slug, nombre, apellido, empresa')
      .in('id', ownerIds)

    const orgsConInfo = (orgs || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const member = members.find((m: any) => m.org_id === o.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ownerProfile = ownerProfiles?.find((p: any) => p.id === o.owner_id)
        return {
          id: o.id,
          nombre: o.nombre,
          slug: ownerProfile?.slug || null,
          owner_id: o.owner_id,
          es_propia: o.owner_id === user.id,
          rol: member?.rol || 'viewer',
        }
      }
    )

    // Org activa (de la cookie). Si no hay cookie, default a la primera.
    const cookieStore = await cookies()
    const activaCookie = cookieStore.get('org_activa_id')?.value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgActivaValida = orgsConInfo.find((o: any) => o.id === activaCookie)
    const orgActivaId = orgActivaValida?.id || orgsConInfo[0]?.id || null

    return NextResponse.json({
      ok: true,
      orgs: orgsConInfo,
      orgActivaId,
    })
  } catch (error) {
    console.error('[orgs-mias]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
