// Ruta destino: src/app/api/fenix/meta-leads/webhook/route.ts
//
// Recibe los eventos "leadgen" que Meta manda cuando alguien llena un
// formulario nativo de Lead Ads en Facebook o Instagram (los mismos que se
// ven en Meta Business Suite → Centro de clientes potenciales). Meta solo
// manda el ID del lead en el webhook -- hay que pedir los datos completos
// a la Graph API con ese ID y el token de la página, y de ahí arman el
// mismo LeadFenix que usa el formulario propio para reusar
// procesarLeadFenix (guardar, avisar al equipo, autorespuesta con
// entregable) sin duplicar esa lógica.
//
// Requiere estas variables de entorno en Vercel (ver guía de configuración
// que Claude le compartió a Ricardo -- no se pueden generar por código,
// hay que crearlas en developers.facebook.com / Meta Business Suite):
//   FENIX_META_VERIFY_TOKEN       -- string arbitrario usado solo para la
//                                     verificación del webhook (paso GET)
//   FENIX_META_PAGE_ACCESS_TOKEN  -- token de página de larga duración con
//                                     permiso leads_retrieval
//   FENIX_META_APP_SECRET         -- (opcional) para validar la firma
//                                     X-Hub-Signature-256 de cada POST

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { procesarLeadFenix, type LeadFenix } from '@/lib/fenix-lead-pipeline'

const GRAPH_API_VERSION = 'v21.0'

// ── GET: verificación del webhook (Meta la llama una sola vez al configurar) ──
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.FENIX_META_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Verificación fallida' }, { status: 403 })
}

// ── Verificación opcional de firma (recomendado por Meta, no obligatorio) ─────
function firmaValida(rawBody: string, header: string | null): boolean {
  const secret = process.env.FENIX_META_APP_SECRET
  if (!secret) return true // sin secret configurado, no se valida (setup mínimo)
  if (!header) return false
  const esperado = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(header)
  const b = Buffer.from(esperado)
  return a.length === b.length && timingSafeEqual(a, b)
}

// ── Graph API: trae los campos completos de un leadgen_id ─────────────────────
type CampoLead = { name: string; values: string[] }

async function obtenerDatosLead(leadgenId: string): Promise<CampoLead[]> {
  const token = process.env.FENIX_META_PAGE_ACCESS_TOKEN
  if (!token) throw new Error('FENIX_META_PAGE_ACCESS_TOKEN no configurada')

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}?fields=field_data&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Graph API rechazó la solicitud: ${res.status} ${await res.text().catch(() => '')}`)
  }
  const data = await res.json()
  return (data.field_data || []) as CampoLead[]
}

// Los nombres de campo de un formulario de Meta dependen de cómo se armó
// (pueden ser 'full_name'/'first_name'+'last_name', o el texto literal de
// una pregunta personalizada) -- por eso el match es flexible, por
// coincidencia parcial normalizada, en vez de esperar nombres exactos.
function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function mapearLead(campos: CampoLead[]): LeadFenix {
  const buscar = (predicate: (nombreNormalizado: string) => boolean): CampoLead | undefined =>
    campos.find((c) => predicate(normalizar(c.name)))

  const campoNombreCompleto = buscar((n) => n === 'full_name' || n.includes('nombre completo'))
  const campoNombre = buscar((n) => n === 'first_name' || n.includes('nombre'))
  const campoApellido = buscar((n) => n === 'last_name' || n.includes('apellido'))
  const campoEmpresa = buscar((n) => n.includes('empresa') || n.includes('company') || n.includes('negocio'))
  const campoEmail = buscar((n) => n === 'email' || n.includes('correo'))
  const campoTelefono = buscar((n) => n === 'phone_number' || n.includes('telefono') || n.includes('whatsapp') || n.includes('phone'))

  const nombre = campoNombreCompleto?.values?.[0]?.trim()
    || [campoNombre?.values?.[0], campoApellido?.values?.[0]].filter(Boolean).join(' ').trim()

  const usados = new Set([campoNombreCompleto, campoNombre, campoApellido, campoEmpresa, campoEmail, campoTelefono].filter(Boolean))

  // Campos no reconocidos como nombre/empresa/email/teléfono se juntan como
  // "qué necesita" -- suele ser la pregunta personalizada del formulario.
  const mensaje = campos
    .filter((c) => !usados.has(c))
    .map((c) => `${c.name}: ${c.values?.[0] || ''}`)
    .join(' · ')

  return {
    nombre: nombre || 'Sin nombre',
    empresa: campoEmpresa?.values?.[0]?.trim() || 'Sin empresa (Meta Ads)',
    email: (campoEmail?.values?.[0] || '').trim().toLowerCase(),
    telefono: campoTelefono?.values?.[0]?.trim() || '',
    mensaje,
  }
}

// ── POST: eventos leadgen ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!firmaValida(rawBody, req.headers.get('x-hub-signature-256'))) {
    console.error('[fenix meta-leads webhook] firma inválida')
    return NextResponse.json({ ok: true }) // 200 igual -- Meta reintenta si no responde 200, no queremos reintentos por esto
  }

  let body: { object?: string; entry?: Array<{ changes?: Array<{ field?: string; value?: { leadgen_id?: string } }> }> }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ ok: true })
  }

  if (body.object !== 'page') return NextResponse.json({ ok: true })

  const leadgenIds: string[] = []
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field === 'leadgen' && change.value?.leadgen_id) {
        leadgenIds.push(change.value.leadgen_id)
      }
    }
  }

  for (const leadgenId of leadgenIds) {
    try {
      const campos = await obtenerDatosLead(leadgenId)
      const lead = mapearLead(campos)
      if (!lead.telefono && !lead.email) {
        console.error('[fenix meta-leads webhook] lead sin teléfono ni email, se ignora:', leadgenId)
        continue
      }
      await procesarLeadFenix(lead, 'meta_ads_leadgen')
    } catch (e) {
      console.error('[fenix meta-leads webhook] error procesando leadgen_id', leadgenId, e)
    }
  }

  return NextResponse.json({ ok: true })
}
