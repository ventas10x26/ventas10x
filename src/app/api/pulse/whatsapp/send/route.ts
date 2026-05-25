// src/app/api/pulse/whatsapp/send/route.ts
// Envía mensaje manual desde el dashboard del asesor

import { NextRequest, NextResponse } from 'next/server'

const EVO_URL = process.env.EVOLUTION_API_URL!
const EVO_KEY = process.env.EVOLUTION_API_KEY!

function slugEmail(email: string) {
  return email.replace('@', '_at_').replace(/\./g, '_').replace(/[^a-z0-9_]/gi, '').toLowerCase()
}

export async function POST(req: NextRequest) {
  try {
    const { email, phone, mensaje, tipo = 'text' } = await req.json()

    if (!email || !phone || !mensaje) {
      return NextResponse.json({ error: 'email, phone y mensaje requeridos' }, { status: 400 })
    }

    const instanceName = slugEmail(email)
    const numero = phone.replace(/[^0-9]/g, '')
    const remoteJid = numero.includes('@') ? numero : `${numero}@s.whatsapp.net`

    const res = await fetch(`${EVO_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
      body: JSON.stringify({ number: remoteJid, text: mensaje }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Error al enviar', detail: data }, { status: 500 })
    }

    return NextResponse.json({ ok: true, messageId: data.key?.id })
  } catch (e) {
    console.error('[pulse/whatsapp/send]', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error interno' }, { status: 500 })
  }
}
