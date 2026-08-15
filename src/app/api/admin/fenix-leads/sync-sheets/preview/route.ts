// Ruta destino: src/app/api/admin/fenix-leads/sync-sheets/preview/route.ts
// Vista previa de solo lectura: descarga el CSV, compara contra la base y
// devuelve quién es nuevo, quién ya existe (duplicado) y quién tiene el
// teléfono dañado por el truncamiento de precisión de Sheets. No inserta
// nada -- eso lo hace /confirmar, con lo que el admin apruebe acá.

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { calcularPlanSincronizacion } from '@/lib/fenix-sync-sheets'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: cfg } = await supabaseService.from('fenix_sync_config').select('csv_url').eq('id', true).single()
  if (!cfg?.csv_url) return NextResponse.json({ error: 'No hay un link de Sheets configurado' }, { status: 400 })

  try {
    const plan = await calcularPlanSincronizacion(cfg.csv_url)
    return NextResponse.json({ ok: true, ...plan })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'No se pudo calcular la vista previa' }, { status: 500 })
  }
}
