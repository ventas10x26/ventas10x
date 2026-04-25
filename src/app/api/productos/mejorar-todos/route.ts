// Ruta destino: src/app/api/productos/mejorar-todos/route.ts
// Recorre TODOS los productos del vendedor y mejora cada descripción con IA.
// Procesa secuencialmente para no saturar la API.
// Devuelve un resumen con qué productos se mejoraron y cuáles fallaron.

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

type Producto = {
  id: string
  nombre: string
  precio: string | null
  descripcion: string | null
}

type Resultado = {
  id: string
  nombre: string
  estado: 'mejorado' | 'omitido' | 'error'
  motivo?: string
  descripcionAnterior?: string
  descripcionNueva?: string
}

const MIN_LARGO_DESCRIPCION = 50
// Si la descripción ya tiene varios saltos de línea, asumimos que ya está formateada
const YA_FORMATEADA_REGEX = /\n.*\n/

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Cargar todos los productos del vendedor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: productos, error: errProd } = await (supabase.from('productos') as any)
      .select('id, nombre, precio, descripcion')
      .eq('vendedor_id', user.id)
      .order('orden', { ascending: true })

    if (errProd) {
      return NextResponse.json({ error: errProd.message }, { status: 500 })
    }

    if (!productos || productos.length === 0) {
      return NextResponse.json({
        ok: true,
        total: 0,
        mejorados: 0,
        omitidos: 0,
        errores: 0,
        resultados: [],
      })
    }

    const resultados: Resultado[] = []

    // Procesar uno por uno (secuencial para no agotar rate limits)
    for (const producto of productos as Producto[]) {
      const descripcion = (producto.descripcion || '').trim()

      // Skip si no tiene descripción o es muy corta
      if (!descripcion || descripcion.length < MIN_LARGO_DESCRIPCION) {
        resultados.push({
          id: producto.id,
          nombre: producto.nombre,
          estado: 'omitido',
          motivo: descripcion.length === 0 ? 'sin descripción' : 'descripción muy corta',
        })
        continue
      }

      // Skip si ya tiene formato (varios saltos de línea)
      if (YA_FORMATEADA_REGEX.test(descripcion)) {
        resultados.push({
          id: producto.id,
          nombre: producto.nombre,
          estado: 'omitido',
          motivo: 'ya tiene formato',
        })
        continue
      }

      // Llamar a la IA
      try {
        const prompt = `Eres un experto en copywriting y diseño de descripciones de productos para landing pages.

Reformatea esta descripción para que sea fácil de leer en una landing page.

PRODUCTO: ${producto.nombre}${producto.precio ? ` (${producto.precio})` : ''}

DESCRIPCIÓN ACTUAL:
"""
${descripcion}
"""

Reglas:
1. NO inventes información. Solo reorganiza y mejora el formato.
2. Decide el mejor formato:
   - Si hay muchas características → bullets con "• "
   - Si es narrativo → párrafos cortos
   - Si tiene intro + características → mezcla
3. Usa saltos de línea reales (\\n). Línea en blanco (\\n\\n) entre párrafos.
4. Para bullets usa "• " al inicio.
5. Mantén español y tono original.
6. Para títulos como "Características:" puedes usar **bold**.
7. Mantén longitud similar.

Responde SOLO con un JSON válido (sin markdown):
{
  "descripcionMejorada": "el texto reformateado con \\n reales"
}`

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        })

        const textBlock = response.content.find((b) => b.type === 'text')
        const text = textBlock && textBlock.type === 'text' ? textBlock.text : ''
        const cleaned = text.replace(/```json|```/g, '').trim()

        const data = JSON.parse(cleaned)

        if (!data.descripcionMejorada) {
          throw new Error('IA no devolvió descripción')
        }

        // Guardar en la BD
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: errUpdate } = await (supabase.from('productos') as any)
          .update({ descripcion: data.descripcionMejorada })
          .eq('id', producto.id)
          .eq('vendedor_id', user.id)

        if (errUpdate) {
          throw new Error(errUpdate.message)
        }

        resultados.push({
          id: producto.id,
          nombre: producto.nombre,
          estado: 'mejorado',
          descripcionAnterior: descripcion,
          descripcionNueva: data.descripcionMejorada,
        })
      } catch (e) {
        resultados.push({
          id: producto.id,
          nombre: producto.nombre,
          estado: 'error',
          motivo: e instanceof Error ? e.message : 'Error desconocido',
        })
      }
    }

    const mejorados = resultados.filter(r => r.estado === 'mejorado').length
    const omitidos = resultados.filter(r => r.estado === 'omitido').length
    const errores = resultados.filter(r => r.estado === 'error').length

    return NextResponse.json({
      ok: true,
      total: productos.length,
      mejorados,
      omitidos,
      errores,
      resultados,
    })
  } catch (error) {
    console.error('[mejorar-todos] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
