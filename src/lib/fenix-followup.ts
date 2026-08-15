// Ruta destino: src/lib/fenix-followup.ts
//
// Lógica de seguimiento automático de leads comerciales, compartida entre
// el cron diario (src/app/api/fenix/whatsapp/followup/route.ts) y el botón
// "Probar ahora" del panel admin (src/app/api/admin/fenix-leads-agente/
// followup-test/route.ts) -- así el admin puede ver el resultado al
// instante sin esperar la próxima corrida del cron, con el mismo código
// exacto que corre en producción.

import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!
const INSTANCE_NAME = 'fenix_cobranza'

const DEFAULT_MENSAJE_FOLLOWUP = '¿Seguimos la conversación? 🙂 Aquí puedes ver más sobre cómo trabajamos: https://app.consultoresfenix.com -- cuéntame qué necesitas y seguimos por acá. Si prefieres que no te escribamos más, dímelo y no insistimos.'
const DEFAULT_HORAS_FOLLOWUP = 20
const DEFAULT_HORAS_PERDIDO = 48

type MensajeHistorial = { role: 'user' | 'assistant'; content: string }
type ConversacionLead = {
  id: string
  remote_jid: string
  historial: MensajeHistorial[]
  updated_at: string
  followup_enviado_at: string | null
}

export type ResultadoFollowups = {
  followupsEnviados: number
  marcadosPerdidos: number
  detalle: string[]
  errores: string[]
}

export type LeadElegible = {
  telefono: string
  empresa: string
  nombre: string
  horasTranscurridas: number
}

export type ResultadoPreview = {
  horasFollowup: number
  horasPerdido: number
  aplicanFollowup: LeadElegible[]
  aplicanPerdido: LeadElegible[]
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
// llegó ahí fue porque sí respondió alguna vez, así que esto nunca lo
// tocaría de todas formas al filtrar por "nunca respondió").
async function marcarLeadPerdido(remoteJid: string): Promise<string | null> {
  const digitos = remoteJid.replace(/\D/g, '')
  if (digitos.length < 8) return null
  const sufijo = digitos.slice(-8)
  const { data: candidatos } = await supabaseAdmin
    .from('fenix_leads')
    .select('id, empresa, nombre')
    .eq('etapa', 'nuevo')
    .ilike('telefono', `%${sufijo}%`)
  const match = candidatos?.[0]
  if (!match) return null
  await supabaseAdmin.from('fenix_leads').update({ etapa: 'perdido' }).eq('id', match.id)
  return `${match.empresa} (${match.nombre})`
}

// Busca el lead por teléfono (solo lectura, sin tocar nada) -- se usa para
// mostrar empresa/nombre en la vista previa antes de ejecutar de verdad.
async function buscarLeadPorTelefono(remoteJid: string): Promise<{ empresa: string; nombre: string } | null> {
  const digitos = remoteJid.replace(/\D/g, '')
  if (digitos.length < 8) return null
  const sufijo = digitos.slice(-8)
  const { data: candidatos } = await supabaseAdmin
    .from('fenix_leads')
    .select('empresa, nombre')
    .eq('etapa', 'nuevo')
    .ilike('telefono', `%${sufijo}%`)
  const match = candidatos?.[0]
  return match ? { empresa: match.empresa, nombre: match.nombre } : null
}

// Misma lógica de elegibilidad que ejecutarFollowupsLeads(), pero de solo
// lectura: no envía mensajes por WhatsApp ni escribe nada en la base. Se
// usa para el botón "Ver quién aplica" del panel admin, así el admin ve
// exactamente quién recibiría el follow-up o quién se marcaría perdido
// antes de decidir si ejecutar la prueba real.
export async function previsualizarFollowups(): Promise<ResultadoPreview> {
  const { data: cfg } = await supabaseAdmin
    .from('fenix_leads_agente')
    .select('horas_followup, horas_perdido')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const horasFollowup = cfg?.horas_followup ?? DEFAULT_HORAS_FOLLOWUP
  const horasPerdido = cfg?.horas_perdido ?? DEFAULT_HORAS_PERDIDO

  const resultado: ResultadoPreview = { horasFollowup, horasPerdido, aplicanFollowup: [], aplicanPerdido: [] }

  const { data: conversaciones } = await supabaseAdmin
    .from('fenix_conversaciones')
    .select('remote_jid, historial, updated_at, followup_enviado_at')
    .eq('instance_name', INSTANCE_NAME)
    .eq('tipo', 'lead')

  for (const conv of (conversaciones || []) as ConversacionLead[]) {
    const historial = conv.historial || []
    const yaRespondio = historial.some((h) => h.role === 'user')
    if (yaRespondio) continue

    const lead = await buscarLeadPorTelefono(conv.remote_jid)
    if (!lead) continue // ya no está en "nuevo" (se movió a mano) -- no aplica a nada de esto

    if (!conv.followup_enviado_at) {
      const horas = horasDesde(conv.updated_at)
      if (horas >= horasFollowup) {
        resultado.aplicanFollowup.push({ telefono: conv.remote_jid, ...lead, horasTranscurridas: Math.round(horas * 10) / 10 })
      }
    } else {
      const horas = horasDesde(conv.followup_enviado_at)
      if (horas >= horasPerdido) {
        resultado.aplicanPerdido.push({ telefono: conv.remote_jid, ...lead, horasTranscurridas: Math.round(horas * 10) / 10 })
      }
    }
  }

  return resultado
}


// Punto de entrada único: revisa todas las conversaciones de leads que
// nunca respondieron y les manda el follow-up o los marca perdidos según
// corresponda. Ejecución real -- lo que el admin ve con "Probar ahora" es
// exactamente lo que hubiera hecho el cron, no una vista previa falsa.
export async function ejecutarFollowupsLeads(): Promise<ResultadoFollowups> {
  const resultado: ResultadoFollowups = { followupsEnviados: 0, marcadosPerdidos: 0, detalle: [], errores: [] }

  if (!EVO_URL || !EVO_KEY) {
    resultado.errores.push('EVOLUTION_API_URL/EVOLUTION_API_KEY no configuradas')
    return resultado
  }

  const { data: cfg } = await supabaseAdmin
    .from('fenix_leads_agente')
    .select('mensaje_followup, horas_followup, horas_perdido')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const mensajeFollowup = cfg?.mensaje_followup?.trim() || DEFAULT_MENSAJE_FOLLOWUP
  const horasFollowup = cfg?.horas_followup ?? DEFAULT_HORAS_FOLLOWUP
  const horasPerdido = cfg?.horas_perdido ?? DEFAULT_HORAS_PERDIDO

  const { data: conversaciones, error } = await supabaseAdmin
    .from('fenix_conversaciones')
    .select('id, remote_jid, historial, updated_at, followup_enviado_at')
    .eq('instance_name', INSTANCE_NAME)
    .eq('tipo', 'lead')

  if (error) {
    resultado.errores.push(error.message)
    return resultado
  }

  for (const conv of (conversaciones || []) as ConversacionLead[]) {
    const historial = conv.historial || []
    const yaRespondio = historial.some((h) => h.role === 'user')
    if (yaRespondio) continue // el lead está enganchado -- lo maneja el webhook normal

    try {
      if (!conv.followup_enviado_at) {
        if (horasDesde(conv.updated_at) < horasFollowup) continue

        await enviarTexto(conv.remote_jid, mensajeFollowup)
        const nuevoHistorial = [...historial, { role: 'assistant' as const, content: mensajeFollowup }].slice(-12)
        await supabaseAdmin.from('fenix_conversaciones').update({
          historial: nuevoHistorial,
          followup_enviado_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', conv.id)
        resultado.followupsEnviados++
        resultado.detalle.push(`Follow-up enviado a ${conv.remote_jid}`)
      } else {
        if (horasDesde(conv.followup_enviado_at) < horasPerdido) continue
        const nombreLead = await marcarLeadPerdido(conv.remote_jid)
        if (nombreLead) {
          resultado.marcadosPerdidos++
          resultado.detalle.push(`Marcado perdido: ${nombreLead}`)
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      resultado.errores.push(`${conv.remote_jid}: ${msg}`)
    }
  }

  return resultado
}
