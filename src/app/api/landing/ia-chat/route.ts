import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ChatMsg {
  role: 'user' | 'ai'
  text: string
}

export async function POST(req: Request) {
  try {
    const { slug, form, message, history } = await req.json()

    const systemPrompt = `Eres un asistente experto en copywriting, marketing y landing pages para vendedores independientes en Colombia.

Contexto de la landing del vendedor:
- Slug: ${slug || 'no especificado'}
- Título actual: ${form?.titulo || '(vacío)'}
- Subtítulo actual: ${form?.subtitulo || '(vacío)'}
- Descripción producto: ${form?.producto || '(vacío)'}
- Color: ${form?.color_acento || '#FF6B2B'}

Reglas:
- Responde en español, tono cercano y profesional.
- Sé conciso (máximo 3-4 oraciones por respuesta).
- Si el vendedor te pide cambiar título, subtítulo o descripción, devuelve la sugerencia en texto Y también en JSON al final del mensaje con este formato exacto:
<JSON>{"titulo": "...", "subtitulo": "...", "producto": "..."}</JSON>
- Solo incluye en el JSON los campos que efectivamente quieras cambiar.
- Si no hay cambios de contenido, no incluyas el bloque <JSON>.`

    // Construir historial para Claude
    const messages = [
      ...(Array.isArray(history)
        ? history.map((m: ChatMsg) => ({
            role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: m.text,
          }))
        : []),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const fullReply = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    // Extraer JSON si viene incluido
    let reply = fullReply
    let titulo: string | undefined
    let subtitulo: string | undefined
    let producto: string | undefined

    const match = fullReply.match(/<JSON>([\s\S]*?)<\/JSON>/)
    if (match) {
      try {
        const parsed = JSON.parse(match[1].trim())
        titulo = parsed.titulo
        subtitulo = parsed.subtitulo
        producto = parsed.producto
        // Quitar el bloque JSON del mensaje visible
        reply = fullReply.replace(/<JSON>[\s\S]*?<\/JSON>/, '').trim()
      } catch {
        // Si falla el parse, devolvemos el texto completo sin cambios
      }
    }

    return NextResponse.json({
      reply,
      titulo,
      subtitulo,
      producto,
    })
  } catch (error) {
    console.error('ia-chat error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}