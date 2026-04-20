import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'

type ProductoExtraido = {
  nombre: string
  precio: string | null
  descripcion: string
}

export const maxDuration = 60

const PROMPT_SISTEMA = `Eres un experto en analizar catálogos comerciales en PDF. Tu tarea es leer el documento y extraer cada producto que aparezca.

Para cada producto identifica:
- nombre: el nombre del producto (obligatorio)
- precio: el precio TAL COMO APARECE en el documento ("$1.250.000", "Desde $50.000", "Consultar", o null si no aparece precio)
- descripcion: breve descripción con la información relevante (especificaciones, variantes, colores, etc.)

Si el PDF tiene muchas páginas, procesa TODAS las páginas. Extrae TODOS los productos visibles en el documento completo.
Ignora contenido que no sea producto: portadas, páginas de contacto, términos y condiciones, publicidad no comercial, índices.

NO conviertas precios a número. Déjalos como texto natural.

Responde SIEMPRE con JSON válido en este formato exacto:
{
  "productos": [
    { "nombre": "...", "precio": "...", "descripcion": "..." }
  ]
}

No agregues explicaciones antes ni después del JSON. Solo el JSON.`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { rutaArchivo } = body as { rutaArchivo: string }

    if (!rutaArchivo || typeof rutaArchivo !== 'string') {
      return NextResponse.json(
        { error: 'Falta la ruta del archivo' },
        { status: 400 }
      )
    }

    // Validar que la ruta pertenece al usuario (seguridad extra, aunque RLS ya la aplica)
    if (!rutaArchivo.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: 'Ruta de archivo no válida' },
        { status: 403 }
      )
    }

    // Descargar el PDF desde Supabase Storage
    const { data: archivoBlob, error: downloadError } = await supabase.storage
      .from('catalogo-uploads')
      .download(rutaArchivo)

    if (downloadError || !archivoBlob) {
      console.error('[api/catalogo/extraer-pdf] Error al descargar:', downloadError)
      return NextResponse.json(
        { error: 'No se pudo descargar el PDF desde Storage' },
        { status: 500 }
      )
    }

    // Convertir a base64 para mandar a Claude
    const buffer = await archivoBlob.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    // Validar tamaño
    if (base64.length > 14_000_000) {
      return NextResponse.json(
        { error: 'El PDF es muy grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      system: PROMPT_SISTEMA,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Extrae todos los productos de este catálogo PDF.',
            },
          ],
        },
      ],
    })

    const textoRespuesta = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('')

    const jsonLimpio = textoRespuesta
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .trim()

    let parsed: { productos: ProductoExtraido[] }
    try {
      parsed = JSON.parse(jsonLimpio)
    } catch {
      return NextResponse.json(
        {
          error: 'La IA devolvió una respuesta no válida. Intenta con otro PDF.',
          debug: textoRespuesta.substring(0, 200),
        },
        { status: 500 }
      )
    }

    if (!Array.isArray(parsed.productos)) {
      return NextResponse.json(
        { error: 'La IA no devolvió productos reconocibles' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      productos: parsed.productos,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    })
  } catch (error) {
    console.error('[api/catalogo/extraer-pdf] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
