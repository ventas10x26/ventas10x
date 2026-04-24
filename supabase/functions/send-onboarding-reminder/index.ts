// supabase/functions/send-onboarding-reminder/index.ts
// Despliega con: supabase functions deploy send-onboarding-reminder
// Programa con: supabase functions schedule send-onboarding-reminder --schedule "0 10 * * *"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Buscar usuarios registrados hace más de 24h sin empresa (onboarding incompleto)
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nombre, apellido')
    .is('empresa', null)
    .gte('created_at', hace48h)
    .lte('created_at', hace24h)

  if (!profiles?.length) {
    return new Response(JSON.stringify({ message: 'No hay usuarios pendientes' }), { status: 200 })
  }

  let enviados = 0

  for (const profile of profiles) {
    // Obtener email del usuario
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
    const email = authUser?.user?.email
    if (!email) continue

    const firstName = profile.nombre || email.split('@')[0]

    // Verificar que no tenga bots tampoco
    const { data: bots } = await supabase
      .from('bots')
      .select('id')
      .eq('user_id', profile.id)
      .limit(1)

    if (bots?.length) continue // Ya tiene bot, no recordar

    // Enviar email de recordatorio
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
                ${[
                  { icon: '📱', text: 'Leads llegando a tu WhatsApp mientras duermes' },
                  { icon: '🎯', text: 'Prospectos calificados listos para cerrar' },
                  { icon: '⚡', text: 'Respuestas automáticas 24/7 sin esfuerzo' },
                ].map(i => `
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:20px;">${i.icon}</span>
                    <span style="font-size:14px;color:#374151;">${i.text}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <a href="https://ventas10x.co/onboarding" style="display:block;background:#FF6B2B;color:#fff;text-decoration:none;text-align:center;padding:16px;border-radius:14px;font-weight:700;font-size:16px;margin-bottom:1rem;">
              🚀 Configurar mi Bot IA ahora →
            </a>

            <div style="background:#fff;border-radius:16px;padding:1.25rem;border:0.5px solid #e5e7eb;margin-bottom:1.5rem;">
              <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">
                ¿Necesitas ayuda? Escríbeme directamente —
                <a href="https://wa.me/573004339418" style="color:#FF6B2B;font-weight:600;">WhatsApp</a>
                o responde este email.
              </p>
            </div>

            <p style="text-align:center;color:#9ca3af;font-size:12px;">
              Ventas10x · <a href="https://ventas10x.co" style="color:#FF6B2B;">ventas10x.co</a><br/>
              <a href="https://ventas10x.co/unsubscribe?email=${email}" style="color:#9ca3af;">No quiero más emails</a>
            </p>
          </div>
        `,
      }),
    })

    enviados++
  }

  return new Response(JSON.stringify({ message: `Recordatorios enviados: ${enviados}` }), { status: 200 })
})
