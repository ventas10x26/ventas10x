// Ruta destino: src/app/api/cron/onboarding-reminder/route.ts
// REFACTORIZADO: cron unificado que evalúa qué email enviar a cada vendedor.
// Reemplaza el cron viejo que solo enviaba 1 tipo de email.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  enviarEmailConTracking,
  yaRecibioEmail,
  diasDesdeRegistro,
  diasHastaVencimiento,
} from '@/lib/email-helpers'
import {
  templatePersonalizarLanding,
  templateCrearBot,
  templateViralizar,
  templatePreVencimiento,
  templateTrialVencido,
} from '@/lib/email-templates'

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ResultadoEnvio = {
  vendedor_id: string
  email: string
  tipo: string
  estado: 'enviado' | 'omitido' | 'error'
  razon?: string
}

export async function GET(req: NextRequest) {
  // Verificar que viene de Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Cargar todos los profiles + sus suscripciones
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabaseService.from('profiles') as any)
    .select('id, nombre, apellido, empresa, slug, created_at')
    .order('created_at', { ascending: false })

  if (!profiles?.length) {
    return NextResponse.json({ message: 'No hay profiles', enviados: 0 })
  }

  const resultados: ResultadoEnvio[] = []

  for (const profile of profiles) {
    try {
      // Obtener email del usuario
      const { data: authData } = await supabaseService.auth.admin.getUserById(profile.id)
      const email = authData?.user?.email
      if (!email) continue

      const nombreCompleto = [profile.nombre, profile.apellido].filter(Boolean).join(' ')
        || email.split('@')[0]
      const primerNombre = nombreCompleto.split(' ')[0]
      const slug = profile.slug || profile.id.slice(0, 8)

      const datos = {
        nombre: nombreCompleto,
        primerNombre,
        email,
        slug,
        empresa: profile.empresa || null,
      }

      const dias = diasDesdeRegistro(profile.created_at)

      // ─── DÍA 1: Personalizar landing (si NO editó landing) ───
      if (dias === 1) {
        const yaRecibio = await yaRecibioEmail(profile.id, 'personalizar_landing')
        if (!yaRecibio) {
          // Verificar si ya editó landing (tiene titulo o subtitulo custom)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: landing } = await (supabaseService.from('landing_config') as any)
            .select('titulo, subtitulo')
            .eq('vendedor_id', profile.id)
            .maybeSingle()

          const yaPersonalizo = !!(landing?.titulo || landing?.subtitulo)

          if (!yaPersonalizo) {
            const { asunto, html } = templatePersonalizarLanding(datos)
            const r = await enviarEmailConTracking({
              vendedorId: profile.id,
              tipo: 'personalizar_landing',
              email,
              asunto,
              html,
            })
            resultados.push({
              vendedor_id: profile.id,
              email,
              tipo: 'personalizar_landing',
              estado: r.ok ? 'enviado' : 'error',
              razon: !r.ok && 'razon' in r ? r.razon : undefined,
            })
          }
        }
      }

      // ─── DÍA 3: Crear Bot IA (si NO tiene bot) ───
      if (dias === 3) {
        const yaRecibio = await yaRecibioEmail(profile.id, 'crear_bot')
        if (!yaRecibio) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: bots } = await (supabaseService.from('bots') as any)
            .select('id')
            .eq('user_id', profile.id)
            .limit(1)

          const tieneBot = (bots?.length || 0) > 0

          if (!tieneBot) {
            const { asunto, html } = templateCrearBot(datos)
            const r = await enviarEmailConTracking({
              vendedorId: profile.id,
              tipo: 'crear_bot',
              email,
              asunto,
              html,
            })
            resultados.push({
              vendedor_id: profile.id,
              email,
              tipo: 'crear_bot',
              estado: r.ok ? 'enviado' : 'error',
              razon: !r.ok && 'razon' in r ? r.razon : undefined,
            })
          }
        }
      }

      // ─── DÍA 7: Viralizar landing (a TODOS, sin filtro) ───
      if (dias === 7) {
        const yaRecibio = await yaRecibioEmail(profile.id, 'viralizar')
        if (!yaRecibio) {
          const { asunto, html } = templateViralizar(datos)
          const r = await enviarEmailConTracking({
            vendedorId: profile.id,
            tipo: 'viralizar',
            email,
            asunto,
            html,
          })
          resultados.push({
            vendedor_id: profile.id,
            email,
            tipo: 'viralizar',
            estado: r.ok ? 'enviado' : 'error',
            razon: !r.ok && 'razon' in r ? r.razon : undefined,
          })
        }
      }

      // ─── PRE-VENCIMIENTO: 2 días antes de fin de trial ───
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sub } = await (supabaseService.from('suscripciones') as any)
        .select('plan, estado, fecha_fin')
        .eq('vendedor_id', profile.id)
        .eq('estado', 'activa')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sub) {
        const diasParaVencer = diasHastaVencimiento(sub.fecha_fin)

        // Pre-vencimiento: 2 días antes (solo trial)
        if (sub.plan === 'trial' && diasParaVencer === 2) {
          const yaRecibio = await yaRecibioEmail(profile.id, 'pre_vencimiento')
          if (!yaRecibio) {
            const { asunto, html } = templatePreVencimiento(datos, diasParaVencer)
            const r = await enviarEmailConTracking({
              vendedorId: profile.id,
              tipo: 'pre_vencimiento',
              email,
              asunto,
              html,
            })
            resultados.push({
              vendedor_id: profile.id,
              email,
              tipo: 'pre_vencimiento',
              estado: r.ok ? 'enviado' : 'error',
              razon: !r.ok && 'razon' in r ? r.razon : undefined,
            })
          }
        }

        // Trial vencido (día siguiente del vencimiento)
        if (sub.plan === 'trial' && diasParaVencer <= 0 && diasParaVencer > -2) {
          const yaRecibio = await yaRecibioEmail(profile.id, 'trial_vencido')
          if (!yaRecibio) {
            const { asunto, html } = templateTrialVencido(datos)
            const r = await enviarEmailConTracking({
              vendedorId: profile.id,
              tipo: 'trial_vencido',
              email,
              asunto,
              html,
            })
            resultados.push({
              vendedor_id: profile.id,
              email,
              tipo: 'trial_vencido',
              estado: r.ok ? 'enviado' : 'error',
              razon: !r.ok && 'razon' in r ? r.razon : undefined,
            })
          }
        }
      }
    } catch (e) {
      console.error(`[cron] Error procesando ${profile.id}:`, e)
      resultados.push({
        vendedor_id: profile.id,
        email: 'unknown',
        tipo: 'unknown',
        estado: 'error',
        razon: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const enviados = resultados.filter(r => r.estado === 'enviado').length
  const errores = resultados.filter(r => r.estado === 'error').length

  return NextResponse.json({
    message: `Procesados ${profiles.length} profiles`,
    enviados,
    errores,
    detalle: resultados,
  })
}
