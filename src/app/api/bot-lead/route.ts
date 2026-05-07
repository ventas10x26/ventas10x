// Ruta destino: src/app/api/bot-lead/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { notificarLeadPorWhatsApp } from '@/lib/notificaciones-whatsapp'
import { generarMensajesParaLead } from '@/lib/lead-mensaje-ia'
import { buildEmailLead } from '@/lib/lead-email-template'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { bot_id, vendedor_id: rawVendedorId, slug, nombre, whatsapp, email, producto, fuente, etapa } = await req.json()

    let vendedor_id = rawVendedorId
    if (!vendedor_id && slug) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('slug', slug)
        .single()
      vendedor_id = profile?.id ?? null
    }

    // Verificar si ya existe un lead con este whatsapp para este vendedor
    const { data: leadExistente } = await supabase
      .from('leads')
      .select('id, email')
      .eq('vendedor_id', vendedor_id)
      .eq('whatsapp', whatsapp)
      .maybeSingle()

    let lead
    let error

    if (leadExistente) {
      // Actualizar email si no lo tenía
      const updateData: Record<string, string> = { updated_at: new Date().toISOString() }
      if (email && !leadExistente.email) updateData.email = email
      if (producto) updateData.producto = producto

      const res = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadExistente.id)
        .select()
        .single()
      lead = res.data
      error = res.error
    } else {
      const res = await supabase
        .from('leads')
        .insert([{
          bot_id,
          vendedor_id,
          nombre,
          whatsapp,
          email: email || null,
          producto,
          fuente: fuente || 'bot_ia',
          etapa: etapa || 'nuevo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single()
      lead = res.data
      error = res.error
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (vendedor_id && !leadExistente) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombre, apellido, empresa, industria, callmebot_apikey, callmebot_telefono, notif_whatsapp_activa')
          .eq('id', vendedor_id)
          .single()

        const { data: authUser } = await supabase.auth.admin.getUserById(vendedor_id)
        const vendedorEmail = authUser?.user?.email
        const vendedorNombre = profile
          ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || 'Asesor'
          : 'Asesor'

        ;(async () => {
          try {
            const mensajes = await generarMensajesParaLead({
              nombre, whatsapp, interes: producto, vendedorNombre,
              empresa: profile?.empresa ?? undefined,
              industria: profile?.industria ?? undefined,
            })

            try {
              if (vendedorEmail) {
                const { subject, html } = buildEmailLead({
                  vendedorNombre, leadNombre: nombre, leadWhatsApp: whatsapp,
                  leadInteres: producto, fuente: fuente || 'bot_ia',
                  mensajePrincipal: mensajes.mensajePrincipal,
                  plantillas: mensajes.plantillas,
                })
                await resend.emails.send({
                  from: 'Ventas10x <notificaciones@ventas10x.co>',
                  to: vendedorEmail, subject, html,
                })
              }
            } catch (e) { console.error('bot-lead email error:', e) }

            try {
              if (profile) {
                await notificarLeadPorWhatsApp(
                  {
                    callmebot_apikey: profile.callmebot_apikey,
                    callmebot_telefono: profile.callmebot_telefono,
                    notif_whatsapp_activa: profile.notif_whatsapp_activa,
                  },
                  { nombre, whatsapp, interes: producto, fuente: fuente || 'bot_ia' },
                  vendedorNombre
                )
              }
            } catch (e) { console.error('bot-lead wa error:', e) }
          } catch (e) { console.error('bot-lead notif error:', e) }
        })()
      } catch (notifError) {
        console.error('bot-lead notif setup error:', notifError)
      }
    }

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('bot-lead error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
