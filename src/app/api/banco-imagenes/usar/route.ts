// Ruta destino: src/app/api/banco-imagenes/usar/route.ts
// POST: registra el uso de una imagen del banco (incrementa contador)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { url } = await req.json()
    if (!url) {
      return NextResponse.json({ error: 'Falta url' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.rpc as any)('incrementar_uso_imagen', { imagen_url: url })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[banco-imagenes/usar] Error:', error)
    return NextResponse.json({ ok: true }) // No crítico, ignoramos errores
  }
}
