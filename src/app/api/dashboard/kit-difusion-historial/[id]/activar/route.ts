// Ruta destino: src/app/api/dashboard/kit-difusion-historial/[id]/activar/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Llama a la funcion SQL que desactiva todas y activa solo esta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: rpcErr } = await (supabase.rpc as any)('activar_estrategia', {
      p_estrategia_id: id,
    })

    if (rpcErr) {
      console.error('[kit-difusion-historial/activar] rpc error:', rpcErr)
      return NextResponse.json({ error: rpcErr.message }, { status: 500 })
    }

    // Devolver la estrategia completa recien activada
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activa, error: getErr } = await (supabase.from('vendedor_estrategias') as any)
      .select('*')
      .eq('id', id)
      .single()

    if (getErr || !activa) {
      console.error('[kit-difusion-historial/activar] get error:', getErr)
      return NextResponse.json({ error: 'No se pudo cargar la estrategia activada' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, estrategia: activa })
  } catch (e) {
    console.error('[kit-difusion-historial/activar]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
