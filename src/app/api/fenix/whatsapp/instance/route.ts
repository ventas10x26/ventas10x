// Ruta destino: src/app/api/fenix/whatsapp/instance/route.ts
// Adaptación de src/app/api/pulse/whatsapp/instance/route.ts para Fenix.
// Diferencia clave: Fenix no tiene un email por vendedor -- es un solo
// agente de cobro para todo el equipo, así que la instancia de WhatsApp
// en Evolution API es única y fija (INSTANCE_NAME), en vez de derivarse
// de un email por usuario. Gate por admin, igual que /api/admin/fenix-agente.

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-helpers'

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://ventas10x.co'
  return `${appUrl}/api/fenix/whatsapp/webhook/${INSTANCE_NAME}/messages-upsert`
}

// ── Actualizar webhook de instancia existente a base64: false ─────────────────
async function corregirWebhook() {
  try {
    const { data: current } = await evoFetch(`/webhook/find/${INSTANCE_NAME}`)
    if (current?.webhookBase64 === true) {
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
  let ownerJid = data?.instance?.ownerJid || data?.ownerJid || null
  let profileName = data?.instance?.profileName || data?.profileName || null

  if (state === 'open' && !ownerJid) {
    const { data: fetchData } = await evoFetch(`/instance/fetchInstances/${INSTANCE_NAME}`)
    ownerJid = fetchData?.instance?.ownerJid || fetchData?.ownerJid || null
    profileName = fetchData?.instance?.profileName || fetchData?.profileName || profileName
  }

  const phone = ownerJid?.replace('@s.whatsapp.net', '') || profileName || null

  if (state === 'open') {
    await corregirWebhook()
    return NextResponse.json({ connected: true, status: 'connected', instanceName: INSTANCE_NAME, phone, profileName })
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
