// Ruta destino: src/lib/pulse/onboarding-dedup.ts
//
// Agrupa filas de pulse_contactos por email antes de disparar cualquier touch de la
// secuencia de onboarding. Existe porque la misma persona puede tener varias filas (probó
// el gate de la demo dos veces, bajó el ebook y después pidió la demo, etc.) — sin agrupar,
// tanto el cron recurrente como el backfill retroactivo le mandarían el mismo correo más de
// una vez al mismo buzón, que es exactamente lo que la secuencia busca evitar.
//
// Prioridad de fuente cuando hay varias filas: demo_panel gana sobre ebook_rentabilidad
// (mayor intención), así el correo se redacta con el ángulo correcto para esa persona.

export interface ContactoOnboardingRow {
  id: string
  nombre: string
  email: string
  fuente: string
}

export interface GrupoOnboarding {
  email: string
  nombre: string
  fuente: string
  ids: string[]
}

/** Ordenar los contactos por created_at DESC antes de llamar a esto, así el primer nombre
 *  visto por email es el más reciente (más probable que esté bien escrito). */
export function agruparContactosPorEmail(contactos: ContactoOnboardingRow[]): GrupoOnboarding[] {
  const mapa = new Map<string, GrupoOnboarding>()
  for (const c of contactos) {
    const email = c.email.trim().toLowerCase()
    const existente = mapa.get(email)
    if (!existente) {
      mapa.set(email, { email, nombre: c.nombre, fuente: c.fuente, ids: [c.id] })
    } else {
      existente.ids.push(c.id)
      if (c.fuente === 'demo_panel') existente.fuente = 'demo_panel'
    }
  }
  return Array.from(mapa.values())
}
