// Ruta destino: src/app/api/bot-save/route.ts
// REEMPLAZA el archivo. Mantiene POST original y agrega GET, PATCH y DELETE.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─────────────────────────────────────────────────────────────
// POST: Crear bot (sin cambios respecto a tu versión)
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const config = await req.json()

    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data, error } = await supabase
      .from('bots')
      .insert([{
        user_id: user.id,
        nombre: config.nombre,
        empresa: config.empresa,
        industria: config.industria,
        tono: config.tono,
        bienvenida: config.bienvenida,
        productos: config.productos,
        faqs: config.faqs,
        whatsapp: config.whatsapp,
        activo: true,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, bot: data })
  } catch (error) {
    console.error('bot-save POST error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────
// GET: Obtener un bot por ID (?id=xxx)
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 })
    }

    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data, error } = await supabase
      .from('bots')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)  // garantizar que es del vendedor
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

    return NextResponse.json({ bot: data })
  } catch (error) {
    console.error('bot-save GET error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH: Actualizar un bot existente
// Body: { id, nombre, empresa, industria, tono, ... }
// ─────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...campos } = body

    if (!id) {
      return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
    }

    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Whitelist de campos permitidos
    const updates: Record<string, unknown> = {}
    const camposPermitidos = [
      'nombre', 'empresa', 'industria', 'tono',
      'bienvenida', 'productos', 'faqs', 'whatsapp', 'activo',
    ]

    for (const c of camposPermitidos) {
      if (campos[c] !== undefined) {
        updates[c] = campos[c]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('bots')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)  // solo su bot
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Bot no encontrado' }, { status: 404 })

    return NextResponse.json({ success: true, bot: data })
  } catch (error) {
    console.error('bot-save PATCH error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE: Eliminar un bot (?id=xxx)
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Falta el parámetro id' }, { status: 400 })
    }

    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { error } = await supabase
      .from('bots')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)  // solo su bot

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('bot-save DELETE error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
