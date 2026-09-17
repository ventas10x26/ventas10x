// Ruta destino: src/lib/fenix-deudores.ts
//
// Lógica compartida del módulo de casos de cartera (fenix_clientes_deuda):
// extracción por IA de texto libre pegado en el panel, y listado para la
// vista de administración. La importación desde Excel/CSV se hace del lado
// del cliente (FenixDeudoresClient.tsx) con la librería xlsx que ya usa el
// proyecto -- no pasa por acá.
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type RegistroDeuda = {
  nombre_deudor: string | null
  telefono: string | null
  documento_identidad: string | null
  empresa_deudora: string | null
  cliente_encarga: string | null
  monto: number | null
  notas: string | null
}

const PROMPT_EXTRACCION = `Eres un extractor de datos para un sistema de cobro de cartera. Te van a pasar texto libre (una nota, un mensaje pegado, una descripción informal) sobre uno o más casos de deudores.

Devuelve SOLO un array JSON (sin texto antes ni después, sin markdown, sin bloques de código) con un objeto por cada deudor identificado, con exactamente estos campos:
- nombre_deudor: string o null
- telefono: string o null (solo dígitos, con indicativo de país si se menciona)
- documento_identidad: string o null (cédula, NIT, etc.)
- empresa_deudora: string o null (si el deudor es una empresa)
- cliente_encarga: string o null (la empresa cliente de Fénix que encarga el cobro, si se menciona)
- monto: number o null (solo el número, sin símbolos de moneda ni separadores de miles)
- notas: string o null (antigüedad de la deuda, intentos previos, cualquier detalle adicional relevante)

Si el texto no describe ningún caso de deudor, devuelve un array vacío: []
Si un campo no se menciona explícitamente, usa null -- nunca inventes datos.`

export async function extraerDeudoresDeTexto(texto: string): Promise<RegistroDeuda[]> {
  const { anthropic } = await import('@/lib/anthropic')
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: PROMPT_EXTRACCION,
    messages: [{ role: 'user', content: texto }],
  })
  const bloque = msg.content[0]
  if (bloque.type !== 'text') return []
  const limpio = bloque.text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  try {
    const parsed: unknown = JSON.parse(limpio)
    if (!Array.isArray(parsed)) return []
    return parsed.map((r: Record<string, unknown>) => normalizarRegistro(r))
  } catch (e) {
    console.error('[fenix-deudores] No se pudo parsear la respuesta de la IA:', e, limpio)
    return []
  }
}

function normalizarRegistro(r: Record<string, unknown>): RegistroDeuda {
  const aTexto = (v: unknown): string | null => {
    if (v === null || v === undefined) return null
    const s = String(v).trim()
    return s ? s : null
  }
  const aMonto = (v: unknown): number | null => {
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    if (typeof v === 'string' && v.trim()) {
      const limpio = v.replace(/[^\d.-]/g, '')
      const n = Number(limpio)
      return Number.isNaN(n) ? null : n
    }
    return null
  }
  return {
    nombre_deudor: aTexto(r.nombre_deudor),
    telefono: r.telefono ? String(r.telefono).replace(/\D/g, '') || null : null,
    documento_identidad: aTexto(r.documento_identidad),
    empresa_deudora: aTexto(r.empresa_deudora),
    cliente_encarga: aTexto(r.cliente_encarga),
    monto: aMonto(r.monto),
    notas: aTexto(r.notas),
  }
}

export type ClienteDeuda = RegistroDeuda & {
  id: string
  estado: string
  origen: string
  conversacion_id: string | null
  created_at: string
}

export async function obtenerClientesDeuda(): Promise<ClienteDeuda[]> {
  const { data, error } = await supabaseService
    .from('fenix_clientes_deuda')
    .select('id, nombre_deudor, telefono, documento_identidad, empresa_deudora, cliente_encarga, monto, notas, estado, origen, conversacion_id, created_at')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[fenix-deudores] Error al listar:', error)
    return []
  }
  return (data || []) as ClienteDeuda[]
}
