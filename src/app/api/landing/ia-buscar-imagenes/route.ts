// Ruta destino: src/app/api/landing/ia-buscar-imagenes/route.ts

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { query, orientation = 'landscape', perPage = 6 } = await req.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Falta el parámetro query' },
        { status: 400 }
      )
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY
    if (!accessKey) {
      return NextResponse.json(
        { error: 'UNSPLASH_ACCESS_KEY no configurada' },
        { status: 500 }
      )
    }

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&orientation=${orientation}&per_page=${perPage}&content_filter=high`

    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Unsplash respondió ${res.status}` },
        { status: 500 }
      )
    }

    const data = await res.json()

    // Normalizar respuesta para el frontend
    const imagenes = (data.results || []).map(
      (p: {
        id: string
        urls: { regular: string; thumb: string; full: string }
        alt_description: string | null
        user: { name: string; links: { html: string } }
        width: number
        height: number
      }) => ({
        id: p.id,
        url: p.urls.regular,
        thumb: p.urls.thumb,
        full: p.urls.full,
        alt: p.alt_description || query,
        autor: p.user.name,
        autorUrl: p.user.links.html,
        ancho: p.width,
        alto: p.height,
      })
    )

    return NextResponse.json({ imagenes, total: data.total || 0 })
  } catch (error) {
    console.error('ia-buscar-imagenes error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
