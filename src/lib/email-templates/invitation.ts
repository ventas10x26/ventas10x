// Ruta destino: src/lib/email-templates/invitation.ts

type Params = {
  inviterNombre: string
  orgNombre: string
  rol: string
  acceptUrl: string
}

export function emailInvitacionEquipo(params: Params): { asunto: string; html: string } {
  const { inviterNombre, orgNombre, rol, acceptUrl } = params

  const asunto = `${inviterNombre} te invitó a unirte a ${orgNombre} en Ventas10x`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${asunto}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Inter','Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">

    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#FF6B2B;width:52px;height:52px;border-radius:13px;line-height:52px;color:#fff;font-weight:800;font-size:20px;letter-spacing:-.02em;">
        V10x
      </div>
    </div>

    <div style="background:#fff;border-radius:18px;padding:36px 32px;border:1px solid #e5e7eb;">

      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f1c2e;line-height:1.3;letter-spacing:-.02em;">
        Te invitaron a un equipo en Ventas10x
      </h1>
      <p style="margin:0 0 24px;font-size:15px;color:#5a6a7c;line-height:1.6;">
        <strong style="color:#0f1c2e;">${escapeHtml(inviterNombre)}</strong> te invitó a unirte a <strong style="color:#0f1c2e;">${escapeHtml(orgNombre)}</strong> como <strong style="color:#FF6B2B;text-transform:capitalize;">${escapeHtml(rol)}</strong>.
      </p>

      <div style="background:#fff5ef;border:1px solid #ffd5be;border-radius:12px;padding:16px;margin-bottom:28px;">
        <div style="font-size:13px;color:#c2410c;font-weight:600;margin-bottom:6px;">
          ✦ Como ${escapeHtml(rol)} podrás:
        </div>
        <ul style="margin:0;padding:0 0 0 20px;font-size:13px;color:#5a6a7c;line-height:1.7;">
          <li>Ver y editar el catálogo de productos</li>
          <li>Gestionar leads y pipeline de ventas</li>
          <li>Personalizar la landing del equipo</li>
          <li>Configurar el bot IA</li>
        </ul>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${acceptUrl}" style="display:inline-block;background:#FF6B2B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 8px 18px rgba(255,107,43,0.25);">
          Aceptar invitación →
        </a>
      </div>

      <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;line-height:1.6;text-align:center;">
        Si no esperabas esta invitación, simplemente ignora este correo.<br/>
        Este enlace expira en 7 días.
      </p>
    </div>

    <p style="margin:24px 0 0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.6;">
      Ventas10x · Plataforma de ventas con IA<br/>
      <a href="https://ventas10x.co" style="color:#9ca3af;text-decoration:underline;">ventas10x.co</a>
    </p>
  </div>
</body>
</html>`

  return { asunto, html }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
