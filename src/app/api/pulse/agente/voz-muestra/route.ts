// src/app/api/pulse/agente/voz-muestra/route.ts
// POST: sube audio de muestra de voz y agrega entrada al historial del asesor

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import {
  PULSE_VOZ_BUCKET,
  PULSE_VOZ_HISTORIAL_MAX,
  normalizarVozHistorial,
  slugEmailParaStorage,
  type PulseAgentMetadata,
  type PulseVozMuestra,
} from '@/lib/pulse-agent'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function resolverEmail(req: NextRequest, formEmail?: string | null): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email) return user.email.trim().toLowerCase()
  if (formEmail && formEmail.includes('@')) return formEmail.trim().toLowerCase()
  const q = req.nextUrl.searchParams.get('email')
  if (q && q.includes('@')) return q.trim().toLowerCase()
  return null
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const audio = form.get('audio')
    const transcripcionRaw = String(form.get('transcripcion') || '').trim()
    const duracionRaw = Number(form.get('duracion_seg') || 0)
    const duracion_seg = Number.isFinite(duracionRaw) ? Math.max(0, Math.round(duracionRaw)) : 0
    const emailForm = form.get('email') ? String(form.get('email')) : null

    const email = await resolverEmail(req, emailForm)
    if (!email) {
      return NextResponse.json({ error: 'Email o sesión requeridos' }, { status: 401 })
    }

    // Aceptar audio aunque no haya transcripción automática — usar placeholder
    const transcripcion = transcripcionRaw.length >= 3
      ? transcripcionRaw
      : '[grabación de voz — completá la transcripción desde Mi agente → Voz y tono]'

    if (!(audio instanceof Blob) || audio.size < 100) {
      return NextResponse.json({ error: 'Archivo de audio inválido' }, { status: 400 })
    }

    if (audio.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'El audio supera 8 MB' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error: selectErr } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .select('id, nombre, metadata')
      .ilike('email', email)
      .maybeSingle()

    if (selectErr || !row?.id) {
      return NextResponse.json(
        { error: 'No encontramos tu agente. Completa el onboarding primero.' },
        { status: 404 }
      )
    }

    const prevMeta = (row.metadata && typeof row.metadata === 'object'
      ? row.metadata
      : {}) as PulseAgentMetadata

    const id = crypto.randomUUID()
    const created_at = new Date().toISOString()
    const storage_path = `${slugEmailParaStorage(email)}/${created_at.slice(0, 10)}_${id}.webm`

    const buffer = Buffer.from(await audio.arrayBuffer())
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(PULSE_VOZ_BUCKET)
      .upload(storage_path, buffer, {
        contentType: audio.type || 'audio/webm',
        upsert: false,
      })

    if (uploadErr) {
      console.error('[pulse/agente/voz-muestra] upload:', uploadErr)
      return NextResponse.json(
        {
          error: 'No pudimos guardar el audio. Verificá el bucket "pulse-agente-voz" en Supabase Storage.',
          detail: uploadErr.message,
        },
        { status: 500 }
      )
    }

    const entrada: PulseVozMuestra = {
      id,
      created_at,
      transcripcion,
      duracion_seg,
      storage_path,
      origen: 'agente',
    }

    const historial = [entrada, ...normalizarVozHistorial(prevMeta.voz_historial)].slice(
      0,
      PULSE_VOZ_HISTORIAL_MAX
    )

    const metadata: PulseAgentMetadata = {
      ...prevMeta,
      muestra_voz: transcripcion,
      duracion_voz_seg: duracion_seg,
      voz_historial: historial,
      updated_at: created_at,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (supabaseAdmin.from('pulse_waitlist') as any)
      .update({ metadata })
      .eq('id', row.id)

    if (updateErr) {
      await supabaseAdmin.storage.from(PULSE_VOZ_BUCKET).remove([storage_path])
      return NextResponse.json({ error: 'No pudimos actualizar el historial' }, { status: 500 })
    }

    const { data: signed } = await supabaseAdmin.storage
      .from(PULSE_VOZ_BUCKET)
      .createSignedUrl(storage_path, 3600)

    return NextResponse.json({
      ok: true,
      muestra: { ...entrada, audio_url: signed?.signedUrl ?? null },
      total: historial.length,
    })
  } catch (e) {
    console.error('[pulse/agente/voz-muestra]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    )
  }
}
