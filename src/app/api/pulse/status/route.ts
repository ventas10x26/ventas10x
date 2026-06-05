// Ruta destino: src/app/api/pulse/status/route.ts
// Devuelve si un slug tiene Pulse Motor activo
// Usa service role pero es una ruta API segura

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ vapi_enabled: false })

  try {
    // Obtener email del asesor por slug desde profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('slug', slug)
      .maybeSingle()

    if (!profile?.email) return NextResponse.json({ vapi_enabled: false })

    // Verificar si tiene Pulse Motor activo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: waitlist } = await (supabase.from('pulse_waitlist') as any)
      .select('metadata')
      .eq('email', profile.email)
      .maybeSingle()

    if (!waitlist) return NextResponse.json({ vapi_enabled: false })

    const meta = waitlist.metadata as Record<string, any> | null
    const vapiEnabled = !!(meta && meta.bot_activo !== false)

    return NextResponse.json({ vapi_enabled: vapiEnabled }, {
      headers: { 'Cache-Control': 'public, max-age=300' } // cache 5min
    })
  } catch (e) {
    console.error('[pulse/status]', e)
    return NextResponse.json({ vapi_enabled: false })
  }
}
