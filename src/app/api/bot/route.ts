// src/app/api/bot/chat/route.ts
// POST /api/bot/chat
// Body: { slug, session_id, message, conversacion_id? }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// ─── Supabase con service_role (escribe sin RLS) ─────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface BotRequestBody {
  slug: string
  session_id: string
  message: string
  conversacion_id?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Carga perfil + catálogo del asesor por slug */
async function cargarContextoAsesor(slug: string) {
  // 1. Perfil
  const { data: perfil } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, industria, slug')
    .eq('slug', slug)
    .single()

  if (!perfil) return null

  // 2. Productos del catálogo (máx 30 para no saturar el contexto)
  const { data: productos } = await supabase
    .from('productos')
    .select('nombre, descripcion, precio, disponible')
    .eq('perfil_id', perfil.id)
    .eq('disponible', true)
    .order('created_at', { ascending: false })
    .limit(30)

  // 3. Config de la landing (título, subtítulo, color)
  const { data: config } = await supabase
    .from('landing_config')
    .select('titulo, subtitulo, producto')
    .eq('perfil_id', perfil.id)
    .single()

  return { perfil, productos: productos ?? [], config }
}

/** Construye el system prompt personalizado por industria */
function buildSystemPrompt(
  perfil: { nombre: string; apellido: string; industria?: string },
  productos: { nombre: string; descripcion?: string; precio?: number }[],
  config: { titulo?: string; subtitulo?: string; producto?: string } | null,
  conversacion: { nombre?: string; email?: string; telefono?: string }
): string {

  const nombreAsesor = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ')
  const industria = perfil.industria ?? 'ventas'

  // Catálogo serializado
  const catalogoTexto = productos.length > 0
    ? productos.map(p => {
        const precio = p.precio ? ` — $${p.precio.toLocaleString('es-CO')} COP` : ''
        const desc = p.descripcion ? ` (${p.descripcion})` : ''
        return `• ${p.nombre}${precio}${desc}`
      }).join('\n')
    : 'El asesor aún no ha cargado productos. Indica que pronto estará disponible el catálogo.'

  // Datos ya conocidos del visitante
  const datosVisitante = [
    conversacion.nombre  ? `Nombre: ${conversacion.nombre}`   : null,
    conversacion.email   ? `Email: ${conversacion.email}`     : null,
    conversacion.telefono? `Teléfono: ${conversacion.telefono}`: null,
  ].filter(Boolean).join('\n') || 'Aún desconocidos'

  // Guía por industria
  const guiaIndustria: Record<string, string> = {
    automotriz:    'Pregunta por el modelo de interés, presupuesto y si busca financiación. Ofrece agendar un test drive.',
    inmobiliaria:  'Pregunta por tipo de inmueble (apto/casa), zona, presupuesto y si es para vivir o invertir. Ofrece agendar una visita.',
    retail:        'Pregunta qué producto busca, para qué uso y su presupuesto. Ofrece hacer la reserva o envío.',
    manufactura:   'Pregunta por el tipo de empresa, volumen mensual y línea de productos. Ofrece generar una cotización.',
    seguros:       'Pregunta qué quiere asegurar, para cuántas personas y su presupuesto mensual. Ofrece enviar una propuesta.',
    default:       'Identifica la necesidad del visitante, muéstrale los productos relevantes y ofrece continuar por WhatsApp.',
  }
  const guia = guiaIndustria[industria.toLowerCase()] ?? guiaIndustria.default

  return `Eres el asistente virtual de ${nombreAsesor}, un asesor de ${industria} en Latinoamérica.
Tu trabajo es atender a los visitantes de su landing page, responder preguntas, calificar si son buenos prospectos y capturar sus datos de contacto.

## Tu personalidad
- Amable, profesional y conciso. Máximo 2-3 oraciones por respuesta.
- Hablas en español latinoamericano, tuteo natural.
- No eres un robot genérico — eres el asistente de ${nombreAsesor} específicamente.
- Nunca inventas precios ni productos que no estén en el catálogo.

## Catálogo disponible
${catalogoTexto}

## Información del negocio
${config?.titulo ? `Propuesta de valor: ${config.titulo}` : ''}
${config?.subtitulo ? `Descripción: ${config.subtitulo}` : ''}
${config?.producto ? `Producto principal: ${config.producto}` : ''}

## Datos ya conocidos del visitante
${datosVisitante}

## Tu embudo de ventas (síguelo en orden)
1. SALUDA y pregunta en qué puedes ayudar.
2. IDENTIFICA la necesidad: ${guia}
3. MUESTRA 1-2 productos relevantes del catálogo con precio.
4. CALIFICA: pregunta su presupuesto y urgencia de compra.
5. CAPTURA DATOS: pide nombre, email y teléfono para que ${nombreAsesor} le haga seguimiento personalizado.
6. CIERRA: confirma que ${nombreAsesor} le contactará pronto y ofrece continuar por WhatsApp.

## Reglas críticas
- Cuando tengas nombre, email Y teléfono del visitante, incluye al final de tu mensaje exactamente este JSON (nada más, solo el JSON al final):
  {"accion":"crear_lead","nombre":"...","email":"...","telefono":"...","interes":"..."}
- Si el visitante quiere agendar cita/reunión, incluye:
  {"accion":"agendar_cita","nombre":"...","email":"...","telefono":"...","fecha_preferida":"..."}
- Si el visitante se despide sin dar datos, incluye:
  {"accion":"sin_datos"}
- Nunca muestres el JSON al usuario — va al final invisible para él.`
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: BotRequestBody = await req.json()
    const { slug, session_id, message, conversacion_id } = body

    if (!slug || !session_id || !message) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // 1. Cargar contexto del asesor
    const contexto = await cargarContextoAsesor(slug)
    if (!contexto) {
      return NextResponse.json({ error: 'Asesor no encontrado' }, { status: 404 })
    }
    const { perfil, productos, config } = contexto

    // 2. Obtener o crear conversación
    let convId = conversacion_id
    let convData: { nombre?: string; email?: string; telefono?: string; estado?: string } = {}

    if (convId) {
      const { data } = await supabase
        .from('bot_conversaciones')
        .select('nombre,email,telefono,estado')
        .eq('id', convId)
        .single()
      convData = data ?? {}
    } else {
      const { data } = await supabase
        .from('bot_conversaciones')
        .insert({ perfil_id: perfil.id, session_id })
        .select('id')
        .single()
      convId = data?.id
    }

    if (!convId) {
      return NextResponse.json({ error: 'Error creando conversación' }, { status: 500 })
    }

    // 3. Cargar historial de mensajes (últimos 20)
    const { data: historial } = await supabase
      .from('bot_mensajes')
      .select('role,content')
      .eq('conversacion_id', convId)
      .order('created_at', { ascending: true })
      .limit(20)

    const messages: { role: 'user' | 'assistant'; content: string }[] =
      (historial ?? []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    // Agregar mensaje actual
    messages.push({ role: 'user', content: message })

    // 4. Guardar mensaje del usuario
    await supabase.from('bot_mensajes').insert({
      conversacion_id: convId,
      role: 'user',
      content: message,
    })

    // 5. Llamar a Claude
    const systemPrompt = buildSystemPrompt(perfil, productos, config, convData)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      system: systemPrompt,
      messages,
    })

    const rawReply = (response.content[0] as { type: string; text: string }).text

    // 6. Extraer JSON de acción si existe
    let replyTexto = rawReply
    let accion: Record<string, string> | null = null

    const jsonMatch = rawReply.match(/\{\"accion\":.*\}/)
    if (jsonMatch) {
      try {
        accion = JSON.parse(jsonMatch[0])
        replyTexto = rawReply.replace(jsonMatch[0], '').trim()
      } catch { /* ignora JSON mal formado */ }
    }

    // 7. Guardar respuesta del bot
    await supabase.from('bot_mensajes').insert({
      conversacion_id: convId,
      role: 'assistant',
      content: replyTexto,
    })

    // 8. Procesar acción
    let leadId: string | null = null

    if (accion?.accion === 'crear_lead' || accion?.accion === 'agendar_cita') {
      // Actualizar conversación con los datos capturados
      await supabase.from('bot_conversaciones').update({
        nombre:   accion.nombre   ?? convData.nombre,
        email:    accion.email    ?? convData.email,
        telefono: accion.telefono ?? convData.telefono,
        estado:   'calificado',
      }).eq('id', convId)

      // Verificar si ya existe lead con ese email
      const { data: leadExistente } = await supabase
        .from('leads')
        .select('id')
        .eq('perfil_id', perfil.id)
        .eq('email', accion.email)
        .single()

      if (!leadExistente) {
        // Crear lead nuevo en el pipeline
        const { data: nuevoLead } = await supabase
          .from('leads')
          .insert({
            perfil_id:  perfil.id,
            nombre:     accion.nombre,
            email:      accion.email,
            telefono:   accion.telefono,
            origen:     'bot_landing',
            estado:     'nuevo',
            notas:      accion.accion === 'agendar_cita'
              ? `Cita solicitada para: ${accion.fecha_preferida ?? 'a confirmar'}. Interés: ${accion.interes ?? ''}`
              : `Lead capturado por Bot IA. Interés: ${accion.interes ?? ''}`,
          })
          .select('id')
          .single()

        leadId = nuevoLead?.id ?? null

        // Vincular lead a la conversación
        if (leadId) {
          await supabase.from('bot_conversaciones').update({
            lead_id: leadId,
            estado:  'lead_creado',
          }).eq('id', convId)
        }
      } else {
        leadId = leadExistente.id
      }
    }

    // 9. Responder al cliente
    return NextResponse.json({
      reply:          replyTexto,
      conversacion_id: convId,
      lead_creado:    !!leadId,
      lead_id:        leadId,
      accion:         accion?.accion ?? null,
    })

  } catch (error) {
    console.error('[bot/chat]', error)
    return NextResponse.json({ error: 'Error interno del bot' }, { status: 500 })
  }
}
