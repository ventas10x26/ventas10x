// src/app/api/pulse/creditos/consumir/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import {
  CREDITOS_CONFIG,
  ACCIONES_FACTURABLES,
  creditosACop,
  formatearCop,
  type AccionCredito,
} from '@/lib/pulse/creditos-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { accion, metadata } = await req.json() as {
      accion: string
      metadata?: Record<string, unknown>
    }

    // El user_id sale de la sesión, nunca del body. Antes se tomaba del JSON sin
    // validar nada y este handler escribe con service role, así que cualquiera
    // podía vaciarle el saldo a otra cuenta mandando su id. Con el cobro por
    // resultado cada llamada vale 100–250 créditos en vez de 2, así que el
    // agujero pasaba de molesto a caro.
    const sb = await createServerClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const user_id = user.id

    if (!accion) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    // Obtener costo de la acción
    const accionKey = accion.toUpperCase() as AccionCredito
    const costo = CREDITOS_CONFIG.COSTO[accionKey] ?? 0

    // Si costo = 0, no descontar pero registrar
    if (costo === 0) {
      return NextResponse.json({ ok: true, costo: 0, sin_descuento: true })
    }

    // Un resultado se cobra una sola vez por lead. Sin esta guarda, arrastrar
    // una tarjeta fuera de "Test Drive" y devolverla cobraría dos citas, y el
    // concesionario no tendría forma de saber por qué se le fue el saldo.
    const leadId = metadata?.lead_id
    if ((ACCIONES_FACTURABLES as readonly string[]).includes(accionKey)) {
      if (!leadId) {
        return NextResponse.json(
          { error: 'falta_lead_id', detalle: 'Un resultado facturable necesita metadata.lead_id para no cobrarse dos veces' },
          { status: 400 }
        )
      }
      const { data: yaCobrado, error: errorGuarda } = await supabase
        .from('pulse_creditos_log')
        .select('id')
        .eq('user_id', user_id)
        .eq('accion', accion.toLowerCase())
        .eq('metadata->>lead_id', String(leadId))
        .maybeSingle()

      // Falla cerrado a propósito: si la guarda de idempotencia no se puede evaluar,
      // no cobramos. Cobrar de más por un error nuestro le rompe la confianza al
      // concesionario de una forma que no se arregla devolviendo el crédito; dejar
      // de cobrar una cita, sí.
      if (errorGuarda) {
        console.error('[creditos/consumir] guarda de idempotencia fallo, no se cobra:', errorGuarda)
        const { data: actual } = await supabase
          .from('pulse_creditos').select('saldo').eq('user_id', user_id).single()
        return NextResponse.json({
          ok: true, costo: 0, guarda_indisponible: true, saldo: actual?.saldo ?? 0,
        })
      }

      if (yaCobrado) {
        const { data: actual } = await supabase
          .from('pulse_creditos').select('saldo').eq('user_id', user_id).single()
        return NextResponse.json({
          ok: true, costo: 0, ya_cobrado: true, saldo: actual?.saldo ?? 0,
        })
      }
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

// GET — consultar el saldo propio. También sale de la sesión: con el user_id por
// query string, cualquiera podía leer el saldo de cualquier cuenta.
export async function GET() {
  const sb = await createServerClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user_id = user.id

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

    const citasRestantes = Math.floor(saldo / CREDITOS_CONFIG.COSTO.CITA_AGENDADA)

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pulse Motor <agente@ventas10x.co>',
        to: email,
        subject: citasRestantes > 0
          ? `Te queda saldo para ${citasRestantes} cita${citasRestantes === 1 ? '' : 's'} más`
          : 'Tu saldo no alcanza para la próxima cita',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0B0D0C;color:#f8fafc;padding:32px;border-radius:8px;">
            <div style="width:32px;height:32px;border-radius:6px;background:linear-gradient(135deg,#2563EB,#1D4ED8);display:flex;align-items:center;justify-content:center;font-size:17px;margin-bottom:16px;">⚡</div>
            <h2 style="font-size:20px;margin:0 0 12px;">Te quedan ${saldo} créditos</h2>
            <p style="font-size:15px;color:#94a3b8;line-height:1.6;margin-bottom:24px;">
              Tu agente sigue conversando gratis — responder mensajes no consume saldo.
              Pero ${citasRestantes > 0
                ? `con este saldo cubrís <strong style="color:#fff;">${citasRestantes} cita${citasRestantes === 1 ? '' : 's'}</strong> más.`
                : 'no alcanza para cobrar la próxima cita que agende.'}
              Cargá saldo desde ${formatearCop(creditosACop(CREDITOS_CONFIG.COSTO.CITA_AGENDADA))} por cita.
            </p>
            <a href="https://pulsemotor.co/pulse/pricing" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;">
              Cargar saldo →
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
