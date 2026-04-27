// Ruta destino: src/lib/admin-helpers.ts
// Helpers para verificar permisos de admin y estado de suscripción

import { createClient } from '@/lib/supabase/server'

/**
 * Verifica si el usuario actual es admin.
 * Devuelve null si no lo es.
 */
export async function getCurrentAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: admin } = await (supabase.from('admins') as any)
    .select('*')
    .eq('email', user.email)
    .single()

  return admin
    ? { ...admin, userId: user.id, userEmail: user.email }
    : null
}

/**
 * Verifica si la suscripción está activa.
 * Devuelve datos útiles para mostrar en UI.
 */
export type EstadoSuscripcionUsuario = {
  activa: boolean
  plan: string
  diasRestantes: number
  fechaFin: Date | null
  estadoLabel: 'activa' | 'por_vencer' | 'vencida' | 'sin_suscripcion'
}

export async function getEstadoSuscripcion(userId: string): Promise<EstadoSuscripcionUsuario> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sub } = await (supabase.from('suscripciones') as any)
    .select('*')
    .eq('vendedor_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub) {
    return {
      activa: false,
      plan: 'sin_plan',
      diasRestantes: 0,
      fechaFin: null,
      estadoLabel: 'sin_suscripcion',
    }
  }

  const fechaFin = new Date(sub.fecha_fin)
  const ahora = Date.now()
  const diff = fechaFin.getTime() - ahora
  const diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))

  const activa = sub.estado === 'activa' && fechaFin.getTime() > ahora

  let estadoLabel: EstadoSuscripcionUsuario['estadoLabel']
  if (!activa) {
    estadoLabel = 'vencida'
  } else if (diasRestantes <= 3) {
    estadoLabel = 'por_vencer'
  } else {
    estadoLabel = 'activa'
  }

  return {
    activa,
    plan: sub.plan,
    diasRestantes,
    fechaFin,
    estadoLabel,
  }
}

/**
 * Helper para usar en endpoints que requieren suscripción activa
 * (bloqueo blando: deja leer, bloquea crear/editar).
 *
 * Uso:
 *   const sub = await requiereSuscripcionActiva()
 *   if ('error' in sub) return sub.error
 *
 * Si la suscripción está vencida, devuelve un Response 403.
 */
export async function requiereSuscripcionActiva(): Promise<
  | { ok: true; userId: string; plan: string }
  | { error: Response }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  const estado = await getEstadoSuscripcion(user.id)

  if (!estado.activa) {
    return {
      error: new Response(
        JSON.stringify({
          error: 'Tu plan está vencido. Renueva tu suscripción para continuar.',
          codigo: 'SUSCRIPCION_VENCIDA',
          accion: 'Ve a /dashboard/planes para renovar',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  return { ok: true, userId: user.id, plan: estado.plan }
}
