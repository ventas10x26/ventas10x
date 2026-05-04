// Ruta destino: src/app/api/feed/conexion/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// POST /api/feed/conexion — prospecto expresa interés
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vendedor_id, post_id, nombre, whatsapp, email, mensaje, producto_interes, fuente } = body

    if (!vendedor_id || !nombre) {
      return NextResponse.json({ error: 'vendedor_id y nombre requeridos' }, { status: 400 })
    }

    // 1. Buscar org del vendedor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: member } = await (supabaseAdmin as any)
      .from('org_members')
      .select('org_id')
      .eq('user_id', vendedor_id)
      .eq('rol', 'owner')
      .maybeSingle()

    const org_id = member?.org_id || null

    // 2. Crear lead en el pipeline del vendedor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lead } = await (supabaseAdmin as any)
      .from('leads')
      .insert({
        vendedor_id,
        org_id,
        nombre,
        whatsapp: whatsapp || '',
        producto: producto_interes || null,
        fuente: fuente || 'explore',
        etapa: 'nuevo',
        notas: mensaje ? `Mensaje desde red social: "${mensaje}"` : 'Captado desde feed social Ventas10x',
      })
      .select()
      .single()

    // 3. Crear registro de conexión
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conexion, error } = await (supabaseAdmin as any)
      .from('feed_conexiones')
      .insert({
        vendedor_id,
        post_id: post_id || null,
        nombre,
        whatsapp: whatsapp || null,
        email: email || null,
        mensaje: mensaje || null,
        producto_interes: producto_interes || null,
        fuente: fuente || 'explore',
        lead_id: lead?.id || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, conexion, lead_creado: !!lead })
  } catch (e) {
    console.error('[feed/conexion]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
