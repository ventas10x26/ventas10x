import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'

type ProductoExtraido = {
  nombre: string
  precio: string | null
  descripcion: string
}

const PROMPT_SISTEMA = `Eres un experto en catálogos comerciales para vendedores en Latinoamérica. Tu tarea es extraer productos de listas de texto y devolverlos en JSON estructurado.

Reglas:
- Identifica cada producto individual
- Extrae 3 campos: nombre (obligatorio), precio (string, puede ser null), descripcion (string)
- El precio se extrae TAL COMO APARECE en el texto. Ejemplos válidos:
  * "$1.250.000"
  * "1.250.000 COP"
  * "Desde $50.000"
  * "Consultar"
  * "Negociable"
  * null (si el producto no menciona precio)
- NO conviertas el precio a número. Déjalo como texto natural.
- Si un producto no tiene descripción, genera una breve (máximo 100 caracteres) basada en el nombre.
- Ignora líneas que no sean productos (encabezados, títulos, separadores, texto suelto).

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
    const { tipo, contenido } = body as { tipo: 'texto'; contenido: string }

    if (tipo !== 'texto') {
      return NextResponse.json(
        { error: 'Por ahora solo se soporta tipo "texto". Imagen/PDF/Excel vienen pronto.' },
        { status: 400 }
      )
    }

    if (!contenido || typeof contenido !== 'string' || contenido.trim().length < 3) {
      return NextResponse.json(
        { error: 'El contenido está vacío o es muy corto' },
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
          content: `Extrae los productos de esta lista:\n\n${contenido}`,
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
          error: 'La IA devolvió una respuesta no válida. Intenta con un texto más claro.',
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
    console.error('[api/catalogo/extraer] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}