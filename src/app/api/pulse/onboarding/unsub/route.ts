// Ruta destino: src/app/api/pulse/onboarding/unsub/route.ts
//
// Baja de la secuencia de onboarding de DataBridge. Link que viaja en el footer de los
// 3 correos (ver onboarding-databridge-email.ts), firmado con HMAC para que nadie pueda
// desuscribir el correo de otra persona adivinando la URL con solo el email en texto plano.
//
// Se marca unsubscribed_at en TODAS las filas de pulse_contactos con ese email, no solo la
// que originó el correo: si alguien dejó datos más de una vez (ebook y después demo, por
// ejemplo), un solo clic en "no quiero más correos" tiene que bastar para las dos.
//
// GET porque es un link de un correo (un click, sin JS del lado del cliente) — devuelve HTML
// legible por un humano, no JSON.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac, timingSafeEqual } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const UNSUB_SECRET = process.env.PULSE_UNSUB_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'pulse-unsub-fallback'

function tokenValido(email: string, token: string): boolean {
  const esperado = createHmac('sha256', UNSUB_SECRET).update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
  const a = Buffer.from(esperado)
  const b = Buffer.from(token)
  // timingSafeEqual exige mismo largo -- si no coincide, ya es un token inválido.
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function paginaHtml(mensaje: string, ok: boolean) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Pulse Motor</title></head>
<body style="margin:0;padding:0;background:#0B0D0C;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#F3EFE7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0D0C;min-height:100vh;padding:60px 20px;">
    <tr><td align="center">
      <table width="440" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%;">
        <tr>
          <td style="background:#14120F;border:1px solid #2A2620;border-top:3px solid ${ok ? '#2563EB' : '#E5484D'};border-radius:16px;padding:34px 30px;text-align:center;">
            <p style="margin:0 0 14px;font-size:22px;">${ok ? '✓' : '✕'}</p>
            <h1 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#F3EFE7;">${ok ? 'Listo, no te escribimos más sobre esto' : 'No pudimos procesar la baja'}</h1>
            <p style="margin:0;font-size:13.5px;color:#9B958A;line-height:1.6;">${mensaje}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase() || ''
  const token = req.nextUrl.searchParams.get('token') || ''

  if (!email || !token || !tokenValido(email, token)) {
    return new NextResponse(paginaHtml('El link no es válido o ya venció.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const { error } = await supabase
      .from('pulse_contactos')
      .update({ unsubscribed_at: new Date().toISOString(), onboarding_next_at: null })
      .eq('email', email)

    if (error) throw new Error(error.message)

    return new NextResponse(
      paginaHtml('Sacamos tu correo de la secuencia sobre DataBridge. Si en algún momento querés probarlo, el link sigue disponible en pulsemotor.co/pulse/databridge.', true),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  } catch (e) {
    console.error('[api/pulse/onboarding/unsub]', e)
    return new NextResponse(paginaHtml('Hubo un error de nuestro lado. Escribinos y lo resolvemos a mano.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}
