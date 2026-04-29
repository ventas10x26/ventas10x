// Ruta destino: src/app/api/landing/ia-autogenerar-bloques/route.ts
// Genera contenido por defecto (stats, como_funciona, badge) según industria
// Se llama 1 vez por cada bloque vacío en la primera carga de la landing.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface RequestBody {
  industria?: string
  empresa?: string
  nombreVendedor?: string
  productoPrincipal?: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body: RequestBody = await req.json()
    const industria = body.industria?.trim() || 'servicios'
    const empresa = body.empresa?.trim() || ''
    const nombreVendedor = body.nombreVendedor?.trim() || 'el asesor'
    const productoPrincipal = body.productoPrincipal?.trim() || ''

    const prompt = `Eres experto en copywriting de landing pages para profesionales en Latinoamérica.

Genera contenido por defecto para la landing de un asesor:
- Industria: ${industria}
- Asesor: ${nombreVendedor}
- Empresa: ${empresa || 'sin especificar'}
- Producto principal: ${productoPrincipal || 'no especificado'}

Genera UN JSON válido (sin markdown, sin backticks) con esta estructura exacta:

{
  "stats": [
    {"valor": "+200", "label": "CLIENTES"},
    {"valor": "5 años", "label": "EXPERIENCIA"},
    {"valor": "5 min", "label": "RESPUESTA"},
    {"valor": "★ 4.9", "label": "RESEÑAS"}
  ],
  "como_funciona": [
    {"titulo": "...", "descripcion": "..."},
    {"titulo": "...", "descripcion": "..."},
    {"titulo": "...", "descripcion": "..."}
  ],
  "badge_promo": "..."
}

Reglas:
1. **stats**: 4 métricas creíbles para esa industria. Valores conservadores y realistas. Labels en MAYÚSCULAS, máximo 12 caracteres. NO inventes números muy altos.
2. **como_funciona**: 3 pasos del cliente desde que descubre la landing hasta que recibe el servicio. Títulos de 1-2 palabras. Descripciones de máximo 12 palabras, claras y concretas.
3. **badge_promo**: 1 frase corta (máx 8 palabras) que cree urgencia o destaque disponibilidad. Tono natural, sin clichés tipo "OFERTA LIMITADA". Ejemplo: "Disponible esta semana" o "Cupos para julio abiertos".

Responde SOLO con el JSON, nada más.`

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
        { error: 'La IA no devolvió un formato válido' },
        { status: 500 }
      )
    }

    if (!data.stats || !data.como_funciona || !data.badge_promo) {
      return NextResponse.json(
        { error: 'JSON incompleto' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      stats: data.stats,
      como_funciona: data.como_funciona,
      badge_promo: data.badge_promo,
    })
  } catch (error) {
    console.error('[ia-autogenerar-bloques]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
