import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { slug, form } = await req.json()

    const prompt = `Eres un experto en copywriting y marketing digital para vendedores independientes en Colombia.

Genera contenido para una landing page de venta basado en esta información:

- Slug/vendedor: ${slug || 'no especificado'}
- Industria/producto actual: ${form?.producto || 'no especificado'}
- Título actual: ${form?.titulo || 'no especificado'}
- Subtítulo actual: ${form?.subtitulo || 'no especificado'}
- Color de marca: ${form?.color_acento || '#FF6B2B'}

Genera una propuesta MEJORADA con:
1. Un título llamativo y orientado a beneficio (máximo 60 caracteres)
2. Un subtítulo que complemente el título y refuerce la propuesta de valor (máximo 140 caracteres)
3. Una descripción del producto clara, persuasiva y orientada al cliente (2-3 oraciones)

Responde SOLO con un JSON válido con este formato exacto, sin markdown, sin backticks, sin texto adicional:
{"titulo": "...", "subtitulo": "...", "producto": "..."}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    // Limpiar posibles backticks o markdown
    const cleaned = text.replace(/```json|```/g, '').trim()

    let data
    try {
      data = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Respuesta inválida del modelo', raw: text },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('ia-generar error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}