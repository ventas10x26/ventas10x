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

function emailToInstance(email: string): string {
  return email.replace('@', '_at_').replace(/\./g, '_')
}

async function resolverInstancia(email: string, whatsappVendedor: string | null): Promise<string | null> {
  try {
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

    if (whatsappVendedor) {
      const numeroNormalizado = whatsappVendedor.replace(/\D/g, '').replace(/^57/, '')
      const instancePorNumero = `57${numeroNormalizado}`
      const resNum = await fetch(`${EVO_URL}/instance/connectionState/${instancePorNumero}`, {
        headers: { apikey: EVO_KEY },
      })
      if (resNum.ok) {
        const dataNum = await resNum.json()
        if (dataNum?.instance?.state === 'open') {
          console.log('[trigger] instancia encontrada por número:', instancePorNumero)
          return instancePorNumero
        }
      }
    }

    const defaultInstance = 'ricaza81_at_gmail_com'
    const resDefault = await fetch(`${EVO_URL}/instance/connectionState/${defaultInstance}`, {
      headers: { apikey: EVO_KEY },
    })
    if (resDefault.ok) {
      const dataDefault = await resDefault.json()
      if (dataDefault?.instance?.state === 'open') {
        console.log('[trigger] usando instancia default:', defaultInstance)
        return defaultInstance
      }
    }

    console.error('[trigger] no se encontró instancia conectada para:', email)
    return null
  } catch (e) {
    console.error('[trigger] resolverInstancia error:', e)
    return null
  }
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

async function verificarBotActivo(whatsappVendedor: string | null, emailVendedor: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('email, metadata')
      .not('metadata', 'is', null)

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      console.log('[trigger] pulse_waitlist vacío — bot inactivo por defecto')
      return false
    }

    if (whatsappVendedor) {
      const numeroCorto = whatsappVendedor.replace(/[^\d]/g, '').replace(/^57/, '')
      const matchesPorNumero = rows.filter((row: Record<string, unknown>) => {
        const meta = row.metadata as Record<string, unknown>
        const w = String(meta?.whatsapp || '').replace(/[^\d]/g, '').replace(/^57/, '')
        return w && w === numeroCorto
      })

      if (matchesPorNumero.length > 0) {
        const hayInactivo = matchesPorNumero.some((row: Record<string, unknown>) => {
          const meta = row.metadata as Record<string, unknown>
          return meta?.bot_activo === false
        })
        console.log('[trigger] verificación por número — matches:', matchesPorNumero.length, 'hayInactivo:', hayInactivo)
        return !hayInactivo
      }
    }

    const matchPorEmail = rows.find((row: Record<string, unknown>) =>
      String(row.email || '').toLowerCase() === emailVendedor.toLowerCase()
    )

    if (matchPorEmail) {
      const meta = matchPorEmail.metadata as Record<string, unknown>
      const activo = meta?.bot_activo !== false
      console.log('[trigger] verificación por email —', emailVendedor, 'bot_activo:', activo)
      return activo
    }

    console.log('[trigger] vendedor sin registro en pulse_waitlist:', emailVendedor, '— bot inactivo')
    return false

  } catch (e) {
    console.error('[trigger] verificarBotActivo error:', e)
    return false
  }
}

// FIX: inicializar conversación en Supabase con el modelo del lead
// para que cuando el cliente responda, el webhook ya tenga el contexto
async function inicializarConversacion(
  instanceName: string,
  telefono: string,
  modelo: string,
  mensajeInicial: string
): Promise<void> {
  try {
    const numero = telefono.startsWith('+') ? telefono.slice(1) : telefono
    const numeroFinal = numero.startsWith('57') ? numero : `57${numero}`
    const remoteJid = `${numeroFinal}@s.whatsapp.net`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('pulse_conversaciones') as any)
      .upsert({
        instance_name: instanceName,
        remote_jid: remoteJid,
        // Guardar el mensaje inicial del asesor como contexto del asistente
        historial: [{ role: 'assistant', content: mensajeInicial }],
        // Guardar el modelo detectado desde el lead — evita que el bot pregunte cuál modelo
        // Normalizar aliases: "Picanto" → "NEW PICANTO", etc. para coincidir con el CSV
        modelo_detectado: modelo.toUpperCase()
          .replace(/^PICANTO\b/, 'NEW PICANTO')
          .replace(/^SORENTO\b/, 'NEW SORENTO')
          .replace(/^STONIC\b/, 'NEW STONIC'),
        media_enviada: [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'instance_name,remote_jid' })

    console.log('[trigger] conversación inicializada — remoteJid:', remoteJid, '| modelo:', modelo)
  } catch (e) {
    console.error('[trigger] inicializarConversacion error:', e)
    // No es crítico — el webhook puede funcionar sin esto
  }
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

    // 4. Verificar bot_activo
    const botActivo = await verificarBotActivo(whatsappVendedor, email)
    if (!botActivo) {
      console.log('[trigger] bot INACTIVO o sin configuración — omitiendo lead:', lead_id)
      return NextResponse.json({ ok: true, skipped: true, reason: 'bot_inactivo' })
    }

    // 5. Resolver instancia de Evolution API
    const instanceName = await resolverInstancia(email, whatsappVendedor)
    if (!instanceName) {
      console.error('[trigger] no se pudo resolver instancia para:', email)
      return NextResponse.json({ error: 'No hay instancia WhatsApp conectada' }, { status: 400 })
    }

    console.log('[trigger] usando instancia:', instanceName)

    // 6. Generar mensaje
    const mensaje = lead.mensaje_ia?.trim()
      ? lead.mensaje_ia
      : await generarMensajeInicial(lead.nombre, lead.modelo || 'KIA', lead.texto_origen || '', nombreAsesor)

    console.log('[trigger] mensaje:', mensaje.slice(0, 80))

    // 7. Enviar WhatsApp
    await enviarWhatsApp(instanceName, lead.telefono, mensaje)

    // 8. FIX: Inicializar conversación en Supabase con modelo del lead
    // Esto evita que el bot pregunte "¿qué modelo te interesa?" cuando el cliente responda
    if (lead.modelo) {
      await inicializarConversacion(instanceName, lead.telefono, lead.modelo, mensaje)
    }

    // 9. Actualizar lead
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
