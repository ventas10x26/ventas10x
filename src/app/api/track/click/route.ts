import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const campana_id = searchParams.get('c')
  const contacto_id = searchParams.get('ct')
  const tipo = searchParams.get('t') || 'landing'
  const redirect = searchParams.get('r')

  if (campana_id) {
    try {
      await supabaseAdmin.from('vendedor_campana_clicks').insert({
        campana_id,
        contacto_id: contacto_id || null,
        tipo,
      })
    } catch { /* silencioso */ }
  }

  return NextResponse.redirect(redirect || 'https://ventas10x.co')
}
