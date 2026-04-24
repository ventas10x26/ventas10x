// Ruta destino: src/app/api/landing/upload-imagen/route.ts
// Sube un archivo o descarga desde URL externa (ej: Unsplash) y la guarda
// en el bucket 'landing-images' de Supabase Storage.
// Luego devuelve la URL pública lista para usar en la landing.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente con service_role para poder escribir en Storage sin RLS
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
    const contentType = req.headers.get('content-type') || ''

    let slug: string
    let tipo: TipoImagen
    let fileBuffer: ArrayBuffer
    let filename: string
    let mimeType: string

    // ── Caso 1: multipart/form-data (archivo subido desde el chat) ──
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      slug = (formData.get('slug') as string) || ''
      tipo = (formData.get('tipo') as TipoImagen) || 'hero'

      if (!file) {
        return NextResponse.json(
          { error: 'Falta el archivo' },
          { status: 400 }
        )
      }

      fileBuffer = await file.arrayBuffer()
      filename = file.name
      mimeType = file.type || 'image/jpeg'
    }
    // ── Caso 2: JSON con URL externa (ej: Unsplash) ──
    else {
      const body = await req.json()
      slug = body.slug || ''
      tipo = body.tipo || 'hero'
      const url = body.url as string

      if (!url) {
        return NextResponse.json(
          { error: 'Falta la URL de la imagen' },
          { status: 400 }
        )
      }

      const r = await fetch(url)
      if (!r.ok) {
        return NextResponse.json(
          { error: `No se pudo descargar la imagen (${r.status})` },
          { status: 500 }
        )
      }

      fileBuffer = await r.arrayBuffer()
      mimeType = r.headers.get('content-type') || 'image/jpeg'
      const ext = mimeType.split('/')[1] || 'jpg'
      filename = `external-${Date.now()}.${ext}`
    }

    // Validaciones
    if (!slug) {
      return NextResponse.json({ error: 'Falta el slug' }, { status: 400 })
    }
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        { error: `Tipo inválido. Debe ser: ${TIPOS_VALIDOS.join(', ')}` },
        { status: 400 }
      )
    }
    if (!mimeType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo no es una imagen' },
        { status: 400 }
      )
    }
    if (fileBuffer.byteLength > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen es mayor a 5MB' },
        { status: 400 }
      )
    }

    // Ruta en el bucket: slug/tipo-timestamp.ext
    const ext = filename.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const path = `${slug}/${tipo}-${timestamp}.${ext}`

    // Subir a Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `Error al subir: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Obtener URL pública
    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path)

    const publicUrl = publicData.publicUrl

    // Actualizar el registro de la landing según el tipo
    if (tipo === 'galeria') {
      // Leer array actual y agregar nueva URL
      const { data: landing } = await supabaseAdmin
        .from(TABLA)
        .select('imagenes_galeria')
        .eq('slug', slug)
        .single()

      const galeriaActual: string[] = landing?.imagenes_galeria || []
      const nuevaGaleria = [...galeriaActual, publicUrl]

      const { error: updateError } = await supabaseAdmin
        .from(TABLA)
        .update({ imagenes_galeria: nuevaGaleria })
        .eq('slug', slug)

      if (updateError) {
        return NextResponse.json(
          { error: `Error al actualizar DB: ${updateError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        url: publicUrl,
        path,
        tipo,
        galeria: nuevaGaleria,
      })
    } else {
      const campoDb = tipo === 'hero' ? 'imagen_hero' : 'imagen_logo'

      const { error: updateError } = await supabaseAdmin
        .from(TABLA)
        .update({ [campoDb]: publicUrl })
        .eq('slug', slug)

      if (updateError) {
        return NextResponse.json(
          { error: `Error al actualizar DB: ${updateError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({ ok: true, url: publicUrl, path, tipo })
    }
  } catch (error) {
    console.error('upload-imagen error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}

// Aumentar límite de body para archivos
export const config = {
  api: {
    bodyParser: false,
  },
}
