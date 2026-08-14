// Ruta destino: src/app/api/admin/fenix-leads/[id]/autorespuesta/route.ts
// Dispara manualmente la autorespuesta de WhatsApp (bienvenida + entregable
// + pregunta de cierre) para un lead ya guardado -- desde el botón del
// modal de detalle en el admin. Útil para leads que no la recibieron
// automáticamente (p. ej. los importados en bloque desde el CSV de Meta
// Ads) o para reenviarla si algo falló la primera vez. A diferencia del
// flujo automático de /api/fenix-contacto y /api/fenix/whatsapp/webhook,
// este envío se fuerza (forzar: true) e ignora el interruptor "activo" del
// panel de leads-agente -- si un admin lo pide a mano, se envía.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { enviarAutorespuestaLead, marcarAutorespuestaEnviada, marcarLeadContactadoPorId, type LeadFenix } from '@/lib/fenix-lead-pipeline'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params

  const { data: fila, error } = await supabaseService
    .from('fenix_leads')
    .select('empresa, nombre, email, telefono, mensaje')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[admin/fenix-leads/autorespuesta] Error al leer el lead:', error)
    return NextResponse.json({ error: 'No se pudo leer el lead' }, { status: 500 })
  }
  if (!fila) {
    return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
  }
  if (!fila.telefono?.trim()) {
    return NextResponse.json({ error: 'Este lead no tiene teléfono registrado' }, { status: 400 })
  }

  const lead: LeadFenix = {
    empresa: fila.empresa || '',
    nombre: fila.nombre || '',
    email: fila.email || '',
    telefono: fila.telefono,
    mensaje: fila.mensaje || '',
  }

  try {
    const enviado = await enviarAutorespuestaLead(lead, { forzar: true })
    if (!enviado) {
      // No debería pasar con forzar:true, pero por si acaso -- ver enviarAutorespuestaLead
      return NextResponse.json({ error: 'El agente de leads no está configurado correctamente' }, { status: 500 })
    }
    const enviadaEn = new Date().toISOString()
    await marcarAutorespuestaEnviada(id, enviado.mensajeCompleto)
    await marcarLeadContactadoPorId(id)

    const { data: filaActualizada } = await supabaseService
      .from('fenix_leads')
      .select('etapa')
      .eq('id', id)
      .maybeSingle()

    return NextResponse.json({
      ok: true,
      autorespuesta_enviada_at: enviadaEn,
      autorespuesta_mensaje: enviado.mensajeCompleto,
      etapa: filaActualizada?.etapa,
    })
  } catch (e) {
    console.error('[admin/fenix-leads/autorespuesta] Error al enviar:', e)
    const mensaje = e instanceof Error ? e.message : 'No se pudo enviar la autorespuesta'
    return NextResponse.json({ error: mensaje }, { status: 502 })
  }
}
