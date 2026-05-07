// Ruta destino: src/app/api/dashboard/metricas/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
  const inicioSemana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const mesAnteriorInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString()
  const mesAnteriorFin = new Date(ahora.getFullYear(), ahora.getMonth(), 0).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabaseAdmin as any

  const [
    leadsTotal,
    leadsMes,
    leadsMesAnterior,
    leadsSemana,
    leadsPorEtapa,
    campanasTotal,
    campanasMes,
    emailsEnviados,
    clicksTotal,
    clicksLanding,
    clicksWa,
    contactosTotal,
    contactosMes,
    visitasTotal,
    visitasMes,
  ] = await Promise.all([
    // Leads
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('vendedor_id', user.id),
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('vendedor_id', user.id).gte('created_at', inicioMes),
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('vendedor_id', user.id).gte('created_at', mesAnteriorInicio).lte('created_at', mesAnteriorFin),
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('vendedor_id', user.id).gte('created_at', inicioSemana),
    sb.from('leads').select('etapa').eq('vendedor_id', user.id),
    // Campañas
    sb.from('vendedor_campanas').select('id', { count: 'exact', head: true }).eq('vendedor_id', user.id),
    sb.from('vendedor_campanas').select('id', { count: 'exact', head: true }).eq('vendedor_id', user.id).gte('created_at', inicioMes),
    sb.from('vendedor_campanas').select('total_enviados').eq('vendedor_id', user.id).eq('estado', 'enviada'),
    admin.from('vendedor_campana_clicks').select('id', { count: 'exact', head: true }).in('campana_id',
      (await sb.from('vendedor_campanas').select('id').eq('vendedor_id', user.id)).data?.map((c: { id: string }) => c.id) || []
    ),
    admin.from('vendedor_campana_clicks').select('id', { count: 'exact', head: true }).eq('tipo', 'landing').in('campana_id',
      (await sb.from('vendedor_campanas').select('id').eq('vendedor_id', user.id)).data?.map((c: { id: string }) => c.id) || []
    ),
    admin.from('vendedor_campana_clicks').select('id', { count: 'exact', head: true }).eq('tipo', 'whatsapp').in('campana_id',
      (await sb.from('vendedor_campanas').select('id').eq('vendedor_id', user.id)).data?.map((c: { id: string }) => c.id) || []
    ),
    // Contactos
    sb.from('vendedor_contactos').select('id', { count: 'exact', head: true }).eq('vendedor_id', user.id).eq('activo', true),
    sb.from('vendedor_contactos').select('id', { count: 'exact', head: true }).eq('vendedor_id', user.id).gte('created_at', inicioMes),
    // Visitas landing
    sb.from('landing_visitas').select('id', { count: 'exact', head: true }).eq('vendedor_id', user.id),
    sb.from('landing_visitas').select('id', { count: 'exact', head: true }).eq('vendedor_id', user.id).gte('created_at', inicioMes),
  ])

  // Leads por etapa
  const etapas = { nuevo: 0, contactado: 0, interesado: 0, cerrado: 0 }
  ;(leadsPorEtapa.data || []).forEach((l: { etapa: string }) => {
    if (l.etapa in etapas) etapas[l.etapa as keyof typeof etapas]++
  })

  // Total emails enviados
  const totalEmailsEnviados = (emailsEnviados.data || []).reduce((acc: number, c: { total_enviados: number }) => acc + (c.total_enviados || 0), 0)

  // CTR global
  const ctr = totalEmailsEnviados > 0 ? Math.round((clicksTotal.count || 0) / totalEmailsEnviados * 100) : 0

  // Tendencia leads mes vs mes anterior
  const tendenciaLeads = leadsMesAnterior.count > 0
    ? Math.round(((leadsMes.count || 0) - (leadsMesAnterior.count || 0)) / leadsMesAnterior.count * 100)
    : 0

  return NextResponse.json({
    leads: {
      total: leadsTotal.count || 0,
      este_mes: leadsMes.count || 0,
      esta_semana: leadsSemana.count || 0,
      tendencia_mes: tendenciaLeads,
      por_etapa: etapas,
    },
    campanas: {
      total: campanasTotal.count || 0,
      este_mes: campanasMes.count || 0,
      emails_enviados: totalEmailsEnviados,
      clicks_total: clicksTotal.count || 0,
      clicks_landing: clicksLanding.count || 0,
      clicks_wa: clicksWa.count || 0,
      ctr,
    },
    contactos: {
      total: contactosTotal.count || 0,
      este_mes: contactosMes.count || 0,
    },
    landing: {
      visitas_total: visitasTotal.count || 0,
      visitas_mes: visitasMes.count || 0,
    },
  })
}
