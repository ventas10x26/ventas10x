// src/app/api/pulse/followup-contacts/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any

  // Obtener instance_name del asesor
  const { data: agente } = await client
    .from('pulse_agentes')
    .select('instance_name, followup_activo, followup_dia1, followup_dia3, followup_dia7')
    .eq('user_id', user.id)
    .single()

  if (!agente) return NextResponse.json({ contacts: [], followup_activo: false })

  // Conversaciones activas del asesor
  const { data: conversaciones } = await client
    .from('pulse_conversaciones')
    .select('remote_jid, historial, updated_at, created_at')
    .eq('instance_name', agente.instance_name)
    .order('updated_at', { ascending: false })

  if (!conversaciones?.length) return NextResponse.json({ contacts: [], followup_activo: agente.followup_activo })

  const jids = conversaciones.map((c: any) => c.remote_jid)

  // Último follow-up enviado por contacto
  const { data: followups } = await client
    .from('pulse_followup_log')
    .select('remote_jid, tipo, enviado_at, status')
    .eq('instance_name', agente.instance_name)
    .in('remote_jid', jids)
    .order('enviado_at', { ascending: false })

  // Agrupar último follow-up por jid
  const lastFollowup: Record<string, any> = {}
  for (const fu of (followups || [])) {
    if (!lastFollowup[fu.remote_jid]) lastFollowup[fu.remote_jid] = fu
  }

  // Contar follow-ups por jid
  const countFollowup: Record<string, number> = {}
  for (const fu of (followups || [])) {
    countFollowup[fu.remote_jid] = (countFollowup[fu.remote_jid] || 0) + 1
  }

  // Construir lista de contactos enriquecida
  const contacts = conversaciones.map((conv: any) => {
    const historial = Array.isArray(conv.historial) ? conv.historial : []
    const lastMsg = historial[historial.length - 1] || null
    const firstUserMsg = historial.find((m: any) => m.role === 'user')

    // Extraer nombre del primer mensaje de usuario (heurística simple)
    const phone = conv.remote_jid.replace('@s.whatsapp.net', '')
    const fu = lastFollowup[conv.remote_jid]
    const fuCount = countFollowup[conv.remote_jid] || 0

    // Calcular días desde último contacto
    const lastUpdate = new Date(conv.updated_at)
    const now = new Date()
    const diffMs = now.getTime() - lastUpdate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    // Determinar próximo follow-up pendiente
    let proximoFollowup: string | null = null
    if (agente.followup_activo) {
      if (agente.followup_dia1 && diffHours >= 24 && fuCount === 0) proximoFollowup = 'día 1'
      else if (agente.followup_dia3 && diffDays >= 3 && fuCount <= 1) proximoFollowup = 'día 3'
      else if (agente.followup_dia7 && diffDays >= 7 && fuCount <= 2) proximoFollowup = 'día 7'
    }

    return {
      remote_jid: conv.remote_jid,
      phone,
      primer_mensaje: firstUserMsg?.content || null,
      ultimo_mensaje: lastMsg?.content || null,
      ultimo_rol: lastMsg?.role || null,
      updated_at: conv.updated_at,
      created_at: conv.created_at,
      diff_hours: diffHours,
      diff_days: diffDays,
      ultimo_followup: fu ? { tipo: fu.tipo, enviado_at: fu.enviado_at, status: fu.status } : null,
      followup_count: fuCount,
      proximo_followup: proximoFollowup,
      tiene_followup_pendiente: proximoFollowup !== null,
    }
  })

  return NextResponse.json({
    contacts,
    followup_activo: agente.followup_activo,
    total: contacts.length,
    pendientes: contacts.filter((c: any) => c.tiene_followup_pendiente).length,
  })
}
