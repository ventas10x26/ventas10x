// Ruta destino: src/lib/clarity.ts
// Trae metricas agregadas (no el mapa de calor en si -- eso no tiene API
// publica) desde la Data Export API de Clarity.
//
// Esta API es mucho mas limitada que la de GA4: solo admite pedir los
// ultimos 1, 2 o 3 dias, y su limite de solicitudes por dia es bajo. Por
// eso el resultado se cachea agresivamente en memoria (6 horas) en vez de
// consultarse en cada carga de /admin/fenix -- pedirlo en cada visita
// agotaria la cuota casi de inmediato.
//
// La forma exacta de cada fila (mas alla de `metricName`) no esta bien
// documentada y puede variar entre metricas; por eso quien consuma esto
// no debe asumir campos especificos dentro de `information`, solo iterar
// lo que venga.

const ENDPOINT = 'https://www.clarity.ms/export-data/api/v1/project-live-insights'

export type FilaMetricaClarity = {
  metricName: string
  information: Array<Record<string, string | number>>
}

let cache: { datos: FilaMetricaClarity[]; expira: number } | null = null

export async function obtenerMetricasClarity(): Promise<FilaMetricaClarity[]> {
  const token = process.env.CLARITY_API_TOKEN
  if (!token) throw new Error('CLARITY_API_TOKEN no configurada')

  const ahora = Date.now()
  if (cache && cache.expira > ahora) return cache.datos

  const res = await fetch(`${ENDPOINT}?numOfDays=3`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`Clarity rechazó la solicitud: ${res.status} ${await res.text()}`)
  }

  const datos = await res.json() as FilaMetricaClarity[]
  cache = { datos, expira: ahora + 1000 * 60 * 60 * 6 }
  return datos
}
