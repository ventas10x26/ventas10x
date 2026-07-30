// Ruta destino: src/app/og/fenix-logo/route.tsx
// Exporta el logotipo de Fenix como PNG a demanda, para cuando hace falta un
// archivo (firmas de correo, presentaciones, proveedores que no aceptan SVG).
//
//   /og/fenix-logo                         isotipo, fondo transparente, 512px
//   /og/fenix-logo?size=1024               otro tamaño
//   /og/fenix-logo?fondo=claro|oscuro      fondo sólido en vez de transparente
//   /og/fenix-logo?tipo=completo           isotipo + tipografía (lockup ancho)

import { ImageResponse } from 'next/og'
import { marcaDataUri, MARCA } from '@/components/fenix/logo-mark'

export const runtime = 'edge'

const FONDOS = {
  transparente: 'transparent',
  claro: '#FFFFFF',
  oscuro: MARCA.tinta,
} as const

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams

  // Techo de 2048: el PNG se rasteriza en el edge y un tamaño libre sería un
  // vector de abuso trivial contra la función.
  const size = Math.min(2048, Math.max(64, Number(q.get('size')) || 512))
  const fondo = FONDOS[(q.get('fondo') as keyof typeof FONDOS) ?? 'transparente'] ?? 'transparent'
  const completo = q.get('tipo') === 'completo'
  const oscuro = q.get('fondo') === 'oscuro'

  const tinta = oscuro ? '#FFFFFF' : MARCA.tinta
  const suave = oscuro ? 'rgba(255,255,255,.6)' : 'rgba(20,16,12,.55)'

  if (!completo) {
    const alto = Math.round(size * 0.86)
    const ancho = Math.round((alto * 100) / 140)
    return new ImageResponse(
      (
        <div style={{
          width: `${size}px`, height: `${size}px`, background: fondo,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={marcaDataUri('png', 140)} alt="" width={ancho} height={alto} />
        </div>
      ),
      { width: size, height: size }
    )
  }

  // Lockup horizontal. La proporción la marca la línea más larga
  // ("CONSULTORES EMPRESARIALES S.A.S."), no el alto del isotipo.
  const h = size
  const w = Math.round(size * 3.5)
  const u = h / 380 // unidad de escala respecto al diseño base

  return new ImageResponse(
    (
      <div style={{
        width: `${w}px`, height: `${h}px`, background: fondo,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: `${68 * u}px`, fontFamily: 'system-ui, sans-serif',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={marcaDataUri('pngfull', 140)} alt="" width={Math.round(214 * u)} height={Math.round(300 * u)} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', color: tinta, fontSize: `${172 * u}px`,
            fontWeight: 700, letterSpacing: `${-6 * u}px`, lineHeight: 1,
          }}>
            Fénix
          </div>
          <div style={{
            display: 'flex', color: suave, fontSize: `${40 * u}px`,
            fontWeight: 600, letterSpacing: `${5 * u}px`, marginTop: `${18 * u}px`,
          }}>
            CONSULTORES EMPRESARIALES S.A.S.
          </div>
          <div style={{
            display: 'flex', color: oscuro ? MARCA.acento : '#B0570A',
            fontSize: `${36 * u}px`, fontWeight: 700, letterSpacing: `${4 * u}px`,
            marginTop: `${16 * u}px`,
          }}>
            ABOGADOS · TECNOLOGÍA · RESULTADOS
          </div>
        </div>
      </div>
    ),
    { width: w, height: h }
  )
}
