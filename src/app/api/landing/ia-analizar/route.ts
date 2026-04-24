import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { slug, form } = await req.json()

    const prompt = `Eres un experto en conversión de landing pages y copywriting para vendedores en Colombia.

Analiza la siguiente landing page y da retroalimentación clara y accionable:

- Vendedor/slug: ${slug || 'no especificado'}
- Título: ${form?.titulo || '(vacío)'}
- Subtítulo: ${form?.subtitulo || '(vacío)'}
- Descripción del producto: ${form?.producto || '(vacío)'}
- Color de marca: ${form?.color_acento || '#FF6B2B'}

Tu análisis debe incluir, en español y de forma concisa:

✅ **Qué está bien** (2-3 puntos)
⚠️ **Qué mejorar** (2-3 puntos concretos con sugerencias específicas)
💡 **Sugerencia clave** (la mejora #1 con mayor impacto en conversión)

Usa formato markdown simple. Sé directo, sin relleno. Máximo 300 palabras.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const analisis =
      textBlock && textBlock.type === 'text' ? textBlock.text : ''

    return NextResponse.json({ analisis })
  } catch (error) {
    console.error('ia-analizar error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}