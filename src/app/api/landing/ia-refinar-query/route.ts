// Ruta destino: src/app/api/landing/ia-refinar-query/route.ts
// Recibe un query del usuario en español y lo refina con Claude para
// generar mejores términos de búsqueda en inglés para Unsplash.

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { query, contexto } = await req.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Falta el parámetro query' },
        { status: 400 }
      )
    }

    const prompt = `Eres un experto en búsqueda de imágenes en Unsplash (banco de fotos).

El usuario quiere encontrar fotos para una landing page. Tu tarea es convertir su búsqueda en español a un query optimizado en INGLÉS que devuelva los mejores resultados en Unsplash.

BÚSQUEDA DEL USUARIO: "${query}"
${contexto ? `CONTEXTO: ${contexto}` : ''}

Reglas:
- Devuelve SOLO 2-3 palabras en inglés (más palabras = peores resultados en Unsplash).
- Si el usuario menciona una marca o modelo específico (ej: "Samsung Galaxy S24"), genera un query GENÉRICO equivalente porque Unsplash NO tiene fotos de productos de marca específicos. Ejemplo: "Samsung Galaxy S24" → "modern smartphone black".
- Si menciona un carro específico (ej: "Kia Sportage"), genera algo genérico como "modern SUV white" o "compact SUV silver".
- Para conceptos abstractos, usa términos visuales concretos. Ejemplo: "éxito empresarial" → "business handshake" o "successful team meeting".
- Para productos de comida, ropa, etc., sé descriptivo visualmente.
- Sugiere también 2 alternativas más por si la primera no encuentra resultados.

Responde SOLO con un JSON válido (sin markdown, sin backticks):
{
  "principal": "query principal en inglés",
  "alternativas": ["alternativa 1", "alternativa 2"],
  "explicacion": "breve explicación en español de por qué este query (1 oración)"
}

Ejemplos:
- Usuario: "Samsung Galaxy S24 Ultra" → {"principal":"modern smartphone","alternativas":["black smartphone product","mobile phone"],"explicacion":"Unsplash no tiene fotos de marcas específicas, busqué smartphones modernos genéricos"}
- Usuario: "Kia Sportage 2024" → {"principal":"white SUV","alternativas":["modern compact SUV","silver crossover car"],"explicacion":"Busqué SUVs modernos similares al Sportage"}
- Usuario: "café para mi negocio" → {"principal":"coffee shop","alternativas":["coffee cup","cafe interior"],"explicacion":"Foto de coffee shop o taza de café para tu negocio"}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()

    let data
    try {
      data = JSON.parse(cleaned)
    } catch {
      // Fallback: si no parsea, devolver el query original
      return NextResponse.json({
        principal: query,
        alternativas: [],
        explicacion: 'No se pudo refinar, usando query original',
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[ia-refinar-query] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
