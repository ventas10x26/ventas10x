// Ruta destino: src/app/api/admin/pagos/[id]/aprobar/route.ts
// Endpoint admin: aprueba un pago + activa el plan + envía email al vendedor

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { PLANES, formatearCOP, type Plan, type Periodo } from '@/lib/suscripciones'
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
    // Verificar que es admin
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id: pagoId } = await params

    // Obtener el pago
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pago, error: pagoError } = await (supabaseService.from('pagos') as any)
      .select('*')
      .eq('id', pagoId)
      .single()

    if (pagoError || !pago) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    if (pago.estado !== 'pendiente') {
      return NextResponse.json(
        { error: `Este pago ya está ${pago.estado}` },
        { status: 400 }
      )
    }

    // Calcular fecha_fin según el periodo
    const ahora = new Date()
    const fechaFin = new Date(ahora)
    if (pago.periodo === 'anual') {
      fechaFin.setFullYear(fechaFin.getFullYear() + 1)
    } else {
      fechaFin.setMonth(fechaFin.getMonth() + 1)
    }

    // Verificar si ya tiene suscripción activa para extenderla
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subActual } = await (supabaseService.from('suscripciones') as any)
      .select('*')
      .eq('vendedor_id', pago.vendedor_id)
      .eq('estado', 'activa')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let suscripcionId: string | null = null

    if (subActual && subActual.plan !== 'trial' && new Date(subActual.fecha_fin) > ahora) {
      // Extender suscripción existente desde su fecha_fin actual
      const nuevaFechaFin = new Date(subActual.fecha_fin)
      if (pago.periodo === 'anual') {
        nuevaFechaFin.setFullYear(nuevaFechaFin.getFullYear() + 1)
      } else {
        nuevaFechaFin.setMonth(nuevaFechaFin.getMonth() + 1)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: subActualizada } = await (supabaseService.from('suscripciones') as any)
        .update({
          plan: pago.plan,           // upgrade si cambió
          periodo: pago.periodo,
          fecha_fin: nuevaFechaFin.toISOString(),
          estado: 'activa',
        })
        .eq('id', subActual.id)
        .select()
        .single()

      suscripcionId = subActualizada?.id ?? subActual.id
    } else {
      // Cancelar trial/vencidas anteriores
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseService.from('suscripciones') as any)
        .update({ estado: 'cancelada' })
        .eq('vendedor_id', pago.vendedor_id)
        .eq('estado', 'activa')

      // Crear suscripción nueva
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: nuevaSub, error: subError } = await (supabaseService.from('suscripciones') as any)
        .insert({
          vendedor_id: pago.vendedor_id,
          plan: pago.plan,
          periodo: pago.periodo,
          estado: 'activa',
          fecha_inicio: ahora.toISOString(),
          fecha_fin: fechaFin.toISOString(),
        })
        .select()
        .single()

      if (subError) {
        console.error('[admin/aprobar] Error creando sub:', subError)
        return NextResponse.json({ error: subError.message }, { status: 500 })
      }
      suscripcionId = nuevaSub?.id ?? null
    }

    // Marcar el pago como aprobado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseService.from('pagos') as any)
      .update({
        estado: 'aprobado',
        suscripcion_id: suscripcionId,
        aprobado_por: admin.userId,
        aprobado_at: ahora.toISOString(),
      })
      .eq('id', pagoId)

    // Enviar email al vendedor
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
        const periodoLabel = pago.periodo === 'anual' ? '1 año' : '1 mes'
        const fechaFinFormateada = (subActual && subActual.plan !== 'trial' && new Date(subActual.fecha_fin) > ahora
          ? new Date(subActual.fecha_fin)
          : fechaFin
        ).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

        await resend.emails.send({
          from: 'Ventas10x <notificaciones@ventas10x.co>',
          to: vendedorEmail,
          subject: `✅ Tu plan ${planConfig.nombre} está activo`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f9;padding:2rem;">
              <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:16px;padding:2rem;margin-bottom:1.5rem;color:#fff;">
                <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;">✅ ¡Plan activado!</h1>
                <p style="margin:0;opacity:.9;">Hola ${vendedorNombre}, tu pago fue aprobado.</p>
              </div>
              <div style="background:#fff;border-radius:16px;padding:1.5rem;margin-bottom:1rem;">
                <table style="width:100%;font-size:14px;">
                  <tr>
                    <td style="padding:8px 0;color:#9ca3af;width:140px;">Plan</td>
                    <td style="font-weight:800;color:#FF6B2B;font-size:18px;">${planConfig.emoji} ${planConfig.nombre}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#9ca3af;">Periodo</td>
                    <td style="color:#111827;text-transform:capitalize;">${pago.periodo} (${periodoLabel})</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#9ca3af;">Monto pagado</td>
                    <td style="font-weight:700;color:#10b981;">${formatearCOP(pago.monto)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#9ca3af;">Acceso hasta</td>
                    <td style="font-weight:700;color:#0f1c2e;">${fechaFinFormateada}</td>
                  </tr>
                </table>
              </div>
              <div style="background:linear-gradient(135deg,#fff7ed 0%,#fed7aa 100%);border-radius:12px;padding:1rem 1.25rem;margin-bottom:1rem;font-size:13px;color:#7c2d12;">
                💡 <strong>Tip:</strong> Configura las notificaciones por email para no perderte ningún lead.
              </div>
              <a href="${BASE_URL}/dashboard" style="display:block;background:#FF6B2B;color:#fff;text-align:center;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;font-size:16px;margin-bottom:1rem;">
                Ir a mi dashboard →
              </a>
              <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:1rem;">
                ¿Preguntas? Responde este email · ventas10x.co
              </p>
            </div>
          `,
        })
      }
    } catch (e) {
      console.error('[admin/aprobar] Error email:', e)
      // No bloqueamos, el pago ya se aprobó OK
    }

    return NextResponse.json({
      ok: true,
      mensaje: '✅ Pago aprobado y plan activado',
      suscripcion_id: suscripcionId,
    })
  } catch (error) {
    console.error('[admin/aprobar] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
