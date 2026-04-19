import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isAdmin = request.nextUrl.pathname.startsWith('/admin')
  const isAuth = request.nextUrl.pathname.startsWith('/auth')

  if ((isDashboard || isAdmin) && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  if (isAuth && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return supabaseResponse
}
