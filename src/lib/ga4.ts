// Ruta destino: src/lib/ga4.ts
// Trae metricas diarias de visitas desde la API de reporting de GA4, para
// mostrarlas dentro de /admin/fenix en vez de tener que salir a
// analytics.google.com. No agrega dependencias: la autenticacion de cuenta
// de servicio (JWT firmado + intercambio por token) se hace con el modulo
// `crypto` nativo de Node, el mismo patron de "sin SDK" que ya usa el resto
// del proyecto para APIs externas (CallMeBot, Resend via fetch crudo).
//
// Todo lo de aqui es best-effort: si faltan las variables de entorno o
// Google rechaza la solicitud, se lanza un error que quien llama debe
// atrapar -- nunca se construye nada a nivel de modulo (la leccion de
// FENIX_RESEND_API_KEY: construir un cliente al cargar el archivo revienta
// la ruta entera si la credencial no esta configurada todavia).

import { createSign } from 'crypto'

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

let tokenCache: { token: string; exp: number } | null = null

/**
 * Tolera las formas mas comunes en que la clave privada llega deformada al
 * pegarla a mano en el panel de Vercel: espacios/saltos sobrantes al
 * inicio o final, comillas que quedaron pegadas del valor JSON original,
 * y el escape "\n" literal (como llega si se copia tal cual del archivo
 * .json, donde un salto de linea real es invalido dentro de un string).
 * Si tras esto el resultado no tiene forma de PEM, se lanza un error que
 * dice exactamente eso -- la libreria de crypto solo da
 * "DECODER routines::unsupported", que no dice nada sobre la causa real.
 */
function normalizarClavePrivada(raw: string): string {
  let key = raw.trim()
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim()
  }
  if (key.includes('\\n')) key = key.replace(/\\n/g, '\n')
  key = key.trim()

  if (!key.includes('-----BEGIN PRIVATE KEY-----') || !key.includes('-----END PRIVATE KEY-----')) {
    throw new Error(
      'GA_SERVICE_ACCOUNT_PRIVATE_KEY no tiene forma de clave PEM (falta el encabezado o el pie ' +
      '-----BEGIN/END PRIVATE KEY-----). Vuelva a copiar el valor completo de "private_key" ' +
      'directamente del .json descargado, sin editarlo a mano.'
    )
  }
  return key
}

async function obtenerAccessToken(): Promise<string> {
  const email = process.env.GA_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!email || !rawKey) {
    throw new Error('GA_SERVICE_ACCOUNT_EMAIL / GA_SERVICE_ACCOUNT_PRIVATE_KEY no configuradas')
  }

  const ahora = Math.floor(Date.now() / 1000)
  if (tokenCache && tokenCache.exp - 60 > ahora) return tokenCache.token

  const privateKey = normalizarClavePrivada(rawKey)

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(JSON.stringify({
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    exp: ahora + 3600,
    iat: ahora,
  }))
  const sinFirmar = `${header}.${claims}`
  const firma = base64url(createSign('RSA-SHA256').update(sinFirmar).sign(privateKey))
  const jwt = `${sinFirmar}.${firma}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) {
    throw new Error(`Google rechazó el intercambio de token: ${res.status} ${await res.text()}`)
  }
  const data = await res.json() as { access_token: string; expires_in: number }
  tokenCache = { token: data.access_token, exp: ahora + data.expires_in }
  return tokenCache.token
}

export type VisitaDiaria = { fecha: string; visitas: number; usuarios: number }

/**
 * Visitas diarias de la landing de Fenix, sin importar por cuál dominio
 * entraron. La reescritura del middleware hace que app.consultoresfenix.com
 * NO reporte pagePath=/fenix-consultores en GA (el navegador sigue viendo
 * la URL original, GA lee document.location) -- por eso el filtro combina
 * hostName y pagePath en vez de confiar solo en la ruta.
 */
export async function obtenerVisitasDiariasFenix(dias = 30): Promise<VisitaDiaria[]> {
  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) throw new Error('GA4_PROPERTY_ID no configurada')

  const token = await obtenerAccessToken()
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${dias}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        dimensionFilter: {
          orGroup: {
            expressions: [
              { filter: { fieldName: 'hostName', stringFilter: { matchType: 'CONTAINS', value: 'consultoresfenix.com' } } },
              { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'CONTAINS', value: '/fenix-consultores' } } },
            ],
          },
        },
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
    }
  )
  if (!res.ok) {
    throw new Error(`GA4 rechazó el reporte: ${res.status} ${await res.text()}`)
  }
  const data = await res.json() as {
    rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }>
  }

  return (data.rows || []).map(r => ({
    fecha: r.dimensionValues[0].value, // YYYYMMDD
    visitas: Number(r.metricValues[0].value),
    usuarios: Number(r.metricValues[1].value),
  }))
}
