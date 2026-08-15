// Ruta destino: src/app/api/admin/fenix-leads/estado-ia/route.ts
// Devuelve, para cada conversación de WhatsApp existente, si la IA está
// pausada o no -- se usa para pintar el indicador 🤖/⏸ en cada tarjeta del
// pipeline sin tener que abrir el detalle de cada lead uno por uno.

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const INSTANCE_NAME = 'fenix_cobranza'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabaseService
    .from('fenix_conversaciones')
    .select('remote_jid, bot_pausado')
    .eq('instance_name', INSTANCE_NAME)

  if (error) {
    console.error('[admin/fenix-leads/estado-ia] Error:', error)
    return NextResponse.json({ error: 'No se pudo cargar el estado de la IA' }, { status: 500 })
  }

  return NextResponse.json({
    conversaciones: (data || []).map((c) => ({ remote_jid: c.remote_jid, bot_pausado: c.bot_pausado === true })),
  })
}
