// Ruta destino: src/app/api/admin/campanas/generar-ia/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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

  try {
    const parsed = JSON.parse(rawText)
    return NextResponse.json({ ok: true, ...parsed })
  } catch {
    return NextResponse.json({ error: 'Error procesando respuesta IA' }, { status: 500 })
  }
}
