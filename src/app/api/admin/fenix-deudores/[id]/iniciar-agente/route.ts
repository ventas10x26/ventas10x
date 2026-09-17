// Ruta destino: src/app/api/admin/fenix-deudores/[id]/iniciar-agente/route.ts
//
// Dispara el PRIMER contacto real con un deudor aprobado. Solo funciona si:
// 1. estado_aprobacion === 'aprobado' (nunca se salta la aprobación manual).
// 2. agente_activo === false (no se manda dos veces el primer contacto).
// 3. fenix_agente.plantilla_primer_contacto está configurada -- WhatsApp
//    exige una plantilla PRE-APROBADA por Meta para escribirle a alguien
//    que nunca ha escrito (no hay ventana de 24h abierta); no hay forma de
//    inventar o saltarse esto vía código, ver whatsapp-cloud-api.ts.
//
// Si todo sale bien: crea/actualiza la fila en fenix_conversaciones para
// este deudor (misma tabla e instance_name que ya usa el webhook normal),
// así que en cuanto responda, fenix-whatsapp-cloud-handler.ts sigue la
// conversación con el agente configurado en /admin/fenix/agente sin ningún
// cambio adicional -- es el mismo flujo que un deudor que escribe por su
// cuenta, solo que acá lo iniciamos nosotros.
//
// Tabla: fenix_clientes_deuda (ver nota en [id]/route.ts -- "fenix_deudores"
// es una tabla huérfana, no usarla).

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { enviarPlantilla, type CuentaWhatsapp } from '@/lib/whatsapp-cloud-api'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const INSTANCE_NAME = 'fenix_cobranza' // igual que fenix-whatsapp-cloud-handler.ts

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params

  const { data: deudor } = await supabaseService.from('fenix_clientes_deuda').select('*').eq('id', id).maybeSingle()
  if (!deudor) return NextResponse.json({ error: 'Deudor no encontrado' }, { status: 404 })
  if (deudor.estado_aprobacion !== 'aprobado') {
    return NextResponse.json({ error: 'Este deudor no está aprobado todavía' }, { status: 400 })
  }
  if (deudor.agente_activo) {
    return NextResponse.json({ error: 'El agente ya se activó para este deudor' }, { status: 400 })
  }

  const { data: cfg } = await supabaseService
    .from('fenix_agente')
    .select('plantilla_primer_contacto, plantilla_idioma')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!cfg?.plantilla_primer_contacto) {
    return NextResponse.json({
      error: 'No hay una plantilla de primer contacto configurada. Ve a /admin/fenix/agente → Avanzado y pon el nombre exacto de una plantilla ya aprobada en Meta Business Suite (Administrador de WhatsApp → Plantillas de mensajes).',
    }, { status: 400 })
  }

  // Cuenta de producción de Fénix -- misma que usa el resto del admin panel.
  // es_prueba=false es obligatorio: whatsapp_cuentas puede tener más de una
  // fila 'activo' para 'fenix' a la vez (p.ej. el número de sandbox que
  // Meta crea por defecto al configurar la Cloud API, que solo puede
  // mandarle a los destinatarios de su propia lista de prueba). Sin este
  // filtro, ordenar por created_at ascendente termina agarrando esa cuenta
  // de prueba en vez de la real y Graph API responde 131030 ("Recipient
  // phone number not in allowed list") aunque el número de destino esté
  // perfecto -- mismo patrón ya resuelto en fenix-lead-pipeline.ts.
  const { data: cuenta } = await supabaseService
    .from('whatsapp_cuentas')
    .select('*')
    .eq('proyecto', 'fenix')
    .eq('estado', 'activo')
    .eq('es_prueba', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!cuenta) {
    return NextResponse.json({ error: 'No hay una cuenta de WhatsApp activa para Fénix en whatsapp_cuentas' }, { status: 500 })
  }

  // La plantilla debe llevar el nombre del deudor como {{1}} en el body --
  // ajustar acá si la plantilla real usa más variables o header.
  try {
    await enviarPlantilla(
      cuenta as CuentaWhatsapp,
      deudor.telefono,
      cfg.plantilla_primer_contacto,
      cfg.plantilla_idioma || 'es_CO',
      [{ type: 'body', parameters: [{ type: 'text', text: deudor.nombre_deudor }] }]
    )
  } catch (e) {
    console.error('[fenix-deudores/iniciar-agente] enviarPlantilla error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'No se pudo enviar la plantilla' }, { status: 502 })
  }

  // Se crea la conversación ya como 'deudor' -- así, cuando responda, el
  // webhook la trata exactamente igual que si hubiera escrito por su
  // cuenta (misma tabla, mismo instance_name, mismo agente).
  //
  // historial NO se deja vacío: se registra que salió la plantilla, aunque
  // sea como nota (no el texto exacto del body, que solo vive en Meta Template
  // Manager y no está replicado acá) -- si no, el panel de Conversaciones
  // muestra "Todavía no hay mensajes" pese a que el mensaje sí se entregó,
  // hasta que el deudor responda y recién ahí aparezca algo.
  const { data: conv, error: convError } = await supabaseService
    .from('fenix_conversaciones')
    .upsert({
      instance_name: INSTANCE_NAME,
      remote_jid: deudor.telefono,
      tipo: 'deudor',
      phone_number_id: cuenta.phone_number_id,
      historial: [{
        role: 'assistant',
        content: `📋 Plantilla "${cfg.plantilla_primer_contacto}" enviada (primer contacto a ${deudor.nombre_deudor || 'este deudor'}).`,
      }],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'instance_name,remote_jid' })
    .select('id')
    .single()

  if (convError) console.error('[fenix-deudores/iniciar-agente] error creando conversación:', convError)

  const { data: actualizado, error: updateError } = await supabaseService
    .from('fenix_clientes_deuda')
    .update({
      agente_activo: true,
      primer_contacto_en: new Date().toISOString(),
      estado: 'contactado',
      conversacion_id: conv?.id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (updateError) {
    console.error('[fenix-deudores/iniciar-agente] error actualizando deudor:', updateError)
    // El mensaje ya salió -- no se le reporta error al admin por esto solo.
  }

  return NextResponse.json({ ok: true, deudor: actualizado || deudor })
}
