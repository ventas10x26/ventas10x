// Ruta destino: src/app/api/instagram/auth/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const igAppId = process.env.META_IG_APP_ID!
  const redirectUri = process.env.META_REDIRECT_URI!

  const url = new URL('https://www.instagram.com/oauth/authorize')
  url.searchParams.set('client_id', igAppId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'instagram_business_basic,instagram_content_publish')
  url.searchParams.set('response_type', 'code')

  return NextResponse.redirect(url.toString())
}