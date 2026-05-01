// Ruta destino: src/app/api/dashboard/metricas-landing/route.ts
// Devuelve métricas agregadas para el dashboard del usuario autenticado.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/get-active-org'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const ahora = new Date()
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString()
    const hace7dias = new Date(Date.now() - 7 * 86400000).toISOString()
    const hace14dias = new Date(Date.now() - 14 * 86400000).toISOString()
    const hace30dias = new Date(Date.now() - 30 * 86400000).toISOString()

    // Cargar TODAS las visitas de los últimos 30 días en una sola query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: visitas, error } = await (supabase.from('landing_visitas') as any)
      .select('visitado_at, ciudad, pais, referrer, dispositivo')
      .eq('vendedor_id', (await getActiveOrg())?.org?.owner_id)
      .gte('visitado_at', hace30dias)
      .order('visitado_at', { ascending: false })

    if (error) {
      console.error('[metricas-landing]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const lista = visitas || []

    // ─── Conteos ───
    const visitasHoy = lista.filter((v: { visitado_at: string }) => v.visitado_at >= inicioHoy).length
    const visitas7d = lista.filter((v: { visitado_at: string }) => v.visitado_at >= hace7dias).length
    const visitas30d = lista.length

    // ─── Mini-gráfica últimos 14 días ───
    const dias14: { dia: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const inicioDia = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const finDia = new Date(inicioDia.getTime() + 86400000)
      const count = lista.filter(
        (v: { visitado_at: string }) =>
          v.visitado_at >= inicioDia.toISOString() && v.visitado_at < finDia.toISOString()
      ).length
      dias14.push({
        dia: inicioDia.toISOString().slice(0, 10),
        count,
      })
    }

    // ─── Top ciudades ───
    const ciudadesMap = new Map<string, number>()
    lista.forEach((v: { ciudad: string | null }) => {
      if (v.ciudad) ciudadesMap.set(v.ciudad, (ciudadesMap.get(v.ciudad) || 0) + 1)
    })
    const topCiudades = Array.from(ciudadesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, count]) => ({ nombre, count }))

    // ─── Top referrers ───
    const referrersMap = new Map<string, number>()
    lista.forEach((v: { referrer: string | null }) => {
      let etiqueta = 'Directo'
      if (v.referrer) {
        try {
          const url = new URL(v.referrer)
          const host = url.hostname.replace('www.', '')
          // Etiquetar plataformas comunes
          if (host.includes('whatsapp') || host.includes('wa.me')) etiqueta = 'WhatsApp'
          else if (host.includes('instagram')) etiqueta = 'Instagram'
          else if (host.includes('facebook') || host.includes('fb.com')) etiqueta = 'Facebook'
          else if (host.includes('tiktok')) etiqueta = 'TikTok'
          else if (host.includes('linkedin')) etiqueta = 'LinkedIn'
          else if (host.includes('twitter') || host.includes('x.com')) etiqueta = 'X / Twitter'
          else if (host.includes('google')) etiqueta = 'Google'
          else if (host.includes('bing')) etiqueta = 'Bing'
          else if (host.includes('youtube')) etiqueta = 'YouTube'
          else if (host.includes('ventas10x')) etiqueta = 'Ventas10x'
          else etiqueta = host
        } catch {
          etiqueta = 'Directo'
        }
      }
      referrersMap.set(etiqueta, (referrersMap.get(etiqueta) || 0) + 1)
    })
    const topReferrers = Array.from(referrersMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, count]) => ({ nombre, count }))

    // ─── Dispositivos ───
    const dispositivos = { mobile: 0, desktop: 0, tablet: 0 }
    lista.forEach((v: { dispositivo: string | null }) => {
      const d = (v.dispositivo as 'mobile' | 'desktop' | 'tablet') || 'desktop'
      if (d in dispositivos) dispositivos[d]++
    })

    return NextResponse.json({
      ok: true,
      visitasHoy,
      visitas7d,
      visitas30d,
      dias14,
      topCiudades,
      topReferrers,
      dispositivos,
    })
  } catch (error) {
    console.error('[metricas-landing]', error)
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
