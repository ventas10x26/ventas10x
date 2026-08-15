// Ruta destino: src/app/api/admin/fenix-leads/almacenamiento/route.ts
// Calcula cuántos KB ocupa el historial de conversación guardado por cada
// lead en fenix_conversaciones. No hay función de tamaño de columna
// expuesta vía el cliente de Supabase (PostgREST), así que se estima
// serializando el JSON de `historial` y midiendo su longitud en bytes --
// es una aproximación razonable, no el tamaño exacto en disco.

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
    .select('remote_jid, historial')
    .eq('instance_name', INSTANCE_NAME)

  if (error) {
    console.error('[admin/fenix-leads/almacenamiento] Error:', error)
    return NextResponse.json({ error: 'No se pudo calcular el almacenamiento' }, { status: 500 })
  }

  let totalBytes = 0
  const porConversacion: Record<string, number> = {}
  for (const fila of data || []) {
    const bytes = new TextEncoder().encode(JSON.stringify(fila.historial || [])).length
    totalBytes += bytes
    const digitos = String(fila.remote_jid || '').replace(/\D/g, '')
    if (digitos.length >= 8) porConversacion[digitos.slice(-8)] = bytes
  }

  return NextResponse.json({
    conversaciones: data?.length || 0,
    totalKB: Math.round((totalBytes / 1024) * 10) / 10,
    promedioKB: data?.length ? Math.round((totalBytes / data.length / 1024) * 10) / 10 : 0,
    porConversacion,
  })
}
