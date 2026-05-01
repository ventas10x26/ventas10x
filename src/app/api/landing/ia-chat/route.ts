// Ruta destino: src/app/api/landing/ia-chat/route.ts
// REEMPLAZA el archivo. Ahora detecta también comandos sobre productos.

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ChatMsg {
  role: 'user' | 'ai'
  text: string
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { form, message, history } = await req.json()

    // Cargar productos del vendedor para que la IA sepa qué tiene
    let productosResumen = '(sin productos aún)'
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: productos } = await (supabase.from('productos') as any)
        .select('id, nombre, precio')
        .eq('org_id', (await getActiveOrg())?.org?.id)
        .order('orden', { ascending: true })

      if (productos && productos.length > 0) {
        productosResumen = productos
          .map((p: { nombre: string; precio: string | null }) => `- ${p.nombre}${p.precio ? ` (${p.precio})` : ''}`)
          .join('\n')
      }
    }

    const systemPrompt = `Eres un asistente experto en copywriting, marketing y landing pages para vendedores independientes en Colombia.

Contexto de la landing del vendedor:
- Título actual: ${form?.titulo || '(vacío)'}
- Subtítulo actual: ${form?.subtitulo || '(vacío)'}
- Descripción producto: ${form?.producto || '(vacío)'}
- Color: ${form?.color_acento || '#FF6B2B'}
- Imagen hero actual: ${form?.imagen_hero ? 'sí' : 'no'}
- Logo actual: ${form?.imagen_logo ? 'sí' : 'no'}

PRODUCTOS ACTUALES DEL VENDEDOR:
${productosResumen}

Reglas:
- Responde en español, tono cercano y profesional.
- Sé conciso (máximo 3-4 oraciones por respuesta).

═══════════════════════════════════════════════════
COMANDOS SOBRE PRODUCTOS (importante)
═══════════════════════════════════════════════════
Si el usuario quiere CREAR, ACTUALIZAR, ELIMINAR o AGREGAR IMAGEN a un producto, devuelve un comando estructurado al final del mensaje.

CREAR producto: si dice "crea un producto X", "agrega producto Y a $Z"
<COMANDO_PRODUCTO>{"accion":"crear","nombre":"Kia Sportage 2024","precio":"$85.000.000","descripcion":"SUV familiar","buscar_imagen":"kia sportage"}</COMANDO_PRODUCTO>

ACTUALIZAR producto: si dice "cambia el precio del Kia a $90M", "renombra el producto Y"
<COMANDO_PRODUCTO>{"accion":"actualizar","nombre_aproximado":"Kia","precio":"$90.000.000"}</COMANDO_PRODUCTO>
Campos opcionales: nuevo_nombre, precio, descripcion. Solo incluye los que cambias.

ELIMINAR producto: si dice "elimina el Kia", "borra el producto X"
<COMANDO_PRODUCTO>{"accion":"eliminar","nombre_aproximado":"Kia"}</COMANDO_PRODUCTO>

AGREGAR IMAGEN a producto: si dice "agrega una foto al producto X", "busca imágenes para Y"
<COMANDO_PRODUCTO>{"accion":"agregar_imagen","nombre_aproximado":"Kia","rol":"adicional","query_imagen":"kia sportage interior"}</COMANDO_PRODUCTO>
- "rol" es "principal" si el producto no tiene foto principal o si dice "imagen principal/portada"
- "rol" es "adicional" si dice "más fotos", "galería", "agrega otra foto"
- "query_imagen" en INGLÉS para mejor búsqueda en Unsplash

REGLAS de los comandos:
- Solo emite UN comando por respuesta.
- Si no estás 100% seguro de qué producto se refiere, PREGUNTA antes de emitir el comando.
- En el texto antes del comando, confirma brevemente qué vas a hacer.

═══════════════════════════════════════════════════
COMANDOS SOBRE IMÁGENES DE LA LANDING (hero/logo/galería)
═══════════════════════════════════════════════════
NO confundir con productos. Estos son sobre el hero, logo y galería de la landing principal.
- Subir archivo: si dice "quiero subir una imagen del hero" → guíalo al botón 📎
- Buscar en banco para hero/logo: usa <BUSCAR_IMAGEN>{"query":"...","tipo":"hero|logo|galeria","orientation":"landscape|portrait|squarish"}</BUSCAR_IMAGEN>
- Si pide "imagen para el producto X" → ESO ES PRODUCTO, usa <COMANDO_PRODUCTO> con accion="agregar_imagen"

═══════════════════════════════════════════════════
CAMBIOS DE TEXTO DE LA LANDING
═══════════════════════════════════════════════════
Si pide cambiar título, subtítulo o descripción:
<JSON>{"titulo":"...","subtitulo":"...","producto":"..."}</JSON>
Solo incluye los campos que cambias.`

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

    let reply = fullReply
    let titulo: string | undefined
    let subtitulo: string | undefined
    let producto: string | undefined

    // ── Cambios de texto ──
    const matchJson = fullReply.match(/<JSON>([\s\S]*?)<\/JSON>/)
    if (matchJson) {
      try {
        const parsed = JSON.parse(matchJson[1].trim())
        titulo = parsed.titulo
        subtitulo = parsed.subtitulo
        producto = parsed.producto
        reply = reply.replace(/<JSON>[\s\S]*?<\/JSON>/, '').trim()
      } catch {
        // ignorar
      }
    }

    // ── Búsqueda de imagen para landing (hero/logo/galería) ──
    let buscarImagen:
      | { query: string; tipo: 'hero' | 'logo' | 'galeria'; orientation: string }
      | undefined

    const matchImg = fullReply.match(/<BUSCAR_IMAGEN>([\s\S]*?)<\/BUSCAR_IMAGEN>/)
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

    // ── Comandos sobre productos ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let comandoProducto: any = undefined

    const matchProd = fullReply.match(/<COMANDO_PRODUCTO>([\s\S]*?)<\/COMANDO_PRODUCTO>/)
    if (matchProd) {
      try {
        comandoProducto = JSON.parse(matchProd[1].trim())
        reply = reply.replace(/<COMANDO_PRODUCTO>[\s\S]*?<\/COMANDO_PRODUCTO>/, '').trim()
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
      comandoProducto,
    })
  } catch (error) {
    console.error('[ia-chat] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
