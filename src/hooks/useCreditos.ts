// src/hooks/useCreditos.ts
// Hook para consumir créditos desde cualquier componente
'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AccionCredito } from '@/lib/pulse/creditos-config'

// El tipo sale de creditos-config: si se agrega un resultado facturable allá,
// acá no hay que acordarse de nada. Antes era una unión duplicada a mano y ya
// se había desincronizado (le faltaba VENTA_CERRADA).

interface ConsumoResult {
  ok: boolean
  saldo?: number
  costo?: number
  ya_cobrado?: boolean
  error?: 'saldo_insuficiente' | 'sin_creditos' | string
}

export function useCreditos() {
  const supabase = createClient()

  const consumir = useCallback(async (
    accion: AccionCredito,
    metadata?: Record<string, unknown>
  ): Promise<ConsumoResult> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'sin_usuario' }

    try {
      // Sin user_id en el body: el endpoint lo toma de la sesión (mandarlo desde
      // el cliente era justamente el agujero que permitía cobrarle a otra cuenta).
      const res = await fetch('/api/pulse/creditos/consumir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion, metadata }),
      })
      const data = await res.json() as ConsumoResult

      if (!res.ok) {
        return { ok: false, error: data.error, saldo: data.saldo }
      }
      return { ok: true, saldo: data.saldo, costo: data.costo, ya_cobrado: data.ya_cobrado }
    } catch {
      return { ok: false, error: 'network_error' }
    }
  }, [])

  return { consumir }
}
