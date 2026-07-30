// Ruta destino: src/components/fenix/logo-mark.ts
// Isotipo de Fenix (ave fenix / llama) como SVG en texto plano.
//
// Vive como string y no como componente porque tiene que servir en dos mundos:
// React (nav, footer, hero) y las rutas de imagen generada con `next/og`, que
// corren en el runtime edge y solo aceptan la marca como <img src="data:...">.
// Un unico origen evita que el logo del favicon se desincronice del de la web.

export const MARCA = {
  llamaClara: '#FFC94B',
  llamaMedia: '#F5821F',
  llamaOscura: '#E02718',
  tinta: '#14100C',
  acento: '#F5821F',
} as const

/**
 * Isotipo en viewBox 0 0 100 140. Sin acentos ni caracteres fuera de ASCII:
 * `btoa` (unica opcion de codificacion en edge) solo admite latin1.
 */
export function marcaSvg(uid = 'a', size = 140) {
  const w = Math.round((size * 100) / 140)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140" width="${w}" height="${size}">
  <defs>
    <linearGradient id="fx-l-${uid}" x1="0.15" y1="1" x2="0.55" y2="0">
      <stop offset="0" stop-color="${MARCA.llamaClara}"/>
      <stop offset="0.45" stop-color="${MARCA.llamaMedia}"/>
      <stop offset="1" stop-color="${MARCA.llamaOscura}"/>
    </linearGradient>
    <linearGradient id="fx-i-${uid}" x1="0.3" y1="1" x2="0.6" y2="0.1">
      <stop offset="0" stop-color="#FFE9A8"/>
      <stop offset="1" stop-color="${MARCA.llamaMedia}"/>
    </linearGradient>
  </defs>
  <path fill="url(#fx-l-${uid})" d="M50 4 C62 34 88 52 86 84 C84 114 68 136 44 136 C22 136 8 118 10 96 C12 74 30 66 34 44 C38 58 46 62 48 74 C56 56 44 30 50 4 Z"/>
  <path fill="url(#fx-i-${uid})" d="M58 54 C63 68 74 78 72 94 C70 112 57 125 41 123 C50 113 50 104 44 96 C38 88 41 79 47 71 C52 65 56 60 58 54 Z"/>
  <path fill="#FFFFFF" fill-opacity="0.9" d="M54 28 C51 53 43 71 29 85 C41 82 51 74 58 63 C55 78 47 90 35 98 C51 94 62 79 66 60 C68 48 62 35 54 28 Z"/>
</svg>`
}

/** Data URI listo para `<img>` dentro de ImageResponse (satori no lee SVG inline). */
export function marcaDataUri(uid = 'og', size = 140) {
  return `data:image/svg+xml;base64,${btoa(marcaSvg(uid, size))}`
}
