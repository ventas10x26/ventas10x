// Ruta destino: src/app/api/admin/emails/enviar-manual/route.ts
// Endpoint para que el admin reenvíe manualmente un email a un vendedor
// Útil para testing o casos especiales

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { enviarEmailConTracking, type TipoEmail } from '@/lib/email-helpers'
import {
  templateWelcome,
  templatePersonalizarLanding,
  templateCrearBot,
  templateViralizar,
  templatePreVencimiento,
  templateTrialVencido,
} from '@/lib/email-templates'

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { vendedor_id, tipo, forzar } = await req.json()

    if (!vendedor_id || !tipo) {
      return NextResponse.json(
        { error: 'vendedor_id y tipo son requeridos' },
        { status: 400 }
      )
    }

    // Cargar datos del vendedor
    const { data: authData } = await supabaseService.auth.admin.getUserById(vendedor_id)
    const email = authData?.user?.email
    if (!email) {
      return NextResponse.json({ error: 'Email del vendedor no encontrado' }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabaseService.from('profiles') as any)
      .select('nombre, apellido, empresa, slug')
      .eq('id', vendedor_id)
      .single()

    const nombreCompleto = profile
      ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || email.split('@')[0]
      : email.split('@')[0]
    const primerNombre = nombreCompleto.split(' ')[0]
    const slug = profile?.slug || vendedor_id.slice(0, 8)

    const datos = {
      nombre: nombreCompleto,
      primerNombre,
      email,
      slug,
      empresa: profile?.empresa || null,
    }

    // Generar template según tipo
    let asunto: string
    let html: string

    switch (tipo as TipoEmail) {
      case 'welcome':
        ({ asunto, html } = templateWelcome(datos))
        break
      case 'personalizar_landing':
        ({ asunto, html } = templatePersonalizarLanding(datos))
        break
      case 'crear_bot':
        ({ asunto, html } = templateCrearBot(datos))
        break
      case 'viralizar':
        ({ asunto, html } = templateViralizar(datos))
        break
      case 'pre_vencimiento':
        ({ asunto, html } = templatePreVencimiento(datos, 2))
        break
      case 'trial_vencido':
        ({ asunto, html } = templateTrialVencido(datos))
        break
      default:
        return NextResponse.json({ error: 'Tipo de email no válido' }, { status: 400 })
    }

    const resultado = await enviarEmailConTracking({
      vendedorId: vendedor_id,
      tipo: tipo as TipoEmail,
      email,
      asunto,
      html,
      forzar: !!forzar,
    })

    if (!resultado.ok) {
      return NextResponse.json({
        ok: false,
        razon: 'razon' in resultado ? resultado.razon : 'unknown',
        mensaje: 'razon' in resultado && resultado.razon === 'ya_enviado'
          ? 'Este email ya fue enviado. Usa forzar=true para reenviar.'
          : 'Error al enviar',
      })
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Email "${tipo}" enviado a ${email}`,
      resendId: resultado.resendId,
    })
  } catch (error) {
    console.error('[admin/emails] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
