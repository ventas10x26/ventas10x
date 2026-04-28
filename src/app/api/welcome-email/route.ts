// Ruta destino: src/app/api/welcome-email/route.ts
// REFACTORIZADO: usa template centralizado + tracking en BD

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enviarEmailConTracking } from '@/lib/email-helpers'
import { templateWelcome } from '@/lib/email-templates'

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, userId } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    // Si no viene userId, intentar obtenerlo por email
    let vendedorId = userId
    if (!vendedorId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: { users } } = await (supabaseService.auth.admin.listUsers() as any)
      const user = users?.find((u: { email?: string }) => u.email === email)
      vendedorId = user?.id
    }

    if (!vendedorId) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 })
    }

    // Obtener slug y empresa del profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabaseService.from('profiles') as any)
      .select('nombre, apellido, empresa, slug')
      .eq('id', vendedorId)
      .single()

    const slug = profile?.slug || vendedorId.slice(0, 8)
    const nombreCompleto = profile
      ? [profile.nombre, profile.apellido].filter(Boolean).join(' ') || nombre || 'Vendedor'
      : nombre || 'Vendedor'
    const primerNombre = nombreCompleto.split(' ')[0]

    const { asunto, html } = templateWelcome({
      nombre: nombreCompleto,
      primerNombre,
      email,
      slug,
      empresa: profile?.empresa || null,
    })

    const resultado = await enviarEmailConTracking({
      vendedorId,
      tipo: 'welcome',
      email,
      asunto,
      html,
    })

    if (!resultado.ok) {
      if (resultado.razon === 'ya_enviado') {
        return NextResponse.json({
          success: false,
          mensaje: 'Welcome ya fue enviado anteriormente',
        })
      }
      return NextResponse.json({ error: resultado.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Welcome email enviado',
      resendId: resultado.resendId,
    })
  } catch (error) {
    console.error('[welcome-email] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
