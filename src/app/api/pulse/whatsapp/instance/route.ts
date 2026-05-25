// src/app/api/pulse/whatsapp/instance/route.ts
// Crea y gestiona instancias de WhatsApp por asesor via Evolution API

import { NextRequest, NextResponse } from 'next/server'

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!

async function evoFetch(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${EVO_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVO_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  return { ok: res.ok, status: res.status, data }
}

function slugEmail(email: string) {
  return email.replace('@', '_at_').replace(/\./g, '_').replace(/[^a-z0-9_]/gi, '').toLowerCase()
}

// GET /api/pulse/whatsapp/instance?email=asesor@gmail.com
// Retorna estado de la instancia (conectado, QR, desconectado)
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })

  const instanceName = slugEmail(email)

  // Verificar si la instancia existe
  const { ok, data } = await evoFetch(`/instance/fetchInstances?instanceName=${instanceName}`)

  if (!ok || !data || (Array.isArray(data) && data.length === 0)) {
    return NextResponse.json({ connected: false, status: 'no_instance', instanceName })
  }

  const instance = Array.isArray(data) ? data[0] : data
  const state = instance?.instance?.state || instance?.state || 'unknown'

  if (state === 'open') {
    return NextResponse.json({ connected: true, status: 'connected', instanceName, phone: instance?.instance?.profileName })
  }

  // Si no está conectado, obtener QR
  if (state === 'connecting' || state === 'close') {
    const { data: qrData } = await evoFetch(`/instance/connect/${instanceName}`)
    return NextResponse.json({
      connected: false,
      status: 'qr_ready',
      instanceName,
      qr: qrData?.base64 || qrData?.qrcode?.base64 || null,
      pairingCode: qrData?.code || null,
    })
  }

  return NextResponse.json({ connected: false, status: state, instanceName })
}

// POST /api/pulse/whatsapp/instance
// Crea una nueva instancia o reconecta
export async function POST(req: NextRequest) {
  const { email, webhookUrl } = await req.json()
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })

  const instanceName = slugEmail(email)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsemotor.co'
  const webhook = webhookUrl || `${appUrl}/api/pulse/whatsapp/webhook`

  // Crear instancia
  const { ok, data } = await evoFetch('/instance/create', 'POST', {
    instanceName,
    integration: 'WHATSAPP-BAILEYS',
    qrcode: true,
    webhook: {
      url: webhook,
      byEvents: true,
      base64: true,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
    },
  })

  if (!ok && !data?.hash) {
    // La instancia puede ya existir — intentar conectar
    const { data: connectData } = await evoFetch(`/instance/connect/${instanceName}`)
    return NextResponse.json({
      ok: true,
      instanceName,
      qr: connectData?.base64 || connectData?.qrcode?.base64 || null,
      pairingCode: connectData?.code || null,
      status: 'reconnecting',
    })
  }

  // Obtener QR de la instancia recién creada
  const { data: connectData } = await evoFetch(`/instance/connect/${instanceName}`)

  return NextResponse.json({
    ok: true,
    instanceName,
    qr: connectData?.base64 || connectData?.qrcode?.base64 || null,
    pairingCode: connectData?.code || null,
    status: 'created',
  })
}

// DELETE /api/pulse/whatsapp/instance?email=asesor@gmail.com
// Desconecta y elimina la instancia
export async function DELETE(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })

  const instanceName = slugEmail(email)
  await evoFetch(`/instance/logout/${instanceName}`, 'DELETE')
  await evoFetch(`/instance/delete/${instanceName}`, 'DELETE')

  return NextResponse.json({ ok: true, instanceName })
}
