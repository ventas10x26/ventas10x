// Ruta destino: src/app/og/fenix/route.tsx
// Genera la OG image de la landing de Fenix Consultores.
// Accesible en: https://ventas10x.co/og/fenix

import { ImageResponse } from 'next/og'
import { marcaDataUri } from '@/components/fenix/logo-mark'

export const runtime = 'edge'

const SIZE = { width: 1200, height: 630 }

const ACCENT = '#F5821F'
const DARK = '#16110d'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: DARK,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '58px 70px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow cálido superior derecho */}
        <div style={{
          position: 'absolute', top: '-260px', right: '-160px',
          width: '760px', height: '760px', borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT}55 0%, ${ACCENT}18 45%, rgba(0,0,0,0) 70%)`,
          display: 'flex',
        }} />

        {/* Anillo de acento */}
        <div style={{
          position: 'absolute', top: '-130px', right: '-40px',
          width: '440px', height: '440px', borderRadius: '50%',
          border: `2px solid ${ACCENT}60`,
          display: 'flex',
        }} />

        {/* Barra lateral de acento */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '8px', height: '100%',
          background: ACCENT,
          display: 'flex',
        }} />

        {/* Header: logo + badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={marcaDataUri('og', 140)} alt="" width={46} height={64} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'white', fontSize: '34px', fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>
                Fénix
              </span>
              <span style={{
                color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600,
                letterSpacing: '1.6px', marginTop: '7px',
              }}>
                CONSULTORES EMPRESARIALES S.A.S.
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center',
            border: `1px solid ${ACCENT}70`, borderRadius: '999px',
            padding: '10px 22px',
          }}>
            <span style={{ color: ACCENT, fontSize: '17px', fontWeight: 700, display: 'flex' }}>
              Recovery Intelligence®
            </span>
          </div>
        </div>

        {/* Titular */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            color: 'white', fontSize: '68px', fontWeight: 300,
            lineHeight: 1.05, letterSpacing: '-2px',
            display: 'flex', flexDirection: 'column',
          }}>
            <span>El dinero de su empresa</span>
            <span style={{ color: ACCENT, fontWeight: 500 }}>no está perdido.</span>
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.6)', fontSize: '25px', fontWeight: 400,
            lineHeight: 1.4, display: 'flex', maxWidth: '850px',
          }}>
            Recuperación estratégica de cartera con Inteligencia Artificial,
            plataforma de gestión y respaldo jurídico especializado.
          </div>
        </div>

        {/* Footer: pilares + dominio */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['Diagnóstico', 'IA aplicada', 'Cobro Jurídico', 'Tiempo real'].map(label => (
              <div key={label} style={{
                display: 'flex',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '999px',
                padding: '10px 20px',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '17px', fontWeight: 600, display: 'flex' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px', display: 'flex' }}>
            ventas10x.co/fenix-consultores
          </span>
        </div>
      </div>
    ),
    { ...SIZE }
  )
}
