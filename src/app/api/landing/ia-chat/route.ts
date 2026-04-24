// Ruta destino: src/app/api/landing/ia-chat/route.ts
// REEMPLAZA el archivo actual. Ahora detecta intención de imagen
// y devuelve sugerencia de búsqueda en Unsplash cuando aplica.

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ChatMsg {
  role: 'user' | 'ai'
  text: string
}

export async function POST(req: Request) {
  try {
    const { slug, form, message, history } = await req.json()

    const systemPrompt = `Eres un asistente experto en copywriting, marketing y landing pages para vendedores independientes en Colombia.

Contexto de la landing del vendedor:
- Slug: ${slug || 'no especificado'}
- Título actual: ${form?.titulo || '(vacío)'}
- Subtítulo actual: ${form?.subtitulo || '(vacío)'}
- Descripción producto: ${form?.producto || '(vacío)'}
- Color: ${form?.color_acento || '#FF6B2B'}
- Imagen hero actual: ${form?.imagen_hero ? 'sí' : 'no'}
- Logo actual: ${form?.imagen_logo ? 'sí' : 'no'}

Reglas:
- Responde en español, tono cercano y profesional.
- Sé conciso (máximo 3-4 oraciones por respuesta).

CUANDO EL USUARIO PIDA IMÁGENES:
El usuario puede pedir imágenes de 3 formas:
a) Subir archivo: si dice "quiero subir una imagen" / "tengo una foto" / "la puedo subir" → responde guiándolo a usar el botón 📎 de adjuntar del chat.
b) Buscar en banco: si dice "busca una imagen de X" / "necesito foto de X" / "ponme una imagen de X" → devuelve búsqueda.
c) Cambiar/quitar: si pide remover, responde que debe hacerlo desde el editor visual.

Cuando detectes intención (b) búsqueda de imagen, al final de tu mensaje incluye OBLIGATORIAMENTE este bloque:
<BUSCAR_IMAGEN>{"query": "términos en inglés para Unsplash", "tipo": "hero|logo|galeria", "orientation": "landscape|portrait|squarish"}</BUSCAR_IMAGEN>

Reglas del bloque BUSCAR_IMAGEN:
- "query" debe estar en INGLÉS (Unsplash funciona mejor en inglés). Ej: "car dealership", "modern office", "business team colombia".
- "tipo" infiérelo del contexto: si dice "principal/hero/portada" → hero; "logo/marca" → logo; "galería/adicional/más fotos" → galeria.
- "orientation": hero → landscape; logo → squarish; galeria → landscape (por defecto).
- Si no queda claro el tipo, pregunta antes y NO incluyas el bloque todavía.

CUANDO EL USUARIO PIDA CAMBIOS DE TEXTO:
Si el vendedor te pide cambiar título, subtítulo o descripción, devuelve la sugerencia en texto Y también en JSON al final del mensaje con este formato exacto:
<JSON>{"titulo": "...", "subtitulo": "...", "producto": "..."}</JSON>
Solo incluye en el JSON los campos que efectivamente quieras cambiar.
Si no hay cambios de contenido, no incluyas el bloque <JSON>.`

    // Construir historial para Claude
    const messages = [
      ...(Array.isArray(history)
        ? history.map((m: ChatMsg) => ({
            role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: m.text,
          }))
        : []),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const fullReply =
      textBlock && textBlock.type === 'text' ? textBlock.text : ''

    // ── Extraer sugerencias de texto ──
    let reply = fullReply
    let titulo: string | undefined
    let subtitulo: string | undefined
    let producto: string | undefined

    const matchJson = fullReply.match(/<JSON>([\s\S]*?)<\/JSON>/)
    if (matchJson) {
      try {
        const parsed = JSON.parse(matchJson[1].trim())
        titulo = parsed.titulo
        subtitulo = parsed.subtitulo
        producto = parsed.producto
        reply = reply.replace(/<JSON>[\s\S]*?<\/JSON>/, '').trim()
      } catch {
        // ignorar parse error
      }
    }

    // ── Extraer búsqueda de imagen ──
    let buscarImagen:
      | { query: string; tipo: 'hero' | 'logo' | 'galeria'; orientation: string }
      | undefined

    const matchImg = fullReply.match(
      /<BUSCAR_IMAGEN>([\s\S]*?)<\/BUSCAR_IMAGEN>/
    )
    if (matchImg) {
      try {
        const parsed = JSON.parse(matchImg[1].trim())
        if (parsed.query && parsed.tipo) {
          buscarImagen = {
            query: parsed.query,
            tipo: parsed.tipo,
            orientation: parsed.orientation || 'landscape',
          }
        }
        reply = reply.replace(/<BUSCAR_IMAGEN>[\s\S]*?<\/BUSCAR_IMAGEN>/, '').trim()
      } catch {
        // ignorar
      }
    }

    return NextResponse.json({
      reply,
      titulo,
      subtitulo,
      producto,
      buscarImagen,
    })
  } catch (error) {
    console.error('ia-chat error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
