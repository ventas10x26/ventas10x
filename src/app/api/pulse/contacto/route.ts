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
    const { nombre, email, telefono } = await req.json()

    if (!nombre || !email || !telefono) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    // 1. Guardar en Supabase
    const { error: dbError } = await supabase
      .from('pulse_contactos')
      .insert({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        fuente: 'landing_como_funciona',
        created_at: new Date().toISOString(),
      })

    if (dbError) {
      console.error('[pulse/contacto] Supabase error:', dbError)
      // No bloqueamos — igual enviamos el email de notificación
    }

    // 2. Notificar por email a Ricardo
    await resend.emails.send({
      from: 'Pulse Motor <agente@ventas10x.co>',
      to: 'ricaza81@gmail.com',
      subject: `🚀 Nuevo contacto Pulse Motor: ${nombre}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #080f1a; color: #f8fafc; padding: 32px; border-radius: 12px;">
          <div style="font-size: 13px; color: #0ea5e9; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 16px;">
            🤝 Nuevo prospecto desde la landing
          </div>
          <h2 style="margin: 0 0 24px; font-size: 22px; color: #f8fafc;">${nombre} quiere su agente</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #94a3b8; font-size: 13px; width: 120px;">Nombre</td>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: 600;">${nombre}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #94a3b8; font-size: 13px;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08);"><a href="mailto:${email}" style="color: #0ea5e9;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; font-size: 13px;">WhatsApp</td>
              <td style="padding: 10px 0;"><a href="https://wa.me/${telefono.replace(/\D/g, '')}" style="color: #10b981; font-weight: 600;">${telefono}</a></td>
            </tr>
          </table>

          <div style="margin-top: 28px; padding: 16px; background: rgba(14,165,233,0.08); border: 1px solid rgba(14,165,233,0.2); border-radius: 8px; font-size: 13px; color: #94a3b8; line-height: 1.6;">
            💡 Acordate de contactar en menos de 24 horas para mantener el momentum.
          </div>

          <a href="https://wa.me/${telefono.replace(/\D/g, '')}"
            style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #0ea5e9, #10b981); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
            Escribirle por WhatsApp →
          </a>

          <p style="margin-top: 24px; font-size: 11px; color: #334155;">
            Pulse Motor · pulsemotor.co · Fuente: landing sección "Lo hacemos juntos"
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[pulse/contacto] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
