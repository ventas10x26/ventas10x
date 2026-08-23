// Ruta destino: src/app/api/cron/pulse-databridge-followup/route.ts
//
// Evalúa la secuencia de onboarding de DataBridge (ver onboarding-databridge-email.ts) y
// dispara el touch que corresponda. Corre diario vía Vercel Cron (ver vercel.json).
//
// No se mete en /api/cron/onboarding-reminder (el cron ya existente) porque ese recorre
// `profiles` — cuentas ya creadas del producto de vendedores — y estos leads todavía NO
// tienen cuenta. Es un dominio de datos distinto (pulse_contactos, sin FK a profiles), así
// que es un cron aparte, mismo criterio que ya separa /api/fenix/whatsapp/followup del resto.
//
// Antes de mandar nada, se fija si el lead ya convirtió: si su email ya corresponde a una
// cuenta con al menos un proyecto en pulse_databridge_proyectos, se corta la secuencia sin
// enviar más correos — el objetivo ya se cumplió, insistir ahí sería puro ruido.
//
// Elegibilidad: pulse_contactos.onboarding_next_at <= ahora, unsubscribed_at es null,
// onboarding_stage en (1, 2) -- stage 1 recibe el touch 2, stage 2 recibe el touch 3 (el
// último; después queda onboarding_next_at en null y no hay más).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarOnboardingDatabridge, type OrigenOnboarding } from '@/lib/pulse/onboarding-databridge-email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Cadencia de la secuencia, en días desde el touch anterior.
const DIAS_HASTA_TOUCH_3 = 4 // sumados a los 3 del touch 2 → ~7 días desde la captura

interface ContactoElegible {
  id: string
  nombre: string
  email: string
  fuente: string
  onboarding_stage: number
}

type ResultadoEnvio = {
  id: string
  email: string
  estado: 'enviado' | 'convertido' | 'omitido' | 'error'
  touch?: 2 | 3
  razon?: string
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: elegibles, error: errQuery } = await supabase
    .from('pulse_contactos')
    .select('id, nombre, email, fuente, onboarding_stage')
    .lte('onboarding_next_at', new Date().toISOString())
    .is('unsubscribed_at', null)
    .in('onboarding_stage', [1, 2])
    .limit(200)

  if (errQuery) {
    console.error('[cron/pulse-databridge-followup] error consultando elegibles:', errQuery)
    return NextResponse.json({ error: errQuery.message }, { status: 500 })
  }

  if (!elegibles?.length) {
    return NextResponse.json({ message: 'Nadie elegible hoy', procesados: 0 })
  }

  // Un solo listUsers para todo el lote, en vez de una consulta por lead — mismo motivo que
  // en /api/pulse/admin/proyectos: la API de admin no tiene "buscar por email" directo.
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const idPorEmail = new Map((usersData?.users || []).map(u => [(u.email || '').toLowerCase(), u.id]))

  const { data: proyectos } = await supabase.from('pulse_databridge_proyectos').select('user_id')
  const usuariosConProyecto = new Set((proyectos || []).map(p => p.user_id as string))

  const resultados: ResultadoEnvio[] = []

  for (const contacto of elegibles as ContactoElegible[]) {
    try {
      const userId = idPorEmail.get(contacto.email.toLowerCase())
      const yaConvirtio = !!userId && usuariosConProyecto.has(userId)

      if (yaConvirtio) {
        await supabase.from('pulse_contactos').update({ onboarding_next_at: null }).eq('id', contacto.id)
        resultados.push({ id: contacto.id, email: contacto.email, estado: 'convertido' })
        continue
      }

      const origen: OrigenOnboarding = contacto.fuente === 'demo_panel' ? 'demo' : 'ebook'
      const siguienteStage = contacto.onboarding_stage === 1 ? 2 : 3
      const touch = siguienteStage as 2 | 3

      await enviarOnboardingDatabridge({ nombre: contacto.nombre, email: contacto.email, origen }, touch)

      // stage 3 es el último: no queda onboarding_next_at, la secuencia se corta sola.
      const proximaFecha = siguienteStage === 3
        ? null
        : new Date(Date.now() + DIAS_HASTA_TOUCH_3 * 24 * 60 * 60 * 1000).toISOString()

      await supabase
        .from('pulse_contactos')
        .update({ onboarding_stage: siguienteStage, onboarding_next_at: proximaFecha })
        .eq('id', contacto.id)

      resultados.push({ id: contacto.id, email: contacto.email, estado: 'enviado', touch })
    } catch (e) {
      console.error(`[cron/pulse-databridge-followup] error con ${contacto.email}:`, e)
      resultados.push({
        id: contacto.id,
        email: contacto.email,
        estado: 'error',
        razon: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return NextResponse.json({
    message: `Procesados ${elegibles.length} contactos`,
    enviados: resultados.filter(r => r.estado === 'enviado').length,
    convertidos: resultados.filter(r => r.estado === 'convertido').length,
    errores: resultados.filter(r => r.estado === 'error').length,
    detalle: resultados,
  })
}
