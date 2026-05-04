// Ruta destino: src/app/api/admin/campanas/[id]/enviar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { Resend } from 'resend'

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
const resend = new Resend(process.env.RESEND_API_KEY)

type Props = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Props) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  // Cargar campaña
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campana } = await (supabaseService as any)
    .from('campanas')
    .select('*')
    .eq('id', id)
    .single()

  if (!campana) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  if (campana.estado === 'enviada') return NextResponse.json({ error: 'Ya fue enviada' }, { status: 400 })

  // Marcar como enviando
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseService as any).from('campanas').update({ estado: 'enviando' }).eq('id', id)

  // Obtener datos de destinatarios
  const destIds: string[] = campana.destinatarios_ids || []
  if (destIds.length === 0) {
    return NextResponse.json({ error: 'Sin destinatarios' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: perfiles } = await (supabaseService as any)
    .from('profiles')
    .select('id, nombre, apellido, whatsapp')
    .in('id', destIds)

  // Obtener emails desde auth.users
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: authUsers } = await (supabaseService.auth.admin as any)
    .listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  ;(authUsers?.users || []).forEach((u: { id: string; email?: string }) => {
    if (u.email) emailMap[u.id] = u.email
  })

  let enviados = 0
  let errores = 0

  for (const perfil of (perfiles || [])) {
    const email = emailMap[perfil.id]
    const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Asesor'

    // ── EMAIL ──
    if ((campana.canal === 'email' || campana.canal === 'ambos') && email && campana.cuerpo_email) {
      try {
        const htmlBody = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><style>
            body { font-family: 'Inter', system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background: #0f1c2e; padding: 28px 32px; }
            .logo { font-size: 20px; font-weight: 800; color: #fff; }
            .logo span { color: #FF6B2B; }
            .body { padding: 32px; }
            .greeting { font-size: 16px; color: #374151; margin-bottom: 20px; }
            .content { font-size: 15px; color: #4b5563; line-height: 1.7; white-space: pre-wrap; }
            .cta { display: inline-block; margin-top: 24px; padding: 14px 28px; background: #FF6B2B; color: #fff; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; }
            .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
          </style></head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Ventas<span>10x</span></div>
              </div>
              <div class="body">
                <div class="greeting">Hola ${nombre}, 👋</div>
                <div class="content">${campana.cuerpo_email.replace(/\n/g, '<br>')}</div>
                <a href="https://ventas10x.co/dashboard" class="cta">Ir a mi dashboard →</a>
              </div>
              <div class="footer">
                Ventas10x · ventas10x.co<br>
                Estás recibiendo este mensaje porque eres parte de la red Ventas10x.
              </div>
            </div>
          </body>
          </html>
        `
        await resend.emails.send({
          from: 'Ventas10x <hola@ventas10x.co>',
          to: email,
          subject: campana.asunto || 'Mensaje de Ventas10x',
          html: htmlBody,
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseService as any).from('campana_envios').insert({
          campana_id: id,
          vendedor_id: perfil.id,
          email,
          canal: 'email',
          estado: 'enviado',
          enviado_at: new Date().toISOString(),
        })
        enviados++
      } catch (e) {
        errores++
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseService as any).from('campana_envios').insert({
          campana_id: id,
          vendedor_id: perfil.id,
          email,
          canal: 'email',
          estado: 'error',
          error_msg: e instanceof Error ? e.message : 'Error desconocido',
        })
      }
    }

    // ── WHATSAPP (link directo — no API masiva) ──
    // Para WhatsApp masivo real necesita Twilio o Meta API
    // Por ahora registramos el intento y retornamos los links
    if ((campana.canal === 'whatsapp' || campana.canal === 'ambos') && perfil.whatsapp && campana.mensaje_wa) {
      const mensajePersonalizado = campana.mensaje_wa.replace('{{nombre}}', nombre)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseService as any).from('campana_envios').insert({
        campana_id: id,
        vendedor_id: perfil.id,
        whatsapp: perfil.whatsapp,
        canal: 'whatsapp',
        estado: 'pendiente', // requiere acción manual o Twilio
        error_msg: `wa.me link: https://wa.me/${perfil.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensajePersonalizado)}`,
      })
    }
  }

  // Actualizar estado final
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseService as any).from('campanas').update({
    estado: 'enviada',
    enviada_at: new Date().toISOString(),
    total_enviados: enviados,
    total_errores: errores,
  }).eq('id', id)

  // Para WhatsApp: retornar los links para envío manual
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: waEnvios } = await (supabaseService as any)
    .from('campana_envios')
    .select('whatsapp, error_msg, vendedor_id')
    .eq('campana_id', id)
    .eq('canal', 'whatsapp')

  return NextResponse.json({
    ok: true,
    enviados,
    errores,
    wa_links: (waEnvios || []).map((e: { error_msg: string }) => e.error_msg),
  })
}
