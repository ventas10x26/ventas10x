// src/app/api/pulse/whatsapp/instance/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function evoFetch(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${EVO_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

function slugEmail(email: string) {
  return email.replace('@', '_at_').replace(/\./g, '_').replace(/[^a-z0-9_]/gi, '').toLowerCase()
}

async function persistirNumeroConectado(email: string, phone: string) {
  try {
    const numero = phone.replace(/\D/g, '')
    const numeroFormateado = numero.startsWith('57') ? `+${numero}` : `+57${numero}`

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.find(u => u.email === email)

    if (user) {
      await supabaseAdmin
        .from('profiles')
        .update({ whatsapp: numeroFormateado })
        .eq('id', user.id)
      console.log('[instance] whatsapp guardado en profiles:', numeroFormateado)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('id, metadata')
      .ilike('email', email)
      .maybeSingle()

    if (row) {
      const meta = { ...(row.metadata || {}), whatsapp: numeroFormateado }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from('pulse_waitlist') as any)
        .update({ metadata: meta })
        .eq('id', row.id)
      console.log('[instance] whatsapp guardado en pulse_waitlist:', numeroFormateado)
    }
  } catch (e) {
    console.error('[instance] persistirNumeroConectado error:', e)
  }
}

// ── Actualizar webhook de instancia existente a base64: false ─────────────────
async function corregirWebhook(instanceName: string, webhookUrl: string) {
  try {
    const { data: current } = await evoFetch(`/webhook/find/${instanceName}`)
    if (current?.webhookBase64 === true) {
      await evoFetch(`/webhook/set/${instanceName}`, 'POST', {
        webhook: {
          url: webhookUrl,
          enabled: true,
          webhookByEvents: true,
          webhookBase64: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
        },
      })
      console.log('[instance] webhook corregido a base64: false para:', instanceName)
    }
  } catch (e) {
    console.error('[instance] corregirWebhook error:', e)
  }
}

// GET /api/pulse/whatsapp/instance?email=asesor@gmail.com
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })

  const instanceName = slugEmail(email)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsemotor.co'
  const webhookUrl = `${appUrl}/api/pulse/whatsapp/webhook/${instanceName}/messages-upsert`

  const { ok, data } = await evoFetch(`/instance/connectionState/${instanceName}`)

  if (!ok || !data) {
    return NextResponse.json({ connected: false, status: 'no_instance', instanceName })
  }

  const state = data?.instance?.state || data?.state || 'unknown'
  let ownerJid = data?.instance?.ownerJid || data?.ownerJid || null
  let profileName = data?.instance?.profileName || data?.profileName || null

  if (state === 'open' && !ownerJid) {
    const { data: fetchData } = await evoFetch(`/instance/fetchInstances/${instanceName}`)
    ownerJid = fetchData?.instance?.ownerJid || fetchData?.ownerJid || null
    profileName = fetchData?.instance?.profileName || fetchData?.profileName || profileName
    console.log('[instance GET] fetchInstances data:', JSON.stringify(fetchData))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let phone = ownerJid?.replace('@s.whatsapp.net', '') || profileName || null
  if (state === 'open' && !phone) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: wlRow } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('metadata')
      .ilike('email', email)
      .maybeSingle()
    const savedPhone = wlRow?.metadata?.whatsapp
    if (savedPhone) phone = savedPhone
    console.log('[instance GET] phone desde pulse_waitlist:', phone)
  }

  if (state === 'open') {
    if (phone) await persistirNumeroConectado(email, phone)

    // Corregir webhook si aún tiene base64: true
    await corregirWebhook(instanceName, webhookUrl)

    return NextResponse.json({
      connected: true,
      status: 'connected',
      instanceName,
      phone,
      profileName,
    })
  }

  const { data: qrData } = await evoFetch(`/instance/connect/${instanceName}`)
  return NextResponse.json({
    connected: false,
    status: 'qr_ready',
    instanceName,
    qr: qrData?.base64 || qrData?.qrcode?.base64 || null,
    pairingCode: qrData?.code || null,
  })
}

// POST /api/pulse/whatsapp/instance — Crear o reconectar instancia
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })

  const instanceName = slugEmail(email)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsemotor.co'
  const webhookUrl = `${appUrl}/api/pulse/whatsapp/webhook/${instanceName}/messages-upsert`

  const { ok, data } = await evoFetch('/instance/create', 'POST', {
    instanceName,
    integration: 'WHATSAPP-BAILEYS',
    qrcode: true,
    webhook: {
      url: webhookUrl,
      byEvents: true,
      base64: false,          // ← fix: era true, causaba que los mensajes llegaran codificados
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
    },
  })

  if (!ok && !data?.hash) {
    // Ya existe — corregir webhook y reconectar
    await corregirWebhook(instanceName, webhookUrl)
    const { data: connectData } = await evoFetch(`/instance/connect/${instanceName}`)
    return NextResponse.json({
      ok: true,
      instanceName,
      qr: connectData?.base64 || connectData?.qrcode?.base64 || null,
      pairingCode: connectData?.code || null,
      status: 'reconnecting',
    })
  }

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
export async function DELETE(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })

  const instanceName = slugEmail(email)
  await evoFetch(`/instance/logout/${instanceName}`, 'DELETE')
  await evoFetch(`/instance/delete/${instanceName}`, 'DELETE')

  return NextResponse.json({ ok: true, instanceName })
}
