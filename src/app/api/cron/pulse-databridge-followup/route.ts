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
// Se agrupa por email (ver onboarding-dedup.ts) antes de enviar: la misma persona puede
// tener varias filas elegibles el mismo día (probó el gate dos veces, etc.) y sin agrupar
// recibiría el mismo touch repetido en el mismo envío.
//
// Elegibilidad: pulse_contactos.onboarding_next_at <= ahora, unsubscribed_at es null,
// onboarding_stage en (1, 2) -- stage 1 recibe el touch 2, stage 2 recibe el touch 3 (el
// último; después queda onboarding_next_at en null y no hay más).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarOnboardingDatabridge, type OrigenOnboarding } from '@/lib/pulse/onboarding-databridge-email'
import { agruparContactosPorEmail } from '@/lib/pulse/onboarding-dedup'

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
  email: string
  estado: 'enviado' | 'convertido' | 'error'
  touch?: 2 | 3
  filas?: number
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
    .order('created_at', { ascending: false })
    .limit(500)

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

  // Distintas filas del mismo email pueden estar en distinto stage (una quedó en 1, otra ya
  // avanzó a 2 en un envío anterior); se procesa por el stage MÁS AVANZADO del grupo, así el
  // touch enviado nunca repite uno que esa persona ya recibió por otra fila.
  const grupos = agruparContactosPorEmail(elegibles as ContactoElegible[])
  const stageMaxPorEmail = new Map<string, number>()
  ;(elegibles as ContactoElegible[]).forEach(c => {
    const email = c.email.trim().toLowerCase()
    stageMaxPorEmail.set(email, Math.max(stageMaxPorEmail.get(email) ?? 0, c.onboarding_stage))
  })

  const resultados: ResultadoEnvio[] = []

  for (const grupo of grupos) {
    try {
      const userId = idPorEmail.get(grupo.email)
      const yaConvirtio = !!userId && usuariosConProyecto.has(userId)

      if (yaConvirtio) {
        await supabase.from('pulse_contactos').update({ onboarding_next_at: null }).in('id', grupo.ids)
        resultados.push({ email: grupo.email, estado: 'convertido', filas: grupo.ids.length })
        continue
      }

      const stageActual = stageMaxPorEmail.get(grupo.email) ?? 1
      const origen: OrigenOnboarding = grupo.fuente === 'demo_panel' ? 'demo' : 'ebook'
      const siguienteStage = stageActual === 1 ? 2 : 3
      const touch = siguienteStage as 2 | 3

      await enviarOnboardingDatabridge({ nombre: grupo.nombre, email: grupo.email, origen }, touch)

      // stage 3 es el último: no queda onboarding_next_at, la secuencia se corta sola.
      const proximaFecha = siguienteStage === 3
        ? null
        : new Date(Date.now() + DIAS_HASTA_TOUCH_3 * 24 * 60 * 60 * 1000).toISOString()

      await supabase
        .from('pulse_contactos')
        .update({ onboarding_stage: siguienteStage, onboarding_next_at: proximaFecha })
        .in('id', grupo.ids)

      resultados.push({ email: grupo.email, estado: 'enviado', touch, filas: grupo.ids.length })
    } catch (e) {
      console.error(`[cron/pulse-databridge-followup] error con ${grupo.email}:`, e)
      resultados.push({
        email: grupo.email,
        estado: 'error',
        razon: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return NextResponse.json({
    message: `Procesados ${grupos.length} contactos únicos (${elegibles.length} filas)`,
    enviados: resultados.filter(r => r.estado === 'enviado').length,
    convertidos: resultados.filter(r => r.estado === 'convertido').length,
    errores: resultados.filter(r => r.estado === 'error').length,
    detalle: resultados,
  })
}
