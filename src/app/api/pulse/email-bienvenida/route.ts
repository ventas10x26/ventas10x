// Ruta destino: src/app/api/pulse/email-bienvenida/route.ts
// Envía email de bienvenida cuando el asesor activa su primer agente de voz

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Pulse Motor <agente@ventas10x.co>'

function htmlEmail(nombre: string, primerNombre: string, emailTrim: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tu agente KIA está listo</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#fff;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 32px 0;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="display:inline-table;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0ea5e9,#10b981);border-radius:12px;width:44px;height:44px;text-align:center;vertical-align:middle;font-size:24px;">⚡</td>
                  <td style="padding-left:10px;font-size:20px;font-weight:700;letter-spacing:-0.3px;color:#fff;">Pulse Motor</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:linear-gradient(145deg,rgba(14,165,233,0.12),rgba(5,15,30,0.95),rgba(16,185,129,0.06));border:1px solid rgba(14,165,233,0.25);border-top:3px solid #0ea5e9;border-radius:18px;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0ea5e9;letter-spacing:1.5px;text-transform:uppercase;">🎙️ TU AGENTE DE VOZ ESTÁ ACTIVO</p>
              <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;line-height:1.2;color:#fff;">
                ¡${primerNombre}, tu asistente<br/>
                <span style="background:linear-gradient(135deg,#0ea5e9,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">KIA ya está entrenado!</span>
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.65;">
                Grabaste tu primera muestra de voz y configuraste tu agente IA. Ahora cada mensaje que mandes a tus leads va a sonar como <strong style="color:#e2e8f0;">tú</strong> — con tu tono, tu ritmo y tu forma de cerrar ventas KIA.
              </p>

              <!-- CTA principal -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0ea5e9,#059669);border-radius:10px;padding:14px 28px;">
                    <a href="https://pulsemotor.co/pulse/agente?email=${encodeURIComponent(emailTrim)}" style="color:#fff;font-size:15px;font-weight:700;text-decoration:none;">Entrenar más mi agente →</a>
                  </td>
                </tr>
              </table>

              <!-- Divisor -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="height:1px;background:rgba(14,165,233,0.2);"></td>
                </tr>
              </table>

              <!-- Sección: por qué más grabaciones -->
              <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#0ea5e9;letter-spacing:0.5px;">¿POR QUÉ SEGUIR GRABANDO?</p>
              <p style="margin:0 0 20px;font-size:14px;color:#94a3b8;line-height:1.65;">
                Cada grabación que hagas entrena al agente con un escenario diferente — así aprende a responder en el tono exacto que usas con leads de Sportage, K3, Niro Híbrido o EV6. <strong style="color:#e2e8f0;">Más grabaciones = respuestas más naturales.</strong>
              </p>

              <!-- 4 pestañas -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">

                <!-- Tab 1 -->
                <tr>
                  <td style="padding:14px 16px;background:rgba(14,165,233,0.06);border:1px solid rgba(14,165,233,0.15);border-radius:10px;margin-bottom:10px;display:block;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" style="font-size:20px;vertical-align:top;">🎙️</td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#7dd3fc;">VOZ Y TONO</p>
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">Graba nuevas muestras de voz para cada tipo de lead KIA. Puedes entrenar un tono diferente para Sportage SUV vs Picanto urbano. El agente aprende a diferenciarlos.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>

                <!-- Tab 2 -->
                <tr>
                  <td style="padding:14px 16px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:10px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" style="font-size:20px;vertical-align:top;">🧠</td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#6ee7b7;">COMPORTAMIENTO</p>
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">Entrena cómo manejas objeciones de precio, competencia o "lo pienso". Agrega tus guiones de cierre favoritos para que el agente los use al responder.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>

                <!-- Tab 3 -->
                <tr>
                  <td style="padding:14px 16px;background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:10px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" style="font-size:20px;vertical-align:top;">💬</td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#7dd3fc;">MENSAJES</p>
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">Personaliza el primer mensaje de WhatsApp que el agente envía a cada lead nuevo. Puedes probarlo directamente desde la plataforma.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>

                <!-- Tab 4 -->
                <tr>
                  <td style="padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" style="font-size:20px;vertical-align:top;">⚙️</td>
                        <td style="padding-left:12px;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#94a3b8;">AVANZADO</p>
                          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">Edita el system prompt interno, actualiza tu WhatsApp y ajusta los parámetros técnicos del agente. Solo si sabes lo que haces.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

              <!-- Divisor -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="height:1px;background:rgba(14,165,233,0.15);"></td></tr>
              </table>

              <!-- Tip -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(14,165,233,0.08);border-left:3px solid #0ea5e9;border-radius:0 8px 8px 0;padding:14px 16px;margin:0 0 28px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0ea5e9;letter-spacing:0.5px;">💡 TIP DE HOY</p>
                    <p style="margin:0;font-size:13px;color:#cbd5e1;line-height:1.55;">Graba una muestra hablando específicamente de <strong style="color:#fff;">financiación con KIA Crédito</strong>. Es el tema que más genera objeciones y el agente necesita aprender tu tono exacto para resolverlas.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA secundario -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(14,165,233,0.12);border:1px solid rgba(14,165,233,0.3);border-radius:10px;padding:12px 24px;">
                    <a href="https://pulsemotor.co/pulse/agente?tab=voz&email=${encodeURIComponent(emailTrim)}" style="color:#7dd3fc;font-size:14px;font-weight:600;text-decoration:none;">🎙️ Grabar nueva muestra de voz →</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#475569;">Pulse Motor · Hecho en Cali, Colombia 🇨🇴</p>
              <p style="margin:0;font-size:11px;color:#334155;">Recibiste este email porque configuraste tu agente IA en pulsemotor.co</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, nombre } = body

    if (!email || !nombre) {
      return NextResponse.json({ error: 'Email y nombre requeridos' }, { status: 400 })
    }

    const primerNombre = nombre.trim().split(/\s+/)[0]

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [email.trim().toLowerCase()],
      subject: `${primerNombre}, tu agente KIA ya está entrenado ⚡`,
      html: htmlEmail(nombre.trim(), primerNombre, email.trim().toLowerCase()),
    })

    if (error) {
      console.error('[email-bienvenida] Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e) {
    console.error('[email-bienvenida]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
