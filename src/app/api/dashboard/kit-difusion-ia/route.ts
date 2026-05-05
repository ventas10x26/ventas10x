// Ruta destino: src/app/api/dashboard/kit-difusion-ia/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { instruccion, nombre, empresa, industria, slug } = await req.json()
    if (!instruccion?.trim()) return NextResponse.json({ error: 'instruccion requerida' }, { status: 400 })

    const landingUrl = `ventas10x.co/u/${slug}`

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      system: `Eres un experto en marketing digital y redes sociales para vendedores en Latinoamérica.
Tu tarea es generar un kit de difusión completo y personalizado para un vendedor.

Responde ÚNICAMENTE con JSON válido sin backticks:
{
  "copies_wa": ["mensaje1 con emoji", "mensaje2", "mensaje3"],
  "copies_ig": ["copy ig 1 con hashtags", "copy ig 2", "copy ig 3"],
  "asunto_email": "Asunto del email atractivo",
  "cuerpo_email": "Cuerpo del email personalizado con saludo, propuesta de valor y CTA",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8"],
  "estrategia": [
    {"dia": "Lunes", "hora": "9:00 AM", "formato": "Historia Instagram", "tip": "Publica tu historia con el diseño descargado y agrega el sticker de link"},
    {"dia": "Miércoles", "hora": "12:00 PM", "formato": "Post Instagram", "tip": "Comparte un producto destacado de tu catálogo con precio y CTA"},
    {"dia": "Viernes", "hora": "6:00 PM", "formato": "Estado WhatsApp", "tip": "Publica el video animado como estado para que tus contactos vean tu página"},
    {"dia": "Sábado", "hora": "10:00 AM", "formato": "Mensaje directo", "tip": "Envía el mensaje de WhatsApp personalizado a tus mejores 20 contactos"},
    {"dia": "Domingo", "hora": "7:00 PM", "formato": "Email", "tip": "Envía el email a tu lista de clientes anteriores o potenciales"}
  ]
}

REGLAS:
- Personaliza TODO según el sector: ${industria || 'general'}
- Los copies deben incluir el link: ${landingUrl}
- El nombre del vendedor es: ${nombre}${empresa ? `, de ${empresa}` : ''}
- Tono: cercano, profesional, motivador en español latinoamericano
- Los mensajes de WhatsApp max 300 chars, directos y con emoji
- Los copies de Instagram incluyen hashtags relevantes al sector
- La estrategia debe ser práctica y fácil de ejecutar`,
      messages: [{ role: 'user', content: `Objetivo: ${instruccion}\nSector: ${industria || 'general'}\nVendedor: ${nombre}` }],
    })

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({ ok: true, ...parsed })
  } catch (e) {
    console.error('[kit-difusion-ia]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
