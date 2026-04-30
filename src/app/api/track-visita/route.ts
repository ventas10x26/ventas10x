// Ruta destino: src/app/api/track-visita/route.ts
// Endpoint público que registra una visita a la landing de un usuario.
// - Anti-spam: misma IP en últimos 5 minutos = no crea visita duplicada.
// - Filtra bots conocidos.
// - IP se hashea para privacidad.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const VENTANA_DEDUP_MS = 5 * 60 * 1000 // 5 minutos

const BOT_PATTERNS = [
  /googlebot/i, /bingbot/i, /yandexbot/i, /duckduckbot/i,
  /baiduspider/i, /slackbot/i, /facebookexternalhit/i,
  /twitterbot/i, /linkedinbot/i, /whatsapp/i, /telegrambot/i,
  /headlesschrome/i, /lighthouse/i, /pingdom/i, /uptimerobot/i,
  /semrush/i, /ahrefs/i, /screaming/i, /python-requests/i,
  /go-http-client/i, /curl/i, /wget/i, /node-fetch/i,
]

function isBot(userAgent: string): boolean {
  if (!userAgent) return true
  return BOT_PATTERNS.some(p => p.test(userAgent))
}

function detectarDispositivo(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (!userAgent) return 'desktop'
  const ua = userAgent.toLowerCase()
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet'
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) return 'mobile'
  return 'desktop'
}

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'ventas10x-default-salt'
  return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 32)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const slug = body.slug?.trim()
    const referrer = body.referrer?.toString().slice(0, 500) || null

    if (!slug) {
      return NextResponse.json({ error: 'Slug requerido' }, { status: 400 })
    }

    const userAgent = req.headers.get('user-agent') || ''

    if (isBot(userAgent)) {
      return NextResponse.json({ ok: true, skipped: 'bot' })
    }

    // IP del visitante
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const ipHashValue = hashIp(ip)

    // Geo desde Vercel headers
    const pais = req.headers.get('x-vercel-ip-country') || null
    const ciudad = req.headers.get('x-vercel-ip-city')
      ? decodeURIComponent(req.headers.get('x-vercel-ip-city')!)
      : null

    // Resolver vendedor_id desde el slug
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ ok: true, skipped: 'profile-not-found' })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vendedorId = (profile as any).id

    // Anti-spam: misma IP a la misma landing en últimos 5 min
    const desde = new Date(Date.now() - VENTANA_DEDUP_MS).toISOString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existente } = await (supabaseAdmin.from('landing_visitas') as any)
      .select('id')
      .eq('vendedor_id', vendedorId)
      .eq('ip_hash', ipHashValue)
      .gte('visitado_at', desde)
      .limit(1)
      .maybeSingle()

    if (existente) {
      return NextResponse.json({ ok: true, skipped: 'duplicate' })
    }

    const dispositivo = detectarDispositivo(userAgent)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin.from('landing_visitas') as any).insert({
      vendedor_id: vendedorId,
      slug,
      ip_hash: ipHashValue,
      user_agent: userAgent.slice(0, 500),
      pais,
      ciudad,
      referrer,
      dispositivo,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[track-visita]', error)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
