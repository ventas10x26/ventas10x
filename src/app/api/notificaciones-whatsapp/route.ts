// Ruta destino: src/app/api/notificaciones-whatsapp/route.ts
// Endpoints para que el vendedor configure y pruebe su CallMeBot.
// POST: prueba la conexión enviándose un mensaje de validación
// PATCH: guarda/actualiza la configuración

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { probarCallMeBot } from '@/lib/notificaciones-whatsapp'

// ─── PATCH: actualizar configuración ───
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const updates: Record<string, unknown> = {}

    if (typeof body.callmebot_apikey === 'string') {
      updates.callmebot_apikey = body.callmebot_apikey.trim() || null
    }
    if (typeof body.callmebot_telefono === 'string') {
      // Limpiar a solo dígitos
      const tel = body.callmebot_telefono.replace(/\D/g, '')
      updates.callmebot_telefono = tel || null
    }
    if (typeof body.notif_whatsapp_activa === 'boolean') {
      updates.notif_whatsapp_activa = body.notif_whatsapp_activa
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('profiles') as any)
      .update(updates)
      .eq('id', user.id)
      .select('callmebot_apikey, callmebot_telefono, notif_whatsapp_activa')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, config: data })
  } catch (error) {
    console.error('[notif-whatsapp PATCH] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ─── POST: enviar mensaje de prueba ───
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('callmebot_apikey, callmebot_telefono')
      .eq('id', user.id)
      .single()

    if (!profile?.callmebot_apikey || !profile?.callmebot_telefono) {
      return NextResponse.json(
        { error: 'Falta configurar API key y teléfono' },
        { status: 400 }
      )
    }

    const resultado = await probarCallMeBot(
      profile.callmebot_apikey,
      profile.callmebot_telefono
    )

    if (!resultado.ok) {
      return NextResponse.json(
        { error: resultado.error || 'No se pudo enviar el mensaje de prueba' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      mensaje: '✅ Mensaje de prueba enviado. Revisa tu WhatsApp en unos segundos.',
    })
  } catch (error) {
    console.error('[notif-whatsapp POST] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
