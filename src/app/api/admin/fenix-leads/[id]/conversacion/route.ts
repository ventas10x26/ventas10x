// Ruta destino: src/app/api/admin/fenix-leads/[id]/conversacion/route.ts
//
// GET: trae el historial de WhatsApp guardado en fenix_conversaciones para
// el teléfono de este lead, para mostrarlo en el modal del admin.
// POST: le manda un mensaje de texto al lead desde el admin (bypassa la
// IA) y lo deja guardado en el mismo historial que ya usa el webhook --
// así la conversación se ve completa sin importar si respondió el bot o
// una persona del equipo.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!
const INSTANCE_NAME = 'fenix_cobranza'

type MensajeHistorial = { role: 'user' | 'assistant'; content: string }

async function obtenerTelefonoLead(id: string): Promise<string | null> {
  const { data } = await supabaseService.from('fenix_leads').select('telefono').eq('id', id).maybeSingle()
  return data?.telefono || null
}

function remoteJidDe(telefono: string): string {
  return `${telefono.replace(/\D/g, '')}@s.whatsapp.net`
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const telefono = await obtenerTelefonoLead(id)
  if (!telefono) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const { data, error } = await supabaseService
    .from('fenix_conversaciones')
    .select('historial, tipo, updated_at')
    .eq('instance_name', INSTANCE_NAME)
    .eq('remote_jid', remoteJidDe(telefono))
    .maybeSingle()

  if (error) {
    console.error('[admin/fenix-leads/conversacion] Error al leer:', error)
    return NextResponse.json({ error: 'No se pudo leer la conversación' }, { status: 500 })
  }

  return NextResponse.json({
    historial: (data?.historial as MensajeHistorial[]) || [],
    tipo: data?.tipo || null,
    updated_at: data?.updated_at || null,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await params
  const { mensaje } = await req.json()
  if (!mensaje || !String(mensaje).trim()) {
    return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
  }
  if (!EVO_URL || !EVO_KEY) {
    return NextResponse.json({ error: 'EVOLUTION_API_URL/EVOLUTION_API_KEY no configuradas' }, { status: 500 })
  }

  const telefono = await obtenerTelefonoLead(id)
  if (!telefono) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const remoteJid = remoteJidDe(telefono)
  const texto = String(mensaje).trim()

  const res = await fetch(`${EVO_URL}/message/sendText/${INSTANCE_NAME}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: JSON.stringify({ number: remoteJid, text: texto }),
  })
  if (!res.ok) {
    const detalle = await res.text().catch(() => '')
    console.error('[admin/fenix-leads/conversacion] Evolution API rechazó el envío:', res.status, detalle)
    return NextResponse.json({ error: `No se pudo enviar por WhatsApp (${res.status})` }, { status: 502 })
  }

  const { data: filaActual } = await supabaseService
    .from('fenix_conversaciones')
    .select('historial, tipo')
    .eq('instance_name', INSTANCE_NAME)
    .eq('remote_jid', remoteJid)
    .maybeSingle()

  const historialPrevio = (filaActual?.historial as MensajeHistorial[]) || []
  const nuevoHistorial = [...historialPrevio, { role: 'assistant' as const, content: texto }].slice(-30)

  const { error: upsertError } = await supabaseService.from('fenix_conversaciones').upsert({
    instance_name: INSTANCE_NAME,
    remote_jid: remoteJid,
    tipo: filaActual?.tipo || 'lead',
    historial: nuevoHistorial,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'instance_name,remote_jid' })

  if (upsertError) {
    console.error('[admin/fenix-leads/conversacion] Error al guardar historial:', upsertError)
    // El mensaje ya salió por WhatsApp -- no se le devuelve error al usuario por esto,
    // solo queda sin guardar en el historial hasta el próximo mensaje.
  }

  return NextResponse.json({ ok: true, historial: nuevoHistorial })
}
