// Ruta destino: src/app/api/pagos/subir-comprobante/route.ts
// Endpoint para que el vendedor suba un comprobante de pago Nequi.
// Crea registro en tabla pagos con estado 'pendiente'.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { PLANES, formatearCOP } from '@/lib/suscripciones'
import type { Plan, Periodo } from '@/lib/suscripciones'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

// ⚠️ CAMBIA por tu email donde quieres recibir notificaciones
const ADMIN_EMAIL = 'ricaza81@gmail.com'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const formData = await req.formData()
    const plan = formData.get('plan') as Plan
    const periodo = formData.get('periodo') as Periodo
    const notas = (formData.get('notas') as string) || ''
    const file = formData.get('comprobante') as File | null

    // Validaciones
    if (!plan || !PLANES[plan]) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    }
    if (plan === 'trial' || plan === 'enterprise') {
      return NextResponse.json({ error: 'Este plan no se paga directamente' }, { status: 400 })
    }
    if (!periodo || !['mensual', 'anual'].includes(periodo)) {
      return NextResponse.json({ error: 'Periodo inválido' }, { status: 400 })
    }
    if (!file || !file.size) {
      return NextResponse.json({ error: 'Falta el comprobante' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo supera 5MB' }, { status: 400 })
    }

    const planConfig = PLANES[plan]
    const monto = periodo === 'anual' ? planConfig.precioAnual : planConfig.precioMensual

    // Subir el comprobante a Storage
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const storagePath = `${user.id}/${timestamp}.${ext}`
    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabaseService.storage
      .from('comprobantes-pago')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[pagos] Error subiendo:', uploadError)
      return NextResponse.json(
        { error: `Error subiendo comprobante: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // URL firmada (privada, válida 7 días para que admin la vea)
    const { data: signedUrl } = await supabaseService.storage
      .from('comprobantes-pago')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

    // Insertar registro de pago
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pago, error: insertError } = await (supabaseService.from('pagos') as any)
      .insert({
        vendedor_id: user.id,
        plan,
        periodo,
        monto,
        comprobante_url: signedUrl?.signedUrl || null,
        comprobante_storage_path: storagePath,
        notas_vendedor: notas.trim() || null,
        estado: 'pendiente',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[pagos] Error insertando:', insertError)
      // Intentar borrar el archivo subido
      await supabaseService.storage
        .from('comprobantes-pago')
        .remove([storagePath])
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Notificar al admin por email
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabaseService.from('profiles') as any)
        .select('nombre, apellido, empresa, slug')
        .eq('id', user.id)
        .single()

      const nombreVendedor = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || user.email
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'

      await resend.emails.send({
        from: 'Ventas10x <notificaciones@ventas10x.co>',
        to: ADMIN_EMAIL,
        subject: `💰 Nuevo pago: ${nombreVendedor} · ${formatearCOP(monto)} · Plan ${planConfig.nombre}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f9;padding:2rem;">
            <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:16px;padding:2rem;margin-bottom:1.5rem;color:#fff;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;">💰 NUEVO PAGO</h1>
              <p style="margin:0;opacity:.9;">Un vendedor subió su comprobante de pago</p>
            </div>
            <div style="background:#fff;border-radius:16px;padding:1.5rem;margin-bottom:1rem;">
              <h2 style="margin:0 0 1rem;font-size:16px;color:#111827;">Datos del pago</h2>
              <table style="width:100%;font-size:14px;">
                <tr><td style="padding:8px 0;color:#9ca3af;width:120px;">👤 Vendedor</td><td style="font-weight:600;color:#111827;">${nombreVendedor}</td></tr>
                <tr><td style="padding:8px 0;color:#9ca3af;">📧 Email</td><td style="color:#111827;">${user.email}</td></tr>
                ${profile?.empresa ? `<tr><td style="padding:8px 0;color:#9ca3af;">🏢 Empresa</td><td style="color:#111827;">${profile.empresa}</td></tr>` : ''}
                ${profile?.slug ? `<tr><td style="padding:8px 0;color:#9ca3af;">🔗 Slug</td><td style="color:#111827;">/u/${profile.slug}</td></tr>` : ''}
                <tr><td style="padding:8px 0;color:#9ca3af;">📦 Plan</td><td style="font-weight:700;color:#FF6B2B;">${planConfig.nombre} (${periodo})</td></tr>
                <tr><td style="padding:8px 0;color:#9ca3af;">💵 Monto</td><td style="font-weight:800;color:#10b981;font-size:18px;">${formatearCOP(monto)}</td></tr>
                ${notas.trim() ? `<tr><td style="padding:8px 0;color:#9ca3af;vertical-align:top;">📝 Notas</td><td style="color:#111827;font-style:italic;">"${notas}"</td></tr>` : ''}
              </table>
            </div>
            ${signedUrl?.signedUrl ? `
              <div style="background:#fff;border-radius:16px;padding:1.5rem;margin-bottom:1rem;text-align:center;">
                <p style="margin:0 0 1rem;color:#6b7280;font-size:13px;">📎 Comprobante adjunto</p>
                <a href="${signedUrl.signedUrl}" style="display:block;color:#FF6B2B;text-decoration:underline;font-weight:600;font-size:14px;">Ver comprobante →</a>
              </div>
            ` : ''}
            <a href="${baseUrl}/admin/pagos/${pago.id}" style="display:block;background:#FF6B2B;color:#fff;text-align:center;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;font-size:16px;">
              ✅ Revisar y aprobar →
            </a>
          </div>
        `,
      })
    } catch (e) {
      console.error('[pagos] Error notificando admin:', e)
      // No bloqueamos, el pago se guardó OK
    }

    return NextResponse.json({
      ok: true,
      pago_id: pago.id,
      mensaje: '¡Comprobante recibido! Lo revisaremos en las próximas horas y activaremos tu plan.',
    })
  } catch (error) {
    console.error('[pagos] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
