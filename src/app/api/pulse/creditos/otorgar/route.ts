// src/app/api/pulse/creditos/otorgar/route.ts
// Usado internamente: al registrarse, bonus por tiempo, reactivación
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CREDITOS_CONFIG } from '@/lib/pulse/creditos-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Solo accesible desde el backend (verificar header interno)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { user_id, cantidad, accion, metadata } = await req.json() as {
      user_id: string
      cantidad: number
      accion: string
      metadata?: Record<string, unknown>
    }

    if (!user_id || !cantidad || !accion) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    // Upsert: crear si no existe, sumar si existe
    const { data: existing } = await supabase
      .from('pulse_creditos')
      .select('saldo, saldo_total')
      .eq('user_id', user_id)
      .single()

    let nuevo_saldo: number
    let nuevo_total: number

    if (!existing) {
      // Crear nuevo
      nuevo_saldo = cantidad
      nuevo_total = cantidad
      await supabase.from('pulse_creditos').insert({
        user_id,
        saldo: nuevo_saldo,
        saldo_total: nuevo_total,
      })
    } else {
      // Sumar al existente
      nuevo_saldo = existing.saldo + cantidad
      nuevo_total = existing.saldo_total + cantidad
      await supabase.from('pulse_creditos')
        .update({ saldo: nuevo_saldo, saldo_total: nuevo_total, updated_at: new Date().toISOString() })
        .eq('user_id', user_id)
    }

    // Log
    await supabase.from('pulse_creditos_log').insert({
      user_id,
      tipo:       accion === 'registro' ? 'otorgado' : 'bonus',
      accion,
      cantidad,
      saldo_post: nuevo_saldo,
      metadata:   metadata ?? null,
    })

    return NextResponse.json({ ok: true, saldo: nuevo_saldo })
  } catch (err) {
    console.error('[creditos/otorgar]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
