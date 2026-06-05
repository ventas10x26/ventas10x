// Ruta destino: src/app/api/pulse/status/route.ts
// Devuelve si un slug tiene Pulse Motor activo
// Busca por whatsapp ya que profiles no tiene email

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
    // Obtener whatsapp del asesor por slug
    const { data: profile } = await supabase
      .from('profiles')
      .select('whatsapp, id')
      .eq('slug', slug)
      .maybeSingle()

    if (!profile) return NextResponse.json({ vapi_enabled: false })

    // Buscar en pulse_waitlist por whatsapp (guardado en metadata)
    // El whatsapp puede estar con o sin +57 o 57
    const wa = profile.whatsapp?.replace(/\D/g, '') || ''
    const waCorto = wa.replace(/^57/, '')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: waitlistRows } = await (supabase.from('pulse_waitlist') as any)
      .select('metadata')

    if (!waitlistRows?.length) return NextResponse.json({ vapi_enabled: false })

    // Buscar por coincidencia de whatsapp en metadata
    const match = waitlistRows.find((row: any) => {
      const metaWa = String(row.metadata?.whatsapp || '').replace(/\D/g, '').replace(/^57/, '')
      return metaWa && metaWa === waCorto
    })

    if (!match) return NextResponse.json({ vapi_enabled: false })

    const meta = match.metadata as Record<string, any>
    const vapiEnabled = !!(meta && meta.bot_activo !== false)

    return NextResponse.json({ vapi_enabled: vapiEnabled }, {
      headers: { 'Cache-Control': 'public, max-age=300' }
    })
  } catch (e) {
    console.error('[pulse/status]', e)
    return NextResponse.json({ vapi_enabled: false })
  }
}
