import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { config, message, history } = await req.json()

    const systemPrompt = `Eres ${config.nombre || 'un asistente de ventas'}, el bot IA de ${config.empresa || 'la empresa'}.
Tu industria es: ${config.industria || 'general'}.
Tu tono de comunicación es: ${config.tono || 'profesional'}.
Productos y servicios que ofreces: ${config.productos || 'Productos y servicios varios.'}
${config.faqs ? `Preguntas frecuentes:\n${config.faqs}` : ''}
${config.whatsapp ? `Cuando el cliente quiera hablar con un asesor, dile que puede escribir al WhatsApp: ${config.whatsapp}` : ''}
Instrucciones: Responde siempre en español, de forma natural. Califica al prospecto preguntando para quién es el producto, si requiere financiación, si tiene retoma y cuándo piensa comprar. Respuestas concisas, máximo 3 oraciones.`

    const messages = [
      ...history.map((m: { who: string; text: string }) => ({
        role: m.who === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].type === 'text'
      ? response.content[0].text
      : 'No pude generar una respuesta.'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('bot-preview error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}