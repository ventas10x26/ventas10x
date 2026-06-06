// src/app/api/pulse/followup-contacts/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // 1. Obtener config del agente — buscar por user_id O por instance_name derivado del email
  let agente = null
  const { data: agenteByUser } = await db
    .from('pulse_agentes')
    .select('instance_name, followup_activo, followup_dia1, followup_dia3, followup_dia7')
    .eq('user_id', user.id)
    .maybeSingle()

  if (agenteByUser) {
    agente = agenteByUser
  } else {
    // Fallback: derivar instance_name del email (ej: ricaza81@gmail.com → ricaza81_at_gmail_com)
    const instanceName = user.email?.toLowerCase().replace('@', '_at_').replace(/\./g, '_') ?? ''
    const { data: agenteByInstance } = await db
      .from('pulse_agentes')
      .select('instance_name, followup_activo, followup_dia1, followup_dia3, followup_dia7')
      .eq('instance_name', instanceName)
      .maybeSingle()
    agente = agenteByInstance
  }

  // Si aún no hay agente registrado, devolver defaults con conversaciones igual
  const instanceName = agente?.instance_name
    ?? user.email?.toLowerCase().replace('@', '_at_').replace(/\./g, '_')
    ?? ''

  const followupActivo = agente?.followup_activo ?? true
  const dia1 = agente?.followup_dia1 ?? true
  const dia3 = agente?.followup_dia3 ?? true
  const dia7 = agente?.followup_dia7 ?? true

  // 2. Conversaciones del asesor
  const { data: conversaciones, error: convError } = await db
    .from('pulse_conversaciones')
    .select('remote_jid, historial, updated_at, created_at')
    .eq('instance_name', instanceName)
    .order('updated_at', { ascending: false })

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 })
  }

  if (!conversaciones?.length) {
    return NextResponse.json({
      contacts: [],
      followup_activo: followupActivo,
      total: 0,
      pendientes: 0,
    })
  }

  const jids: string[] = conversaciones.map((c: any) => c.remote_jid)

  // 3. Todos los follow-ups de esos JIDs
  const { data: followups } = await db
    .from('pulse_followup_log')
    .select('remote_jid, tipo, enviado_at, status')
    .eq('instance_name', instanceName)
    .in('remote_jid', jids)
    .order('enviado_at', { ascending: false })

  // 4. Agrupar por JID
  const lastFollowup: Record<string, any> = {}
  const countFollowup: Record<string, number> = {}
  // Solo contar tipos de seguimiento real (dia1/dia3/dia7), no notificaciones del sistema
  const TIPOS_SEGUIMIENTO = ['dia1', 'dia3', 'dia7']

  for (const fu of (followups || [])) {
    if (!lastFollowup[fu.remote_jid]) lastFollowup[fu.remote_jid] = fu
    if (TIPOS_SEGUIMIENTO.includes(fu.tipo)) {
      countFollowup[fu.remote_jid] = (countFollowup[fu.remote_jid] || 0) + 1
    }
  }

  // 5. Construir contactos
  const now = Date.now()

  const contacts = conversaciones.map((conv: any) => {
    const historial: any[] = Array.isArray(conv.historial) ? conv.historial : []
    const lastMsg = historial.length > 0 ? historial[historial.length - 1] : null
    const firstUserMsg = historial.find((m: any) => m.role === 'user')

    const phone = conv.remote_jid.replace('@s.whatsapp.net', '')

    // Calcular tiempo desde última actividad
    const lastUpdate = new Date(conv.updated_at).getTime()
    const diffMs = now - lastUpdate
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    const fu = lastFollowup[conv.remote_jid] ?? null
    const fuCount = countFollowup[conv.remote_jid] ?? 0

    // Último mensaje fue del usuario (respondió) o del bot
    const ultimoRol = lastMsg?.role ?? null
    const respondio = ultimoRol === 'user'

    // No hacer follow-up si el lead respondió recientemente (< 2h)
    const respondioReciente = respondio && diffHours < 2

    // Determinar próximo follow-up pendiente
    let proximoFollowup: string | null = null
    if (followupActivo && !respondioReciente) {
      if (dia1 && diffHours >= 24 && fuCount === 0) {
        proximoFollowup = 'día 1'
      } else if (dia3 && diffDays >= 3 && fuCount <= 0) {
        proximoFollowup = 'día 3'
      } else if (dia7 && diffDays >= 7 && fuCount <= 1) {
        proximoFollowup = 'día 7'
      }
    }

    return {
      remote_jid: conv.remote_jid,
      phone,
      primer_mensaje: firstUserMsg?.content ?? null,
      ultimo_mensaje: lastMsg?.content ?? null,
      ultimo_rol: ultimoRol,
      respondio,
      updated_at: conv.updated_at,
      created_at: conv.created_at,
      diff_hours: diffHours,
      diff_days: diffDays,
      ultimo_followup: fu
        ? { tipo: fu.tipo, enviado_at: fu.enviado_at, status: fu.status }
        : null,
      followup_count: fuCount,
      proximo_followup: proximoFollowup,
      tiene_followup_pendiente: proximoFollowup !== null,
    }
  })

  const pendientes = contacts.filter((c: any) => c.tiene_followup_pendiente).length

  return NextResponse.json({
    contacts,
    followup_activo: followupActivo,
    total: contacts.length,
    pendientes,
  })
}
