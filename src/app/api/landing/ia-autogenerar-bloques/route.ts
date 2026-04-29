// Ruta destino: src/app/api/landing/ia-autogenerar-bloques/route.ts
// FASE 3 - Usa el tema del sector como base. Si el usuario tiene tema definido,
// la IA refina los defaults del tema. Si no, mantiene comportamiento anterior.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getTheme, detectThemeFromIndustria, type SectorKey } from '@/lib/sector-themes'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface RequestBody {
  industria?: string
  empresa?: string
  nombreVendedor?: string
  productoPrincipal?: string
  tema?: SectorKey | string
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json()
    const industria = body.industria?.trim() || ''
    const empresa = body.empresa?.trim() || ''
    const nombreVendedor = body.nombreVendedor?.trim() || 'el asesor'
    const productoPrincipal = body.productoPrincipal?.trim() || ''

    // Resolver el tema: prioridad al campo `tema`, fallback al detectado por `industria`
    const sectorKey = body.tema?.trim()
      ? body.tema.trim() as SectorKey
      : detectThemeFromIndustria(industria)
    const theme = getTheme(sectorKey)

    // Si la IA falla, devolvemos los defaults del tema (siempre algo se renderiza)
    const fallback = {
      ok: true,
      tema: theme.key,
      stats: theme.statsDefault,
      como_funciona: theme.comoFuncionaDefault,
      badge_promo: theme.badgePromoDefault,
    }

    const prompt = `Eres experto en copywriting de landing pages para profesionales en Latinoamérica.

Voy a darte un punto de partida de un sector específico, y tu tarea es **adaptarlo y refinarlo** al asesor concreto. NO inventes números altos. Mantén el tono natural latinoamericano.

CONTEXTO DEL ASESOR:
- Sector detectado: ${theme.nombre} (${theme.emoji})
- Industria que escribió: ${industria || 'no especificada'}
- Asesor: ${nombreVendedor}
- Empresa: ${empresa || 'sin especificar'}
- Producto principal: ${productoPrincipal || 'no especificado'}

PUNTO DE PARTIDA DEL SECTOR (refínalo):

stats_base = ${JSON.stringify(theme.statsDefault)}
como_funciona_base = ${JSON.stringify(theme.comoFuncionaDefault)}
badge_promo_base = "${theme.badgePromoDefault}"

INSTRUCCIONES:

1. **stats**: Personaliza las 4 métricas para que encajen con el asesor (${nombreVendedor}) si tienes pistas en el contexto. Si no, deja las del sector pero ajusta valores conservadores. Labels en MAYÚSCULAS, máximo 14 caracteres.

2. **como_funciona**: Toma los 3 pasos del sector y reescríbelos en primera persona desde la perspectiva del asesor. Adapta a su producto/servicio si lo conoces. Títulos cortos (1-2 palabras). Descripciones de máximo 12 palabras.

3. **badge_promo**: Toma el badge del sector y adáptalo al contexto. Mantén el tono. Máximo 8 palabras.

Responde SOLO con un JSON válido (sin markdown, sin backticks, sin texto adicional):

{
  "stats": [
    {"valor": "...", "label": "..."},
    {"valor": "...", "label": "..."},
    {"valor": "...", "label": "..."},
    {"valor": "...", "label": "..."}
  ],
  "como_funciona": [
    {"titulo": "...", "descripcion": "..."},
    {"titulo": "...", "descripcion": "..."},
    {"titulo": "...", "descripcion": "..."}
  ],
  "badge_promo": "..."
}`

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
      // Si la IA no devolvió JSON válido, usamos los defaults del sector
      return NextResponse.json(fallback)
    }

    if (!data.stats || !data.como_funciona || !data.badge_promo) {
      return NextResponse.json(fallback)
    }

    return NextResponse.json({
      ok: true,
      tema: theme.key,
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
