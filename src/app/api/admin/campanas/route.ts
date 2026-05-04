// Ruta destino: src/app/api/admin/campanas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { Resend } from 'resend'

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
const resend = new Resend(process.env.RESEND_API_KEY)

// GET — listar campañas
export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseService as any)
    .from('campanas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ campanas: data || [] })
}

// POST — crear campaña
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { nombre, asunto, cuerpo_email, mensaje_wa, canal, destinatarios_ids, destinatarios_filtro, programada_para } = body

  if (!nombre || !canal) return NextResponse.json({ error: 'nombre y canal requeridos' }, { status: 400 })

  // Resolver destinatarios según filtro
  let destIds: string[] = destinatarios_ids || []
  if (destinatarios_filtro && destinatarios_filtro !== 'seleccionados') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabaseService as any).from('profiles').select('id')
    if (destinatarios_filtro === 'todos') {
      // todos los vendedores
    } else if (['plan_trial', 'plan_starter', 'plan_pro', 'plan_enterprise'].includes(destinatarios_filtro)) {
      const plan = destinatarios_filtro.replace('plan_', '')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: subs } = await (supabaseService as any)
        .from('suscripciones')
        .select('vendedor_id')
        .eq('plan', plan)
        .eq('estado', 'activa')
      destIds = (subs || []).map((s: { vendedor_id: string }) => s.vendedor_id)
      query = null
    }
    if (query) {
      const { data: perfiles } = await query
      destIds = (perfiles || []).map((p: { id: string }) => p.id)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campana, error } = await (supabaseService as any)
    .from('campanas')
    .insert({
      creado_por: admin.id || 'superadmin',
      nombre,
      asunto: asunto || null,
      cuerpo_email: cuerpo_email || null,
      mensaje_wa: mensaje_wa || null,
      canal,
      destinatarios_ids: destIds,
      destinatarios_filtro: destinatarios_filtro || 'seleccionados',
      programada_para: programada_para || null,
      estado: programada_para ? 'programada' : 'borrador',
      total_destinatarios: destIds.length,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, campana })
}
