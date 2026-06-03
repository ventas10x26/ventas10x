// src/app/api/pulse/playground/route.ts
// Endpoint del playground — misma lógica exacta que el webhook de WhatsApp

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function obtenerConfigAgente(email: string): Promise<{ systemPrompt: string; nombre: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('nombre, metadata')
      .ilike('email', email)
      .maybeSingle()

    if (!data) return { systemPrompt: '', nombre: 'el asesor' }

    const cfg = data.metadata?.agent_config as Record<string, unknown> | undefined
    return {
      systemPrompt: String(cfg?.system_prompt || ''),
      nombre: data.nombre || 'el asesor',
    }
  } catch (e) {
    console.error('[playground] obtenerConfigAgente error:', e)
    return { systemPrompt: '', nombre: 'el asesor' }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { mensaje, historial, email, systemPromptOverride } = await req.json()

    if (!mensaje?.trim()) {
      return NextResponse.json({ error: 'mensaje requerido' }, { status: 400 })
    }

    // Obtener config del agente (igual que el webhook)
    const agenteEmail = email || 'ricaza81@gmail.com'
    const { systemPrompt: systemPromptDB, nombre } = await obtenerConfigAgente(agenteEmail)

    // Permitir override del system prompt desde el playground
    const systemPrompt = systemPromptOverride ?? systemPromptDB

    // Sanitizar historial — misma lógica exacta del webhook
    const historialLimpio: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const turn of (historial || []).slice(-6)) {
      const ultimo = historialLimpio[historialLimpio.length - 1]
      if (ultimo && ultimo.role === turn.role) continue
      historialLimpio.push(turn)
    }
    if (historialLimpio[historialLimpio.length - 1]?.role === 'user') {
      historialLimpio.pop()
    }

    const { anthropic } = await import('@/lib/anthropic')

    // System prompt — IDÉNTICO al webhook
    const systemFinal = systemPrompt
      ? `${systemPrompt}

REGLAS ESTRICTAS:
- Responde en español colombiano, tono cercano y natural
- Máximo 2-3 oraciones — esto es WhatsApp
- No uses asteriscos ni markdown
- Suena como ${nombre}, no como un bot
- NUNCA inventes datos: ciudad, precios exactos, tasas, fechas de entrega
- Si no sabes algo con certeza, di "te confirmo ese dato" o "déjame verificar"
- Si mencionan inicial + crédito + plazo: di que vas a simular la cuota con KIA Crédito y pide confirmar el modelo exacto
- Si quieren ver el carro: ofrece enviar la foto y el enlace del concesionario`
      : `Eres el asistente de ventas de ${nombre}, asesor KIA. Responde en español colombiano, de forma natural y cercana. Máximo 2-3 oraciones. NUNCA inventes datos que no te hayan dado.`

    const startTime = Date.now()

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      system: systemFinal,
      messages: [
        ...historialLimpio,
        { role: 'user', content: mensaje.trim() },
      ],
    })

    const latencia = Date.now() - startTime
    const respuesta = msg.content[0].type === 'text' ? msg.content[0].text : null
    const inputTokens = msg.usage?.input_tokens || 0
    const outputTokens = msg.usage?.output_tokens || 0

    return NextResponse.json({
      ok: true,
      respuesta,
      nombre,
      systemPrompt: systemPromptDB,
      meta: {
        modelo: 'claude-haiku-4-5-20251001',
        latencia_ms: latencia,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      },
    })
  } catch (e) {
    console.error('[playground] error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
