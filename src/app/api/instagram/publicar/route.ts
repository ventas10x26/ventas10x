// Ruta destino: src/app/api/instagram/publicar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { imagen_url, caption } = await req.json()
    if (!imagen_url || !caption) {
      return NextResponse.json({ error: 'imagen_url y caption son requeridos' }, { status: 400 })
    }

    // Obtener tokens del perfil
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: perfil } = await (supabaseAdmin.from('profiles') as any)
      .select('instagram_access_token, instagram_account_id')
      .eq('id', user.id)
      .single()

    if (!perfil?.instagram_access_token || !perfil?.instagram_account_id) {
      return NextResponse.json({ error: 'Instagram no conectado' }, { status: 400 })
    }

    const { instagram_access_token: token, instagram_account_id: igId } = perfil

    // Paso 1: Crear contenedor de media
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imagen_url,
          caption,
          access_token: token,
        }),
      }
    )
    const containerData = await containerRes.json()
    if (!containerData.id) {
      console.error('[instagram/publicar] container error:', containerData)
      return NextResponse.json({ error: containerData.error?.message || 'Error creando contenedor' }, { status: 500 })
    }

    // Paso 2: Publicar el contenedor
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: token,
        }),
      }
    )
    const publishData = await publishRes.json()
    if (!publishData.id) {
      console.error('[instagram/publicar] publish error:', publishData)
      return NextResponse.json({ error: publishData.error?.message || 'Error publicando' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, post_id: publishData.id })
  } catch (e) {
    console.error('[instagram/publicar] error:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
