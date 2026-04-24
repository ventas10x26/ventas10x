// Ruta destino: src/app/api/landing/ia-aplicar-mejoras/route.ts
// NUEVO archivo — crea la carpeta ia-aplicar-mejoras/ dentro de src/app/api/landing/

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { slug, form, analisis } = await req.json()

    if (!analisis) {
      return NextResponse.json(
        { error: 'Falta el análisis previo' },
        { status: 400 }
      )
    }

    const prompt = `Eres un experto en copywriting para landing pages de vendedores en Colombia.

Tienes una landing actual y un análisis con oportunidades de mejora. Tu tarea es aplicar esas mejoras y devolver las versiones CORREGIDAS de título, subtítulo y descripción del producto.

LANDING ACTUAL:
- Vendedor/slug: ${slug || 'no especificado'}
- Título: ${form?.titulo || '(vacío)'}
- Subtítulo: ${form?.subtitulo || '(vacío)'}
- Descripción producto: ${form?.producto || '(vacío)'}
- Color de marca: ${form?.color_acento || '#FF6B2B'}

ANÁLISIS Y OPORTUNIDADES DE MEJORA:
${analisis}

Reglas:
- Aplica TODAS las mejoras sugeridas en el análisis.
- Mantén el foco en la industria/producto actual.
- Título: máximo 60 caracteres, con gancho emocional y beneficio claro.
- Subtítulo: máximo 140 caracteres, refuerza la propuesta de valor.
- Producto: 2-3 oraciones persuasivas orientadas al cliente.
- Tono cercano, profesional, colombiano (sin ser coloquial).

Responde SOLO con un JSON válido con este formato exacto, sin markdown, sin backticks, sin texto adicional:
{"titulo": "...", "subtitulo": "...", "producto": "..."}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
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
        { error: 'Respuesta inválida del modelo', raw: text },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('ia-aplicar-mejoras error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
