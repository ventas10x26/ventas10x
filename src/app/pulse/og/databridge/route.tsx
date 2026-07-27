// Ruta destino: src/app/pulse/og/databridge/route.tsx
// OG image de /pulse/databridge — la que ve WhatsApp al compartir el enlace.
//
// Vive bajo /pulse a propósito: en pulsemotor.co el middleware reescribe todo lo que NO
// empieza con /pulse hacia /pulse/*, así que una ruta en /og/... daría 404 en ese dominio.
// Acá funcionan las dos formas: pulsemotor.co/pulse/og/databridge (pasa derecho) y
// pulsemotor.co/og/databridge (el rewrite la manda justo acá).

import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const BLUE = '#2563EB'
const INK = '#F3EFE7'
const INK_DIM = '#9B958A'

// Mismos nodos que arma DataBridge con datos de concesionario: el preview muestra el
// trabajo real del producto, no una promesa genérica de IA.
const NODOS = [
  { sigla: 'INV', label: 'Inventario' },
  { sigla: 'FIN', label: 'Financiación' },
  { sigla: 'PÓL', label: 'Pólizas' },
  { sigla: 'RET', label: 'Retomas' },
]

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0B0D0C',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '58px 72px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Barra de acento y halo azul tenue */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '7px', height: '630px', background: BLUE, display: 'flex' }} />
        <div style={{ position: 'absolute', top: '-160px', right: '-120px', width: '520px', height: '520px', borderRadius: '260px', background: 'rgba(37,99,235,0.16)', display: 'flex' }} />

        {/* Encabezado: marca + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* El rayo va como SVG y no como emoji: el runtime edge no carga fuente de emoji,
              así que un ⚡ acá sale como un cuadrado vacío. */}
          <div style={{ width: '46px', height: '46px', background: BLUE, borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M13.5 1.5 4.2 13.1a.8.8 0 0 0 .62 1.3h4.6l-1.02 7.3a.5.5 0 0 0 .9.36l9.3-11.6a.8.8 0 0 0-.62-1.3h-4.6l1.02-7.3a.5.5 0 0 0-.9-.36Z" />
            </svg>
          </div>
          <div style={{ display: 'flex', fontSize: '25px', fontWeight: 700, color: INK, letterSpacing: '-0.4px' }}>
            Pulse Motor
          </div>
          <div style={{ display: 'flex', marginLeft: '10px', padding: '7px 16px', borderRadius: '999px', background: 'rgba(37,99,235,0.14)', border: '1px solid rgba(37,99,235,0.4)', fontSize: '15px', fontWeight: 700, color: '#7BA4F5', letterSpacing: '1.6px' }}>
            DATABRIDGE 360
          </div>
        </div>

        {/* Titular */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '900px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: '62px', fontWeight: 800, color: INK, lineHeight: 1.08, letterSpacing: '-2px' }}>
            Tus planillas sueltas,
          </div>
          <div style={{ display: 'flex', fontSize: '62px', fontWeight: 800, color: BLUE, lineHeight: 1.08, letterSpacing: '-2px' }}>
            un modelo de datos
          </div>
          <div style={{ display: 'flex', marginTop: '18px', fontSize: '25px', color: INK_DIM, lineHeight: 1.45, maxWidth: '820px' }}>
            Subí tu Excel, CSV o JSON. Detectamos cada hoja, sus campos y las relaciones entre tablas — y te dejamos el panel andando.
          </div>
        </div>

        {/* Diagrama de nodos: la prueba visual de lo que hace el producto */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {NODOS.map((n, i) => (
              <div key={n.sigla} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '62px', height: '62px', borderRadius: '31px', background: 'rgba(37,99,235,0.16)', border: `2px solid ${BLUE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 700, color: '#9DBBF8' }}>
                    {n.sigla}
                  </div>
                  <div style={{ display: 'flex', marginTop: '10px', fontSize: '16px', color: INK_DIM }}>{n.label}</div>
                </div>
                {i < NODOS.length - 1 && (
                  <div style={{ width: '58px', height: '2px', background: 'rgba(37,99,235,0.5)', display: 'flex', marginBottom: '26px' }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', fontSize: '22px', fontWeight: 600, color: INK }}>
            pulsemotor.co
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
