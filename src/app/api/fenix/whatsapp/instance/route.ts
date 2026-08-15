// Ruta destino: src/app/api/fenix/whatsapp/instance/route.ts
// Adaptación de src/app/api/pulse/whatsapp/instance/route.ts para Fenix.
// Diferencia clave: Fenix no tiene un email por vendedor -- es un solo
// agente de cobro para todo el equipo, así que la instancia de WhatsApp
// en Evolution API es única y fija (INSTANCE_NAME), en vez de derivarse
// de un email por usuario. Gate por admin, igual que /api/admin/fenix-agente.

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!
const INSTANCE_NAME = 'fenix_cobranza'

async function evoFetch(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${EVO_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

function webhookUrl() {
  // app.consultoresfenix.com no redirige (a diferencia de ventas10x.co sin
  // "www", que hace un 307 a www.ventas10x.co -- un webhook que manda POST
  // y no reenvía bien tras esa redirección pierde el mensaje en silencio,
  // que es justo lo que le pasaba a las respuestas entrantes de los leads).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://app.consultoresfenix.com'
  return `${appUrl}/api/fenix/whatsapp/webhook/${INSTANCE_NAME}/messages-upsert`
}

// ── Corregir webhook de instancia existente (base64 y/o URL desactualizada) ───
async function corregirWebhook() {
  try {
    const { data: current } = await evoFetch(`/webhook/find/${INSTANCE_NAME}`)
    const urlDesactualizada = current?.url && current.url !== webhookUrl()
    const base64Mal = current?.webhookBase64 === true
    if (urlDesactualizada || base64Mal) {
      await evoFetch(`/webhook/set/${INSTANCE_NAME}`, 'POST', {
        webhook: {
          url: webhookUrl(),
          enabled: true,
          webhookByEvents: true,
          webhookBase64: false,
          base64: false,
          byEvents: true,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
        },
      })
    }
  } catch (e) {
    console.error('[fenix instance] corregirWebhook error:', e)
  }
}

// GET /api/fenix/whatsapp/instance — estado de la instancia única de Fenix
export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { ok, data } = await evoFetch(`/instance/connectionState/${INSTANCE_NAME}`)

  if (!ok || !data) {
    return NextResponse.json({ connected: false, status: 'no_instance', instanceName: INSTANCE_NAME })
  }

  const state = data?.instance?.state || data?.state || 'unknown'
  let ownerJid = data?.instance?.ownerJid || data?.instance?.owner || data?.ownerJid || data?.owner || null
  let profileName = data?.instance?.profileName || data?.profileName || null

  if (state === 'open' && !ownerJid) {
    // Este servidor de Evolution API no soporta /instance/fetchInstances/{nombre}
    // (devuelve 404) -- solo el endpoint sin nombre, que lista todas las
    // instancias y hay que filtrar del lado del cliente.
    const { data: fetchData } = await evoFetch('/instance/fetchInstances')
    const entry = Array.isArray(fetchData)
      ? fetchData.find((it: Record<string, unknown>) => {
          const inst = it?.instance as Record<string, unknown> | undefined
          return (inst?.instanceName || it?.instanceName || it?.name) === INSTANCE_NAME
        })
      : fetchData
    const entryInstance = entry?.instance as Record<string, unknown> | undefined
    ownerJid = (entryInstance?.ownerJid as string) || (entryInstance?.owner as string) || (entry?.ownerJid as string) || (entry?.owner as string) || null
    profileName = (entryInstance?.profileName as string) || (entry?.profileName as string) || profileName
  }

  let phone = ownerJid?.replace('@s.whatsapp.net', '').replace(/\D/g, '') || profileName || null
  let debugRaw: unknown = undefined

  if (state === 'open' && !phone) {
    try {
      const { data: fila } = await supabaseAdmin
        .from('fenix_agente')
        .select('whatsapp')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (fila?.whatsapp) phone = fila.whatsapp
    } catch (e) {
      console.error('[fenix instance] fallback whatsapp guardado error:', e)
    }
  }

  if (state === 'open' && !phone) {
    // Diagnóstico: si tras todos los intentos seguimos sin número, exponemos
    // la respuesta cruda de Evolution API para poder ver exactamente qué
    // formato usa este servidor y ajustar la extracción del dato.
    const { data: fetchData } = await evoFetch('/instance/fetchInstances')
    debugRaw = { connectionState: data, fetchInstances: fetchData }
  }

  if (state === 'open') {
    await corregirWebhook()
    return NextResponse.json({
      connected: true, status: 'connected', instanceName: INSTANCE_NAME, phone, profileName,
      ...(debugRaw !== undefined ? { debug: debugRaw } : {}),
    })
  }

  const { data: qrData } = await evoFetch(`/instance/connect/${INSTANCE_NAME}`)
  return NextResponse.json({
    connected: false,
    status: 'qr_ready',
    instanceName: INSTANCE_NAME,
    qr: qrData?.base64 || qrData?.qrcode?.base64 || null,
    pairingCode: qrData?.code || null,
  })
}

// POST /api/fenix/whatsapp/instance — crear o reconectar la instancia de Fenix
export async function POST() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { ok, data } = await evoFetch('/instance/create', 'POST', {
    instanceName: INSTANCE_NAME,
    integration: 'WHATSAPP-BAILEYS',
    qrcode: true,
    webhook: {
      url: webhookUrl(),
      byEvents: true,
      base64: false,
      webhookByEvents: true,
      webhookBase64: false,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
    },
  })

  if (!ok && !data?.hash) {
    // Ya existe -- corregir webhook y reconectar
    await corregirWebhook()
    const { data: connectData } = await evoFetch(`/instance/connect/${INSTANCE_NAME}`)
    return NextResponse.json({
      ok: true,
      instanceName: INSTANCE_NAME,
      qr: connectData?.base64 || connectData?.qrcode?.base64 || null,
      pairingCode: connectData?.code || null,
      status: 'reconnecting',
    })
  }

  const { data: connectData } = await evoFetch(`/instance/connect/${INSTANCE_NAME}`)
  return NextResponse.json({
    ok: true,
    instanceName: INSTANCE_NAME,
    qr: connectData?.base64 || connectData?.qrcode?.base64 || null,
    pairingCode: connectData?.code || null,
    status: 'created',
  })
}

// DELETE /api/fenix/whatsapp/instance — desconectar el WhatsApp del equipo de cobro
export async function DELETE() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  await evoFetch(`/instance/logout/${INSTANCE_NAME}`, 'DELETE')
  await evoFetch(`/instance/delete/${INSTANCE_NAME}`, 'DELETE')

  return NextResponse.json({ ok: true, instanceName: INSTANCE_NAME })
}
