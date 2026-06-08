import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BOLD_SECRET = process.env.BOLD_SECRET_KEY!

// Bold firma el payload con HMAC-SHA256
function verificarFirma(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', BOLD_SECRET)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text()
    const signature = req.headers.get('x-bold-signature') ?? ''

    // Verificar autenticidad del webhook
    if (BOLD_SECRET && signature && !verificarFirma(rawBody, signature)) {
      console.warn('[bold/webhook] Firma inválida')
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    console.log('[bold/webhook] Evento recibido:', event.type, event.order_id)

    // Solo procesamos pagos aprobados
    if (event.type !== 'payment.approved' && event.status !== 'APPROVED') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    // order_id tiene formato: pulse_{userId}_{timestamp}
    const orderId = event.order_id as string
    const userId  = orderId.split('_')[1] ?? null

    if (!userId) {
      console.error('[bold/webhook] No se pudo extraer userId de order_id:', orderId)
      return NextResponse.json({ error: 'order_id inválido' }, { status: 400 })
    }

    // Guardar pago en tabla pulse_pagos
    const { error: pagoError } = await supabase
      .from('pulse_pagos')
      .insert({
        user_id:    userId,
        order_id:   orderId,
        amount:     event.amount ?? 9900000,
        currency:   'COP',
        status:     'approved',
        bold_data:  event,
        created_at: new Date().toISOString(),
      })

    if (pagoError) console.error('[bold/webhook] Error guardando pago:', pagoError)

    // Actualizar pulse_waitlist: marcar como pagado
    const { error: waitlistError } = await supabase
      .from('pulse_waitlist')
      .update({
        pagado:        true,
        fecha_pago:    new Date().toISOString(),
        plan_activo:   true,
      })
      .eq('user_id', userId)

    if (waitlistError) console.error('[bold/webhook] Error actualizando waitlist:', waitlistError)

    // Obtener email del usuario para enviar confirmación
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const email = userData?.user?.email

    if (email) {
      // Enviar email de confirmación via Resend
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Pulse Motor <agente@ventas10x.co>',
          to: email,
          subject: '✅ Pago confirmado — Tu agente Pulse Motor está activo',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080f1a;color:#f8fafc;padding:32px;border-radius:12px;">
              <div style="font-size:32px;margin-bottom:16px;">⚡</div>
              <h2 style="font-size:22px;margin:0 0 12px;color:#f8fafc;">¡Tu agente está activo!</h2>
              <p style="font-size:15px;color:#94a3b8;line-height:1.6;margin-bottom:24px;">
                Recibimos tu pago de <strong style="color:#10b981;">$99.000 COP</strong>. 
                Tu agente Pulse Motor ya está respondiendo leads en tu WhatsApp.
              </p>
              <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#6ee7b7;font-weight:600;">Referencia de pago: ${orderId}</p>
              </div>
              <a href="https://pulsemotor.co/pulse/agente" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#0ea5e9,#10b981);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
                Ir a mi panel →
              </a>
              <p style="font-size:11px;color:#334155;margin-top:24px;">Pulse Motor · pulsemotor.co</p>
            </div>
          `,
        }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[bold/webhook] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
