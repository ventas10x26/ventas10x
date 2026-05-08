// Ruta destino: src/app/api/instagram/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect('https://ventas10x.co/dashboard/perfil?ig=error')
  }

  try {
    // 1. Intercambiar code por access_token
    const tokenRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: process.env.META_REDIRECT_URI!,
        code,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      console.error('[instagram/callback] token error:', tokenData)
      return NextResponse.redirect('https://ventas10x.co/dashboard/perfil?ig=error')
    }

    const shortToken = tokenData.access_token

    // 2. Obtener token de larga duración
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${shortToken}`
    )
    const longTokenData = await longTokenRes.json()
    const accessToken = longTokenData.access_token || shortToken

    // 3. Obtener páginas de Facebook
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    )
    const pagesData = await pagesRes.json()
    const page = pagesData.data?.[0]
    if (!page) {
      return NextResponse.redirect('https://ventas10x.co/dashboard/perfil?ig=no-page')
    }

    const pageToken = page.access_token
    const pageId = page.id

    // 4. Obtener cuenta de Instagram conectada a la página
    const igRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
    )
    const igData = await igRes.json()
    const igAccountId = igData.instagram_business_account?.id

    if (!igAccountId) {
      return NextResponse.redirect('https://ventas10x.co/dashboard/perfil?ig=no-ig-account')
    }

    // 5. Guardar en el perfil del usuario
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect('https://ventas10x.co/auth/login')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('profiles') as any).update({
      instagram_access_token: pageToken,
      instagram_account_id: igAccountId,
    }).eq('id', user.id)

    return NextResponse.redirect('https://ventas10x.co/dashboard/kit-difusion?ig=conectado')
  } catch (e) {
    console.error('[instagram/callback] error:', e)
    return NextResponse.redirect('https://ventas10x.co/dashboard/perfil?ig=error')
  }
}
