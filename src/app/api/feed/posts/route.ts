// Ruta destino: src/app/api/feed/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

const supabasePublic = () => {
  const { createClient: createAnon } = require('@supabase/supabase-js')
  return createAnon(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/feed/posts — feed público paginado
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit
    const tipo = searchParams.get('tipo') // filtro opcional
    const vendedor_id = searchParams.get('vendedor_id') // filtro por vendedor

    const supabase = supabasePublic()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('feed_posts')
      .select(`
        id, tipo, titulo, contenido, imagen_url, deal_valor, deal_industria,
        metrica_tipo, metrica_valor, likes_count, created_at, vendedor_id, producto_id,
        profiles!vendedor_id (
          id, nombre, apellido, empresa, avatar_url, slug, industria
        ),
        productos (
          id, nombre, precio, descripcion, imagen_principal
        )
      `)
      .eq('publico', true)
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (tipo) query = query.eq('tipo', tipo)
    if (vendedor_id) query = query.eq('vendedor_id', vendedor_id)

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ posts: data || [], page, hasMore: (data || []).length === limit })
  } catch (e) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST /api/feed/posts — crear post (requiere auth)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const active = await getActiveOrg()
    if (!active) return NextResponse.json({ error: 'Sin org activa' }, { status: 403 })

    const body = await req.json()
    const { tipo, titulo, contenido, imagen_url, producto_id, deal_valor, deal_industria, metrica_tipo, metrica_valor, publico } = body

    if (!tipo || !contenido) {
      return NextResponse.json({ error: 'tipo y contenido requeridos' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('feed_posts')
      .insert({
        vendedor_id: user.id,
        org_id: active.org.id,
        tipo,
        titulo: titulo?.trim() || null,
        contenido: contenido?.trim(),
        imagen_url: imagen_url || null,
        producto_id: producto_id || null,
        deal_valor: deal_valor || null,
        deal_industria: deal_industria || null,
        metrica_tipo: metrica_tipo || null,
        metrica_valor: metrica_valor || null,
        publico: publico !== false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, post: data })
  } catch (e) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
