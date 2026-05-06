// Ruta destino: src/app/og/home/route.tsx
// Genera la OG image dinámica de la home de ventas10x.co
// Accesible en: https://ventas10x.co/og/home

import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const SIZE = { width: 1200, height: 630 }

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0f1c2e 0%, #1a2f4a 60%, #0f1c2e 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 72px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Acento superior */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '6px', height: '100%',
          background: '#FF6B2B',
          display: 'flex',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: '#FF6B2B',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              color: 'white', fontSize: '22px', fontWeight: '900',
              display: 'flex',
            }}>V</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span style={{ color: 'white', fontSize: '28px', fontWeight: '800' }}>Ventas</span>
            <span style={{ color: '#FF6B2B', fontSize: '28px', fontWeight: '800' }}>10x</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            color: 'white', fontSize: '64px', fontWeight: '900',
            lineHeight: '1.1', display: 'flex', flexDirection: 'column',
          }}>
            <span>Vende 10x más</span>
            <span style={{ color: '#FF6B2B' }}>con Inteligencia Artificial.</span>
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.55)', fontSize: '22px', fontWeight: '400',
            display: 'flex',
          }}>
            Landing · Catálogo IA · Bot WhatsApp · Pipeline · Red de ventas
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '40px' }}>
            {[['+200', 'vendedores'], ['48h', 'setup'], ['14 días', 'gratis']].map(([val, label]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#FF6B2B', fontSize: '30px', fontWeight: '800', display: 'flex' }}>{val}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', display: 'flex' }}>{label}</span>
              </div>
            ))}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '16px', display: 'flex' }}>
            ventas10x.co
          </span>
        </div>
      </div>
    ),
    { ...SIZE }
  )
}