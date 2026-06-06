// src/app/api/pulse/followup-config/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any
  const { data, error } = await client
    .from('pulse_agentes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    return NextResponse.json({ data: null, defaults: true })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  const allowed = [
    'followup_activo',
    'followup_dia1', 'followup_msg_dia1',
    'followup_dia3', 'followup_msg_dia3',
    'followup_dia7', 'followup_msg_dia7',
    'bot_activo', 'marca',
  ]

  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  // Castear el cliente completo para evitar conflictos con tipos generados
  // (pulse_agentes es tabla nueva sin tipos en database.types.ts aún)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any
  const { data, error } = await client
    .from('pulse_agentes')
    .update(patch)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}
