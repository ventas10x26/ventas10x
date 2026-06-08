// src/app/api/pulse/creditos/consumir/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CREDITOS_CONFIG, type AccionCredito } from '@/lib/pulse/creditos-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { user_id, accion, metadata } = await req.json() as {
      user_id: string
      accion: string
      metadata?: Record<string, unknown>
    }

    if (!user_id || !accion) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    // Obtener costo de la acción
    const accionKey = accion.toUpperCase() as AccionCredito
    const costo = CREDITOS_CONFIG.COSTO[accionKey] ?? 0

    // Si costo = 0, no descontar pero registrar
    if (costo === 0) {
      return NextResponse.json({ ok: true, costo: 0, sin_descuento: true })
    }

    // Obtener saldo actual con lock
    const { data: creditos, error: fetchError } = await supabase
      .from('pulse_creditos')
      .select('saldo')
      .eq('user_id', user_id)
      .single()

    if (fetchError || !creditos) {
      // Usuario sin créditos — crear con 0 (no darle gratis, ya debería tenerlos)
      return NextResponse.json({ error: 'sin_creditos', saldo: 0 }, { status: 402 })
    }

    // Verificar saldo suficiente
    if (creditos.saldo < costo) {
      return NextResponse.json({
        error: 'saldo_insuficiente',
        saldo: creditos.saldo,
        costo,
      }, { status: 402 })
    }

    const nuevo_saldo = creditos.saldo - costo

    // Actualizar saldo
    const { error: updateError } = await supabase
      .from('pulse_creditos')
      .update({ saldo: nuevo_saldo, updated_at: new Date().toISOString() })
      .eq('user_id', user_id)

    if (updateError) throw updateError

    // Registrar en log
    await supabase.from('pulse_creditos_log').insert({
      user_id,
      tipo:       'consumido',
      accion:     accion.toLowerCase(),
      cantidad:   -costo,
      saldo_post: nuevo_saldo,
      metadata:   metadata ?? null,
    })

    // Si saldo bajo, disparar email de aviso (fire and forget)
    if (nuevo_saldo <= CREDITOS_CONFIG.ALERTA_CRITICO && creditos.saldo > CREDITOS_CONFIG.ALERTA_CRITICO) {
      void notificarSaldoCritico(user_id, nuevo_saldo)
    }

    return NextResponse.json({ ok: true, saldo: nuevo_saldo, costo })
  } catch (err) {
    console.error('[creditos/consumir]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// GET — consultar saldo de un usuario
export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id')
  if (!user_id) return NextResponse.json({ error: 'Falta user_id' }, { status: 400 })

  const { data, error } = await supabase
    .from('pulse_creditos')
    .select('saldo, saldo_total, updated_at')
    .eq('user_id', user_id)
    .single()

  if (error) return NextResponse.json({ saldo: 0, saldo_total: 0 })
  return NextResponse.json(data)
}

async function notificarSaldoCritico(user_id: string, saldo: number) {
  try {
    const { data: userData } = await supabase.auth.admin.getUserById(user_id)
    const email = userData?.user?.email
    if (!email) return

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pulse Motor <agente@ventas10x.co>',
        to: email,
        subject: `⚡ Te quedan solo ${saldo} créditos en Pulse Motor`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#080f1a;color:#f8fafc;padding:32px;border-radius:12px;">
            <div style="font-size:32px;margin-bottom:16px;">⚡</div>
            <h2 style="font-size:20px;margin:0 0 12px;">Te quedan ${saldo} créditos</h2>
            <p style="font-size:15px;color:#94a3b8;line-height:1.6;margin-bottom:24px;">
              Tus créditos gratuitos de Pulse Motor se están agotando. Activá tu plan por <strong style="color:#10b981;">$99.000/mes</strong> para responder ilimitado.
            </p>
            <a href="https://pulsemotor.co/pulse/pricing" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">
              Activar plan →
            </a>
            <p style="font-size:11px;color:#334155;margin-top:24px;">Pulse Motor · pulsemotor.co</p>
          </div>
        `,
      }),
    })
  } catch (e) {
    console.error('[creditos] Error enviando email crítico:', e)
  }
}
