// Ruta destino: src/app/api/dashboard/campanas/metricas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

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
  const campana_id = searchParams.get('c')
  if (!campana_id) return NextResponse.json({ error: 'campana_id requerido' }, { status: 400 })

  // Verificar que la campaña pertenece al vendedor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campana } = await (supabase as any)
    .from('vendedor_campanas')
    .select('id')
    .eq('id', campana_id)
    .eq('vendedor_id', user.id)
    .single()

  if (!campana) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clicks } = await (supabaseAdmin as any)
    .from('vendedor_campana_clicks')
    .select('tipo, created_at')
    .eq('campana_id', campana_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ clicks: clicks || [] })
}
