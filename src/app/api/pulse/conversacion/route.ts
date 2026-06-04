// src/app/api/pulse/conversacion/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  const telefono = req.nextUrl.searchParams.get('telefono')
  if (!telefono) return NextResponse.json({ historial: [] })

  try {
    const tel = telefono.replace(/\D/g, '').replace(/^57/, '')
    const remoteJid = `57${tel}@s.whatsapp.net`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin.from('pulse_conversaciones') as any)
      .select('historial, modelo_detectado, updated_at')
      .eq('remote_jid', remoteJid)
      .maybeSingle()

    return NextResponse.json({
      historial: data?.historial || [],
      modelo: data?.modelo_detectado || null,
      ultima_actividad: data?.updated_at || null,
    })
  } catch (e) {
    console.error('[conversacion] error:', e)
    return NextResponse.json({ historial: [] })
  }
}
