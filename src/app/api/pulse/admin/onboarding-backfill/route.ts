// Ruta destino: src/app/api/pulse/admin/onboarding-backfill/route.ts
//
// Activa la secuencia de onboarding de DataBridge para los contactos que ya existían ANTES
// de que ebook/route.ts y demo-contacto/route.ts empezaran a agendarla en el insert. Sin
// esto, esos leads se quedan para siempre en onboarding_stage=0 (el default de la columna)
// y el cron nunca los toca.
//
// Se ejecuta una sola vez por lote de leads históricos, a mano, desde el botón "Activar
// onboarding" en /pulse/leads — mismo patrón de auth que /api/pulse/admin/proyectos y
// /api/pulse/admin/leads (bearer token + PULSE_ADMIN_EMAILS), no el de /admin/fenix.
//
// Envía el touch 1 (el mismo correo que ya reciben los leads nuevos al capturarse) y deja
// agendado el touch 2 a +3 días, exactamente como si acabaran de dejar sus datos hoy.
//
// Se agrupa por email antes de enviar (ver onboarding-dedup.ts): en la captura de pantalla
// que originó este endpoint, un mismo correo aparecía repetido hasta 8 veces (reintentos de
// prueba del propio formulario) — sin agrupar, esa persona recibiría el mismo correo 8 veces.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarOnboardingDatabridge, type OrigenOnboarding } from '@/lib/pulse/onboarding-databridge-email'
import { agruparContactosPorEmail } from '@/lib/pulse/onboarding-dedup'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const ADMINS = (process.env.PULSE_ADMIN_EMAILS || 'ricaza81@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

const DIAS_HASTA_TOUCH_2 = 3
const FUENTES_ELEGIBLES = ['ebook_rentabilidad', 'demo_panel']

interface ContactoHistorico {
  id: string
  nombre: string
  email: string
  fuente: string
}

type ResultadoBackfill = {
  email: string
  estado: 'enviado' | 'error'
  filasAgrupadas: number
  razon?: string
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 })

    const { data: { user }, error: authErr } = await admin.auth.getUser(token)
    if (authErr || !user?.email) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    if (!ADMINS.includes(user.email.toLowerCase())) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    // Solo los que NUNCA entraron a la secuencia (stage 0, el default) — así este endpoint
    // se puede volver a llamar sin riesgo: a quien ya se le activó (stage >= 1, por más
    // nuevo que sea el lead) no se le vuelve a tocar acá, eso es trabajo del cron.
    const { data: historicos, error: errQuery } = await admin
      .from('pulse_contactos')
      .select('id, nombre, email, fuente')
      .in('fuente', FUENTES_ELEGIBLES)
      .eq('onboarding_stage', 0)
      .is('unsubscribed_at', null)
      .order('created_at', { ascending: false })
      .limit(500)

    if (errQuery) throw new Error(errQuery.message)

    if (!historicos?.length) {
      return NextResponse.json({ message: 'No hay contactos pendientes de activar', enviados: 0, detalle: [] })
    }

    const grupos = agruparContactosPorEmail(historicos as ContactoHistorico[])
    const resultados: ResultadoBackfill[] = []

    for (const grupo of grupos) {
      try {
        const origen: OrigenOnboarding = grupo.fuente === 'demo_panel' ? 'demo' : 'ebook'
        await enviarOnboardingDatabridge({ nombre: grupo.nombre, email: grupo.email, origen })

        await admin
          .from('pulse_contactos')
          .update({
            onboarding_stage: 1,
            onboarding_next_at: new Date(Date.now() + DIAS_HASTA_TOUCH_2 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .in('id', grupo.ids)

        resultados.push({ email: grupo.email, estado: 'enviado', filasAgrupadas: grupo.ids.length })
      } catch (e) {
        console.error(`[api/pulse/admin/onboarding-backfill] error con ${grupo.email}:`, e)
        resultados.push({
          email: grupo.email,
          estado: 'error',
          filasAgrupadas: grupo.ids.length,
          razon: e instanceof Error ? e.message : String(e),
        })
      }
    }

    return NextResponse.json({
      message: `${grupos.length} correos únicos procesados de ${historicos.length} filas históricas`,
      enviados: resultados.filter(r => r.estado === 'enviado').length,
      errores: resultados.filter(r => r.estado === 'error').length,
      detalle: resultados,
    })
  } catch (e) {
    console.error('[api/pulse/admin/onboarding-backfill]', e)
    return NextResponse.json({ error: 'No pudimos activar el onboarding retroactivo' }, { status: 500 })
  }
}
