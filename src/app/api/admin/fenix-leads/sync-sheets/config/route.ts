// Ruta destino: src/app/api/admin/fenix-leads/sync-sheets/config/route.ts
// GET/PUT del link del CSV publicado de Google Sheets usado para
// sincronizar leads. Fila única (id=true), igual que fenix_costos.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await supabaseService
    .from('fenix_sync_config')
    .select('csv_url, last_synced_at, last_sync_resumen')
    .eq('id', true)
    .single()

  if (error) return NextResponse.json({ error: 'No se pudo leer la configuración' }, { status: 500 })
  return NextResponse.json({ ok: true, ...data })
}

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { csv_url } = await req.json()
  if (!csv_url || typeof csv_url !== 'string' || !csv_url.startsWith('http')) {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  const { data, error } = await supabaseService
    .from('fenix_sync_config')
    .update({ csv_url: csv_url.trim() })
    .eq('id', true)
    .select('csv_url')
    .single()

  if (error) return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })
  return NextResponse.json({ ok: true, csv_url: data.csv_url })
}
