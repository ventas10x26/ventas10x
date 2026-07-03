import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      razon_social: string
      nit?: string
      ciudad: string
      telefono: string
      email: string
      marcas?: string[]
      num_asesores?: number
      modulos?: string[]
    }

    const { razon_social, nit, ciudad, telefono, email, marcas, num_asesores, modulos } = body

    if (!razon_social || !ciudad || !telefono || !email) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('pulse_concesionarios_leads') as any)
      .insert({
        razon_social: razon_social.trim(),
        nit:          nit?.trim() || null,
        ciudad:       ciudad.trim(),
        telefono:     telefono.trim(),
        email:        email.trim().toLowerCase(),
        marcas:       marcas || [],
        num_asesores: num_asesores || 1,
        modulos:      modulos || [],
        estado:       'nuevo',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[concesionario/solicitud] DB error:', error)
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    // Email a Ricardo
    await resend.emails.send({
      from:    'Pulse Motor <agente@ventas10x.co>',
      to:      'ricaza81@gmail.com',
      subject: `🏢 Nuevo concesionario: ${razon_social} — ${ciudad}`,
      html: `
        <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;background:#0d1b2e;color:#f8fafc;padding:32px;border-radius:16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
            <div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#10b981,#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:18px">⚡</div>
            <span style="font-size:18px;font-weight:800;letter-spacing:-.3px">Pulse Motor</span>
          </div>
          <h2 style="font-size:20px;font-weight:800;margin:0 0 16px">Nuevo lead — DataBridge 360</h2>
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;width:140px">Empresa</td><td style="padding:8px 0;font-weight:600">${razon_social}</td></tr>
            ${nit ? `<tr><td style="padding:8px 0;color:#64748b">NIT</td><td style="padding:8px 0">${nit}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#64748b">Ciudad</td><td style="padding:8px 0">${ciudad}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Teléfono</td><td style="padding:8px 0"><a href="https://wa.me/${telefono.replace(/\D/g,'')}" style="color:#25d366">${telefono}</a></td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#0ea5e9">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#64748b">Asesores</td><td style="padding:8px 0">${num_asesores || 1}</td></tr>
            ${marcas?.length ? `<tr><td style="padding:8px 0;color:#64748b">Marcas</td><td style="padding:8px 0">${marcas.join(', ')}</td></tr>` : ''}
            ${modulos?.length ? `<tr><td style="padding:8px 0;color:#64748b">Módulos</td><td style="padding:8px 0">${modulos.join(', ')}</td></tr>` : ''}
          </table>
          <div style="margin-top:20px;padding:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;font-size:13px;color:#6ee7b7">
            Lead ID: ${data?.id}
          </div>
        </div>
      `,
    })

    // Email de confirmación al lead
    await resend.emails.send({
      from:    'Ricardo — Pulse Motor <agente@ventas10x.co>',
      to:      email,
      subject: `${razon_social}, recibimos tu solicitud — DataBridge 360`,
      html: `
        <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;background:#0d1b2e;color:#f8fafc;padding:32px;border-radius:16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
            <div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#10b981,#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:18px">⚡</div>
            <span style="font-size:18px;font-weight:800">Pulse Motor</span>
          </div>
          <h2 style="font-size:20px;font-weight:800;margin:0 0 12px">Recibimos tu solicitud</h2>
          <p style="font-size:15px;color:#94a3b8;line-height:1.7;margin:0 0 20px">Hola, gracias por tu interés en DataBridge 360 para <strong style="color:#f8fafc">${razon_social}</strong>. Te contactamos en menos de 24 horas para coordinar la demo.</p>
          <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:12px;padding:16px;margin-bottom:20px">
            <p style="font-size:12px;font-weight:700;color:#10b981;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px">Qué sigue</p>
            <p style="font-size:13px;color:#94a3b8;line-height:1.7;margin:0">1. Revisamos tu solicitud y los módulos seleccionados<br>2. Te enviamos un link para agendar la demo<br>3. Demo personalizada con tu equipo — sin compromiso</p>
          </div>
          <p style="font-size:12px;color:#334155">¿Tenés preguntas? Respondé este email o escribinos por WhatsApp.</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e) {
    console.error('[concesionario/solicitud]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
