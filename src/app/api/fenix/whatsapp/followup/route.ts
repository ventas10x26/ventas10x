// Ruta destino: src/app/api/fenix/whatsapp/followup/route.ts
//
// Cron diario (ver vercel.json) que revisa las conversaciones de leads
// comerciales que nunca respondieron tras la autorespuesta inicial y las
// mueve por dos etapas -- envía el follow-up, y si tampoco responde a eso,
// marca el lead como "perdido". Lógica real en src/lib/fenix-followup.ts,
// compartida con el botón "Probar ahora" del panel admin.
//
// Protegido igual que el cron existente (src/app/api/cron/onboarding-reminder):
// exige el header Authorization: Bearer $CRON_SECRET que Vercel Cron ya
// manda automáticamente para cualquier cron definido en vercel.json.

import { NextRequest, NextResponse } from 'next/server'
import { ejecutarFollowupsLeads } from '@/lib/fenix-followup'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resultado = await ejecutarFollowupsLeads()
  return NextResponse.json({ ok: true, ...resultado })
}
