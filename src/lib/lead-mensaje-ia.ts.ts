// Ruta destino: src/lib/lead-mensaje-ia.ts
// Genera con IA un mensaje personalizado de WhatsApp para responder al lead.
// El vendedor click → se le abre WhatsApp con texto listo.

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type DatosLead = {
  nombre: string
  whatsapp: string
  interes?: string
  vendedorNombre: string
  empresa?: string
  industria?: string
}

/**
 * Genera 1 mensaje principal personalizado + 3 plantillas rápidas.
 * Si la IA falla, devuelve plantillas por defecto.
 */
export async function generarMensajesParaLead(lead: DatosLead): Promise<{
  mensajePrincipal: string
  plantillas: { etiqueta: string; emoji: string; mensaje: string }[]
}> {
  const fallback = {
    mensajePrincipal: `Hola ${lead.nombre}, soy ${lead.vendedorNombre}${lead.empresa ? ` de ${lead.empresa}` : ''}. Vi tu mensaje y te contacto para continuar la conversación. ¿Cuándo te queda fácil hablar?`,
    plantillas: [
      {
        etiqueta: 'Cotizar',
        emoji: '📋',
        mensaje: `Hola ${lead.nombre}, soy ${lead.vendedorNombre}. Para enviarte la cotización exacta, ¿me confirmas qué presupuesto manejas y para cuándo lo necesitas?`,
      },
      {
        etiqueta: 'Disponible',
        emoji: '✅',
        mensaje: `Hola ${lead.nombre}, soy ${lead.vendedorNombre}. ¡Buenas noticias! Tenemos disponibilidad de lo que pediste. ¿Cuándo te queda bien que conversemos los detalles?`,
      },
      {
        etiqueta: 'Te llamo',
        emoji: '📞',
        mensaje: `Hola ${lead.nombre}, soy ${lead.vendedorNombre}. ¿Te queda fácil que te llame en los próximos 30 minutos para resolverte todas las dudas?`,
      },
    ],
  }

  try {
    const prompt = `Eres un vendedor experto colombiano que ayuda a redactar mensajes de WhatsApp para responder rápido a leads.

DATOS DEL LEAD:
- Nombre: ${lead.nombre}
- Interés expresado: ${lead.interes || '(no especificado)'}
- Industria del vendedor: ${lead.industria || 'general'}

DATOS DEL VENDEDOR:
- Nombre: ${lead.vendedorNombre}
- Empresa: ${lead.empresa || ''}

TAREA:
Genera 4 mensajes de WhatsApp que el vendedor pueda enviar al lead. Todos en español latinoamericano, tuteo natural, máximo 2 oraciones cada uno. NO uses emojis al inicio (los pondré yo).

1. **Principal**: Un mensaje personalizado que mencione específicamente lo que el lead pidió (si pidió "Kia Sportage", menciónalo). Cálido pero profesional. Cierra con pregunta abierta.

2. **Cotizar**: Pregunta presupuesto y plazo para enviar cotización exacta.

3. **Disponible**: Confirma que tienes disponibilidad de lo que pidió. Propón siguiente paso.

4. **Te llamo**: Propone llamar en los próximos 30 minutos.

Responde SOLO con JSON válido (sin markdown, sin backticks):
{
  "principal": "...",
  "cotizar": "...",
  "disponible": "...",
  "tellamo": "..."
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''
    const cleaned = text.replace(/```json|```/g, '').trim()

    const data = JSON.parse(cleaned)

    if (!data.principal) return fallback

    return {
      mensajePrincipal: data.principal,
      plantillas: [
        { etiqueta: 'Cotizar', emoji: '📋', mensaje: data.cotizar || fallback.plantillas[0].mensaje },
        { etiqueta: 'Disponible', emoji: '✅', mensaje: data.disponible || fallback.plantillas[1].mensaje },
        { etiqueta: 'Te llamo', emoji: '📞', mensaje: data.tellamo || fallback.plantillas[2].mensaje },
      ],
    }
  } catch (e) {
    console.error('[lead-mensaje-ia] Error:', e)
    return fallback
  }
}
