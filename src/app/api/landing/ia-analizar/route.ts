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
      .select('empresa, industria')
      .eq('slug', slug).single()

    const { data: leads } = await supabase
      .from('leads').select('id').eq('slug_origen', slug)

    const totalLeads = leads?.length || 0

    const prompt = `Eres un experto en optimización de landing pages de ventas para Latinoamérica.

Analiza esta landing page de un vendedor:
- Industria: ${profile?.industria || 'General'}
- Empresa: ${profile?.empresa || 'No especificada'}
- Título: "${form.titulo || '(vacío)'}"
- Subtítulo: "${form.subtitulo || '(vacío)'}"
- Producto clave: "${form.producto || '(vacío)'}"
- Leads generados hasta ahora: ${totalLeads}

Proporciona un análisis conciso en español con:

✅ PUNTOS FUERTES (máx 2)
⚠️ OPORTUNIDADES DE MEJORA (máx 3, con sugerencias concretas)
🎯 RECOMENDACIÓN PRINCIPAL (1 acción específica que mayor impacto tendría)

Sé específico y accionable. Máximo 200 palabras.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const analisis = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ analisis })
  } catch (error) {
    console.error('ia-analizar error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
