// Ruta destino: src/app/api/instagram/auth/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const appId = process.env.META_APP_ID!
  const redirectUri = process.env.META_REDIRECT_URI!

  const scope = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_read_engagement',
    'pages_show_list',
  ].join(',')

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('response_type', 'code')

  return NextResponse.redirect(url.toString())
}
