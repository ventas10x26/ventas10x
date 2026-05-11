// Ruta destino: src/app/api/pulse/leads/[id]/clasificar/route.ts
//
// POST: clasifica un lead usando Claude.
// Extrae: nombre, teléfono, modelo, score 1-10, urgencia.
// Actualiza el lead con los datos extraídos.
// Registra evento 'lead_clasificado' en pulse_eventos.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Cargar el lead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lead, error: leadErr } = await (supabase.from('pulse_leads') as any)
      .select('id, texto_origen, vendedor_id, nombre')
      .eq('id', id)
      .eq('vendedor_id', user.id)
      .single()

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    // Si ya está clasificado, devolver sin reprocesar
    if (lead.nombre) {
      return NextResponse.json({ ok: true, already_classified: true })
    }

    // Llamar a Claude para clasificar
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: `Eres un experto en clasificación de leads de concesionarios automotrices en Latinoamérica.
Tu tarea es analizar un texto crudo de un lead y extraer información estructurada.

Responde ÚNICAMENTE con JSON válido sin backticks:
{
  "nombre": "Nombre del cliente o null si no aparece",
  "telefono": "Teléfono con código país (+57 si Colombia) o null si no aparece",
  "modelo": "Modelo del carro de interés o null si no se menciona",
  "score": 1-10 (qué tan caliente es el lead),
  "urgencia": "alta | media | baja",
  "canal_detectado": "mercadolibre | web | instagram | walk_in | referido | whatsapp | otro"
}

REGLAS PARA SCORE:
- 9-10: Cliente menciona financiación específica + tiempo + modelo concreto = COMPRADOR
- 7-8: Cliente da datos personales + pregunta concreta + modelo específico = INTERESADO
- 5-6: Cliente pregunta info general pero da datos = TIBIO
- 3-4: Cliente solo pregunta precio o datos básicos sin contexto = CURIOSO
- 1-2: Sin información útil = TIRADOR

REGLAS PARA URGENCIA:
- alta: menciona "ya", "pronto", "esta semana", "necesito", "urgente"
- media: pregunta sin urgencia pero con interés claro
- baja: solo curiosidad o consulta general

Si un dato no aparece en el texto, usa null. No inventes datos.`,
      messages: [
        {
          role: 'user',
          content: `Texto del lead:\n\n${lead.texto_origen}`,
        },
      ],
    })

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed: {
      nombre: string | null
      telefono: string | null
      modelo: string | null
      score: number
      urgencia: string
      canal_detectado: string
    }
    try {
      parsed = JSON.parse(clean)
    } catch (parseErr) {
      console.error('[pulse/clasificar] JSON parse error:', parseErr)
      console.error('[pulse/clasificar] raw:', rawText.slice(-200))
      return NextResponse.json(
        { error: 'La IA no pudo clasificar el lead. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    // Actualizar lead con datos extraídos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: leadActualizado, error: updateErr } = await (supabase.from('pulse_leads') as any)
      .update({
        nombre: parsed.nombre,
        telefono: parsed.telefono,
        modelo: parsed.modelo,
        score: parsed.score,
        urgencia: parsed.urgencia,
        canal: parsed.canal_detectado || 'otro',
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateErr) {
      console.error('[pulse/clasificar] update error:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Registrar evento
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('pulse_eventos') as any).insert({
        lead_id: id,
        vendedor_id: user.id,
        tipo: 'lead_clasificado',
        payload: parsed,
      })
    } catch (evErr) {
      console.error('[pulse/clasificar] evento error:', evErr)
    }

    return NextResponse.json({
      ok: true,
      lead: leadActualizado,
      clasificacion: parsed,
    })
  } catch (e) {
    console.error('[pulse/clasificar]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}