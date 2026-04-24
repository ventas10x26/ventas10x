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
    const { slug, form } = await req.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre, apellido, empresa, industria, whatsapp')
      .eq('slug', slug).single()

    const { data: productos } = await supabase
      .from('productos').select('nombre, descripcion, precio')
      .eq('vendedor_id', (await supabase.from('profiles').select('id').eq('slug', slug).single()).data?.id)
      .limit(10)

    const nombreAsesor = profile ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') : 'el asesor'
    const catalogo = productos?.map(p => `• ${p.nombre}${p.precio ? ` - ${p.precio}` : ''}`).join('\n') || 'Sin productos cargados'

    const prompt = `Eres un experto en copywriting de ventas para Latinoamérica.

Genera el contenido para la landing page de un vendedor con estos datos:
- Asesor: ${nombreAsesor}
- Empresa: ${profile?.empresa || 'No especificada'}
- Industria: ${profile?.industria || 'General'}
- Productos/servicios: ${catalogo}
- Título actual: "${form.titulo || 'Sin título'}"
- Subtítulo actual: "${form.subtitulo || 'Sin subtítulo'}"

Genera contenido persuasivo, específico para la industria y orientado a conversión.

Responde SOLO con un JSON válido sin backticks:
{"titulo":"...","subtitulo":"...","producto":"..."}

- titulo: máx 80 chars, impactante, con la propuesta de valor clara
- subtitulo: máx 160 chars, genera urgencia o confianza, incluye beneficio concreto
- producto: 1-3 palabras clave del producto principal`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)

    return NextResponse.json(data)
  } catch (error) {
    console.error('ia-generar error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
