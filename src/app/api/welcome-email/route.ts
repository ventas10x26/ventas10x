import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { nombre, email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    const firstName = nombre?.split(' ')[0] || 'Vendedor'

    await resend.emails.send({
      from: 'Ricardo de Ventas10x <ricardo@ventas10x.co>',
      to: email,
      subject: `¡Bienvenido a Ventas10x, ${firstName}! 🚀 Tu bot IA te espera`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f9;padding:2rem;">

          <div style="background:#0f1c2e;border-radius:20px;padding:2.5rem;margin-bottom:1.5rem;text-align:center;">
            <div style="margin-bottom:1.5rem;">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin:0 auto;">
                <rect width="52" height="52" rx="13" fill="#FF6B2B"/>
                <rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/>
                <rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/>
                <rect x="28" y="16" width="7" height="28" rx="2" fill="white"/>
              </svg>
            </div>
            <h1 style="color:#fff;font-size:26px;font-weight:800;margin:0 0 10px;letter-spacing:-.02em;">
              ¡Bienvenido a Ventas<span style="color:#FF6B2B">10x</span>, ${firstName}!
            </h1>
            <p style="color:rgba(255,255,255,.65);font-size:16px;margin:0;line-height:1.6;">
              Tu cuenta está activa. Tienes <strong style="color:#FF6B2B;">14 días gratis</strong> para explorar todo.
            </p>
          </div>

          <div style="background:#fff;border-radius:16px;padding:2rem;margin-bottom:1.5rem;border:0.5px solid #e5e7eb;">
            <h2 style="font-size:18px;font-weight:800;color:#111827;margin:0 0 1.25rem;">¿Por dónde empezar?</h2>
            <div style="display:flex;flex-direction:column;gap:1rem;">
              <div style="display:flex;align-items:flex-start;gap:12px;padding:14px;background:#f9fafb;border-radius:12px;">
                <div style="width:36px;height:36px;border-radius:10px;background:#fff7f3;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">👤</div>
                <div>
                  <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:3px;">1. Completa tu perfil</div>
                  <div style="font-size:13px;color:#6b7280;">Configura tu empresa e industria para personalizar tu experiencia.</div>
                </div>
              </div>
              <div style="display:flex;align-items:flex-start;gap:12px;padding:14px;background:#f9fafb;border-radius:12px;">
                <div style="width:36px;height:36px;border-radius:10px;background:#fff7f3;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🤖</div>
                <div>
                  <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:3px;">2. Crea tu Bot IA</div>
                  <div style="font-size:13px;color:#6b7280;">Tu asistente que prospeta en WhatsApp 24/7. Listo en 5 minutos.</div>
                </div>
              </div>
              <div style="display:flex;align-items:flex-start;gap:12px;padding:14px;background:#f9fafb;border-radius:12px;">
                <div style="width:36px;height:36px;border-radius:10px;background:#fff7f3;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🔗</div>
                <div>
                  <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:3px;">3. Comparte tu link</div>
                  <div style="font-size:13px;color:#6b7280;">Tu landing personalizada lista para recibir prospectos hoy.</div>
                </div>
              </div>
            </div>
          </div>

          <a href="https://ventas10x.co/onboarding" style="display:block;background:#FF6B2B;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:14px;font-weight:700;font-size:16px;margin-bottom:1rem;">
            🚀 Completar mi configuración →
          </a>

          <div style="background:#fff;border-radius:16px;padding:1.5rem;border:0.5px solid #e5e7eb;margin-bottom:1.5rem;">
            <p style="font-size:14px;color:#374151;margin:0 0 8px;"><strong>¿Tienes preguntas?</strong></p>
            <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">
              Responde este email y te ayudo personalmente. También puedes escribirme al 
              <a href="https://wa.me/573004339418" style="color:#FF6B2B;font-weight:600;">WhatsApp</a>.
            </p>
            <div style="margin-top:1rem;display:flex;align-items:center;gap:10px;">
              <div style="width:40px;height:40px;border-radius:50%;background:#FF6B2B;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;">R</div>
              <div>
                <div style="font-size:13px;font-weight:700;color:#111827;">Ricardo Zambrano</div>
                <div style="font-size:12px;color:#9ca3af;">Fundador · Ventas10x</div>
              </div>
            </div>
          </div>

          <p style="text-align:center;color:#9ca3af;font-size:12px;">
            Ventas10x · <a href="https://ventas10x.co" style="color:#FF6B2B;">ventas10x.co</a><br/>
            Recibiste este email porque te registraste en Ventas10x.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('welcome-email error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
