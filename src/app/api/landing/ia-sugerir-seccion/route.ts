// Ruta destino: src/app/api/landing/ia-sugerir-seccion/route.ts
// La IA analiza el contexto y sugiere qué sección crear con contenido pre-generado.

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { form, analisis, tipoPedido } = await req.json()

    // Si el usuario pide un tipo específico, usamos ese; si no, la IA decide
    const tipoInstruccion = tipoPedido
      ? `El usuario quiere específicamente una sección de tipo: ${tipoPedido}. Genera contenido para ese tipo.`
      : 'Analiza el contexto y sugiere UNA sola sección de las disponibles que sea la más útil.'

    const prompt = `Eres un experto en landing pages de alta conversión para vendedores en Colombia.

CONTEXTO DE LA LANDING:
- Título: ${form?.titulo || '(vacío)'}
- Subtítulo: ${form?.subtitulo || '(vacío)'}
- Producto/industria: ${form?.producto || '(vacío)'}
- Color marca: ${form?.color_acento || '#FF6B2B'}

${analisis ? `ANÁLISIS PREVIO:\n${analisis}\n` : ''}

SECCIONES DISPONIBLES (MVP):
- testimonios: reseñas de clientes (genera 3 testimonios realistas para la industria)
- faq: preguntas frecuentes (genera 4-5 preguntas típicas de la industria con respuestas)
- cta: botón llamado a la acción destacado (con urgencia)

${tipoInstruccion}

Responde SOLO con un JSON válido (sin backticks, sin markdown, sin texto extra) con este formato exacto:

Para testimonios:
{
  "tipo": "testimonios",
  "razon": "breve explicación de por qué esta sección ayuda",
  "titulo": "Lo que dicen nuestros clientes",
  "subtitulo": "subtítulo opcional o null",
  "contenido": {
    "items": [
      {"id": "t1", "nombre": "María P.", "texto": "...", "rating": 5, "empresa": "Bogotá"},
      {"id": "t2", "nombre": "Carlos R.", "texto": "...", "rating": 5, "empresa": "Medellín"},
      {"id": "t3", "nombre": "Ana M.", "texto": "...", "rating": 5, "empresa": "Cali"}
    ]
  }
}

Para faq:
{
  "tipo": "faq",
  "razon": "...",
  "titulo": "Preguntas Frecuentes",
  "subtitulo": null,
  "contenido": {
    "items": [
      {"id": "f1", "pregunta": "...", "respuesta": "..."},
      {"id": "f2", "pregunta": "...", "respuesta": "..."}
    ]
  }
}

Para cta:
{
  "tipo": "cta",
  "razon": "...",
  "titulo": "¿Listo para empezar?",
  "subtitulo": "subtítulo motivador",
  "contenido": {
    "boton_texto": "Contactar ahora",
    "usar_whatsapp": true,
    "mensaje_wa": "Hola, vi tu landing y me interesa...",
    "descripcion": "texto breve motivador antes del botón"
  }
}

Reglas:
- Testimonios: usa nombres colombianos reales y cortos. Ciudades colombianas. Textos de 1-2 oraciones creíbles.
- FAQ: preguntas que REALMENTE se hacen los clientes antes de comprar en esa industria.
- CTA: tono directo, con urgencia suave. El botón corto (máx 3 palabras).
- Todo en español, tono cercano y profesional.`

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
        { error: 'Respuesta inválida del modelo', raw: text },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[ia-sugerir-seccion] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
