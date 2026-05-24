// Ruta destino: src/app/api/pulse/leads/[id]/responder/route.ts
//
// POST: genera un mensaje de WhatsApp personalizado para responder al lead.
// Usa Claude con conocimiento de los modelos KIA (Picanto, Sportage, Seltos)
// para personalizar el tono y los puntos de venta.
// Guarda el mensaje en pulse_leads.mensaje_ia.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { buildResponderSystemPrompt, type PulseAgentMetadata } from '@/lib/pulse-agent'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Mini-base de conocimiento de modelos KIA top en Colombia
const PERFILES_MODELO: Record<string, string> = {
  picanto: 'Hatchback urbano. Target: jóvenes, primer carro, parejas sin hijos. Puntos fuertes: economía de combustible, fácil de parquear, mantenimiento bajo, precio de entrada accesible. Cuotas desde valor moderado.',
  sportage: 'SUV familiar. Target: familias 30-45 años, profesionales. Puntos fuertes: seguridad (5 estrellas), espacio interior, opción híbrida, tecnología, prestigio de marca. Financiación atractiva a 60 meses.',
  seltos: 'SUV compacto. Target: profesionales jóvenes 28-40 años, parejas sin hijos o con uno. Puntos fuertes: diseño moderno, conectividad, eficiencia, precio entre Picanto y Sportage.',
  sonet: 'SUV pequeño urbano. Target: parejas jóvenes, primer SUV. Puntos fuertes: precio accesible para SUV, diseño llamativo, fácil maniobra en ciudad.',
  k3: 'Sedán mediano. Target: profesionales que quieren auto formal. Puntos fuertes: confort, eficiencia, look ejecutivo, espacio para 5 cómodos.',
  carnival: 'Minivan familiar premium. Target: familias grandes 5+ personas. Puntos fuertes: espacio, comodidad, lujo.',
  rio: 'Sedán compacto. Target: profesionales que quieren sedán económico. Puntos fuertes: precio, durabilidad, eficiencia.',
}

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
      .select('id, nombre, telefono, modelo, score, urgencia, texto_origen, vendedor_id')
      .eq('id', id)
      .eq('vendedor_id', user.id)
      .single()

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    if (!lead.nombre) {
      return NextResponse.json(
        { error: 'Primero clasificá el lead para extraer sus datos.' },
        { status: 400 }
      )
    }

    // Obtener nombre + marca del vendedor desde metadata
    const vendedorNombre =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.nombre as string) ||
      'tu asesor de confianza'
    const vendedorMarca =
      (user.user_metadata?.pulse_marca as string) || 'el concesionario'
    const vendedorConcesionario =
      (user.user_metadata?.pulse_concesionario as string) || ''

    // Configuración personalizada del agente (onboarding / centro de entrenamiento)
    let agentMeta: PulseAgentMetadata | null = null
    if (user.email) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: waitRow } = await (supabaseAdmin.from('pulse_waitlist') as any)
        .select('metadata')
        .ilike('email', user.email.trim())
        .maybeSingle()
      if (waitRow?.metadata && typeof waitRow.metadata === 'object') {
        agentMeta = waitRow.metadata as PulseAgentMetadata
      }
    }

    const systemPrompt = buildResponderSystemPrompt(
      agentMeta,
      vendedorNombre,
      vendedorMarca || 'KIA'
    )

    // Detectar modelo y obtener su perfil
    const modeloLower = (lead.modelo || '').toLowerCase()
    let perfilModelo = ''
    for (const [key, perfil] of Object.entries(PERFILES_MODELO)) {
      if (modeloLower.includes(key)) {
        perfilModelo = `\nCONTEXTO DEL MODELO ${key.toUpperCase()}: ${perfil}`
        break
      }
    }

    // Llamar a Claude para generar el mensaje
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `DATOS DEL VENDEDOR:
- Nombre: ${vendedorNombre}
- Marca: ${vendedorMarca}
- Concesionario: ${vendedorConcesionario || 'no especificado'}

DATOS DEL CLIENTE:
- Nombre: ${lead.nombre}
- Teléfono: ${lead.telefono || 'no especificado'}
- Modelo de interés: ${lead.modelo || 'no especificado'}
- Score (1-10): ${lead.score || 5}
- Urgencia: ${lead.urgencia || 'media'}

TEXTO ORIGINAL DEL LEAD:
"${lead.texto_origen}"
${perfilModelo}

Generá el mensaje de WhatsApp que el vendedor le va a mandar.`,
        },
      ],
    })

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed: { mensaje: string }
    try {
      parsed = JSON.parse(clean)
    } catch (parseErr) {
      console.error('[pulse/responder] JSON parse error:', parseErr)
      return NextResponse.json(
        { error: 'La IA no pudo generar el mensaje. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    if (!parsed.mensaje || parsed.mensaje.length < 20) {
      return NextResponse.json(
        { error: 'El mensaje generado es muy corto. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    // Guardar mensaje en el lead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('pulse_leads') as any)
      .update({ mensaje_ia: parsed.mensaje })
      .eq('id', id)

    // Registrar evento
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('pulse_eventos') as any).insert({
        lead_id: id,
        vendedor_id: user.id,
        tipo: 'mensaje_generado',
        payload: { mensaje: parsed.mensaje, modelo: lead.modelo },
      })
    } catch (evErr) {
      console.error('[pulse/responder] evento error:', evErr)
    }

    // Generar URL de WhatsApp si hay teléfono
    let whatsappUrl = null
    if (lead.telefono) {
      const numeroLimpio = lead.telefono.replace(/[^\d+]/g, '').replace(/^\+/, '')
      const mensajeEncoded = encodeURIComponent(parsed.mensaje)
      whatsappUrl = `https://wa.me/${numeroLimpio}?text=${mensajeEncoded}`
    }

    return NextResponse.json({
      ok: true,
      mensaje: parsed.mensaje,
      whatsapp_url: whatsappUrl,
    })
  } catch (e) {
    console.error('[pulse/responder]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}
