import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'

type ProductoExtraido = {
  nombre: string
  precio: string | null
  descripcion: string
}

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type TipoMedia = typeof TIPOS_PERMITIDOS[number]

const PROMPT_SISTEMA = `Eres un experto en identificar productos en imágenes de catálogos comerciales. Tu tarea es analizar la imagen y extraer cada producto visible.

Para cada producto identifica:
- nombre: el nombre del producto (obligatorio)
- precio: el precio TAL COMO APARECE en la imagen ("$1.250.000", "Desde $50.000", "Consultar", o null si no se ve precio)
- descripcion: breve descripción basada en lo que ves (colores, material, tamaño, variantes)

Si la imagen tiene varios productos, devuelve TODOS. Si solo ves un producto, devuelve uno. Si la imagen no contiene productos comerciales reconocibles, devuelve array vacío.

NO conviertas precios a número. Déjalos como texto.

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
    const { imagenBase64, tipoMedia } = body as {
      imagenBase64: string
      tipoMedia: string
    }

    if (!imagenBase64 || typeof imagenBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Falta la imagen en base64' },
        { status: 400 }
      )
    }

    if (!TIPOS_PERMITIDOS.includes(tipoMedia as TipoMedia)) {
      return NextResponse.json(
        { error: 'Tipo de imagen no soportado. Usa JPG, PNG, WEBP o GIF.' },
        { status: 400 }
      )
    }

    // Validación ruda del tamaño del base64 (limitar a ~7MB de base64 ~= 5MB de imagen)
    if (imagenBase64.length > 7_000_000) {
      return NextResponse.json(
        { error: 'La imagen es muy grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: PROMPT_SISTEMA,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: tipoMedia as TipoMedia,
                data: imagenBase64,
              },
            },
            {
              type: 'text',
              text: 'Extrae todos los productos que veas en esta imagen.',
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
          error: 'La IA devolvió una respuesta no válida. Intenta con otra imagen.',
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
    console.error('[api/catalogo/extraer-imagen] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
