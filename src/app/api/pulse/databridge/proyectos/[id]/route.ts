// src/app/api/pulse/databridge/proyectos/[id]/route.ts
// GET: devuelve un proyecto de DataBridge guardado — 404 si no existe o no pertenece al usuario.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('pulse_databridge_proyectos') as any)
      .select('id, nombre, tablas, relaciones, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[pulse/databridge/proyectos/[id] GET] error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    return NextResponse.json({ ok: true, proyecto: data })
  } catch (e) {
    console.error('[pulse/databridge/proyectos/[id] GET]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
