// Ruta destino: src/app/api/bot/chat/route.ts
// REEMPLAZA. Email ULTRA disruptivo con mensaje IA + plantillas rápidas.
// Mantiene WhatsApp via CallMeBot por si lo activas más adelante (no rompe nada si no está configurado).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { notificarLeadPorWhatsApp } from '@/lib/notificaciones-whatsapp'
import { generarMensajesParaLead } from '@/lib/lead-mensaje-ia'
import { buildEmailLead } from '@/lib/lead-email-template'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const resend = new Resend(process.env.RESEND_API_KEY)

interface BotRequestBody {
  slug: string
  session_id: string
  message: string
  conversacion_id?: string
}

async function cargarContexto(slug: string) {
  const { data: perfil } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, empresa, industria, whatsapp, callmebot_apikey, callmebot_telefono, notif_whatsapp_activa')
    .eq('slug', slug)
    .single()

  if (!perfil) return null

  const { data: productos } = await supabase
    .from('productos')
    .select('nombre, descripcion, precio')
    .eq('vendedor_id', perfil.id)
    .order('orden')
    .limit(30)

  const { data: config } = await supabase
    .from('landing_config')
    .select('titulo, subtitulo, producto, whatsapp, mensaje_wa')
    .eq('vendedor_id', perfil.id)
    .single()

  return { perfil, productos: productos ?? [], config }
}

function buildSystemPrompt(
  perfil: { nombre: string | null; apellido: string | null; empresa: string | null; industria: string | null },
  productos: { nombre: string; descripcion?: string | null; precio?: string | null }[],
  config: { titulo?: string | null; subtitulo?: string | null; producto?: string | null } | null,
  convData: { nombre?: string | null; whatsapp?: string | null }
): string {
  const nombreAsesor = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'el asesor'
  const empresa = perfil.empresa ?? 'la empresa'
  const industria = perfil.industria?.toLowerCase() ?? 'default'

  const catalogoTexto = productos.length > 0
    ? productos.map(p => {
        const precio = p.precio ? ` — ${p.precio}` : ''
        const desc = p.descripcion ? ` (${p.descripcion})` : ''
        return `• ${p.nombre}${precio}${desc}`
      }).join('\n')
    : 'El catálogo aún no está disponible. Ofrece que el asesor le enviará información por WhatsApp.'

  const datosVisitante = [
    convData.nombre   ? `Nombre: ${convData.nombre}`     : null,
    convData.whatsapp ? `WhatsApp: ${convData.whatsapp}` : null,
  ].filter(Boolean).join('\n') || 'Aún desconocidos'

  const guiaIndustria: Record<string, string> = {
    automotriz:   'Pregunta qué modelo le interesa, su presupuesto y si busca financiación. Ofrece agendar un test drive.',
    inmobiliaria: 'Pregunta si busca apto o casa, en qué zona y su presupuesto. Ofrece agendar una visita.',
    retail:       'Pregunta qué producto necesita y para qué uso. Ofrece hacer una reserva o coordinar el envío.',
    manufactura:  'Pregunta el tipo de empresa, volumen mensual y línea de productos. Ofrece generar una cotización.',
    seguros:      'Pregunta qué quiere asegurar y para cuántas personas. Ofrece enviar una propuesta.',
    default:      'Identifica la necesidad del visitante, muéstrale productos relevantes y ofrece continuar por WhatsApp.',
  }
  const guia = guiaIndustria[industria] ?? guiaIndustria.default

  return `Eres el asistente virtual de ${nombreAsesor} de ${empresa}.
Tu trabajo: atender visitantes de su landing, responder preguntas del catálogo, calificar prospectos y capturar nombre y WhatsApp.

## Personalidad
- Amable, conciso. Máximo 2-3 oraciones por respuesta.
- Español latinoamericano, tuteo natural.
- Nunca inventas precios ni productos que no estén en el catálogo.

## Catálogo
${catalogoTexto}

${config?.titulo ? `## Propuesta de valor\n${config.titulo}` : ''}
${config?.subtitulo ? `${config.subtitulo}` : ''}
${config?.producto ? `Producto principal: ${config.producto}` : ''}

## Datos ya conocidos del visitante
${datosVisitante}

## Embudo (síguelo en orden)
1. Saluda y pregunta en qué puedes ayudar.
2. Identifica la necesidad: ${guia}
3. Muestra 1-2 productos relevantes del catálogo.
4. Pregunta presupuesto y urgencia.
5. Pide nombre y número de WhatsApp para que ${nombreAsesor} le haga seguimiento.
6. Confirma que ${nombreAsesor} le contactará pronto.

## REGLA CRÍTICA
Cuando tengas nombre Y WhatsApp del visitante, incluye al FINAL de tu mensaje este JSON (el visitante no lo verá):
{"accion":"crear_lead","nombre":"...","whatsapp":"...","interes":"..."}

Si quiere agendar cita:
{"accion":"agendar_cita","nombre":"...","whatsapp":"...","fecha":"..."}

Si se despide sin datos:
{"accion":"sin_datos"}`
}

export async function POST(req: NextRequest) {
  try {
    const body: BotRequestBody = await req.json()
    const { slug, session_id, message, conversacion_id } = body

    if (!slug || !session_id || !message) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const contexto = await cargarContexto(slug)
    if (!contexto) {
      return NextResponse.json({ error: 'Asesor no encontrado' }, { status: 404 })
    }
    const { perfil, productos, config } = contexto

    let convId = conversacion_id
    let convData: { nombre?: string | null; whatsapp?: string | null } = {}

    if (convId) {
      const { data } = await supabase
        .from('bot_conversaciones')
        .select('nombre, whatsapp, estado')
        .eq('id', convId)
        .single()
      convData = data ?? {}
    } else {
      const { data } = await supabase
        .from('bot_conversaciones')
        .insert({ vendedor_id: perfil.id, session_id, estado: 'activo' })
        .select('id')
        .single()
      convId = data?.id
    }

    if (!convId) {
      return NextResponse.json({ error: 'Error creando conversación' }, { status: 500 })
    }

    const { data: historial } = await supabase
      .from('bot_mensajes')
      .select('role, content')
      .eq('conversacion_id', convId)
      .order('created_at', { ascending: true })
      .limit(20)

    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      ...(historial ?? []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ]

    await supabase.from('bot_mensajes').insert({
      conversacion_id: convId,
      role: 'user',
      content: message,
    })

    const systemPrompt = buildSystemPrompt(perfil, productos, config, convData)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      system: systemPrompt,
      messages,
    })

    const rawReply = (response.content[0] as { type: string; text: string }).text

    let replyTexto = rawReply
    let accion: Record<string, string> | null = null

    const jsonMatch = rawReply.match(/\{"accion":.*?\}/)
    if (jsonMatch) {
      try {
        accion = JSON.parse(jsonMatch[0])
        replyTexto = rawReply.replace(jsonMatch[0], '').trim()
      } catch { /* ignorar */ }
    }

    await supabase.from('bot_mensajes').insert({
      conversacion_id: convId,
      role: 'assistant',
      content: replyTexto,
    })

    let leadId: string | null = null

    if (accion?.accion === 'crear_lead' || accion?.accion === 'agendar_cita') {
      await supabase.from('bot_conversaciones').update({
        nombre:   accion.nombre   ?? convData.nombre,
        whatsapp: accion.whatsapp ?? convData.whatsapp,
        estado:   'calificado',
      }).eq('id', convId)

      const { data: leadExistente } = await supabase
        .from('leads')
        .select('id')
        .eq('vendedor_id', perfil.id)
        .eq('whatsapp', accion.whatsapp ?? '')
        .single()

      if (!leadExistente && accion.whatsapp) {
        const notas = accion.accion === 'agendar_cita'
          ? `Cita solicitada: ${accion.fecha ?? 'a confirmar'}. Interés: ${accion.interes ?? ''}`
          : `Capturado por Bot IA. Interés: ${accion.interes ?? ''}`

        const { data: nuevoLead } = await supabase
          .from('leads')
          .insert({
            vendedor_id: perfil.id,
            nombre:      accion.nombre ?? 'Visitante',
            whatsapp:    accion.whatsapp,
            fuente:      'bot_landing',
            slug_origen: slug,
            etapa:       'nuevo',
            notas,
          })
          .select('id')
          .single()

        leadId = nuevoLead?.id ?? null

        if (leadId) {
          await supabase.from('bot_conversaciones').update({
            lead_id: leadId,
            estado:  'lead_creado',
          }).eq('id', convId)
        }

        // ── Notificaciones disruptivas ──
        const vendedorNombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || 'Asesor'

        // 1. Generar mensajes IA personalizados (en paralelo con email/whatsapp)
        const mensajesPromise = generarMensajesParaLead({
          nombre: accion.nombre ?? 'Visitante',
          whatsapp: accion.whatsapp,
          interes: accion.interes,
          vendedorNombre,
          empresa: perfil.empresa ?? undefined,
          industria: perfil.industria ?? undefined,
        })

        // 2. Enviar email + whatsapp (no bloquean)
        ;(async () => {
          try {
            const mensajes = await mensajesPromise

            // Email
            try {
              const { data: authUser } = await supabase.auth.admin.getUserById(perfil.id)
              const vendedorEmail = authUser?.user?.email
              if (vendedorEmail) {
                const { subject, html } = buildEmailLead({
                  vendedorNombre,
                  leadNombre: accion.nombre ?? 'Visitante',
                  leadWhatsApp: accion.whatsapp,
                  leadInteres: accion.interes,
                  fuente: 'bot_landing',
                  mensajePrincipal: mensajes.mensajePrincipal,
                  plantillas: mensajes.plantillas,
                })

                await resend.emails.send({
                  from: 'Ventas10x <notificaciones@ventas10x.co>',
                  to: vendedorEmail,
                  subject,
                  html,
                })
              }
            } catch (e) {
              console.error('[bot/chat] email error:', e)
            }

            // WhatsApp (CallMeBot, si está activo)
            try {
              await notificarLeadPorWhatsApp(
                {
                  callmebot_apikey: perfil.callmebot_apikey,
                  callmebot_telefono: perfil.callmebot_telefono,
                  notif_whatsapp_activa: perfil.notif_whatsapp_activa,
                },
                {
                  nombre: accion.nombre ?? 'Visitante',
                  whatsapp: accion.whatsapp,
                  interes: accion.interes,
                  fuente: 'bot_landing',
                },
                vendedorNombre
              )
            } catch (e) {
              console.error('[bot/chat] wa error:', e)
            }
          } catch (e) {
            console.error('[bot/chat] notif error:', e)
          }
        })()
      } else {
        leadId = leadExistente?.id ?? null
      }
    }

    return NextResponse.json({
      reply:           replyTexto,
      conversacion_id: convId,
      lead_creado:     !!leadId,
      lead_id:         leadId,
      accion:          accion?.accion ?? null,
    })

  } catch (error) {
    console.error('[bot/chat]', error)
    return NextResponse.json({ error: 'Error interno del bot' }, { status: 500 })
  }
}
