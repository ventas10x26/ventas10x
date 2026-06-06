// src/app/api/pulse/followup-contacts/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET() {
  // Auth con el cliente normal (cookies de sesión)
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Queries con service role — bypasea RLS, lee todas las tablas
  const db = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const instanceName = user.email!
    .toLowerCase()
    .replace('@', '_at_')
    .replace(/\./g, '_')

  // Config del agente
  const { data: agente } = await db
    .from('pulse_agentes')
    .select('followup_activo, followup_dia1, followup_dia3, followup_dia7')
    .eq('instance_name', instanceName)
    .limit(1)
    .maybeSingle()

  const followupActivo: boolean = (agente as any)?.followup_activo ?? true
  const dia1: boolean           = (agente as any)?.followup_dia1    ?? true
  const dia3: boolean           = (agente as any)?.followup_dia3    ?? true
  const dia7: boolean           = (agente as any)?.followup_dia7    ?? true

  // Conversaciones
  const { data: conversaciones, error: convError } = await db
    .from('pulse_conversaciones')
    .select('remote_jid, historial, updated_at, created_at, nombre_contacto, followup_activo')
    .eq('instance_name', instanceName)
    .order('updated_at', { ascending: false })

  if (convError) return NextResponse.json({ error: convError.message }, { status: 500 })
  if (!conversaciones?.length) {
    return NextResponse.json({ contacts: [], followup_activo: followupActivo, total: 0, pendientes: 0 })
  }

  const jids = conversaciones.map((c: any) => c.remote_jid)

  // Follow-up logs
  const { data: followups } = await db
    .from('pulse_followup_log')
    .select('remote_jid, tipo, enviado_at, status')
    .eq('instance_name', instanceName)
    .in('remote_jid', jids)
    .order('enviado_at', { ascending: false })

  // Indexar
  const lastFollowup: Record<string, any> = {}
  const countSeguimiento: Record<string, number> = {}
  const SEGUIMIENTO = new Set(['dia1', 'dia3', 'dia7'])

  for (const fu of (followups ?? [])) {
    if (!lastFollowup[fu.remote_jid]) lastFollowup[fu.remote_jid] = fu
    if (SEGUIMIENTO.has(fu.tipo)) {
      countSeguimiento[fu.remote_jid] = (countSeguimiento[fu.remote_jid] ?? 0) + 1
    }
  }

  const now = Date.now()

  const contacts = conversaciones.map((conv: any) => {
    const historial: any[] = Array.isArray(conv.historial) ? conv.historial : []
    const lastMsg      = historial.at(-1) ?? null
    const firstUserMsg = historial.find((m: any) => m.role === 'user') ?? null

    const phone     = (conv.remote_jid as string).replace('@s.whatsapp.net', '')
    const diffMs    = now - new Date(conv.updated_at).getTime()
    const diffHours = Math.floor(diffMs / 36e5)
    const diffDays  = Math.floor(diffHours / 24)
    const fuCount   = countSeguimiento[conv.remote_jid] ?? 0
    const fu        = lastFollowup[conv.remote_jid] ?? null
    const ultimoRol = lastMsg?.role ?? null
    const respondio = ultimoRol === 'user'
    const respondioReciente = respondio && diffHours < 2

    let proximoFollowup: string | null = null
    if (followupActivo && !respondioReciente) {
      if      (dia1 && diffHours >= 24 && fuCount === 0) proximoFollowup = 'día 1'
      else if (dia3 && diffDays  >= 3  && fuCount <= 0)  proximoFollowup = 'día 3'
      else if (dia7 && diffDays  >= 7  && fuCount <= 1)  proximoFollowup = 'día 7'
    }

    return {
      remote_jid:               conv.remote_jid,
      phone,
      primer_mensaje:           firstUserMsg?.content ?? null,
      ultimo_mensaje:           lastMsg?.content ?? null,
      ultimo_rol:               ultimoRol,
      respondio,
      updated_at:               conv.updated_at,
      diff_hours:               diffHours,
      diff_days:                diffDays,
      ultimo_followup:          fu ? { tipo: fu.tipo, enviado_at: fu.enviado_at } : null,
      followup_count:           fuCount,
      proximo_followup:         proximoFollowup,
      tiene_followup_pendiente: proximoFollowup !== null,
      nombre_contacto: conv.nombre_contacto ?? null,
      followup_activo_contacto: conv.followup_activo ?? true,
    }
  })

  return NextResponse.json({
    contacts,
    followup_activo: followupActivo,
    total:           contacts.length,
    pendientes:      contacts.filter((c: any) => c.tiene_followup_pendiente).length,
  })
}
