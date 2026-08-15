// Ruta destino: src/app/admin/fenix/page.tsx
// Panel de leads y pipeline de Fenix Consultores. Fenix no es un tenant de
// Ventas10x (no tiene org_id ni vendedor_id) -- por eso vive bajo /admin,
// igual que /admin/pagos, y no bajo /dashboard, que filtra por org activa.
// Las visitas de la landing (GA4 + Clarity) tienen su propia página en
// /admin/fenix/visitas -- antes vivían acá mezcladas con el pipeline.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { FenixLeadsClient } from '@/components/admin/FenixLeadsClient'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export default async function AdminFenixPage() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    // /dashboard no existe bajo el dominio de Fenix (el middleware lo
    // reescribiría a algo inexistente): sin sesión ahí, lo correcto es
    // pedir login, no mandarlo a una ruta de otro producto.
    const host = (await headers()).get('host') || ''
    const esFenix = host.includes('app.consultoresfenix.com') || host.includes('fenix.localhost')
    redirect(esFenix ? '/auth/login' : '/dashboard')
  }

  const { data: leads } = await supabaseService
    .from('fenix_leads')
    .select('*')
    .order('created_at', { ascending: false })

  // Estado de la IA (pausada o no) por conversación de WhatsApp -- vive en
  // fenix_conversaciones, no en fenix_leads, así que se cruza acá por
  // teléfono (últimos 8 dígitos, igual que el resto de matches por
  // teléfono en el proyecto) para mostrarlo/filtrarlo en el pipeline sin
  // que el cliente tenga que pedirlo lead por lead.
  const { data: conversaciones } = await supabaseService
    .from('fenix_conversaciones')
    .select('remote_jid, bot_pausado')
    .eq('instance_name', 'fenix_cobranza')
    .eq('tipo', 'lead')

  const pausaPorSufijo = new Map<string, boolean>()
  for (const conv of conversaciones || []) {
    const digitos = String(conv.remote_jid || '').replace(/\D/g, '')
    if (digitos.length >= 8) pausaPorSufijo.set(digitos.slice(-8), conv.bot_pausado === true)
  }

  const leadsConEstadoAgente = (leads || []).map((lead) => {
    const digitos = String(lead.telefono || '').replace(/\D/g, '')
    const sufijo = digitos.slice(-8)
    const agentePausado = digitos.length >= 8 && pausaPorSufijo.has(sufijo) ? pausaPorSufijo.get(sufijo)! : null
    return { ...lead, agente_pausado: agentePausado }
  })

  return <FenixLeadsClient initialLeads={leadsConEstadoAgente} />
}
