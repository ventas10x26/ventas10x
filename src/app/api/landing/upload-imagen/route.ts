// Ruta destino: src/app/api/landing/upload-imagen/route.ts
// FASE 4.B: usa org activa para resolver vendedor_id (owner) y org_id.
// El admin invitado puede subir imágenes a la landing del owner.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getActiveOrg } from '@/lib/get-active-org'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const BUCKET = 'landing-images'
const TABLA = 'landing_config'
const TIPOS_VALIDOS = ['hero', 'logo', 'galeria'] as const
type TipoImagen = (typeof TIPOS_VALIDOS)[number]

export async function POST(req: Request) {
  try {
    const active = await getActiveOrg()
    if (!active) {
      return NextResponse.json({ error: 'Sin org activa' }, { status: 400 })
    }

    // El registro en landing_config se identifica por vendedor_id = owner de la org
    const vendedorId = active.org.owner_id
    const orgId = active.org.id

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const tipo = (formData.get('tipo') as string) as TipoImagen | null

    if (!file) {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
    }
    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        { error: `Tipo inválido. Debe ser: ${TIPOS_VALIDOS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validaciones del archivo
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Archivo > 5MB' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'No es una imagen' }, { status: 400 })
    }

    // Subir al bucket
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${vendedorId}/${tipo}-${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: errUpload } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (errUpload) {
      console.error('[upload-imagen]', errUpload)
      return NextResponse.json({ error: errUpload.message }, { status: 500 })
    }

    // URL pública
    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    const url = urlData.publicUrl

    // Actualizar landing_config según tipo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cambios: Record<string, any> = { vendedor_id: vendedorId, org_id: orgId }
    if (tipo === 'hero') cambios.imagen_hero = url
    if (tipo === 'logo') cambios.imagen_logo = url
    if (tipo === 'galeria') {
      // Para galería, agregar a array existente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabaseAdmin.from(TABLA) as any)
        .select('imagenes_galeria')
        .eq('vendedor_id', vendedorId)
        .maybeSingle()

      const galeria: string[] = existing?.imagenes_galeria || []
      cambios.imagenes_galeria = [...galeria, url]
    }

    // Upsert (crear o actualizar)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: errUpdate } = await (supabaseAdmin.from(TABLA) as any)
      .upsert(cambios, { onConflict: 'vendedor_id' })

    if (errUpdate) {
      console.error('[upload-imagen update]', errUpdate)
      return NextResponse.json({ error: errUpdate.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, url, tipo })
  } catch (error) {
    console.error('[upload-imagen]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
