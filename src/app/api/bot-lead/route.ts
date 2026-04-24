import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { bot_id, vendedor_id, nombre, whatsapp, producto, fuente, etapa } = await req.json()

    const { data, error } = await supabase
      .from('leads')
      .insert([{
        bot_id,
        vendedor_id,
        nombre,
        whatsapp,
        producto,
        fuente: fuente || 'bot_ia',
        etapa: etapa || 'nuevo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, lead: data })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
