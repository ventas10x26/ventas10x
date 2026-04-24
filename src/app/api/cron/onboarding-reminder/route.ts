import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  // Verificar que viene de Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  // Usuarios registrados entre 24h y 48h sin empresa (onboarding incompleto)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nombre, created_at')
    .is('empresa', null)
    .gte('created_at', hace48h)
    .lte('created_at', hace24h)

  if (!profiles?.length) {
    return NextResponse.json({ message: 'No hay usuarios pendientes' })
  }

  let enviados = 0

  for (const profile of profiles) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
      const email = authUser?.user?.email
      if (!email) continue

      // Verificar que no tenga bots
      const { data: bots } = await supabase
        .from('bots').select('id').eq('user_id', profile.id).limit(1)
      if (bots?.length) continue

      const firstName = profile.nombre || email.split('@')[0]

      await resend.emails.send({
        from: 'Ricardo de Ventas10x <ricardo@ventas10x.co>',
        to: email,
        subject: `${firstName}, tu Bot IA te está esperando 🤖`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f9;padding:2rem;">
            <div style="background:#0f1c2e;border-radius:20px;padding:2.5rem;margin-bottom:1.5rem;text-align:center;">
              <div style="font-size:48px;margin-bottom:1rem;">🤖</div>
              <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 10px;">
                ${firstName}, tu bot sigue esperando
              </h1>
              <p style="color:rgba(255,255,255,.65);font-size:15px;margin:0;line-height:1.6;">
                Creaste tu cuenta ayer pero aún no configuraste tu Bot IA.<br/>
                <strong style="color:#FF6B2B;">Solo toma 5 minutos.</strong>
              </p>
            </div>
            <div style="background:#fff;border-radius:16px;padding:1.75rem;margin-bottom:1.5rem;border:0.5px solid #e5e7eb;">
              <h2 style="font-size:16px;font-weight:800;color:#111827;margin:0 0 1rem;">Lo que te estás perdiendo:</h2>
              <div style="display:flex;flex-direction:column;gap:.875rem;">
                <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">📱</span><span style="font-size:14px;color:#374151;">Leads llegando a tu WhatsApp mientras duermes</span></div>
                <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">🎯</span><span style="font-size:14px;color:#374151;">Prospectos calificados listos para cerrar</span></div>
                <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:20px;">⚡</span><span style="font-size:14px;color:#374151;">Respuestas automáticas 24/7 sin esfuerzo</span></div>
              </div>
            </div>
            <a href="https://ventas10x.co/onboarding" style="display:block;background:#FF6B2B;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:14px;font-weight:700;font-size:16px;margin-bottom:1rem;">
              🚀 Configurar mi Bot IA ahora →
            </a>
            <div style="background:#fff;border-radius:16px;padding:1.25rem;border:0.5px solid #e5e7eb;margin-bottom:1.5rem;">
              <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">
                ¿Necesitas ayuda? Escríbeme al <a href="https://wa.me/573004339418" style="color:#FF6B2B;font-weight:600;">WhatsApp</a> o responde este email.
              </p>
              <div style="margin-top:1rem;display:flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;border-radius:50%;background:#FF6B2B;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;">R</div>
                <div>
                  <div style="font-size:13px;font-weight:700;color:#111827;">Ricardo Zambrano</div>
                  <div style="font-size:12px;color:#9ca3af;">Fundador · Ventas10x</div>
                </div>
              </div>
            </div>
            <p style="text-align:center;color:#9ca3af;font-size:12px;">
              Ventas10x · <a href="https://ventas10x.co" style="color:#FF6B2B;">ventas10x.co</a>
            </p>
          </div>
        `,
      })
      enviados++
    } catch (e) {
      console.error('reminder error:', e)
    }
  }

  return NextResponse.json({ message: `Recordatorios enviados: ${enviados}` })
}
