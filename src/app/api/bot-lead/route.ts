import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { bot_id, vendedor_id: rawVendedorId, slug, nombre, whatsapp, producto, fuente, etapa } = await req.json()

    // Resolver vendedor_id desde slug si no viene
    let vendedor_id = rawVendedorId
    if (!vendedor_id && slug) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('slug', slug)
        .single()
      vendedor_id = profile?.id ?? null
    }

    // 1. Guardar lead en Supabase
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([{
        bot_id,
        vendedor_id,
        nombre,
        whatsapp,
        producto,
        fuente: fuente || 'bot_ia',
        etapa: etapa || 'nuevo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 2. Enviar email al vendedor
    if (vendedor_id) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre, apellido')
          .eq('id', vendedor_id)
          .single()

        const { data: authUser } = await supabase.auth.admin.getUserById(vendedor_id)
        const vendedorEmail = authUser?.user?.email

        if (vendedorEmail) {
          const vendedorNombre = profile
            ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Asesor'
            : 'Asesor'
          const waNum = (whatsapp || '').replace(/\D/g, '')
          const fuenteLabel = fuente === 'bot_landing' ? 'Bot Landing' : 'Bot IA'

          await resend.emails.send({
            from: 'Ventas10x <notificaciones@ventas10x.co>',
            to: vendedorEmail,
            subject: `🔥 Nuevo lead desde tu bot: ${nombre}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f9;padding:2rem;">
                <div style="background:#0f1c2e;border-radius:16px;padding:2rem;margin-bottom:1.5rem;">
                  <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 8px;">🔥 Nuevo lead desde tu bot</h1>
                  <p style="color:rgba(255,255,255,.7);margin:0;">Hola ${vendedorNombre}, tienes un nuevo prospecto listo para contactar.</p>
                </div>
                <div style="background:#fff;border-radius:16px;padding:1.5rem;margin-bottom:1rem;border:0.5px solid #e5e7eb;">
                  <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 1rem;">Datos del lead</h2>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px 0;color:#9ca3af;font-size:13px;width:120px;">👤 Nombre</td><td style="color:#111827;font-size:14px;font-weight:600;">${nombre}</td></tr>
                    <tr><td style="padding:8px 0;color:#9ca3af;font-size:13px;">📱 WhatsApp</td><td style="color:#111827;font-size:14px;font-weight:600;">${whatsapp}</td></tr>
                    ${producto ? `<tr><td style="padding:8px 0;color:#9ca3af;font-size:13px;">🎯 Interés</td><td style="color:#111827;font-size:14px;font-weight:600;">${producto}</td></tr>` : ''}
                    <tr><td style="padding:8px 0;color:#9ca3af;font-size:13px;">📍 Fuente</td><td style="color:#FF6B2B;font-size:14px;font-weight:700;">${fuenteLabel}</td></tr>
                  </table>
                </div>
                <a href="https://wa.me/${waNum}" style="display:block;background:#25D366;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:12px;font-weight:700;font-size:15px;margin-bottom:1rem;">
                  💬 Contactar por WhatsApp ahora →
                </a>
                <a href="https://ventas10x.co/dashboard/leads" style="display:block;background:#FF6B2B;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:12px;font-weight:700;font-size:15px;margin-bottom:1.5rem;">
                  Ver en mi dashboard →
                </a>
                <p style="text-align:center;color:#9ca3af;font-size:12px;">
                  Este email fue enviado por Ventas10x · <a href="https://ventas10x.co" style="color:#FF6B2B;">ventas10x.co</a>
                </p>
              </div>
            `,
          })
        }
      } catch (emailError) {
        console.error('bot-lead email error:', emailError)
      }
    }

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('bot-lead error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
