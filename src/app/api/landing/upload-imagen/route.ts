// Ruta destino: src/app/api/landing/upload-imagen/route.ts
// FIX: ahora resuelve vendedor_id desde la sesión autenticada (no necesita slug en body).
// landing_config NO tiene columna `slug`, solo `vendedor_id`. Por eso fallaba.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Cliente admin (service_role) para escribir en Storage sin RLS
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
    // ── Auth: obtener user.id desde cookies (sesión actual) ──
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const vendedorId = user.id

    // ── Obtener slug del usuario para el path en Storage ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('slug')
      .eq('id', vendedorId)
      .single()

    const slug = profile?.slug || vendedorId  // fallback al user.id si no hay slug

    const contentType = req.headers.get('content-type') || ''

    let tipo: TipoImagen
    let fileBuffer: ArrayBuffer
    let filename: string
    let mimeType: string

    // ── Caso 1: multipart/form-data (archivo subido desde el chat) ──
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
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

    // ── Validaciones ──
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
    const ext = filename.split('.').pop()?.split('?')[0] || 'jpg'
    const timestamp = Date.now()
    const path = `${slug}/${tipo}-${timestamp}.${ext}`

    // ── Subir a Supabase Storage ──
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

    // URL pública
    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path)

    const publicUrl = publicData.publicUrl

    // ── Actualizar landing_config (usando vendedor_id, NO slug) ──
    if (tipo === 'galeria') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: landing } = await (supabaseAdmin.from(TABLA) as any)
        .select('imagenes_galeria')
        .eq('vendedor_id', vendedorId)
        .maybeSingle()

      const galeriaActual: string[] = landing?.imagenes_galeria || []
      const nuevaGaleria = [...galeriaActual, publicUrl]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabaseAdmin.from(TABLA) as any)
        .upsert(
          { vendedor_id: vendedorId, imagenes_galeria: nuevaGaleria },
          { onConflict: 'vendedor_id' }
        )

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabaseAdmin.from(TABLA) as any)
        .upsert(
          { vendedor_id: vendedorId, [campoDb]: publicUrl },
          { onConflict: 'vendedor_id' }
        )

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

export const config = {
  api: {
    bodyParser: false,
  },
}
