// Ruta destino: src/app/api/admin/fenix-conversaciones/[id]/mensaje/route.ts
//
// POST: envía un mensaje de texto manual (bypassa la IA) usando la MISMA
// cuenta de WhatsApp Cloud API por la que llegó esa conversación --
// resuelta por fenix_conversaciones.phone_number_id, guardado por
// fenix-whatsapp-cloud-handler.ts en cada mensaje entrante desde que se
// agregó esa columna. Si la conversación es de antes de esa columna (o de
// la época de Evolution API), no hay con qué número responder y se
// devuelve un error explícito en vez de adivinar.
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { enviarTexto, type CuentaWhatsapp } from '@/lib/whatsapp-cloud-api'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type MensajeHistorial = { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const { mensaje } = await req.json()
  if (!mensaje || !String(mensaje).trim()) {
    return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
  }
  const texto = String(mensaje).trim()

  const { data: conv } = await supabaseService
    .from('fenix_conversaciones')
    .select('remote_jid, historial, phone_number_id')
    .eq('id', id)
    .maybeSingle()

  if (!conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })
  if (!conv.phone_number_id) {
    return NextResponse.json({
      error: 'Esta conversación no tiene una cuenta de WhatsApp asociada (es de antes de la migración a Cloud API). No se puede responder desde acá -- usa "Abrir en WhatsApp".',
    }, { status: 400 })
  }

  const { data: cuenta } = await supabaseService
    .from('whatsapp_cuentas')
    .select('*')
    .eq('phone_number_id', conv.phone_number_id)
    .maybeSingle()

  if (!cuenta) {
    return NextResponse.json({ error: `No se encontró la cuenta de WhatsApp (phone_number_id ${conv.phone_number_id}) en whatsapp_cuentas.` }, { status: 500 })
  }

  const telefono = conv.remote_jid.replace('@s.whatsapp.net', '').replace(/\D/g, '')

  try {
    await enviarTexto(cuenta as CuentaWhatsapp, telefono, texto)
  } catch (e) {
    console.error('[admin/fenix-conversaciones/mensaje] Error al enviar por Cloud API:', e)
    return NextResponse.json({ error: 'No se pudo enviar por WhatsApp' }, { status: 502 })
  }

  const historialPrevio = (conv.historial as MensajeHistorial[]) || []
  const nuevoHistorial = [...historialPrevio, { role: 'assistant' as const, content: texto }].slice(-30)

  const { error: upsertError } = await supabaseService
    .from('fenix_conversaciones')
    .update({ historial: nuevoHistorial, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (upsertError) {
    console.error('[admin/fenix-conversaciones/mensaje] Error al guardar historial:', upsertError)
    // El mensaje ya salió por WhatsApp -- no se le devuelve error al
    // admin por esto, solo queda sin guardar hasta el próximo mensaje.
  }

  return NextResponse.json({ ok: true, historial: nuevoHistorial })
}
