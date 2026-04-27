// Ruta destino: src/app/api/admin/pagos/[id]/rechazar/route.ts
// Endpoint admin: rechaza un pago + envía email al vendedor

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { PLANES, formatearCOP, type Plan } from '@/lib/suscripciones'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: pagoId } = await params
    const body = await req.json()
    const motivo = (body.motivo || '').trim()

    if (!motivo || motivo.length < 5) {
      return NextResponse.json(
        { error: 'Debes especificar un motivo (mínimo 5 caracteres)' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pago } = await (supabaseService.from('pagos') as any)
      .select('*')
      .eq('id', pagoId)
      .single()

    if (!pago) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

    if (pago.estado !== 'pendiente') {
      return NextResponse.json(
        { error: `Este pago ya está ${pago.estado}` },
        { status: 400 }
      )
    }

    // Marcar como rechazado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseService.from('pagos') as any)
      .update({
        estado: 'rechazado',
        motivo_rechazo: motivo,
        aprobado_por: admin.userId,
        aprobado_at: new Date().toISOString(),
      })
      .eq('id', pagoId)

    // Email al vendedor
    try {
      const { data: { user } } = await supabaseService.auth.admin.getUserById(pago.vendedor_id)
      const vendedorEmail = user?.email

      if (vendedorEmail) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabaseService.from('profiles') as any)
          .select('nombre, apellido')
          .eq('id', pago.vendedor_id)
          .single()

        const vendedorNombre = profile
          ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Asesor'
          : 'Asesor'

        const planConfig = PLANES[pago.plan as Plan]

        await resend.emails.send({
          from: 'Ventas10x <notificaciones@ventas10x.co>',
          to: vendedorEmail,
          subject: `⚠️ Hubo un problema con tu pago de Plan ${planConfig.nombre}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f9;padding:2rem;">
              <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);border-radius:16px;padding:2rem;margin-bottom:1.5rem;color:#fff;">
                <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;">⚠️ Tu pago no pudo ser confirmado</h1>
                <p style="margin:0;opacity:.9;">Hola ${vendedorNombre}, hubo un problema validando tu comprobante.</p>
              </div>
              <div style="background:#fff;border-radius:16px;padding:1.5rem;margin-bottom:1rem;">
                <h3 style="margin:0 0 .75rem;color:#111827;font-size:15px;">Detalle</h3>
                <table style="width:100%;font-size:14px;margin-bottom:1rem;">
                  <tr><td style="padding:6px 0;color:#9ca3af;width:140px;">Plan intentado</td><td style="color:#111827;">${planConfig.emoji} ${planConfig.nombre}</td></tr>
                  <tr><td style="padding:6px 0;color:#9ca3af;">Monto</td><td style="color:#111827;">${formatearCOP(pago.monto)}</td></tr>
                </table>
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:.85rem 1rem;font-size:13px;color:#991b1b;">
                  <strong>Motivo del rechazo:</strong><br/>${motivo}
                </div>
              </div>
              <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:1rem 1.25rem;margin-bottom:1rem;font-size:13px;color:#92400e;">
                💡 <strong>Qué hacer:</strong> Verifica el comprobante e intenta de nuevo. Si crees que es un error, responde este email y te ayudamos.
              </div>
              <a href="${BASE_URL}/dashboard/planes" style="display:block;background:#FF6B2B;color:#fff;text-align:center;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;font-size:16px;">
                Reintentar pago →
              </a>
            </div>
          `,
        })
      }
    } catch (e) {
      console.error('[admin/rechazar] Error email:', e)
    }

    return NextResponse.json({
      ok: true,
      mensaje: '✗ Pago rechazado',
    })
  } catch (error) {
    console.error('[admin/rechazar] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
