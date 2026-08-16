// Ruta destino: src/app/api/whatsapp-cloud/webhook/route.ts
//
// Webhook único para TODAS las cuentas de WhatsApp Cloud API del monorepo
// (Fénix, Pulse, futuros asesores de Ventas10x). Meta manda cada mensaje
// entrante acá sin importar qué número lo recibió -- este endpoint busca en
// whatsapp_cuentas cuál de nuestras cuentas es (por phone_number_id) y
// despacha al handler del proyecto correspondiente.
//
// GET: handshake de verificación que Meta hace al configurar/cambiar la URL.
// POST: mensajes y eventos entrantes reales.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { parsearWebhookEntrante, verificarHandshakeWebhook, type CuentaWhatsapp } from '@/lib/whatsapp-cloud-api'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const { data: cuentas } = await supabaseService
    .from('whatsapp_cuentas')
    .select('webhook_verify_token')

  const tokensValidos = (cuentas || []).map((c) => c.webhook_verify_token)
  const resultado = verificarHandshakeWebhook({ mode, token, challenge }, tokensValidos)

  if (resultado === null) {
    return NextResponse.json({ error: 'Verificación fallida' }, { status: 403 })
  }
  // Meta espera el challenge devuelto tal cual, como texto plano (no JSON).
  return new NextResponse(resultado, { status: 200 })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const mensajes = parsearWebhookEntrante(body)

  // Puede llegar un payload sin mensajes (ej. actualización de estado
  // "delivered"/"read" de algo que nosotros enviamos) -- no hay nada que
  // hacer con eso todavía, se responde 200 igual para que Meta no reintente.
  if (mensajes.length === 0) {
    return NextResponse.json({ ok: true })
  }

  for (const mensaje of mensajes) {
    const { data: cuenta } = await supabaseService
      .from('whatsapp_cuentas')
      .select('*')
      .eq('phone_number_id', mensaje.phoneNumberId)
      .maybeSingle()

    if (!cuenta) {
      console.error(`[whatsapp-cloud webhook] Mensaje entrante de un phone_number_id sin cuenta registrada: ${mensaje.phoneNumberId}`)
      continue
    }

    try {
      await despacharAlProyecto(cuenta as CuentaWhatsapp, mensaje.from, mensaje.texto, mensaje.tipo)
    } catch (e) {
      console.error(`[whatsapp-cloud webhook] Error despachando a ${cuenta.proyecto}:`, e)
      // No se relanza -- un fallo en un handler no debe tumbar el resto de
      // mensajes del batch ni hacer que Meta reintente el webhook completo.
    }
  }

  return NextResponse.json({ ok: true })
}

// Punto de despacho por proyecto -- cada uno vive en su propio módulo
// (misma idea que ya existe para Fénix en fenix-lead-pipeline.ts / el
// webhook de Evolution API, solo que ahora comparten la capa de envío).
// Los handlers de pulse y ventas10x se agregan cuando esos proyectos migren.
async function despacharAlProyecto(
  cuenta: CuentaWhatsapp,
  from: string,
  texto: string | null,
  tipo: string
) {
  switch (cuenta.proyecto) {
    case 'fenix': {
      const { manejarMensajeEntranteFenix } = await import('@/lib/fenix-whatsapp-cloud-handler')
      await manejarMensajeEntranteFenix(cuenta, from, texto, tipo)
      return
    }
    case 'pulse':
      // TODO: conectar cuando Pulse migre de su integración actual a Cloud API.
      console.log(`[whatsapp-cloud webhook] Mensaje para Pulse (${cuenta.nombre_visible}) -- handler pendiente`)
      return
    case 'ventas10x':
      // TODO: conectar cuando arranque el alta multi-tenant por asesor (Embedded Signup).
      console.log(`[whatsapp-cloud webhook] Mensaje para Ventas10x tenant=${cuenta.tenant_id} -- handler pendiente`)
      return
  }
}
