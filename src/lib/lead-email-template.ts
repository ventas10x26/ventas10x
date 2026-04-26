// Ruta destino: src/lib/lead-email-template.ts
// Genera el HTML del email disruptivo con CTAs personalizados.
// Compatible con clientes de email (Gmail, Outlook, Apple Mail).

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'

type Plantilla = {
  etiqueta: string
  emoji: string
  mensaje: string
}

type EmailLeadParams = {
  vendedorNombre: string
  leadNombre: string
  leadWhatsApp: string
  leadInteres?: string
  fuente: 'bot_landing' | 'bot_ia' | string
  mensajePrincipal: string
  plantillas: Plantilla[]
}

/** Limpia teléfono a solo dígitos */
function limpiarTelefono(tel: string): string {
  return (tel || '').replace(/\D/g, '')
}

/** URL para abrir WhatsApp con mensaje pre-cargado */
function urlWhatsApp(telefono: string, mensaje: string): string {
  const tel = limpiarTelefono(telefono)
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`
}

/** URL para llamar */
function urlLlamar(telefono: string): string {
  const tel = limpiarTelefono(telefono)
  return `tel:+${tel}`
}

export function buildEmailLead(params: EmailLeadParams): { subject: string; html: string } {
  const {
    vendedorNombre,
    leadNombre,
    leadWhatsApp,
    leadInteres,
    fuente,
    mensajePrincipal,
    plantillas,
  } = params

  const fuenteLabel = fuente === 'bot_landing' ? 'Bot Landing' : fuente === 'bot_ia' ? 'Bot IA' : 'Formulario'
  const subject = `⚡ NUEVO LEAD: ${leadNombre}${leadInteres ? ` quiere ${leadInteres.substring(0, 40)}` : ''}`

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">

    <!-- Header con urgencia -->
    <div style="background:linear-gradient(135deg,#FF6B2B 0%,#E94B0F 100%);border-radius:18px 18px 0 0;padding:22px 24px;color:#fff;">
      <div style="font-size:11px;font-weight:800;letter-spacing:.12em;opacity:.9;margin-bottom:6px;">
        ⚡ NUEVO LEAD · ${fuenteLabel.toUpperCase()}
      </div>
      <div style="font-size:26px;font-weight:800;line-height:1.2;letter-spacing:-.02em;">
        ${leadNombre}
      </div>
      ${leadInteres ? `<div style="font-size:14px;opacity:.95;margin-top:6px;">quiere: <strong style="font-weight:700;">${leadInteres}</strong></div>` : ''}
    </div>

    <!-- Datos del lead en grande -->
    <div style="background:#fff;padding:24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;margin-bottom:18px;">
        <div style="font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">
          📱 WhatsApp
        </div>
        <div style="font-size:22px;font-weight:800;color:#0f1c2e;font-family:'SF Mono',Monaco,Consolas,monospace;letter-spacing:.02em;">
          ${leadWhatsApp}
        </div>
      </div>

      <!-- CTA principal: WhatsApp con mensaje IA -->
      <div style="margin-bottom:14px;">
        <div style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">
          ✨ Mensaje sugerido por IA
        </div>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px 14px;font-size:13px;color:#7c2d12;line-height:1.55;font-style:italic;margin-bottom:10px;">
          "${mensajePrincipal.replace(/"/g, '&quot;')}"
        </div>
        <a href="${urlWhatsApp(leadWhatsApp, mensajePrincipal)}"
           target="_blank"
           style="display:block;background:#25D366;color:#fff !important;text-decoration:none;text-align:center;padding:16px;border-radius:12px;font-weight:800;font-size:16px;letter-spacing:.01em;box-shadow:0 4px 12px rgba(37,211,102,.25);">
          💬 Enviar este mensaje por WhatsApp →
        </a>
      </div>

      <!-- Botón llamar -->
      <a href="${urlLlamar(leadWhatsApp)}"
         style="display:block;background:#0f1c2e;color:#fff !important;text-decoration:none;text-align:center;padding:14px;border-radius:12px;font-weight:700;font-size:15px;margin-bottom:18px;">
        📞 Llamar ahora a ${leadWhatsApp}
      </a>

      <!-- Plantillas rápidas -->
      <div style="border-top:1px dashed #e5e7eb;padding-top:18px;">
        <div style="font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">
          ⚡ O usa una plantilla rápida
        </div>

        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
          <tr>
            ${plantillas.map((p, i) => `
              <td style="padding:0 ${i < plantillas.length - 1 ? '4px' : '0'} 0 ${i > 0 ? '4px' : '0'};vertical-align:top;width:33.3%;">
                <a href="${urlWhatsApp(leadWhatsApp, p.mensaje)}"
                   target="_blank"
                   style="display:block;background:#f3f4f6;color:#0f1c2e !important;text-decoration:none;text-align:center;padding:12px 8px;border-radius:10px;font-weight:700;font-size:13px;border:1px solid #e5e7eb;">
                  <div style="font-size:18px;margin-bottom:4px;">${p.emoji}</div>
                  ${p.etiqueta}
                </a>
              </td>
            `).join('')}
          </tr>
        </table>
        <div style="font-size:11px;color:#9ca3af;text-align:center;margin-top:8px;">
          Click → se abre WhatsApp con mensaje listo
        </div>
      </div>
    </div>

    <!-- Footer con dashboard -->
    <div style="background:#fff;padding:18px 24px 22px;border-radius:0 0 18px 18px;border:1px solid #e5e7eb;border-top:none;">
      <a href="${BASE_URL}/dashboard/leads"
         style="display:block;background:transparent;color:#FF6B2B !important;text-decoration:none;text-align:center;padding:10px;border-radius:10px;font-weight:700;font-size:13px;border:1px solid #fed7aa;">
        Ver lead completo en mi dashboard →
      </a>
    </div>

    <!-- Tip pro -->
    <div style="text-align:center;font-size:11px;color:#9ca3af;margin-top:14px;line-height:1.5;">
      <strong style="color:#374151;">⏱ Tip:</strong> Los leads que reciben respuesta en menos de 5 minutos<br>
      tienen <strong style="color:#FF6B2B;">9x más probabilidad</strong> de convertirse en venta.
    </div>

    <div style="text-align:center;font-size:10px;color:#9ca3af;margin-top:18px;">
      <a href="${BASE_URL}" style="color:#9ca3af;text-decoration:none;">ventas10x.co</a> · Notificación enviada para ${vendedorNombre}
    </div>
  </div>
</body>
</html>
  `.trim()

  return { subject, html }
}
