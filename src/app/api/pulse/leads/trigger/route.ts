// src/app/api/pulse/leads/trigger/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!
const DEFAULT_INSTANCE = 'ricaza81_at_gmail_com'

function emailToInstance(email: string): string {
  return email.replace('@', '_at_').replace(/\./g, '_')
}

async function resolverInstancia(email: string, whatsappVendedor: string | null): Promise<string> {
  try {
    // 1. Intentar con el email directo
    const instanceGuess = emailToInstance(email)
    const res = await fetch(`${EVO_URL}/instance/connectionState/${instanceGuess}`, {
      headers: { apikey: EVO_KEY },
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.instance?.state === 'open') {
        console.log('[trigger] instancia encontrada por email:', instanceGuess)
        return instanceGuess
      }
    }

    // 2. Match por número de teléfono del vendedor
    if (whatsappVendedor) {
      const numeroNormalizado = whatsappVendedor.replace(/\D/g, '').replace(/^57/, '')
      const defaultRes = await fetch(`${EVO_URL}/instance/connectionState/${DEFAULT_INSTANCE}`, {
        headers: { apikey: EVO_KEY },
      })
      if (defaultRes.ok) {
        const defaultData = await defaultRes.json()
        const ownerJid = String(defaultData?.instance?.ownerJid || '')
        if (ownerJid.includes(numeroNormalizado)) {
          console.log('[trigger] instancia default coincide con teléfono del vendedor')
          return DEFAULT_INSTANCE
        }
      }
    }
  } catch (e) {
    console.error('[trigger] resolverInstancia error:', e)
  }

  // Fallback: instancia principal hardcodeada
  console.log('[trigger] usando instancia hardcodeada por defecto:', DEFAULT_INSTANCE)
  return DEFAULT_INSTANCE
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
    const lead_id = body.lead_id || body.record?.id
    if (!lead_id) return NextResponse.json({ error: 'lead_id requerido' }, { status: 400 })

    console.log('[trigger] procesando lead:', lead_id)

    // 1. Obtener el lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('pulse_leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      console.error('[trigger] lead no encontrado:', leadError)
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
    }

    if (lead.mensaje_enviado) {
      console.log('[trigger] mensaje ya enviado para lead:', lead_id)
      return NextResponse.json({ ok: true, skipped: true })
    }

    if (!lead.telefono) {
      console.log('[trigger] lead sin teléfono, omitiendo:', lead_id)
      return NextResponse.json({ ok: true, skipped: true, reason: 'sin telefono' })
    }

    // 2. Obtener email del vendedor
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(lead.vendedor_id)
    const email = userData?.user?.email
    if (!email) {
      console.error('[trigger] vendedor sin email:', lead.vendedor_id)
      return NextResponse.json({ error: 'Vendedor sin email' }, { status: 400 })
    }

    // 3. Obtener perfil del asesor
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nombre, whatsapp')
      .eq('id', lead.vendedor_id)
      .maybeSingle()

    const nombreAsesor = profile?.nombre || 'el asesor'
    const whatsappVendedor = profile?.whatsapp || null

    // 4. Resolver instancia
    const instanceName = await resolverInstancia(email, whatsappVendedor)
    console.log('[trigger] usando instancia:', instanceName)

    // 5. Generar mensaje
    const mensaje = lead.mensaje_ia?.trim()
      ? lead.mensaje_ia
      : await generarMensajeInicial(lead.nombre, lead.modelo || 'KIA', lead.texto_origen || '', nombreAsesor)

    console.log('[trigger] mensaje:', mensaje.slice(0, 80))

    // 6. Enviar WhatsApp
    await enviarWhatsApp(instanceName, lead.telefono, mensaje)

    // 7. Actualizar lead
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

export async function GET(req: NextRequest) {
  const lead_id = req.nextUrl.searchParams.get('lead_id')
  if (!lead_id) return NextResponse.json({ error: 'lead_id requerido' })
  return POST(new NextRequest(req.url, { method: 'POST', body: JSON.stringify({ lead_id }) }))
}
