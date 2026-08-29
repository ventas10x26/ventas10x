// Ruta destino: src/lib/fenix-conversaciones-list.ts
// Lógica compartida entre el server component de /admin/fenix/conversaciones
// (carga inicial) y el endpoint GET /api/admin/fenix-conversaciones (usado
// por el botón de refrescar del cliente) -- para no mantener el mismo
// cruce con fenix_leads en dos lugares.
import { createClient as createServiceClient } from '@supabase/supabase-js'

const supabaseService = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type MensajeHistorial = { role: 'user' | 'assistant'; content: string }

export type ConversacionFenix = {
  id: string
  telefono: string
  tipo: string
  empresa: string | null
  nombre: string | null
  historial: MensajeHistorial[]
  bot_pausado: boolean
  updated_at: string
  // Cuenta de Cloud API por la que llegó el último mensaje -- null en
  // conversaciones de antes de que existiera esta columna (o de la época
  // de Evolution API). El admin panel solo habilita la caja de "responder"
  // cuando esto no es null, porque sin ella no había forma de saber con
  // qué número devolver la llamada a la API de Meta.
  phone_number_id: string | null
}

// Evolution-era rows llevan sufijo @s.whatsapp.net; las de WhatsApp Cloud
// API (ver fenix-whatsapp-cloud-handler.ts) llegan como solo dígitos --
// esto normaliza ambos formatos a un mismo número de 10-13 dígitos.
function telefonoDeRemoteJid(remoteJid: string): string {
  return remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
}

export async function obtenerConversacionesFenix(): Promise<ConversacionFenix[]> {
  const { data: conversaciones, error } = await supabaseService
    .from('fenix_conversaciones')
    .select('id, remote_jid, tipo, historial, bot_pausado, updated_at, phone_number_id')
    .eq('instance_name', 'fenix_cobranza')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[fenix-conversaciones-list] Error al leer conversaciones:', error)
    return []
  }

  // Enriquece las de tipo 'lead' con el nombre/empresa del lead, cruzando
  // por los últimos 8 dígitos del teléfono -- mismo criterio que usa
  // marcarLeadContactado() en fenix-whatsapp-cloud-handler.ts. Las de tipo
  // 'deudor' no tienen equivalente en fenix_leads, así que quedan solo con
  // el número.
  const { data: leads } = await supabaseService.from('fenix_leads').select('empresa, nombre, telefono')
  const leadPorSufijo = new Map<string, { empresa: string; nombre: string }>()
  for (const l of leads || []) {
    const digitos = String(l.telefono || '').replace(/\D/g, '')
    if (digitos.length >= 8) leadPorSufijo.set(digitos.slice(-8), { empresa: l.empresa, nombre: l.nombre })
  }

  return (conversaciones || []).map((c) => {
    const telefono = telefonoDeRemoteJid(c.remote_jid)
    const lead = leadPorSufijo.get(telefono.slice(-8)) || null
    return {
      id: c.id as string,
      telefono,
      tipo: (c.tipo as string) || 'deudor',
      empresa: lead?.empresa || null,
      nombre: lead?.nombre || null,
      historial: (c.historial as MensajeHistorial[]) || [],
      bot_pausado: c.bot_pausado === true,
      updated_at: c.updated_at as string,
      phone_number_id: (c.phone_number_id as string) || null,
    }
  })
}
