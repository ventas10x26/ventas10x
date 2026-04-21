import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ConfigInput = {
  titulo: string
  subtitulo: string
  producto: string
  color_acento: string
}

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { titulo, subtitulo, producto, color_acento } = body as ConfigInput

    // Validación del color
    if (color_acento && !HEX_REGEX.test(color_acento)) {
      return NextResponse.json(
        { error: 'El color debe ser un hex válido (ej: #FF6B2B)' },
        { status: 400 }
      )
    }

    // Preparar datos (sanitizados)
    const datos = {
      vendedor_id: user.id,
      titulo: titulo?.trim() || null,
      subtitulo: subtitulo?.trim() || null,
      producto: producto?.trim() || null,
      color_acento: color_acento?.trim() || '#FF6B2B',
    }

    // Upsert: crea la fila si no existe, actualiza si existe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('landing_config') as any)
      .upsert(datos, { onConflict: 'vendedor_id' })
      .select('*')
      .single()

    if (error) {
      console.error('[api/landing/config PATCH] Error Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ config: data })
  } catch (error) {
    console.error('[api/landing/config PATCH] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
