import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { slug, form, message, history } = await req.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('empresa, industria')
      .eq('slug', slug).single()

    const system = `Eres un experto en copywriting y optimización de landing pages de ventas para Latinoamérica.

Estás ayudando a un vendedor a mejorar su landing page.

Datos actuales de la landing:
- Industria: ${profile?.industria || 'General'}
- Empresa: ${profile?.empresa || 'No especificada'}
- Título: "${form.titulo || '(vacío)'}"
- Subtítulo: "${form.subtitulo || '(vacío)'}"
- Producto: "${form.producto || '(vacío)'}"

Cuando el vendedor pida cambios en el contenido, responde con:
1. Una explicación breve de los cambios
2. Al FINAL, un JSON con los campos a actualizar (solo los que cambien):
{"titulo":"...","subtitulo":"...","producto":"..."}

Si el usuario hace preguntas generales, responde sin JSON.
Respuestas concisas, máximo 3 párrafos. En español latinoamericano.`

    const messages = [
      ...history.map((m: { role: string; text: string }) => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system,
      messages,
    })

    const rawReply = response.content[0].type === 'text' ? response.content[0].text : ''
    let reply = rawReply
    let cambios: Record<string, string> = {}

    const jsonMatch = rawReply.match(/\{[^{}]*"titulo"[^{}]*\}|\{[^{}]*"subtitulo"[^{}]*\}|\{[^{}]*"producto"[^{}]*\}/)
    if (jsonMatch) {
      try {
        cambios = JSON.parse(jsonMatch[0])
        reply = rawReply.replace(jsonMatch[0], '').trim()
      } catch { /* ignorar */ }
    }

    return NextResponse.json({ reply, ...cambios })
  } catch (error) {
    console.error('ia-chat error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
