// src/app/api/pulse/cron/follow-up/route.ts
// v2 — guard anti-duplicado: verifica pulse_followup_log antes de enviar

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function extraerNombreLead(historial: any[]): string {
  for (const m of historial ?? []) {
    const texto = (m.content || m.text || '')
    const match = texto.match(/(?:soy|me llamo|mi nombre es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/i)
    if (match) return match[1]
  }
  return 'Cliente'
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

async function registrarLog(
  remoteJid: string,
  instanceName: string,
  asesorEmail: string,
  tipo: 'lead' | 'asesor_wa' | 'asesor_email' | 'dia1' | 'dia3' | 'dia7',
  status = 'ok'
) {
  await supabase.from('pulse_followup_log').insert({
    remote_jid: remoteJid,
    instance_name: instanceName,
    asesor_email: asesorEmail,
    tipo,
    status,
  })
}

// ── Guard anti-duplicado ─────────────────────────────────────────────────────
// Verifica si ya se envió un follow-up del mismo tipo a este JID hoy
async function yaEnviadoHoy(
  remoteJid: string,
  instanceName: string,
  tipo: string
): Promise<boolean> {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('pulse_followup_log')
    .select('id')
    .eq('remote_jid', remoteJid)
    .eq('instance_name', instanceName)
    .eq('tipo', tipo)
    .eq('status', 'ok')
    .gte('enviado_at', hoy.toISOString())
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[cron] yaEnviadoHoy error:', error.message)
    return false
  }
  return !!data
}

async function emailAsesor(
  emailAsesor: string,
  nombreAsesor: string,
  telefono: string,
  nombreLead: string,
  modelo: string,
  horas: number
) {
  const horasStr = horas.toFixed(1)
  await resend.emails.send({
    from: 'Pulse Motor <agente@ventas10x.co>',
    to: emailAsesor,
    subject: `⚠️ Lead sin atender hace ${horasStr}h — ${nombreLead} interesado en ${modelo}`,
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
  <tr><td style="background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.2);border-top:3px solid #f59e0b;border-radius:16px;padding:36px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#f59e0b;letter-spacing:1.5px;text-transform:uppercase;">⏰ ALERTA DE FOLLOW-UP</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;line-height:1.3;">
      ${nombreAsesor}, tienes un lead<br/>
      <span style="color:#f59e0b;">sin atender hace ${horasStr} horas</span>
    </h1>
    <table cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:24px;width:100%;">
      <tr><td style="padding:5px 0;font-size:13px;color:#94a3b8;width:130px;">👤 Lead</td><td style="padding:5px 0;font-size:13px;color:#fff;font-weight:600;">${nombreLead}</td></tr>
      <tr><td style="padding:5px 0;font-size:13px;color:#94a3b8;">📱 Teléfono</td><td style="padding:5px 0;font-size:13px;color:#fff;font-weight:600;">${telefono}</td></tr>
      <tr><td style="padding:5px 0;font-size:13px;color:#94a3b8;">🚗 Interés</td><td style="padding:5px 0;font-size:13px;color:#10b981;font-weight:600;">${modelo}</td></tr>
      <tr><td style="padding:5px 0;font-size:13px;color:#94a3b8;">⏱️ Inactivo</td><td style="padding:5px 0;font-size:13px;color:#f59e0b;font-weight:600;">${horasStr} horas</td></tr>
    </table>
    <p style="margin:0 0 24px;font-size:13px;color:#94a3b8;line-height:1.6;">El bot ya envió un mensaje de reactivación automático.</p>
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

  const stats = { procesados: 0, mensajes_lead: 0, alertas_wa: 0, alertas_email: 0, duplicados_saltados: 0, errores: [] as string[] }

  try {
    const { data: convs, error } = await supabase
      .from('pulse_conversaciones_inactivas')
      .select('*')

    if (error) throw new Error(`Vista error: ${error.message}`)
    if (!convs?.length) return NextResponse.json({ ok: true, mensaje: 'Sin inactivas', ...stats })

    for (const c of convs) {
      stats.procesados++
      const telefono = c.remote_jid.replace('@s.whatsapp.net', '').replace('@c.us', '')
      const nombreLead = extraerNombreLead(c.historial ?? [])
      const modelo = c.modelo_detectado ?? 'vehículo KIA'
      const nombreAsesor = c.asesor_nombre ?? 'tu asesor KIA'

      // ── GUARD: verificar si ya se envió el follow-up al lead hoy ──
      const duplicado = await yaEnviadoHoy(c.remote_jid, c.instance_name, 'lead')
      if (duplicado) {
        stats.duplicados_saltados++
        console.log(`[cron] SALTADO (ya enviado hoy): ${c.remote_jid}`)
        continue
      }

      // 1️⃣ WhatsApp al lead
      try {
        const msg = buildMensaje(
          c.followup_mensaje ?? '¡Hola {nombre}! 👋 Soy {asesor} de KIA. ¿Sigues interesado en el {modelo}?',
          nombreLead, modelo, nombreAsesor
        )
        await enviarWhatsApp(c.instance_name, c.remote_jid, msg)
        await registrarLog(c.remote_jid, c.instance_name, c.asesor_email, 'lead')
        stats.mensajes_lead++
        console.log(`[cron] ✅ lead enviado: ${c.remote_jid}`)
      } catch (e: any) {
        stats.errores.push(`[lead] ${c.remote_jid}: ${e.message}`)
        await registrarLog(c.remote_jid, c.instance_name, c.asesor_email, 'lead', 'error')
        continue // si falla el mensaje al lead, no alertar al asesor
      }

      // 2️⃣ WhatsApp al asesor
      if (c.asesor_whatsapp) {
        try {
          const yaAlertadoWA = await yaEnviadoHoy(c.remote_jid, c.instance_name, 'asesor_wa')
          if (!yaAlertadoWA) {
            const alerta = `⚠️ *Follow-up enviado*\n\n👤 *Lead:* ${nombreLead}\n📱 *Tel:* ${telefono}\n🚗 *Interés:* ${modelo}\n⏱️ *Inactivo:* ${Number(c.horas_inactivo).toFixed(1)}h\n\nEl bot ya lo contactó. Haz seguimiento personal 💪`
            await enviarWhatsApp(c.instance_name, c.asesor_whatsapp, alerta)
            await registrarLog(c.remote_jid, c.instance_name, c.asesor_email, 'asesor_wa')
            stats.alertas_wa++
          }
        } catch (e: any) {
          stats.errores.push(`[asesor_wa] ${c.asesor_email}: ${e.message}`)
        }
      }

      // 3️⃣ Email al asesor
      if (c.asesor_email) {
        try {
          const yaEmailado = await yaEnviadoHoy(c.remote_jid, c.instance_name, 'asesor_email')
          if (!yaEmailado) {
            await emailAsesor(c.asesor_email, nombreAsesor, telefono, nombreLead, modelo, Number(c.horas_inactivo))
            await registrarLog(c.remote_jid, c.instance_name, c.asesor_email, 'asesor_email')
            stats.alertas_email++
          }
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
