// Ruta destino: src/lib/email-helpers.ts
// Helper centralizado para enviar emails con:
// - Lazy init de Resend (evita errores de build)
// - Tracking automático en tabla emails_enviados
// - Prevención de duplicados (excepto los explícitamente repetibles)

import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY no configurada')
    _resend = new Resend(apiKey)
  }
  return _resend
}

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type TipoEmail =
  | 'welcome'
  | 'personalizar_landing'
  | 'crear_bot'
  | 'viralizar'
  | 'pre_vencimiento'
  | 'trial_vencido'
  | 'comprobante_aprobado'
  | 'comprobante_rechazado'
  | 'invitacion_equipo'

// Tipos que NO se pueden enviar más de una vez por vendedor
const EMAILS_UNICOS: TipoEmail[] = [
  'welcome',
  'personalizar_landing',
  'crear_bot',
  'viralizar',
  'pre_vencimiento',
  'trial_vencido',
]

type EnviarEmailParams = {
  vendedorId: string
  tipo: TipoEmail
  email: string
  asunto: string
  html: string
  metadata?: Record<string, unknown>
  /** Si true, ignora la verificación de duplicados (solo para emails repetibles) */
  forzar?: boolean
}

type ResultadoEmail =
  | { ok: true; resendId: string }
  | { ok: false; razon: 'ya_enviado' | 'error'; error?: string }

/**
 * Envía un email + lo registra en BD para tracking.
 * Para emails únicos (welcome, etc.), verifica si ya se envió antes.
 */
export async function enviarEmailConTracking(
  params: EnviarEmailParams
): Promise<ResultadoEmail> {
  const { vendedorId, tipo, email, asunto, html, metadata = {}, forzar = false } = params

  // 1. Verificar si ya se envió (para emails únicos)
  if (!forzar && EMAILS_UNICOS.includes(tipo)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: yaEnviado } = await (supabaseService.from('emails_enviados') as any)
      .select('id')
      .eq('vendedor_id', vendedorId)
      .eq('tipo', tipo)
      .limit(1)
      .maybeSingle()

    if (yaEnviado) {
      return { ok: false, razon: 'ya_enviado' }
    }
  }

  // 2. Enviar via Resend
  try {
    const result = await getResend().emails.send({
      from: 'Ricardo de Ventas10x <ricardo@ventas10x.co>',
      to: email,
      subject: asunto,
      html,
    })

    const resendId = result.data?.id || ''

    // 3. Registrar en BD
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseService.from('emails_enviados') as any).insert({
      vendedor_id: vendedorId,
      tipo,
      asunto,
      email,
      resend_id: resendId,
      metadata,
    })

    return { ok: true, resendId }
  } catch (error) {
    console.error(`[email-helpers] Error enviando ${tipo}:`, error)
    return {
      ok: false,
      razon: 'error',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Verifica si un vendedor ya recibió un tipo de email
 */
export async function yaRecibioEmail(
  vendedorId: string,
  tipo: TipoEmail
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseService.from('emails_enviados') as any)
    .select('id')
    .eq('vendedor_id', vendedorId)
    .eq('tipo', tipo)
    .limit(1)
    .maybeSingle()

  return !!data
}

/**
 * Calcula días desde el registro
 */
export function diasDesdeRegistro(createdAt: string | Date): number {
  const created = new Date(createdAt).getTime()
  const ahora = Date.now()
  return Math.floor((ahora - created) / (1000 * 60 * 60 * 24))
}

/**
 * Calcula días hasta el vencimiento de la suscripción
 */
export function diasHastaVencimiento(fechaFin: string | Date): number {
  const fin = new Date(fechaFin).getTime()
  const ahora = Date.now()
  return Math.ceil((fin - ahora) / (1000 * 60 * 60 * 24))
}
