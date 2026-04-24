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
    const { bot_id, vendedor_id, nombre, whatsapp, producto, fuente, etapa } = await req.json()

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

    // 2. Obtener email del vendedor
    if (vendedor_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, nombre, apellido')
        .eq('id', vendedor_id)
        .single()

      const { data: authUser } = await supabase.auth.admin.getUserById(vendedor_id)
      const vendedorEmail = authUser?.user?.email

      if (vendedorEmail) {
        const vendedorNombre = profile
          ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Asesor'
          : 'Asesor'

        await resend.emails.send({
          from: 'Ventas10x <notificaciones@ventas10x.co>',
          to: vendedorEmail,
          subject: `🔥 Nuevo lead desde tu bot: ${nombre}`,
          html: `
            <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f4f6f9; padding: 2rem;">
              <div style="background: #0f1c2e; border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;">
                  <div style="background: #FF6B2B; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">🤖</div>
                  <div>
                    <div style="color: #fff; font-weight: 800; font-size: 18px;">Ventas10x</div>
                    <div style="color: rgba(255,255,255,.5); font-size: 12px;">Notificación de nuevo lead</div>
                  </div>
                </div>
                <h1 style="color: #fff; font-size: 22px; font-weight: 800; margin: 0 0 8px;">🔥 Nuevo lead desde tu bot</h1>
                <p style="color: rgba(255,255,255,.7); margin: 0;">Hola ${vendedorNombre}, tienes un nuevo prospecto listo para contactar.</p>
              </div>

              <div style="background: #fff; border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem; border: 0.5px solid #e5e7eb;">
                <h2 style="font-size: 16px; font-weight: 700; color: #111827; margin: 0 0 1rem;">Datos del lead</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #9ca3af; font-size: 13px; width: 120px;">👤 Nombre</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${nombre}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">📱 WhatsApp</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${whatsapp}</td>
                  </tr>
                  ${producto ? `
                  <tr>
                    <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">🎯 Interés</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${producto}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">📍 Fuente</td>
                    <td style="padding: 8px 0; color: #FF6B2B; font-size: 14px; font-weight: 700;">Bot IA</td>
                  </tr>
                </table>
              </div>

              <a href="https://wa.me/${whatsapp.replace(/\D/g, '')}" 
                style="display: block; background: #25D366; color: #fff; text-decoration: none; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 1rem;">
                💬 Contactar por WhatsApp ahora →
              </a>

              <a href="https://ventas10x.co/dashboard/leads" 
                style="display: block; background: #FF6B2B; color: #fff; text-decoration: none; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 1.5rem;">
                Ver en mi dashboard →
              </a>

              <p style="text-align: center; color: #9ca3af; font-size: 12px;">
                Este email fue enviado por Ventas10x · <a href="https://ventas10x.co" style="color: #FF6B2B;">ventas10x.co</a>
              </p>
            </div>
          `,
        })
      }
    }

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('bot-lead error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
