// src/app/api/pulse/cron/creditos-reactivacion/route.ts
// Cron diario — detecta usuarios por tiempo y otorga bonus o envía emails
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CREDITOS_CONFIG } from '@/lib/pulse/creditos-config'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const ahora   = new Date()
  const logs    = { procesados: 0, bonus: 0, emails: 0, pagados_bloqueados: 0 }

  // Obtener todos los usuarios con créditos que NO han pagado
  const { data: usuarios } = await supabase
    .from('pulse_waitlist')
    .select('user_id, email, nombre, created_at, pagado, creditos_bonus_enviado, tipo_acceso')
    .eq('pagado', false)
    .not('user_id', 'is', null)

  if (!usuarios?.length) return NextResponse.json({ ok: true, ...logs })

  for (const usuario of usuarios) {
    logs.procesados++
    const diasDesdeRegistro = Math.floor(
      (ahora.getTime() - new Date(usuario.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    // ── Usuarios 14-30 días: bonus de gracia ──
    if (diasDesdeRegistro >= 14 && diasDesdeRegistro < 30 && !usuario.creditos_bonus_enviado) {
      await otorgarBonus(usuario.user_id, CREDITOS_CONFIG.BONUS.DIAS_14_A_30, 'bonus_tiempo')
      await enviarEmailBonus(usuario.email, usuario.nombre, CREDITOS_CONFIG.BONUS.DIAS_14_A_30, 'gracia')
      await supabase.from('pulse_waitlist')
        .update({ creditos_bonus_enviado: true })
        .eq('user_id', usuario.user_id)
      logs.bonus++; logs.emails++
    }

    // ── Usuarios 30-60 días: reactivación ──
    else if (diasDesdeRegistro >= 30 && diasDesdeRegistro < 60 && !usuario.creditos_bonus_enviado) {
      await otorgarBonus(usuario.user_id, CREDITOS_CONFIG.BONUS.DIAS_30_A_60, 'bonus_reactivacion')
      await enviarEmailReactivacion(usuario.email, usuario.nombre, 'reactivacion')
      await supabase.from('pulse_waitlist')
        .update({ creditos_bonus_enviado: true, tipo_acceso: 'gracia' })
        .eq('user_id', usuario.user_id)
      logs.bonus++; logs.emails++
    }

    // ── Usuarios +60 días: "tu agente te extraña" ──
    else if (diasDesdeRegistro >= 60 && !usuario.creditos_bonus_enviado) {
      await otorgarBonus(usuario.user_id, CREDITOS_CONFIG.BONUS.DIAS_MAS_60, 'bonus_reactivacion')
      await enviarEmailReactivacion(usuario.email, usuario.nombre, 'extranya')
      await supabase.from('pulse_waitlist')
        .update({ creditos_bonus_enviado: true, tipo_acceso: 'gracia' })
        .eq('user_id', usuario.user_id)
      logs.bonus++; logs.emails++
    }

    // ── Verificar si créditos agotados → suspender ──
    const { data: creditos } = await supabase
      .from('pulse_creditos')
      .select('saldo')
      .eq('user_id', usuario.user_id)
      .single()

    if (creditos && creditos.saldo <= 0 && usuario.tipo_acceso !== 'suspendido') {
      await supabase.from('pulse_waitlist')
        .update({ tipo_acceso: 'suspendido', bot_activo: false })
        .eq('user_id', usuario.user_id)
      await enviarEmailSinCreditos(usuario.email, usuario.nombre)
      logs.pagados_bloqueados++
    }
  }

  console.log('[cron/creditos-reactivacion]', logs)
  return NextResponse.json({ ok: true, ...logs })
}

async function otorgarBonus(user_id: string, cantidad: number, accion: string) {
  const { data: existing } = await supabase
    .from('pulse_creditos')
    .select('saldo, saldo_total')
    .eq('user_id', user_id)
    .single()

  const nuevo_saldo = (existing?.saldo ?? 0) + cantidad
  const nuevo_total = (existing?.saldo_total ?? 0) + cantidad

  if (!existing) {
    await supabase.from('pulse_creditos').insert({ user_id, saldo: nuevo_saldo, saldo_total: nuevo_total })
  } else {
    await supabase.from('pulse_creditos').update({ saldo: nuevo_saldo, saldo_total: nuevo_total, updated_at: new Date().toISOString() }).eq('user_id', user_id)
  }

  await supabase.from('pulse_creditos_log').insert({
    user_id, tipo: 'bonus', accion, cantidad, saldo_post: nuevo_saldo,
    metadata: { automatico: true },
  })
}

async function enviarEmailBonus(email: string, nombre: string, cantidad: number, tipo: string) {
  await resend.emails.send({
    from: 'Pulse Motor <agente@ventas10x.co>',
    to: email,
    subject: `🎁 Te regalamos ${cantidad} créditos extra — Pulse Motor`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080f1a;color:#f8fafc;padding:32px;border-radius:12px;">
        <div style="font-size:32px;margin-bottom:16px;">🎁</div>
        <h2 style="font-size:20px;margin:0 0 12px;">¡${cantidad} créditos extra para vos, ${nombre}!</h2>
        <p style="font-size:15px;color:#94a3b8;line-height:1.6;margin-bottom:24px;">
          Sabemos que estuviste explorando Pulse Motor. Te regalamos <strong style="color:#10b981;">${cantidad} créditos extra</strong> para que puedas seguir respondiendo leads sin interrupciones.
        </p>
        <a href="https://pulsemotor.co/pulse/agente" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#0ea5e9,#10b981);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;margin-bottom:16px;">
          Usar mis créditos →
        </a>
        <p style="font-size:13px;color:#64748b;margin-top:16px;">
          O si querés créditos ilimitados, activá tu plan por solo <strong>$99.000/mes</strong>.
        </p>
        <a href="https://pulsemotor.co/pulse/pricing" style="font-size:13px;color:#0ea5e9;">Ver plan →</a>
        <p style="font-size:11px;color:#334155;margin-top:24px;">Pulse Motor · pulsemotor.co</p>
      </div>
    `,
  })
}

async function enviarEmailReactivacion(email: string, nombre: string, tipo: string) {
  const esExtranya = tipo === 'extranya'
  await resend.emails.send({
    from: 'Pulse Motor <agente@ventas10x.co>',
    to: email,
    subject: esExtranya
      ? `🤖 Tu agente Pulse Motor te extraña, ${nombre}`
      : `⚡ Seguí respondiendo leads — tenés créditos nuevos`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080f1a;color:#f8fafc;padding:32px;border-radius:12px;">
        <div style="font-size:32px;margin-bottom:16px;">${esExtranya ? '🤖' : '⚡'}</div>
        <h2 style="font-size:20px;margin:0 0 12px;">
          ${esExtranya ? `Tu agente te extraña, ${nombre}` : `Nuevos créditos disponibles`}
        </h2>
        <p style="font-size:15px;color:#94a3b8;line-height:1.6;margin-bottom:24px;">
          ${esExtranya
            ? `Hace un tiempo que no usás tu agente Pulse Motor. Te dejamos <strong style="color:#10b981;">200 créditos</strong> para que vuelvas a responder leads automáticamente — sin perderte ninguno.`
            : `Depositamos créditos extra en tu cuenta para que sigas sin interrupciones. Tu agente está listo para responder.`
          }
        </p>
        <a href="https://pulsemotor.co/pulse/agente" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;margin-bottom:20px;">
          Reactivar mi agente →
        </a>
        <div style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.2);border-radius:10px;padding:16px;margin-bottom:16px;">
          <p style="margin:0;font-size:13px;color:#7dd3fc;">
            💡 <strong>Tip:</strong> Activá el plan por $99.000/mes y nunca más te preocupés por créditos.
          </p>
        </div>
        <a href="https://pulsemotor.co/pulse/pricing" style="font-size:13px;color:#0ea5e9;">Ver precios →</a>
        <p style="font-size:11px;color:#334155;margin-top:24px;">Pulse Motor · pulsemotor.co</p>
      </div>
    `,
  })
}

async function enviarEmailSinCreditos(email: string, nombre: string) {
  await resend.emails.send({
    from: 'Pulse Motor <agente@ventas10x.co>',
    to: email,
    subject: `🔴 Tu agente Pulse Motor está pausado — sin créditos`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080f1a;color:#f8fafc;padding:32px;border-radius:12px;">
        <div style="font-size:32px;margin-bottom:16px;">🔴</div>
        <h2 style="font-size:20px;margin:0 0 12px;">Tu agente está pausado, ${nombre}</h2>
        <p style="font-size:15px;color:#94a3b8;line-height:1.6;margin-bottom:24px;">
          Usaste todos tus créditos gratuitos — eso significa que tu agente respondió muchos leads. 🎉<br/><br/>
          Para seguir sin perder ningún lead, activá tu plan por <strong style="color:#10b981;">$99.000/mes</strong>.
        </p>
        <a href="https://pulsemotor.co/pulse/pricing" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          Activar plan — $99.000/mes →
        </a>
        <p style="font-size:12px;color:#475569;margin-top:16px;">Sin tarjeta para empezar · Cancelás cuando querás</p>
        <p style="font-size:11px;color:#334155;margin-top:24px;">Pulse Motor · pulsemotor.co</p>
      </div>
    `,
  })
}
