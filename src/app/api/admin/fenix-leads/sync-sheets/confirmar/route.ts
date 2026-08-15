// Ruta destino: src/app/api/admin/fenix-leads/sync-sheets/confirmar/route.ts
// Inserta de verdad los leads que el admin aprobó en la vista previa
// (incluye los que traían teléfono dañado, ya con el número corregido a
// mano en el body). Actualiza fenix_sync_config con la hora y el resumen
// del último sync.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { confirmarSincronizacion, type LeadCandidato } from '@/lib/fenix-sync-sheets'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const candidatos = body.candidatos as LeadCandidato[] | undefined
  if (!Array.isArray(candidatos) || candidatos.length === 0) {
    return NextResponse.json({ error: 'No hay candidatos para sincronizar' }, { status: 400 })
  }

  // Validación mínima -- cada candidato necesita teléfono con al menos 8
  // dígitos, para no dejar pasar uno dañado que el admin no haya corregido.
  const invalidos = candidatos.filter((c) => c.telefono.replace(/\D/g, '').length < 8)
  if (invalidos.length > 0) {
    return NextResponse.json({ error: `${invalidos.length} lead(s) todavía tienen un teléfono incompleto` }, { status: 400 })
  }

  try {
    const resultado = await confirmarSincronizacion(candidatos)
    await supabaseService.from('fenix_sync_config').update({
      last_synced_at: new Date().toISOString(),
      last_sync_resumen: resultado,
    }).eq('id', true)
    return NextResponse.json({ ok: true, ...resultado })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'No se pudo sincronizar' }, { status: 500 })
  }
}
