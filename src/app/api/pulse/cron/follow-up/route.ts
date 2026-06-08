// src/app/api/pulse/cron/follow-up/route.ts
// v3 — día 1/3/7 con mensajes por día desde pulse_agentes + lock anti-race-condition

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)
const EVOLUTION_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY!

// ── Helpers ───────────────────────────────────────────────────────────────────

function extraerNombreLead(historial: any[]): string {
  for (const m of historial ?? []) {
    const texto = m.content || m.text || ''
    const match = texto.match(/(?:soy|me llamo|mi nombre es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/i)
    if (match) return match[1]
  }
  return 'Cliente'
}

function limpiarModelo(modeloRaw: string | null): string {
  if (!modeloRaw) return 'vehículo KIA'
  const partes = modeloRaw.split('|||').map(p => p.trim())
  const texto = partes.join(' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  return `KIA ${texto}`
}

function buildMensaje(template: string, nombre: string, modelo: string, asesor: string) {
  return template
    .replace(/\{nombre\}/g, nombre)
    .replace(/\{modelo\}/g, modelo)
    .replace(/\{asesor\}/g, asesor)
}

async function enviarWhatsApp(instanceName: string, to: string, texto: string) {
  const res = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
    body: JSON.stringify({ number: to, text: texto }),
  })
  if (!res.ok) throw new Error(`Evolution ${res.status}: ${await res.text()}`)
  return res.json()
}

// Obtener mensaje del día desde pulse_agentes (con fallback a pulse_waitlist)
async function obtenerMensajeDia(
  instanceName: string,
  tipoDia: 'dia1' | 'dia3' | 'dia7',
  fallbackMensaje: string | null
): Promise<string> {
  const defaults: Record<string, string> = {
    dia1: '¡Hola {nombre}! 👋 Soy {asesor} de KIA. Solo quería confirmar si pudiste ver la info del {modelo}. ¿Tienes alguna pregunta? 🚗',
    dia3: '¡Hola {nombre}! 😊 Quería saber si pudiste revisar el catálogo del {modelo}. Esta semana tenemos disponibilidad para test drive. ¿Te interesa?',
    dia7: 'Hola {nombre}, es mi último mensaje 🙏. Si en algún momento querés info sobre el {modelo} u otro vehículo KIA, acá estoy. ¡Que tengas un excelente día!',
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: agente } = await (supabase as any)
      .from('pulse_agentes')
      .select('followup_activo, followup_dia1, followup_dia3, followup_dia7, followup_msg_dia1, followup_msg_dia3, followup_msg_dia7')
      .eq('instance_name', instanceName)
      .maybeSingle()

    if (agente) {
      if (agente.followup_activo === false) return ''
      // Verificar toggle del día específico
      const activoKey = `followup_${tipoDia}` as 'followup_dia1' | 'followup_dia3' | 'followup_dia7'
      const msgKey = `followup_msg_${tipoDia}` as 'followup_msg_dia1' | 'followup_msg_dia3' | 'followup_msg_dia7'
      if (agente[activoKey] === false) return ''
      if (agente[msgKey]) return agente[msgKey] as string
    }
  } catch (e) {
    console.warn('[cron] obtenerMensajeDia error:', e)
  }

  return fallbackMensaje || defaults[tipoDia]
}

async function emailAsesor(
  emailAsesor: string,
  nombreAsesor: string,
  telefono: string,
  nombreLead: string,
  modelo: string,
  horas: number,
  tipoDia: string
) {
  const horasStr = horas.toFixed(1)
  const diaLabel = tipoDia === 'dia1' ? 'Día 1' : tipoDia === 'dia3' ? 'Día 3' : 'Día 7'
  await resend.emails.send({
    from: 'Pulse Motor <agente@ventas10x.co>',
    to: emailAsesor,
    subject: `🔁 Follow-up ${diaLabel} enviado — ${nombreLead} · ${modelo}`,
    html: `
<!DOCTYPE html><html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',system-ui,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="padding:0 0 28px;text-align:center;">
    <span style="background:linear-gradient(135deg,#0ea5e9,#10b981);border-radius:10px;padding:8px 16px;font-size:18px;font-weight:700;">⚡ Pulse Motor</span>
  </td></tr>
  <tr><td style="background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.2);border-top:3px solid #0ea5e9;border-radius:16px;padding:36px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#7dd3fc;letter-spacing:1.5px;text-transform:uppercase;">🔁 FOLLOW-UP AUTOMÁTICO · ${diaLabel.toUpperCase()}</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;line-height:1.3;">
      ${nombreAsesor}, el agente acaba de<br/>
      <span style="color:#0ea5e9;">hacer seguimiento a un lead</span>
    </h1>
    <table cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:24px;width:100%;">
      <tr><td style="padding:5px 0;font-size:13px;color:#94a3b8;width:130px;">👤 Lead</td><td style="padding:5px 0;font-size:13px;color:#fff;font-weight:600;">${nombreLead}</td></tr>
      <tr><td style="padding:5px 0;font-size:13px;color:#94a3b8;">📱 Teléfono</td><td style="padding:5px 0;font-size:13px;color:#fff;font-weight:600;">${telefono}</td></tr>
      <tr><td style="padding:5px 0;font-size:13px;color:#94a3b8;">🚗 Interés</td><td style="padding:5px 0;font-size:13px;color:#10b981;font-weight:600;">${modelo}</td></tr>
      <tr><td style="padding:5px 0;font-size:13px;color:#94a3b8;">⏱️ Inactivo</td><td style="padding:5px 0;font-size:13px;color:#fbbf24;font-weight:600;">${horasStr} horas</td></tr>
      <tr><td style="padding:5px 0;font-size:13px;color:#94a3b8;">📅 Seguimiento</td><td style="padding:5px 0;font-size:13px;color:#7dd3fc;font-weight:600;">${diaLabel}</td></tr>
    </table>
    <a href="https://wa.me/${telefono}" style="display:inline-block;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;">💬 Escribir al lead en WhatsApp</a>
  </td></tr>
  <tr><td style="padding:20px 0 0;text-align:center;font-size:11px;color:#475569;">Pulse Motor · pulsemotor.co</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  })
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats = {
    procesados: 0,
    dia1: 0, dia3: 0, dia7: 0,
    alertas_wa: 0, alertas_email: 0,
    saltados: 0,
    errores: [] as string[],
  }

  try {
    const { data: convs, error } = await supabase
      .from('pulse_conversaciones_inactivas')
      .select('*')

    if (error) throw new Error(`Vista error: ${error.message}`)
    if (!convs?.length) return NextResponse.json({ ok: true, mensaje: 'Sin pendientes', ...stats })

    for (const c of convs) {
      const tipoDia = c.tipo_followup_pendiente as 'dia1' | 'dia3' | 'dia7' | null
      if (!tipoDia) { stats.saltados++; continue }

      stats.procesados++
      const telefono = c.remote_jid.replace('@s.whatsapp.net', '').replace('@c.us', '')
      const nombreLead = extraerNombreLead(c.historial ?? [])
      const modelo = limpiarModelo(c.modelo_detectado)
      const nombreAsesor = c.asesor_nombre ?? 'tu asesor KIA'

      // Obtener mensaje del día (respeta config de pulse_agentes)
      const templateMensaje = await obtenerMensajeDia(c.instance_name, tipoDia, c.followup_mensaje)
      if (!templateMensaje) {
        console.log(`[cron] ${tipoDia} desactivado para ${c.instance_name}`)
        stats.saltados++
        continue
      }

      // Lock anti-race-condition: insertar con status='procesando'
      const { data: lockInsert } = await supabase
        .from('pulse_followup_log')
        .insert({
          remote_jid: c.remote_jid,
          instance_name: c.instance_name,
          asesor_email: c.asesor_email,
          tipo: tipoDia,
          status: 'procesando',
        })
        .select('id')
        .single()

      if (!lockInsert) {
        stats.saltados++
        console.log(`[cron] SALTADO (race condition): ${c.remote_jid}`)
        continue
      }

      // Enviar WhatsApp al lead
      try {
        const msg = buildMensaje(templateMensaje, nombreLead, modelo, nombreAsesor)
        await enviarWhatsApp(c.instance_name, c.remote_jid, msg)
        await supabase.from('pulse_followup_log').update({ status: 'ok' }).eq('id', lockInsert.id)
        stats[tipoDia]++
        console.log(`[cron] ✅ ${tipoDia} enviado: ${c.remote_jid} | ${modelo}`)
      } catch (e: any) {
        stats.errores.push(`[${tipoDia}] ${c.remote_jid}: ${e.message}`)
        await supabase.from('pulse_followup_log').update({ status: 'error' }).eq('id', lockInsert.id)
        continue
      }

      // WhatsApp al asesor
      if (c.asesor_whatsapp) {
        try {
          const alerta = `🔁 *Follow-up ${tipoDia === 'dia1' ? 'Día 1' : tipoDia === 'dia3' ? 'Día 3' : 'Día 7'} enviado*\n\n👤 *Lead:* ${nombreLead}\n📱 *Tel:* ${telefono}\n🚗 *Interés:* ${modelo}\n⏱️ *Inactivo:* ${Number(c.horas_inactivo).toFixed(1)}h`
          await enviarWhatsApp(c.instance_name, c.asesor_whatsapp, alerta)
          await supabase.from('pulse_followup_log').insert({
            remote_jid: c.remote_jid, instance_name: c.instance_name,
            asesor_email: c.asesor_email, tipo: 'asesor_wa', status: 'ok',
          })
          stats.alertas_wa++
        } catch (e: any) {
          stats.errores.push(`[asesor_wa] ${c.asesor_email}: ${e.message}`)
        }
      }

      // Email al asesor
      if (c.asesor_email) {
        try {
          await emailAsesor(c.asesor_email, nombreAsesor, telefono, nombreLead, modelo, Number(c.horas_inactivo), tipoDia)
          await supabase.from('pulse_followup_log').insert({
            remote_jid: c.remote_jid, instance_name: c.instance_name,
            asesor_email: c.asesor_email, tipo: 'asesor_email', status: 'ok',
          })
          stats.alertas_email++
        } catch (e: any) {
          stats.errores.push(`[asesor_email] ${c.asesor_email}: ${e.message}`)
        }
      }
    }

    return NextResponse.json({ ok: true, ...stats })
  } catch (e: any) {
    console.error('[cron/follow-up]', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
