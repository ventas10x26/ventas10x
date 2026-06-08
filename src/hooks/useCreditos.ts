// src/hooks/useCreditos.ts
// Hook para consumir créditos desde cualquier componente
'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type AccionCredito =
  | 'MENSAJE_RESPONDIDO'
  | 'FOLLOWUP_ENVIADO'
  | 'CITA_AGENDADA'
  | 'VOZ_MUESTRA'
  | 'CONECTAR_WHATSAPP'
  | 'CONFIGURAR_AGENTE'

interface ConsumoResult {
  ok: boolean
  saldo?: number
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
      const res = await fetch('/api/pulse/creditos/consumir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, accion, metadata }),
      })
      const data = await res.json() as ConsumoResult & { costo?: number }

      if (!res.ok) {
        return { ok: false, error: data.error, saldo: data.saldo }
      }
      return { ok: true, saldo: data.saldo }
    } catch {
      return { ok: false, error: 'network_error' }
    }
  }, [])

  return { consumir }
}
