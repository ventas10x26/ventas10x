// src/app/api/pulse/leads/trigger/route.ts
// Recibe un lead_id, genera mensaje personalizado y lo envía por WhatsApp

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!

function emailToInstance(email: string): string {
  // ricaza81@gmail.com → ricaza81_at_gmail_com
  return email.replace('@', '_at_').replace(/\./g, '_')
}

async function generarMensajeInicial(
  nombreLead: string,
  modelo: string,
  textoOrigen: string,
  nombreAsesor: string
): Promise<string> {
  try {
    const { anthropic } = await import('@/lib/anthropic')
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: `Eres ${nombreAsesor}, asesor KIA. Escribe UN primer mensaje de WhatsApp para contactar a un lead que acaba de llegar. 
REGLAS:
- Saluda por nombre
- Menciona el modelo de interés de forma natural
- Máximo 2 oraciones
- Español colombiano, tono cercano, no robótico
- No uses asteriscos ni markdown
- Termina invitando a conversar (ej: "¿Qué te gustaría saber?")`,
      messages: [
        {
          role: 'user',
          content: `Lead: ${nombreLead}\nModelo de interés: ${modelo}\nContexto adicional: ${textoOrigen || 'ninguno'}`,
        },
      ],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text : `¡Hola ${nombreLead}! Vi que te interesa el ${modelo}. ¿En qué te puedo ayudar?`
  } catch (e) {
    console.error('[trigger] generarMensajeInicial error:', e)
    return `¡Hola ${nombreLead}! Vi que te interesa el ${modelo}. ¿En qué te puedo ayudar?`
  }
}

async function enviarWhatsApp(instanceName: string, telefono: string, mensaje: string) {
  // Normalizar teléfono: asegurar que tenga 57 al inicio
  const numero = telefono.startsWith('+') ? telefono.slice(1) : telefono
  const numeroFinal = numero.startsWith('57') ? numero : `57${numero}`

  const res = await fetch(`${EVO_URL}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: JSON.stringify({ number: numeroFinal, text: mensaje }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Evolution API error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Acepta tanto { lead_id } directo como el payload nativo de Supabase { record: { id } }
    const lead_id = body.lead_id || body.record?.id
    if (!lead_id) return NextResponse.json({ error: 'lead_id requerido' }, { status: 400 })

    console.log('[trigger] procesando lead:', lead_id)

    // 1. Obtener el lead con datos del vendedor
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('pulse_leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      console.error('[trigger] lead no encontrado:', leadError)
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    // Evitar doble envío
    if (lead.mensaje_enviado) {
      console.log('[trigger] mensaje ya enviado para lead:', lead_id)
      return NextResponse.json({ ok: true, skipped: true })
    }

    // 2. Obtener email del vendedor desde auth.users
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(lead.vendedor_id)
    const email = userData?.user?.email
    if (!email) {
      console.error('[trigger] vendedor sin email:', lead.vendedor_id)
      return NextResponse.json({ error: 'Vendedor sin email' }, { status: 400 })
    }

    // 3. Obtener nombre del asesor desde profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nombre')
      .eq('id', lead.vendedor_id)
      .maybeSingle()

    const nombreAsesor = profile?.nombre || 'el asesor'
    const instanceName = emailToInstance(email)

    console.log('[trigger] vendedor:', email, '→ instance:', instanceName)

    // 4. Generar mensaje (usar mensaje_ia si ya existe, si no generar uno)
    const mensaje = lead.mensaje_ia?.trim()
      ? lead.mensaje_ia
      : await generarMensajeInicial(lead.nombre, lead.modelo || 'KIA', lead.texto_origen || '', nombreAsesor)

    console.log('[trigger] mensaje:', mensaje.slice(0, 80))

    // 5. Enviar WhatsApp
    await enviarWhatsApp(instanceName, lead.telefono, mensaje)

    // 6. Actualizar lead: enviado + estado contactado
    await supabaseAdmin
      .from('pulse_leads')
      .update({
        mensaje_enviado: true,
        mensaje_ia: mensaje,
        estado: 'contactado',
        contactado_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead_id)

    console.log('[trigger] ✅ lead contactado:', lead.nombre, lead.telefono)
    return NextResponse.json({ ok: true, mensaje })

  } catch (e) {
    console.error('[trigger] error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// Endpoint GET para pruebas manuales: /api/pulse/leads/trigger?lead_id=xxx
export async function GET(req: NextRequest) {
  const lead_id = req.nextUrl.searchParams.get('lead_id')
  if (!lead_id) return NextResponse.json({ error: 'lead_id requerido' })
  return POST(new NextRequest(req.url, { method: 'POST', body: JSON.stringify({ lead_id }) }))
}
