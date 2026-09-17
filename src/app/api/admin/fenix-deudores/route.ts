// Ruta destino: src/app/api/admin/fenix-deudores/route.ts
// GET: lista deudores (con filtros simples). POST: importa un lote desde
// filas ya parseadas en el cliente (el parseo de CSV vive en
// FenixDeudoresClient.tsx -- acá solo se valida y se inserta).

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type FilaImportada = {
  nombre: string
  documento?: string
  telefono: string
  empresa_acreedora?: string
  monto_deuda?: number | null
  fecha_vencimiento?: string | null
  concepto?: string
  numero_obligacion?: string
  notas?: string
}

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const estadoAprobacion = searchParams.get('estado_aprobacion')

  let query = supabaseService.from('fenix_deudores').select('*').order('created_at', { ascending: false })
  if (estadoAprobacion) query = query.eq('estado_aprobacion', estadoAprobacion)

  const { data, error } = await query
  if (error) {
    console.error('[admin/fenix-deudores GET] error:', error)
    return NextResponse.json({ error: 'No se pudo cargar la lista' }, { status: 500 })
  }
  return NextResponse.json({ deudores: data })
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { filas } = (await req.json()) as { filas: FilaImportada[] }
  if (!Array.isArray(filas) || filas.length === 0) {
    return NextResponse.json({ error: 'No hay filas para importar' }, { status: 400 })
  }
  if (filas.length > 2000) {
    return NextResponse.json({ error: 'Máximo 2000 filas por importación' }, { status: 400 })
  }

  const lote = `csv-${new Date().toISOString()}`
  const errores: string[] = []
  const paraInsertar: Record<string, unknown>[] = []

  filas.forEach((fila, i) => {
    const nombre = String(fila.nombre || '').trim()
    const telefono = String(fila.telefono || '').replace(/\D/g, '')
    if (!nombre) { errores.push(`Fila ${i + 2}: falta nombre`); return }
    if (telefono.length < 10) { errores.push(`Fila ${i + 2}: teléfono inválido (${fila.telefono})`); return }

    paraInsertar.push({
      nombre,
      documento: fila.documento?.trim() || null,
      telefono,
      empresa_acreedora: fila.empresa_acreedora?.trim() || null,
      monto_deuda: typeof fila.monto_deuda === 'number' && !Number.isNaN(fila.monto_deuda) ? fila.monto_deuda : null,
      fecha_vencimiento: fila.fecha_vencimiento || null,
      concepto: fila.concepto?.trim() || null,
      numero_obligacion: fila.numero_obligacion?.trim() || null,
      notas: fila.notas?.trim() || null,
      lote_importacion: lote,
    })
  })

  if (paraInsertar.length === 0) {
    return NextResponse.json({ error: 'Ninguna fila pasó la validación', errores }, { status: 400 })
  }

  const { data, error } = await supabaseService.from('fenix_deudores').insert(paraInsertar).select('id')
  if (error) {
    console.error('[admin/fenix-deudores POST] error:', error)
    return NextResponse.json({ error: 'No se pudo importar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, importados: data?.length || 0, omitidos: errores.length, errores, lote })
}
