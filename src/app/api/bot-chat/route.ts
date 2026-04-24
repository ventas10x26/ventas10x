import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { config, message, history } = await req.json()

    const systemPrompt = `Eres ${config.nombre || 'un asistente de ventas'}, el bot IA de ${config.empresa || 'la empresa'}.
Tu industria es: ${config.industria || 'general'}.
Tu tono de comunicación es: ${config.tono || 'profesional'}.
Productos y servicios: ${config.productos || 'Productos y servicios varios.'}
${config.faqs ? `Preguntas frecuentes:\n${config.faqs}` : ''}
${config.whatsapp ? `WhatsApp del asesor: ${config.whatsapp}` : ''}

Instrucciones:
- Responde en español, de forma natural y conversacional.
- Califica al prospecto preguntando: para quién es el producto, si requiere financiación, si tiene retoma, cuándo piensa comprar.
- Cuando detectes intención de compra alta (el prospecto pregunta por precio, disponibilidad, financiación o dice que quiere comprar), responde con JSON al final: {"showLeadForm": true}
- Respuestas concisas, máximo 3 oraciones.
- IMPORTANTE: Si vas a mostrar el formulario, agrega al FINAL de tu respuesta exactamente: ###SHOW_LEAD_FORM###`

    const messages = [
      ...history
        .filter((m: { type?: string }) => m.type !== 'lead-form')
        .map((m: { who: string; text: string }) => ({
          role: m.who === 'user' ? 'user' as const : 'assistant' as const,
          content: m.text,
        })),
      { role: 'user' as const, content: message },
    ]

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 350,
      system: systemPrompt,
      messages,
    })

    let reply = response.content[0].type === 'text' ? response.content[0].text : 'No pude generar una respuesta.'
    
    const showLeadForm = reply.includes('###SHOW_LEAD_FORM###')
    reply = reply.replace('###SHOW_LEAD_FORM###', '').trim()

    return NextResponse.json({ reply, showLeadForm })
  } catch (error) {
    console.error('bot-chat error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
