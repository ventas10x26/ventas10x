// Ruta destino: src/app/api/landing/config/route.ts
// FASE 1 - Soporte para nuevos campos: stats, como_funciona, bloques_activos,
// badge_promo, cta_principal_texto, cta_principal_microcopy.
// Retrocompatible con los campos existentes (titulo, subtitulo, producto, color_acento).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/

type Stat = { valor: string; label: string }
type Paso = { titulo: string; descripcion: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isStatArray(v: any): v is Stat[] {
  return Array.isArray(v) && v.every(
    (s) => s && typeof s.valor === 'string' && typeof s.label === 'string'
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPasoArray(v: any): v is Paso[] {
  return Array.isArray(v) && v.every(
    (p) => p && typeof p.titulo === 'string' && typeof p.descripcion === 'string'
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isBloquesActivos(v: any): boolean {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  return Object.values(v).every((x) => typeof x === 'boolean')
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()

    // ── Validación del color (si viene) ──
    if (body.color_acento && !HEX_REGEX.test(body.color_acento)) {
      return NextResponse.json(
        { error: 'El color debe ser un hex válido (ej: #FF6B2B)' },
        { status: 400 }
      )
    }

    // ── Construir objeto de cambios (solo campos enviados) ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cambios: Record<string, any> = {
      vendedor_id: user.id,
    }

    // Campos texto existentes
    if (body.titulo !== undefined) cambios.titulo = body.titulo?.trim() || null
    if (body.subtitulo !== undefined) cambios.subtitulo = body.subtitulo?.trim() || null
    if (body.producto !== undefined) cambios.producto = body.producto?.trim() || null
    if (body.color_acento !== undefined) cambios.color_acento = body.color_acento?.trim() || '#FF6B2B'

    // Campos texto adicionales (que ya existen en BD pero no estaban en el endpoint)
    if (body.foto_url !== undefined) cambios.foto_url = body.foto_url?.trim() || null
    if (body.whatsapp !== undefined) cambios.whatsapp = body.whatsapp?.trim() || null
    if (body.mensaje_wa !== undefined) cambios.mensaje_wa = body.mensaje_wa?.trim() || null
    if (body.imagen_hero !== undefined) cambios.imagen_hero = body.imagen_hero?.trim() || null
    if (body.imagen_logo !== undefined) cambios.imagen_logo = body.imagen_logo?.trim() || null

    // Imagenes galería (array de strings)
    if (body.imagenes_galeria !== undefined) {
      if (Array.isArray(body.imagenes_galeria)) {
        cambios.imagenes_galeria = body.imagenes_galeria.filter(
          (s: unknown) => typeof s === 'string'
        )
      } else if (body.imagenes_galeria === null) {
        cambios.imagenes_galeria = null
      } else {
        return NextResponse.json(
          { error: 'imagenes_galeria debe ser un array de strings' },
          { status: 400 }
        )
      }
    }

    // ── FASE 1: campos nuevos ──

    // Stats (jsonb): array de {valor, label}
    if (body.stats !== undefined) {
      if (body.stats === null) {
        cambios.stats = []
      } else if (isStatArray(body.stats)) {
        cambios.stats = body.stats.slice(0, 6) // máximo 6 stats
      } else {
        return NextResponse.json(
          { error: 'stats debe ser un array de {valor, label}' },
          { status: 400 }
        )
      }
    }

    // Como funciona (jsonb): array de {titulo, descripcion}
    if (body.como_funciona !== undefined) {
      if (body.como_funciona === null) {
        cambios.como_funciona = []
      } else if (isPasoArray(body.como_funciona)) {
        cambios.como_funciona = body.como_funciona.slice(0, 5) // máximo 5 pasos
      } else {
        return NextResponse.json(
          { error: 'como_funciona debe ser un array de {titulo, descripcion}' },
          { status: 400 }
        )
      }
    }

    // Bloques activos (jsonb): objeto {hero: bool, stats: bool, ...}
    if (body.bloques_activos !== undefined) {
      if (isBloquesActivos(body.bloques_activos)) {
        cambios.bloques_activos = body.bloques_activos
      } else {
        return NextResponse.json(
          { error: 'bloques_activos debe ser un objeto de booleanos' },
          { status: 400 }
        )
      }
    }

    // Badge promo (texto corto)
    if (body.badge_promo !== undefined) {
      cambios.badge_promo = body.badge_promo?.trim()?.slice(0, 80) || null
    }

    // CTA principal
    if (body.cta_principal_texto !== undefined) {
      cambios.cta_principal_texto = body.cta_principal_texto?.trim()?.slice(0, 50) || null
    }
    if (body.cta_principal_microcopy !== undefined) {
      cambios.cta_principal_microcopy = body.cta_principal_microcopy?.trim()?.slice(0, 120) || null
    }
    if (body.tema !== undefined) {
      const temasValidos = ['automotriz', 'inmobiliaria', 'salud', 'retail', 'tecnologia', 'belleza', 'servicios', 'generico']
      const tema = String(body.tema).trim().toLowerCase()
      if (temasValidos.includes(tema)) {
        cambios.tema = tema
      }
    }

    // ── Si solo viene vendedor_id (nada más), error ──
    if (Object.keys(cambios).length === 1) {
      return NextResponse.json(
        { error: 'No hay cambios para guardar' },
        { status: 400 }
      )
    }

    // ── Upsert ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('landing_config') as any)
      .upsert(cambios, { onConflict: 'vendedor_id' })
      .select('*')
      .single()

    if (error) {
      console.error('[api/landing/config PATCH] Error Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ config: data })
  } catch (error) {
    console.error('[api/landing/config PATCH] Error:', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}