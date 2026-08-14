// Ruta destino: src/app/api/admin/fenix-leads-agente/followup-test/route.ts
// Dispara manualmente el follow-up de leads (misma lógica exacta del cron
// diario) desde el botón "Probar ahora" del panel. Ejecución real, no una
// simulación -- si hay leads elegibles, les llega el mensaje de verdad.

import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { ejecutarFollowupsLeads } from '@/lib/fenix-followup'

export async function POST() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const resultado = await ejecutarFollowupsLeads()
  return NextResponse.json({ ok: true, ...resultado })
}
