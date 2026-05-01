// Ruta destino: src/app/api/productos/[id]/mejorar-descripcion/route.ts
// FASE 4.B: usa org activa.

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: producto } = await (supabase.from('productos') as any)
      .select('*')
      .eq('id', id)
      .eq('org_id', active.org.id)
      .single()

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const { descripcion: descripcionEnviada } = await req.json()
    const descripcion = (descripcionEnviada || producto.descripcion || '').trim()

    if (!descripcion || descripcion.length < 30) {
      return NextResponse.json(
        { error: 'La descripción es muy corta para mejorar (mínimo 30 caracteres)' },
        { status: 400 }
      )
    }

    const prompt = `Eres un experto en copywriting y diseño de descripciones de productos para landing pages.

Te paso la descripción de un producto que actualmente está en un solo bloque continuo. Tu tarea es **reformatearla** para que sea fácil de leer en una landing page, decidiendo el mejor formato según el contenido.

PRODUCTO: ${producto.nombre}${producto.precio ? ` (${producto.precio})` : ''}

DESCRIPCIÓN ACTUAL:
"""
${descripcion}
"""

Reglas importantes:
1. **NO inventes información** que no esté en la descripción original. Solo reorganiza y mejora el formato.
2. **Decide el mejor formato** según el contenido:
   - Si hay muchas características técnicas o features → usa **bullets** con "• "
   - Si es más narrativo → usa **párrafos cortos** separados por línea en blanco
   - Si tiene una intro + características → usa **mezcla** (párrafo + bullets)
3. Usa **saltos de línea** reales (\\n) para separar secciones. Línea en blanco (\\n\\n) entre párrafos. Salto simple (\\n) dentro de listas.
4. Para bullets usa "• " al inicio de cada línea (NO uses guiones, asteriscos ni numeración).
5. Mantén el mismo idioma (español) y el tono original.
6. Puedes corregir errores menores de puntuación pero respeta el contenido.
7. Mantén una longitud similar a la original (no la alargues mucho ni la acortes).
8. Si hay categorías de información (ej: "Características:", "Disponibilidad:"), puedes usar negritas con **texto** para los títulos.

Responde SOLO con un JSON válido (sin markdown, sin backticks):
{
  "descripcionMejorada": "el texto reformateado con saltos de línea reales",
  "formatoUsado": "bullets" | "parrafos" | "mezcla",
  "explicacion": "breve explicación en español de por qué este formato (1 oración)"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()

    let data
    try {
      data = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'La IA no devolvió un formato válido. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    if (!data.descripcionMejorada) {
      return NextResponse.json(
        { error: 'La IA no generó una descripción mejorada' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      descripcionMejorada: data.descripcionMejorada,
      formatoUsado: data.formatoUsado || 'mezcla',
      explicacion: data.explicacion || '',
      descripcionOriginal: descripcion,
    })
  } catch (error) {
    console.error('[mejorar-descripcion] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
