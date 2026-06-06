// src/app/api/pulse/followup-contacts/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // DEBUG temporal — quitar después
  console.log('[followup-contacts] user:', user?.email, 'authError:', authError?.message)

  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const instanceName = user.email!
    .toLowerCase()
    .replace('@', '_at_')
    .replace(/\./g, '_')

  console.log('[followup-contacts] instanceName:', instanceName)

  // Config del agente
  const { data: agente, error: agenteError } = await db
    .from('pulse_agentes')
    .select('followup_activo, followup_dia1, followup_dia3, followup_dia7')
    .eq('instance_name', instanceName)
    .limit(1)
    .single()

  console.log('[followup-contacts] agente:', agente, 'error:', agenteError?.message)

  const followupActivo: boolean = agente?.followup_activo ?? true
  const dia1: boolean           = agente?.followup_dia1    ?? true
  const dia3: boolean           = agente?.followup_dia3    ?? true
  const dia7: boolean           = agente?.followup_dia7    ?? true

  // Conversaciones
  const { data: conversaciones, error: convError } = await db
    .from('pulse_conversaciones')
    .select('remote_jid, historial, updated_at, created_at')
    .eq('instance_name', instanceName)
    .order('updated_at', { ascending: false })

  console.log('[followup-contacts] conversaciones count:', conversaciones?.length, 'error:', convError?.message)

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 })
  }

  if (!conversaciones || conversaciones.length === 0) {
    return NextResponse.json({ contacts: [], followup_activo: followupActivo, total: 0, pendientes: 0 })
  }

  const jids: string[] = conversaciones.map((c: any) => c.remote_jid)

  const { data: followups } = await db
    .from('pulse_followup_log')
    .select('remote_jid, tipo, enviado_at, status')
    .eq('instance_name', instanceName)
    .in('remote_jid', jids)
    .order('enviado_at', { ascending: false })

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
    }
  })

  return NextResponse.json({
    contacts,
    followup_activo: followupActivo,
    total:           contacts.length,
    pendientes:      contacts.filter((c: any) => c.tiene_followup_pendiente).length,
  })
}
