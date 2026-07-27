// Ruta destino: src/app/pulse/og/demo/route.tsx
// OG image de /pulse/demo — la que ve WhatsApp al compartir el demo.
//
// Vive bajo /pulse por la misma razón que la de databridge: en pulsemotor.co el middleware
// reescribe a /pulse/* todo lo que no empieza con /pulse.
//
// Las cifras de acá son las mismas sintéticas del demo (ver src/app/pulse/demo/datos.ts) —
// ninguna proviene de un concesionario real.

import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const BLUE = '#2563EB'
const INK = '#F3EFE7'
const INK_DIM = '#9B958A'

// Mismo embudo que muestra el demo, con el total de las tres sedes en 12 meses.
const ETAPAS = [
  { label: 'Oportunidades', alto: 100 },
  { label: 'Citas', alto: 74 },
  { label: 'Show up', alto: 52 },
  { label: 'Cotizaciones', alto: 63 },
  { label: 'Pedidos', alto: 31 },
  { label: 'Matrículas', alto: 17 },
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
          padding: '56px 72px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '7px', height: '630px', background: BLUE, display: 'flex' }} />
        <div style={{ position: 'absolute', top: '-170px', right: '-130px', width: '540px', height: '540px', borderRadius: '270px', background: 'rgba(37,99,235,0.16)', display: 'flex' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Rayo como SVG y no emoji: el runtime edge no carga fuente de emoji. */}
          <div style={{ width: '46px', height: '46px', background: BLUE, borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M13.5 1.5 4.2 13.1a.8.8 0 0 0 .62 1.3h4.6l-1.02 7.3a.5.5 0 0 0 .9.36l9.3-11.6a.8.8 0 0 0-.62-1.3h-4.6l1.02-7.3a.5.5 0 0 0-.9-.36Z" />
            </svg>
          </div>
          <div style={{ display: 'flex', fontSize: '25px', fontWeight: 700, color: INK, letterSpacing: '-0.4px' }}>Pulse Motor</div>
          <div style={{ display: 'flex', marginLeft: '10px', padding: '7px 16px', borderRadius: '999px', background: 'rgba(37,99,235,0.14)', border: '1px solid rgba(37,99,235,0.4)', fontSize: '15px', fontWeight: 700, color: '#7BA4F5', letterSpacing: '1.6px' }}>
            DEMO · DATOS SIMULADOS
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '580px' }}>
            <div style={{ display: 'flex', fontSize: '58px', fontWeight: 800, color: INK, lineHeight: 1.07, letterSpacing: '-1.8px' }}>
              Así se ve tu operación
            </div>
            <div style={{ display: 'flex', fontSize: '58px', fontWeight: 800, color: BLUE, lineHeight: 1.07, letterSpacing: '-1.8px' }}>
              cuando está toda junta
            </div>
            <div style={{ display: 'flex', marginTop: '18px', fontSize: '24px', color: INK_DIM, lineHeight: 1.45 }}>
              Embudo de seis etapas, integralidad 360° y rendimiento por sede — en un panel que podés recorrer.
            </div>
          </div>

          {/* Embudo en barras: la forma del panel, sin exponer cifras de nadie */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '230px' }}>
            {ETAPAS.map((e, i) => (
              <div key={e.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '230px' }}>
                <div style={{
                  width: '46px',
                  height: `${Math.round((e.alto / 100) * 190)}px`,
                  borderRadius: '8px',
                  background: i === ETAPAS.length - 1 ? BLUE : 'rgba(37,99,235,0.42)',
                  display: 'flex',
                }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: '19px', color: INK_DIM }}>
            Cifras simuladas — los datos de cada concesionario son suyos
          </div>
          <div style={{ display: 'flex', fontSize: '22px', fontWeight: 600, color: INK }}>pulsemotor.co/demo</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
