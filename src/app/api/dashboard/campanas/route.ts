// Ruta destino: src/app/api/dashboard/campanas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo')

  if (tipo === 'leads') {
    const { data } = await (supabase as any).from('leads')
      .select('id, nombre, whatsapp, etapa')
      .eq('vendedor_id', user.id)
      .order('created_at', { ascending: false })
    return NextResponse.json({ leads: data || [] })
  }

  if (tipo === 'contactos') {
    const { data } = await (supabase as any).from('vendedor_contactos')
      .select('*').eq('vendedor_id', user.id).eq('activo', true)
      .order('created_at', { ascending: false })
    return NextResponse.json({ contactos: data || [] })
  }

  const { data } = await (supabase as any).from('vendedor_campanas')
    .select('*, productos(id, nombre, imagen_principal, precio)')
    .eq('vendedor_id', user.id)
    .order('created_at', { ascending: false })
  return NextResponse.json({ campanas: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { accion } = body

  if (accion === 'agregar_contacto') {
    const { nombre, email, whatsapp, empresa, fuente } = body
    const { data, error } = await (supabase as any).from('vendedor_contactos').insert({
      vendedor_id: user.id, nombre, email, whatsapp, empresa, fuente: fuente || 'manual'
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, contacto: data })
  }

  if (accion === 'importar_csv') {
    const { contactos } = body
    const rows = contactos.map((c: any) => ({ vendedor_id: user.id, ...c, fuente: 'csv' }))
    const { error } = await (supabase as any).from('vendedor_contactos').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, importados: rows.length })
  }

  if (accion === 'crear_campana') {
    const { nombre, canal, asunto, cuerpo_email, mensaje_wa, producto_id, imagen_url, contacto_ids, programada_para } = body
    const { data: campana, error } = await (supabase as any).from('vendedor_campanas').insert({
      vendedor_id: user.id, nombre, canal,
      asunto, cuerpo_email, mensaje_wa,
      producto_id: producto_id || null,
      imagen_url: imagen_url || null,
      programada_para: programada_para || null,
      estado: programada_para ? 'programada' : 'borrador',
      total_destinatarios: contacto_ids?.length || 0,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, campana })
  }

  if (accion === 'enviar_campana') {
    const { campana_id } = body

    const { data: campana } = await (supabase as any).from('vendedor_campanas')
      .select('*, productos(id, nombre, imagen_principal, precio)')
      .eq('id', campana_id).eq('vendedor_id', user.id).single()
    if (!campana) return NextResponse.json({ error: 'Campana no encontrada' }, { status: 404 })

    const { contacto_ids } = body
    let query = (supabase as any).from('vendedor_contactos').select('*').eq('vendedor_id', user.id)
    if (contacto_ids?.length > 0) query = query.in('id', contacto_ids)
    const { data: contactos } = await query

    const { data: perfil } = await (supabaseAdmin as any).from('profiles')
      .select('nombre, apellido, empresa, slug, whatsapp, logo_url').eq('id', user.id).single()

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id)
    const vendedorEmail = authUser?.user?.email || null

    const nombreVendedor = perfil ? [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') : 'Tu asesor'
    const landingUrl = `https://ventas10x.co/u/${perfil?.slug || ''}`
    const waVendedor = perfil?.whatsapp?.replace(/\D/g, '') || ''
    const waLink = `https://wa.me/${waVendedor}?text=${encodeURIComponent('Hola, vi tu campana y me interesa.')}`

    let enviados = 0
    const waLinks: string[] = []

    for (const contacto of (contactos || [])) {
      if ((campana.canal === 'email' || campana.canal === 'ambos') && contacto.email && campana.cuerpo_email) {
        try {
          const productoHtml = campana.productos ? `
            <div style="background:#f8fafc;border-radius:12px;padding:16px;margin:16px 0;display:flex;gap:12px;align-items:center;">
              ${campana.productos.imagen_principal ? `<img src="${campana.productos.imagen_principal}" style="width:80px;height:80px;border-radius:8px;object-fit:cover;" alt="${campana.productos.nombre}"/>` : ''}
              <div>
                <div style="font-weight:700;font-size:16px;color:#0f172a;">${campana.productos.nombre}</div>
                ${campana.productos.precio ? `<div style="color:#FF6B2B;font-weight:800;font-size:18px;margin-top:4px;">${campana.productos.precio}</div>` : ''}
              </div>
            </div>` : ''

          const imagenHtml = campana.imagen_url
            ? `<img src="${campana.imagen_url}" style="width:100%;max-height:280px;object-fit:cover;border-radius:12px;margin:16px 0;display:block;" alt="imagen campana"/>`
            : ''

          const trackWaUrl = `https://ventas10x.co/api/track/click?c=${campana_id}&ct=${contacto.id}&t=whatsapp&r=${encodeURIComponent(waLink)}`
          const trackLandingUrl = `https://ventas10x.co/api/track/click?c=${campana_id}&ct=${contacto.id}&t=landing&r=${encodeURIComponent(landingUrl)}`

          const headerHtml = perfil?.logo_url
            ? `<img src="${perfil.logo_url}" alt="${perfil?.empresa || nombreVendedor}" style="max-height:48px;max-width:200px;object-fit:contain;"/>`
            : `<div style="display:flex;align-items:center;gap:12px;"><div style="width:36px;height:36px;background:#FF6B2B;border-radius:10px;"></div><span style="font-size:18px;font-weight:800;color:#fff;">Ventas10x</span></div>`

          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0f1c2e;padding:20px 32px;display:flex;align-items:center;justify-content:center;min-height:64px;">
      ${headerHtml}
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#374151;margin-bottom:16px;">Hola ${contacto.nombre || 'amigo/a'}</p>
      ${imagenHtml}
      ${productoHtml}
      <div style="font-size:15px;color:#4b5563;line-height:1.7;white-space:pre-wrap;">${campana.cuerpo_email}</div>
      <div style="display:flex;gap:12px;margin-top:24px;flex-wrap:wrap;">
        <a href="${trackWaUrl}" style="padding:12px 24px;background:#25D366;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">WhatsApp</a>
        <a href="${trackLandingUrl}" style="padding:12px 24px;background:#FF6B2B;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">Ver mi pagina</a>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
      Enviado por ${nombreVendedor}${perfil?.empresa ? ` - ${perfil.empresa}` : ''} via Ventas10x
    </div>
  </div>
</body></html>`

          await resend.emails.send({
            from: `${nombreVendedor} <hola@ventas10x.co>`,
            replyTo: vendedorEmail || undefined,
            to: contacto.email,
            subject: campana.asunto || `Mensaje de ${nombreVendedor}`,
            html,
          })
          enviados++

          await (supabaseAdmin as any).from('vendedor_campana_envios').insert({
            campana_id, contacto_id: contacto.id, email: contacto.email,
            canal: 'email', estado: 'enviado', enviado_at: new Date().toISOString()
          })
        } catch { /* silencioso */ }
      }

      if ((campana.canal === 'whatsapp' || campana.canal === 'ambos') && contacto.whatsapp && campana.mensaje_wa) {
        const wa = contacto.whatsapp.replace(/\D/g, '')
        const msg = campana.mensaje_wa.replace('{{nombre}}', contacto.nombre || '').replace('{{link}}', landingUrl)
        waLinks.push(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`)

        await (supabaseAdmin as any).from('vendedor_campana_envios').insert({
          campana_id, contacto_id: contacto.id, whatsapp: contacto.whatsapp,
          canal: 'whatsapp', estado: 'pendiente'
        })
      }
    }

    await (supabaseAdmin as any).from('vendedor_campanas').update({
      estado: 'enviada', enviada_at: new Date().toISOString(), total_enviados: enviados,
      total_destinatarios: (contactos || []).length,
    }).eq('id', campana_id)

    return NextResponse.json({ ok: true, enviados, wa_links: waLinks })
  }

  return NextResponse.json({ error: 'Accion no reconocida' }, { status: 400 })
}
