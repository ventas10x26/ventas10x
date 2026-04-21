import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ProfileInput = {
  nombre: string
  apellido: string
  empresa: string
  whatsapp: string
  slug: string
}

const SLUG_REGEX = /^[a-z0-9-]+$/

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
    const { nombre, apellido, empresa, whatsapp, slug } = body as ProfileInput

    // Validaciones
    if (slug && slug.trim().length > 0) {
      const slugLimpio = slug.trim().toLowerCase()

      if (!SLUG_REGEX.test(slugLimpio)) {
        return NextResponse.json(
          { error: 'El slug solo puede tener minúsculas, números y guiones.' },
          { status: 400 }
        )
      }

      if (slugLimpio.length < 3 || slugLimpio.length > 30) {
        return NextResponse.json(
          { error: 'El slug debe tener entre 3 y 30 caracteres.' },
          { status: 400 }
        )
      }

      // Verificar que el slug no esté tomado por OTRO usuario
      const { data: slugExistente } = await supabase
        .from('profiles')
        .select('id')
        .eq('slug', slugLimpio)
        .neq('id', user.id)
        .maybeSingle()

      if (slugExistente) {
        return NextResponse.json(
          { error: `El slug "${slugLimpio}" ya está en uso. Elige otro.` },
          { status: 409 }
        )
      }
    }

    // Preparar datos a actualizar (sanitizados)
    const datosActualizados = {
      nombre: nombre?.trim() || null,
      apellido: apellido?.trim() || null,
      empresa: empresa?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      slug: slug?.trim().toLowerCase() || null,
    }

    // Update en Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('profiles') as any)
      .update(datosActualizados)
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) {
      console.error('[api/perfil PATCH] Error Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('[api/perfil PATCH] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
