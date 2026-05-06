import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { instruccion } = await req.json()
    if (!instruccion?.trim()) return NextResponse.json({ error: 'instruccion requerida' }, { status: 400 })

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `Eres un experto en email marketing para Ventas10x, plataforma SaaS de ventas para Latinoamérica.
Genera el contenido completo de una campaña. Responde ÚNICAMENTE con JSON válido sin backticks ni texto adicional:
{
  "nombre": "Nombre corto de la campaña",
  "asunto": "Asunto del email atractivo max 60 chars",
  "cuerpo_email": "Cuerpo en texto plano, profesional y cercano, 3-4 párrafos, sin saludo inicial, con CTA claro al final",
  "mensaje_wa": "Mensaje WhatsApp max 300 chars con {{nombre}}, emoji relevante y link https://ventas10x.co/dashboard",
  "explicacion": "Una línea con la estrategia de esta campaña"
}
Tono: profesional pero cercano, motivador, español latinoamericano.`,
      messages: [{ role: 'user', content: instruccion }],
    })

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json({ ok: true, ...parsed })
  } catch (e) {
    console.error('[generar-ia]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
