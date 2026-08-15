// Ruta destino: src/app/api/admin/fenix-leads/fusionar/route.ts
// Fusiona varios leads duplicados (mismo teléfono, capturados dos veces
// por ejemplo desde Meta Ads y la landing) en uno solo: conserva el
// registro `keepId`, le junta las notas de los demás (para no perder
// seguimiento ya escrito), y borra el resto.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { keepId, mergeIds } = await req.json()
  if (!keepId || !Array.isArray(mergeIds) || mergeIds.length === 0) {
    return NextResponse.json({ error: 'Se necesita "keepId" y un arreglo "mergeIds" con al menos un elemento' }, { status: 400 })
  }
  if (mergeIds.includes(keepId)) {
    return NextResponse.json({ error: 'keepId no puede estar también en mergeIds' }, { status: 400 })
  }

  const { data: filas, error: errLectura } = await supabaseService
    .from('fenix_leads')
    .select('id, notas, mensaje, etapa, autorespuesta_enviada_at, autorespuesta_mensaje')
    .in('id', [keepId, ...mergeIds])

  if (errLectura || !filas) {
    console.error('[admin/fenix-leads/fusionar] Error al leer:', errLectura)
    return NextResponse.json({ error: 'No se pudieron leer los leads a fusionar' }, { status: 500 })
  }

  const principal = filas.find((f) => f.id === keepId)
  if (!principal) return NextResponse.json({ error: 'keepId no encontrado' }, { status: 404 })
  const otros = filas.filter((f) => f.id !== keepId)

  const notasCombinadas = [principal.notas, ...otros.map((o) => o.notas)]
    .filter((n): n is string => !!n && n.trim().length > 0)
    .join('\n---\n') || null

  // Si el principal no tiene autorespuesta pero algún duplicado sí, se
  // adopta esa -- así no se pierde el registro de que ya se le escribió.
  const conAutoresp = filas.find((f) => f.autorespuesta_enviada_at)
  const autorespuestaFinal = principal.autorespuesta_enviada_at
    ? { autorespuesta_enviada_at: principal.autorespuesta_enviada_at, autorespuesta_mensaje: principal.autorespuesta_mensaje }
    : conAutoresp
      ? { autorespuesta_enviada_at: conAutoresp.autorespuesta_enviada_at, autorespuesta_mensaje: conAutoresp.autorespuesta_mensaje }
      : {}

  const { data: actualizado, error: errUpdate } = await supabaseService
    .from('fenix_leads')
    .update({ notas: notasCombinadas, ...autorespuestaFinal })
    .eq('id', keepId)
    .select('*')
    .single()

  if (errUpdate) {
    console.error('[admin/fenix-leads/fusionar] Error al actualizar el principal:', errUpdate)
    return NextResponse.json({ error: 'No se pudo actualizar el lead principal' }, { status: 500 })
  }

  const { error: errDelete } = await supabaseService.from('fenix_leads').delete().in('id', mergeIds)
  if (errDelete) {
    console.error('[admin/fenix-leads/fusionar] Error al borrar duplicados:', errDelete)
    return NextResponse.json({ error: 'Se actualizó el principal pero no se pudieron borrar los duplicados' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, lead: actualizado, fusionados: mergeIds.length })
}
