// Ruta destino: src/app/api/pulse/ebook/route.ts
//
// Captura del lead que descarga el ebook de rentabilidad.
//
// Endpoint propio en vez de reusar /api/pulse/demo-contacto por una razón de
// conversión: aquel exige teléfono, y pedir un WhatsApp para bajar un PDF se
// lee como trampa y hunde la tasa de completado. Acá alcanza con nombre, correo
// y concesionario. El teléfono se pide después, en el seguimiento.
//
// Se guarda en la misma tabla que el resto de los leads (pulse_contactos) pero
// con `fuente` distinta, así se puede separar en el embudo quién pidió una demo
// de quién solo descargó material. No son el mismo grado de intención y tratarlos
// igual ensucia cualquier medición posterior.
//
// Disparador de onboarding: apenas el lead queda guardado, se dispara en paralelo
// (fire-and-forget, no bloquea la respuesta) el touch 1 del correo que lo lleva a
// crear su primer proyecto en /pulse/databridge — ver onboarding-databridge-email.ts.
// El insert también deja agendado el touch 2 (onboarding_stage=1, next_at=+3 días):
// /api/cron/pulse-databridge-followup lo recoge de ahí, sin que este endpoint tenga
// que saber nada de cadencias ni de si el lead ya convirtió.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarOnboardingDatabridge } from '@/lib/pulse/onboarding-databridge-email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const FUENTE = 'ebook_rentabilidad'
const DIAS_HASTA_TOUCH_2 = 3

export async function POST(req: NextRequest) {
  try {
    const { concesionario, nombre, email, cargo } = await req.json()

    if (!concesionario || !nombre || !email) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const correo = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return NextResponse.json({ error: 'Revisá el correo, no parece válido' }, { status: 400 })
    }

    const nombreLimpio = String(nombre).trim()

    const notas = [
      `Concesionario: ${String(concesionario).trim()}`,
      cargo ? `Cargo: ${String(cargo).trim()}` : '',
      'Descargó: Rentabilidad por unidad (ebook)',
    ].filter(Boolean).join(' · ')

    const { error } = await supabase.from('pulse_contactos').insert({
      nombre: nombreLimpio,
      email: correo,
      // La tabla comparte forma con los leads de demo, donde el telefono es
      // obligatorio. Se manda un guion en vez de vacio para que en la bandeja se
      // vea de un vistazo que este lead todavia no dejo un numero.
      telefono: '—',
      fuente: FUENTE,
      notas,
      onboarding_stage: 1,
      onboarding_next_at: new Date(Date.now() + DIAS_HASTA_TOUCH_2 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (error) throw new Error(error.message)

    // No se espera (await) ni se deja que una falla acá tumbe la respuesta al
    // visitante: el lead ya quedó guardado arriba, que es lo que no se puede
    // perder. El error queda en logs si Resend lo rechaza.
    enviarOnboardingDatabridge({ nombre: nombreLimpio, email: correo, origen: 'ebook' })
      .catch(e => console.error('[api/pulse/ebook] onboarding email falló:', e))

    return NextResponse.json({ ok: true })
  } catch (e) {
    // No se filtra el detalle del error al cliente: el usuario no puede hacer
    // nada con el mensaje de Postgres y el registro queda en los logs igual.
    console.error('[api/pulse/ebook]', e)
    return NextResponse.json({ error: 'No pudimos registrar tus datos. Intentá de nuevo.' }, { status: 500 })
  }
}
