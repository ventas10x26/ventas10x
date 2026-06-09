// src/app/api/pulse/bold/integrity/route.ts
// Genera el hash de integridad Bold en el servidor (nunca exponer llave secreta al frontend)
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const BOLD_SECRET = process.env.BOLD_SECRET_KEY! // 4Z2fP3VeHhzUT_rbXb4JTw

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, currency } = await req.json() as {
      orderId: string
      amount: number
      currency: string
    }

    if (!orderId || !amount || !currency) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    // Formato Bold: {orderId}{amount}{currency}{llaveSecreta}
    const cadena = `${orderId}${amount}${currency}${BOLD_SECRET}`
    const hash   = crypto.createHash('sha256').update(cadena, 'utf8').digest('hex')

    return NextResponse.json({ integrity: hash, orderId })
  } catch (err) {
    console.error('[bold/integrity]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
