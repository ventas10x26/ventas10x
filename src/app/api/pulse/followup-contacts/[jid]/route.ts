// src/app/api/pulse/followup-contacts/[jid]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jid: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const instanceName = user.email!
    .toLowerCase()
    .replace('@', '_at_')
    .replace(/\./g, '_')

  const { jid } = await params
  const remoteJid = decodeURIComponent(jid)

  const body = await req.json()
  const patch: Record<string, unknown> = {}
  if ('nombre_contacto' in body) patch.nombre_contacto = body.nombre_contacto
  if ('followup_activo' in body) patch.followup_activo = body.followup_activo

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  const { error } = await db
    .from('pulse_conversaciones')
    .update(patch)
    .eq('remote_jid', remoteJid)
    .eq('instance_name', instanceName)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
