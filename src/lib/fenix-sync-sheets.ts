// Ruta destino: src/lib/fenix-sync-sheets.ts
//
// Sincroniza leads desde el CSV publicado de Google Sheets (export de Meta
// Lead Ads) hacia fenix_leads. Compartido entre el endpoint de vista previa
// (solo lectura) y el de confirmación (inserta de verdad).
//
// Problema real que resuelve: cuando Sheets guarda columnas numéricas muy
// largas (lead_id, ad_id, phone_number) como "Número" en vez de "Texto
// sin formato", pierde precisión más allá de ~15 dígitos y rellena con
// ceros -- un teléfono real "573116123456" puede llegar como
// "573116000000". Sincronizar eso a ciegas guardaría números inservibles
// (y potencialmente colisiones falsas). Este módulo detecta el patrón y
// separa esos leads para que el admin escriba el teléfono correcto a mano
// antes de confirmar.

import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export type FilaCSV = {
  id: string
  created_time: string
  email: string
  full_name: string
  phone_number: string
  form_name: string
}

export type LeadCandidato = {
  metaLeadId: string
  nombre: string
  email: string
  telefono: string
  formulario: string
  createdAtISO: string | null
}

export type PlanSincronizacion = {
  nuevos: LeadCandidato[]
  danados: LeadCandidato[] // mismo email pero teléfono con pinta de truncado por Sheets
  duplicados: number // filas del CSV que ya existen en la base (por email o teléfono)
  totalFilasCSV: number
}

// Detecta el patrón de truncamiento de precisión de Sheets: números que
// terminan en 5 o más ceros seguidos. Un celular colombiano real
// (57 3XX XXXXXXX) prácticamente nunca termina así -- son 10 dígitos
// esencialmente aleatorios después del 57.
function pareceTelefonoDanado(telefono: string): boolean {
  const digitos = telefono.replace(/\D/g, '')
  return /0{5,}$/.test(digitos)
}

function convertirFechaSheet(s: string): string | null {
  // Formato de Sheets: "8/14/26 5:59" -- se asume hora de Bogotá (UTC-5)
  // porque así coincidió con los timestamps ya guardados en producción.
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})\s+(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const [, mes, dia, anio, hora, min] = m
  const dt = new Date(Date.UTC(2000 + Number(anio), Number(mes) - 1, Number(dia), Number(hora) + 5, Number(min)))
  return dt.toISOString()
}

function parseCSV(texto: string): FilaCSV[] {
  const lineas = texto.split(/\r\n|\n/).filter((l) => l.trim().length > 0)
  if (lineas.length < 2) return []
  const headers = parseLineaCSV(lineas[0])
  const idx = (col: string) => headers.indexOf(col)
  const iId = idx('id'), iFecha = idx('created_time'), iEmail = idx('email')
  const iNombre = idx('full_name'), iTelefono = idx('phone_number'), iForm = idx('form_name')

  const filas: FilaCSV[] = []
  for (let i = 1; i < lineas.length; i++) {
    const cols = parseLineaCSV(lineas[i])
    filas.push({
      id: cols[iId] || '',
      created_time: cols[iFecha] || '',
      email: (cols[iEmail] || '').trim().toLowerCase(),
      full_name: (cols[iNombre] || '').trim(),
      phone_number: (cols[iTelefono] || '').trim(),
      form_name: cols[iForm] || '',
    })
  }
  return filas
}

// Parser CSV simple con soporte de comillas (para campos como form_name que
// traen comas dentro de comillas).
function parseLineaCSV(linea: string): string[] {
  const resultado: string[] = []
  let actual = ''
  let dentroComillas = false
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i]
    if (ch === '"') {
      if (dentroComillas && linea[i + 1] === '"') { actual += '"'; i++ }
      else dentroComillas = !dentroComillas
    } else if (ch === ',' && !dentroComillas) {
      resultado.push(actual); actual = ''
    } else {
      actual += ch
    }
  }
  resultado.push(actual)
  return resultado
}

// Calcula el plan de sincronización sin escribir nada -- compara contra
// los leads que ya existen en fenix_leads (por email, que es más estable
// que el teléfono cuando el teléfono puede venir dañado).
export async function calcularPlanSincronizacion(csvUrl: string): Promise<PlanSincronizacion> {
  const res = await fetch(csvUrl)
  if (!res.ok) throw new Error(`No se pudo descargar el CSV (HTTP ${res.status})`)
  const texto = await res.text()
  const filas = parseCSV(texto)

  const { data: existentes, error } = await supabaseAdmin
    .from('fenix_leads')
    .select('email, telefono')
  if (error) throw new Error(error.message)

  const emailsExistentes = new Set((existentes || []).map((l) => (l.email || '').trim().toLowerCase()).filter(Boolean))
  const telefonosExistentes = new Set((existentes || []).map((l) => l.telefono.replace(/\D/g, '').slice(-8)))

  // Agrupa por email -- si el mismo lead aparece varias veces en el CSV
  // (típico cuando una fila se corrompió y se volvió a exportar), se
  // queda con la mejor versión: teléfono sin pinta de dañado, y si hay
  // varias así, la más reciente.
  const porEmail = new Map<string, FilaCSV[]>()
  for (const fila of filas) {
    if (!fila.phone_number) continue
    const clave = fila.email || `sin-email:${fila.phone_number}`
    const grupo = porEmail.get(clave)
    if (grupo) grupo.push(fila)
    else porEmail.set(clave, [fila])
  }

  const nuevos: LeadCandidato[] = []
  const danados: LeadCandidato[] = []
  let duplicados = 0

  for (const [clave, grupo] of porEmail) {
    const yaExisteEmail = clave.startsWith('sin-email:') ? false : emailsExistentes.has(clave)
    const sufijos = grupo.map((f) => f.phone_number.replace(/\D/g, '').slice(-8))
    const yaExisteTelefono = sufijos.some((s) => s.length >= 8 && telefonosExistentes.has(s))

    if (yaExisteEmail || yaExisteTelefono) {
      duplicados += grupo.length
      continue
    }

    const sanos = grupo.filter((f) => !pareceTelefonoDanado(f.phone_number))
    const mejor = (sanos.length > 0 ? sanos : grupo).sort((a, b) => (a.created_time < b.created_time ? 1 : -1))[0]

    const candidato: LeadCandidato = {
      metaLeadId: mejor.id,
      nombre: mejor.full_name || 'Sin nombre',
      email: mejor.email,
      telefono: mejor.phone_number,
      formulario: mejor.form_name,
      createdAtISO: convertirFechaSheet(mejor.created_time),
    }

    if (pareceTelefonoDanado(candidato.telefono)) danados.push(candidato)
    else nuevos.push(candidato)
  }

  return { nuevos, danados, duplicados, totalFilasCSV: filas.length }
}

// Inserta los leads confirmados por el admin (ya sea de la lista "nuevos"
// tal cual, o de "danados" con el teléfono corregido a mano). Vuelve a
// chequear duplicados justo antes de insertar por si algo cambió entre la
// vista previa y la confirmación.
export async function confirmarSincronizacion(candidatos: LeadCandidato[]): Promise<{ insertados: number; omitidos: string[] }> {
  if (candidatos.length === 0) return { insertados: 0, omitidos: [] }

  const { data: existentes } = await supabaseAdmin.from('fenix_leads').select('email, telefono')
  const emailsExistentes = new Set((existentes || []).map((l) => (l.email || '').trim().toLowerCase()).filter(Boolean))
  const telefonosExistentes = new Set((existentes || []).map((l) => l.telefono.replace(/\D/g, '').slice(-8)))

  const omitidos: string[] = []
  const filasInsertar = candidatos.filter((c) => {
    const sufijo = c.telefono.replace(/\D/g, '').slice(-8)
    const dup = (c.email && emailsExistentes.has(c.email.toLowerCase())) || (sufijo.length >= 8 && telefonosExistentes.has(sufijo))
    if (dup) omitidos.push(`${c.nombre} (${c.telefono})`)
    return !dup
  }).map((c) => ({
    empresa: 'Sin empresa (Meta Ads)',
    nombre: c.nombre,
    email: c.email || null,
    telefono: c.telefono.replace(/\D/g, ''),
    mensaje: c.formulario ? `Formulario: ${c.formulario}` : null,
    etapa: 'nuevo',
    fuente: 'meta_ads_leadgen',
    notas: `Meta lead_id: ${c.metaLeadId} (sincronizado desde Sheets)`,
    created_at: c.createdAtISO || new Date().toISOString(),
  }))

  if (filasInsertar.length === 0) return { insertados: 0, omitidos }

  const { error } = await supabaseAdmin.from('fenix_leads').insert(filasInsertar)
  if (error) throw new Error(error.message)

  return { insertados: filasInsertar.length, omitidos }
}
