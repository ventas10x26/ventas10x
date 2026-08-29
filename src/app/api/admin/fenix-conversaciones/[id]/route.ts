// Ruta destino: src/app/api/admin/fenix-conversaciones/[id]/route.ts
//
// PATCH: pausa o reanuda la IA para esta conversación puntual, igual que el
// PATCH que ya existe en /api/admin/fenix-leads/[id]/conversacion -- pero
// clave por el id directo de fenix_conversaciones en vez de por un lead,
// para que también funcione con conversaciones tipo 'deudor' que no tienen
// ningún lead asociado.
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const { bot_pausado } = await req.json()
  if (typeof bot_pausado !== 'boolean') {
    return NextResponse.json({ error: 'bot_pausado debe ser true o false' }, { status: 400 })
  }

  const { error } = await supabaseService
    .from('fenix_conversaciones')
    .update({ bot_pausado, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[admin/fenix-conversaciones/[id]] Error al actualizar:', error)
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, bot_pausado })
}
