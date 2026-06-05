// Ruta destino: src/app/api/pulse/voice/token/route.ts
// Genera un token de sesión firmado para ElevenLabs Conversational AI
// Inyecta las variables del asesor (nombre, catálogo) en el agente global

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID!
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTej36IuFT6HGZGKUvHGlestv9Ro1qyKXuZ88poK_diUl_6vOiU_QBKhBV7UGSUq7c3Z9g40pPtPNYr/pub?output=csv'

async function obtenerCatalogoResumen(): Promise<string> {
  try {
    const res = await fetch(CSV_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return 'KIA Picanto, Sportage, Sonet, Seltos, Carnival, EV6'
    const csv = await res.text()
    const filas = csv.split('\n').slice(1).filter(Boolean)
    const modelos: string[] = []
    for (const fila of filas.slice(0, 20)) {
      const cols = fila.split(',')
      if (cols[0] && cols[0].trim()) {
        const linea = cols[0].trim().replace(/"/g, '')
        const version = cols[1]?.trim().replace(/"/g, '') || ''
        const precio = cols[4]?.trim().replace(/"/g, '') || ''
        if (linea && !modelos.some(m => m.includes(linea))) {
          modelos.push('KIA ' + linea + (version ? ' ' + version : '') + (precio ? ' desde $' + parseInt(precio.replace(/\D/g, '') || '0') / 1000000 + 'M' : ''))
        }
      }
    }
    return modelos.slice(0, 8).join(', ') || 'KIA Picanto, Sportage, Sonet, Seltos, Carnival'
  } catch {
    return 'KIA Picanto, Sportage, Sonet, Seltos, Carnival, EV6'
  }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')

  let nombreAsesor = 'Sandra'
  let catalogoTexto = ''

  // Si hay slug, buscar el asesor en pulse_waitlist
  if (slug) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('pulse_waitlist') as any)
        .select('nombre, metadata')
        .or('metadata->>slug.eq.' + slug + ',metadata->>whatsapp.ilike.%' + slug + '%')
        .maybeSingle()

      if (data?.nombre) {
        const primerNombre = data.nombre.split(' ')[0]
        nombreAsesor = primerNombre
      }
    } catch (e) {
      console.error('[voice/token] error buscando asesor:', e)
    }
  }

  catalogoTexto = await obtenerCatalogoResumen()

  try {
    // Generar token de sesión firmado con variables del asesor
    const res = await fetch(
      'https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=' + ELEVENLABS_AGENT_ID,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('[voice/token] ElevenLabs error:', res.status, err)
      return NextResponse.json({ error: 'Error generando token' }, { status: 500 })
    }

    const data = await res.json()

    return NextResponse.json({
      signed_url: data.signed_url,
      agent_id: ELEVENLABS_AGENT_ID,
      variables: {
        nombre_asesor: nombreAsesor,
        catalogo: catalogoTexto,
        modelo_interes: '',
      },
    })
  } catch (e: any) {
    console.error('[voice/token] error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
