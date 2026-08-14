// Ruta destino: src/app/api/fenix/whatsapp/followup/route.ts
//
// Cron diario (ver vercel.json) que revisa las conversaciones de leads
// comerciales (fenix_conversaciones.tipo='lead') que nunca respondieron
// tras la autorespuesta inicial, y las mueve por dos etapas:
//
//   1. Si pasaron >= UMBRAL_FOLLOWUP_HORAS desde el último mensaje nuestro
//      y el lead nunca contestó -> le mandamos un mensaje de seguimiento
//      (editable en /admin/fenix/leads-agente) preguntando si quiere
//      seguir la conversación, con el link de la landing.
//   2. Si ya se le mandó el follow-up y pasaron otras
//      >= UMBRAL_PERDIDO_HORAS sin que responda -> lo marcamos "perdido"
//      en el pipeline automáticamente (solo si sigue en "nuevo", para no
//      pisar una etapa que el equipo ya haya movido a mano). Así el
//      pipeline se auto-depura de leads que nunca engancharon, sin
//      intervención manual -- la calificación de calidad que pedía Ricardo.
//
// Protegido igual que el cron existente (src/app/api/cron/onboarding-reminder):
// exige el header Authorization: Bearer $CRON_SECRET que Vercel Cron ya
// manda automáticamente para cualquier cron definido en vercel.json.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!
const INSTANCE_NAME = 'fenix_cobranza'

const UMBRAL_FOLLOWUP_HORAS = 20 // desde el último mensaje nuestro sin respuesta
const UMBRAL_PERDIDO_HORAS = 48  // desde el follow-up, si tampoco responde

const DEFAULT_MENSAJE_FOLLOWUP = '¿Seguimos la conversación? 🙂 Aquí puedes ver más sobre cómo trabajamos: https://app.consultoresfenix.com -- cuéntame qué necesitas y seguimos por acá. Si prefieres que no te escribamos más, dímelo y no insistimos.'

type MensajeHistorial = { role: 'user' | 'assistant'; content: string }
type ConversacionLead = {
  id: string
  remote_jid: string
  historial: MensajeHistorial[]
  updated_at: string
  followup_enviado_at: string | null
}

function horasDesde(fechaISO: string): number {
  return (Date.now() - new Date(fechaISO).getTime()) / (1000 * 60 * 60)
}

async function enviarTexto(remoteJid: string, mensaje: string) {
  const res = await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: JSON.stringify({ number: remoteJid, text: mensaje }),
  })
  if (!res.ok) {
    throw new Error(`Evolution API rechazó el envío: ${res.status} ${await res.text().catch(() => '')}`)
  }
}

// Marca "perdido" solo si el lead sigue en "nuevo" -- no pisa una etapa
// que el equipo ya haya movido a mano (ni siquiera "contactado", porque si
// llegó ahí fue porque sí respondió alguna vez, así que este cron nunca lo
// tocaría de todas formas al filtrar por "nunca respondió").
async function marcarLeadPerdido(remoteJid: string) {
  const digitos = remoteJid.replace(/\D/g, '')
  if (digitos.length < 8) return
  const sufijo = digitos.slice(-8)
  const { data: candidatos } = await supabaseAdmin
    .from('fenix_leads')
    .select('id')
    .eq('etapa', 'nuevo')
    .ilike('telefono', `%${sufijo}%`)
  const match = candidatos?.[0]
  if (!match) return
  await supabaseAdmin.from('fenix_leads').update({ etapa: 'perdido' }).eq('id', match.id)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resultado = { followupsEnviados: 0, marcadosPerdidos: 0, errores: [] as string[] }

  if (!EVO_URL || !EVO_KEY) {
    return NextResponse.json({ ...resultado, error: 'EVOLUTION_API_URL/EVOLUTION_API_KEY no configuradas' })
  }

  const { data: mensajeCfg } = await supabaseAdmin
    .from('fenix_leads_agente')
    .select('mensaje_followup')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  const mensajeFollowup = mensajeCfg?.mensaje_followup?.trim() || DEFAULT_MENSAJE_FOLLOWUP

  const { data: conversaciones, error } = await supabaseAdmin
    .from('fenix_conversaciones')
    .select('id, remote_jid, historial, updated_at, followup_enviado_at')
    .eq('instance_name', INSTANCE_NAME)
    .eq('tipo', 'lead')

  if (error) {
    console.error('[fenix followup] Error leyendo conversaciones:', error)
    return NextResponse.json({ ...resultado, error: error.message }, { status: 500 })
  }

  for (const conv of (conversaciones || []) as ConversacionLead[]) {
    const historial = conv.historial || []
    const yaRespondio = historial.some((h) => h.role === 'user')
    if (yaRespondio) continue // el lead está enganchado -- lo maneja el webhook normal, este cron no lo toca

    try {
      if (!conv.followup_enviado_at) {
        // Etapa 1: nunca se le mandó el follow-up -- ¿ya pasó suficiente tiempo?
        if (horasDesde(conv.updated_at) < UMBRAL_FOLLOWUP_HORAS) continue

        await enviarTexto(conv.remote_jid, mensajeFollowup)
        const nuevoHistorial = [...historial, { role: 'assistant' as const, content: mensajeFollowup }].slice(-12)
        await supabaseAdmin.from('fenix_conversaciones').update({
          historial: nuevoHistorial,
          followup_enviado_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', conv.id)
        resultado.followupsEnviados++
      } else {
        // Etapa 2: ya se le mandó el follow-up y sigue sin responder -- ¿ya pasó suficiente tiempo?
        if (horasDesde(conv.followup_enviado_at) < UMBRAL_PERDIDO_HORAS) continue
        await marcarLeadPerdido(conv.remote_jid)
        resultado.marcadosPerdidos++
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[fenix followup] error con', conv.remote_jid, msg)
      resultado.errores.push(`${conv.remote_jid}: ${msg}`)
    }
  }

  return NextResponse.json({ ok: true, ...resultado })
}
