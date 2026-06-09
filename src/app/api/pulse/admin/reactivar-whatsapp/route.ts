// src/app/api/pulse/admin/reactivar-whatsapp/route.ts
// Envía emails de reactivación a usuarios sin WhatsApp conectado
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

// Lista manual de usuarios a contactar (o se obtiene de la DB)
const USUARIOS_TARGET = [
  { email: 'agentevirtualkia2@almotores.com',      nombre: 'Karime' },
  { email: 'dirgestioncomercialkia@almotores.com', nombre: 'Almotores' },
  { email: 'dirgestioncomercialkia@gmail.com',     nombre: 'GTest' },
  // bryanlosada se agrega si confirma que no tiene WhatsApp conectado
]

function htmlEmail(nombre: string, email: string) {
  const loginUrl = `https://pulsemotor.co/pulse/login`
  const agenteUrl = `https://pulsemotor.co/pulse/agente?tab=avanzado`

  return `
    <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;background:#080f1a;color:#f8fafc;padding:36px;border-radius:16px;">
      
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
        <div style="width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#f97316,#ea580c);display:flex;align-items:center;justify-content:center;font-size:18px;">⚡</div>
        <span style="font-size:18px;font-weight:800;letter-spacing:-.3px;">Pulse Motor</span>
      </div>

      <h2 style="font-size:22px;font-weight:800;margin:0 0 12px;line-height:1.2;">
        Hola ${nombre}, tu agente está listo pero falta un paso 👋
      </h2>
      
      <p style="font-size:15px;color:#94a3b8;line-height:1.7;margin:0 0 20px;">
        Configuraste tu agente Pulse Motor, pero aún no conectaste tu WhatsApp. 
        <strong style="color:#f8fafc;">Sin eso, el agente no puede responder tus leads automáticamente.</strong>
      </p>

      <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="font-size:13px;font-weight:700;color:#fdba74;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">
          ⚡ Conectar tarda menos de 1 minuto
        </p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${['1. Ingresá a tu panel → Mi agente → Avanzado', '2. Hacé click en "Conectar mi WhatsApp"', '3. Abrís WhatsApp → Dispositivos vinculados → Escanear QR', '4. ¡Listo! Tu agente responde leads en 30 segundos'].map(paso => `
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:13px;color:#cbd5e1;">${paso}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <a href="${agenteUrl}" 
        style="display:block;padding:14px 24px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;text-decoration:none;border-radius:10px;font-weight:800;font-size:15px;text-align:center;margin-bottom:16px;">
        Conectar mi WhatsApp ahora →
      </a>

      <p style="font-size:13px;color:#475569;text-align:center;margin-bottom:28px;">
        Solo necesitás tu celular y 60 segundos
      </p>

      <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:20px;">
        <p style="font-size:13px;color:#334155;line-height:1.6;margin:0 0 12px;">
          <strong style="color:#94a3b8;">¿Por qué es importante?</strong><br/>
          Los leads que no reciben respuesta en los primeros 30 minutos tienen 
          <strong style="color:#f97316;">21 veces menos probabilidad de cerrar</strong>. 
          Tu agente responde en 30 segundos, 24/7.
        </p>
        <p style="font-size:12px;color:#334155;">
          ¿Necesitás ayuda? Respondé este email o escribinos al 
          <a href="https://wa.me/573001234567" style="color:#f97316;">WhatsApp de soporte</a>.
        </p>
      </div>

      <p style="font-size:11px;color:#1e293b;margin-top:24px;text-align:center;">
        Pulse Motor · pulsemotor.co · Hecho en Cali, Colombia 🇨🇴<br/>
        <a href="${loginUrl}" style="color:#334155;">Ingresar a mi cuenta</a>
      </p>
    </div>
  `
}

export async function POST(req: NextRequest) {
  // Proteger con CRON_SECRET
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const resultados: { email: string; status: string }[] = []

  for (const usuario of USUARIOS_TARGET) {
    try {
      await resend.emails.send({
        from:    'Pulse Motor <agente@ventas10x.co>',
        to:      usuario.email,
        subject: `⚡ ${usuario.nombre}, tu agente está listo — falta conectar WhatsApp`,
        html:    htmlEmail(usuario.nombre, usuario.email),
      })
      resultados.push({ email: usuario.email, status: 'enviado' })
      console.log('[reactivar-whatsapp] enviado a:', usuario.email)
    } catch (e) {
      console.error('[reactivar-whatsapp] error:', usuario.email, e)
      resultados.push({ email: usuario.email, status: 'error' })
    }
  }

  return NextResponse.json({ ok: true, resultados })
}

// GET para preview del email (solo en dev)
export async function GET(req: NextRequest) {
  const preview = req.nextUrl.searchParams.get('preview')
  if (preview !== 'true') return NextResponse.json({ error: 'Solo para preview' }, { status: 400 })
  
  return new Response(htmlEmail('Karime', 'agentevirtualkia2@almotores.com'), {
    headers: { 'Content-Type': 'text/html' }
  })
}
