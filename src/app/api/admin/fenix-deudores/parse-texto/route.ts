// Ruta destino: src/app/api/admin/fenix-deudores/parse-texto/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-helpers'
import { extraerDeudoresDeTexto } from '@/lib/fenix-deudores'

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { texto } = await req.json()
  if (!texto || !String(texto).trim()) {
    return NextResponse.json({ error: 'El texto no puede estar vacío' }, { status: 400 })
  }

  try {
    const registros = await extraerDeudoresDeTexto(String(texto))
    return NextResponse.json({ registros })
  } catch (e) {
    console.error('[admin/fenix-deudores/parse-texto] Error:', e)
    return NextResponse.json({ error: 'No se pudo analizar el texto con IA' }, { status: 502 })
  }
}
