// Ruta destino: src/app/api/banco-imagenes/route.ts
// POST: sube una imagen al banco con análisis de IA (etiquetas + moderación)
// GET: lista imágenes del banco (propias + públicas con filtros)

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const BUCKET = 'banco-imagenes'
const MAX_SIZE = 5 * 1024 * 1024  // 5MB

// ═══════════════════════════════════════════════════════════════
// POST: Subir imagen al banco
// FormData: file (File) + opcional publica (boolean)
// ═══════════════════════════════════════════════════════════════

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const publica = formData.get('publica') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen supera 5MB' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // ── Análisis IA: etiquetas + moderación ──
    const base64 = buffer.toString('base64')
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    if (file.type === 'image/png') mediaType = 'image/png'
    else if (file.type === 'image/webp') mediaType = 'image/webp'
    else if (file.type === 'image/gif') mediaType = 'image/gif'
    else mediaType = 'image/jpeg'

    let etiquetas: string[] = []
    let descripcion = ''
    let categoria = 'otro'
    let aprobada = false
    let motivoRechazo: string | undefined

    try {
      const analisis = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              {
                type: 'text',
                text: `Analiza esta imagen para un banco de fotos de productos comerciales.

Tu tarea:
1. **MODERACIÓN**: ¿Es apropiada para uso comercial? Rechaza si:
   - Tiene contenido sexual, desnudez, o sugerente
   - Tiene violencia, sangre, armas
   - Tiene drogas, contenido ilegal
   - Es ofensiva o discriminatoria
   - Es ilegible o de muy baja calidad

2. **CATEGORIZACIÓN**: Clasifica en una categoría: "vehiculo", "inmueble", "alimento", "moda", "tecnologia", "salud", "servicio", "personas", "ambiente", "abstracto", "otro"

3. **ETIQUETAS**: Extrae 4-8 etiquetas en español, cortas y descriptivas (sustantivos, colores, características clave). Sin "el", "la". Minúsculas.

4. **DESCRIPCIÓN**: Una oración breve en español que describa qué se ve.

Responde SOLO con JSON válido (sin markdown):
{
  "aprobada": true|false,
  "motivoRechazo": "razón si fue rechazada, sino null",
  "categoria": "vehiculo"|"inmueble"|...,
  "etiquetas": ["carro", "suv", "blanco", "kia"],
  "descripcion": "SUV blanco moderno visto de frente"
}`,
              },
            ],
          },
        ],
      })

      const textBlock = analisis.content.find((b) => b.type === 'text')
      const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''
      const cleaned = text.replace(/```json|```/g, '').trim()

      const data = JSON.parse(cleaned)
      aprobada = !!data.aprobada
      motivoRechazo = data.motivoRechazo || undefined
      etiquetas = Array.isArray(data.etiquetas) ? data.etiquetas.slice(0, 10) : []
      descripcion = String(data.descripcion || '').substring(0, 200)
      categoria = String(data.categoria || 'otro').substring(0, 50)
    } catch (e) {
      console.error('[banco-imagenes] Error análisis IA:', e)
      // Si la IA falla, dejamos imagen privada y sin análisis
      aprobada = false
      motivoRechazo = 'No se pudo analizar (sube sin etiquetas)'
    }

    // Si la imagen fue rechazada y el usuario quería publicarla, forzamos privada
    const publicaFinal = publica && aprobada

    // ── Subir a Storage ──
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      })

    if (uploadError || !uploadData) {
      return NextResponse.json(
        { error: uploadError?.message || 'Error al subir' },
        { status: 500 }
      )
    }

    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from(BUCKET)
      .getPublicUrl(fileName)

    const url = publicUrlData.publicUrl

    // ── Guardar en BD ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bancoData, error: bancoError } = await (supabase.from('banco_imagenes') as any)
      .insert({
        vendedor_id: user.id,
        url,
        storage_path: fileName,
        publica: publicaFinal,
        aprobada,
        motivo_rechazo: motivoRechazo,
        etiquetas,
        descripcion,
        categoria,
        formato: ext,
        tamaño_kb: Math.round(file.size / 1024),
      })
      .select('*')
      .single()

    if (bancoError) {
      // Rollback: si falla la BD, borrar de Storage
      await supabaseAdmin.storage.from(BUCKET).remove([fileName])
      return NextResponse.json({ error: bancoError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      imagen: bancoData,
      mensaje: aprobada
        ? '✅ Imagen subida y analizada'
        : `⚠️ Imagen rechazada por moderación: ${motivoRechazo}`,
    })
  } catch (error) {
    console.error('[banco-imagenes POST] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════
// GET: Listar imágenes del banco
// Query params:
//   ?scope=mias|publicas|todas (default: todas)
//   ?q=texto (búsqueda por etiquetas o descripción)
//   ?categoria=vehiculo|inmueble|...
//   ?limit=50 (default 50, max 100)
// ═══════════════════════════════════════════════════════════════

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const url = new URL(req.url)
    const scope = url.searchParams.get('scope') || 'todas'
    const q = url.searchParams.get('q')?.trim().toLowerCase()
    const categoria = url.searchParams.get('categoria')
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('banco_imagenes') as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filtrar por scope
    if (scope === 'mias') {
      query = query.eq('vendedor_id', user.id)
    } else if (scope === 'publicas') {
      query = query.eq('publica', true).eq('aprobada', true).neq('vendedor_id', user.id)
    } else {
      // todas: mías + públicas aprobadas de otros
      query = query.or(`vendedor_id.eq.${user.id},and(publica.eq.true,aprobada.eq.true)`)
    }

    if (categoria) {
      query = query.eq('categoria', categoria)
    }

    if (q) {
      // Buscar en etiquetas (array contiene) o descripción
      query = query.or(
        `descripcion.ilike.%${q}%,etiquetas.cs.{${q}}`
      )
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ imagenes: data || [] })
  } catch (error) {
    console.error('[banco-imagenes GET] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
