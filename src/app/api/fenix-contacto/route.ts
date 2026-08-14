// Ruta destino: src/app/api/fenix-contacto/route.ts
//
// Recibe los leads del formulario principal y del widget flotante (ambos
// usan FenixLeadForm, que postea aquí). El procesamiento -- guardar en
// Supabase, avisar al equipo por correo y WhatsApp, y mandarle la
// autorespuesta con el entregable al lead -- vive en
// src/lib/fenix-lead-pipeline.ts, compartido con el webhook de Meta Lead
// Ads (src/app/api/fenix/meta-leads/webhook/route.ts) para que ambos
// orígenes de leads se comporten idéntico.

import { NextRequest, NextResponse } from 'next/server'
import { procesarLeadFenix, type LeadFenix } from '@/lib/fenix-lead-pipeline'

export async function POST(req: NextRequest) {
  try {
    const { empresa, nombre, email, telefono, mensaje } = await req.json()

    if (!empresa || !nombre || !email || !telefono) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const lead: LeadFenix = {
      empresa: String(empresa).trim(),
      nombre: String(nombre).trim(),
      email: String(email).trim().toLowerCase(),
      telefono: String(telefono).trim(),
      mensaje: String(mensaje || '').trim(),
    }

    const resultado = await procesarLeadFenix(lead, 'landing_fenix_consultores')

    // Solo se rechaza si el lead no quedó registrado en ningún lado. Mientras
    // esté guardado o haya salido un aviso, la solicitud está recibida.
    if (!resultado.guardado && !resultado.email && !resultado.whatsappEquipo) {
      return NextResponse.json({ error: 'No pudimos enviar la solicitud. Intenta de nuevo.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[fenix-contacto] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
