import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const config = await req.json()

    // Obtener usuario autenticado
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data, error } = await supabase
      .from('bots')
      .insert([{
        user_id: user.id,
        nombre: config.nombre,
        empresa: config.empresa,
        industria: config.industria,
        tono: config.tono,
        bienvenida: config.bienvenida,
        productos: config.productos,
        faqs: config.faqs,
        whatsapp: config.whatsapp,
        activo: true,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, bot: data })
  } catch (error) {
    console.error('bot-save error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}